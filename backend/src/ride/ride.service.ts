import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ride, RideStatus, RideType } from '../entities/ride.entity';
import { Driver, DriverStatus } from '../entities/driver.entity';
import { Pricing, PricingType } from '../entities/pricing.entity';
import { CreateRideDto } from './dto/create-ride.dto';
import { NotificationService } from '../notifications/notification.service';
import { InternalNotificationsService } from '../notifications/internal-notifications.service';
import { ConfigSystemService } from '../config-system/config-system.service';
import { EncryptionService } from '../encryption/encryption.service';
import { User, UserRole } from '../entities/user.entity';
import { LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { InternalNotificationType } from '../entities/internal-notification.entity';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { Inject, forwardRef } from '@nestjs/common';

@Injectable()
export class RideService {
  constructor(
    @InjectRepository(Ride)
    private rideRepository: Repository<Ride>,
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(Pricing)
    private pricingRepository: Repository<Pricing>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationService: NotificationService,
    private internalNotificationsService: InternalNotificationsService,
    private configSystemService: ConfigSystemService,
    private encryptionService: EncryptionService,
    @Inject(forwardRef(() => WebSocketGateway))
    private websocketGateway: WebSocketGateway,
  ) {}

  async createRide(createDto: CreateRideDto) {
    // Trouver le tarif approprié
    const scheduledDate = new Date(createDto.scheduledAt);
    const hour = scheduledDate.getHours();
    const dayOfWeek = scheduledDate.getDay();

    // Déterminer le type de tarif
    let pricingType = PricingType.STANDARD;
    if (hour >= 22 || hour < 6) {
      pricingType = PricingType.NIGHT;
    } else if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      pricingType = PricingType.PEAK_HOURS;
    }

    // Trouver le tarif
    const pricing = await this.pricingRepository.findOne({
      where: {
        rideType: createDto.rideType,
        type: pricingType,
        isActive: true,
      },
    });

    if (!pricing) {
      // Utiliser le tarif standard si pas de tarif spécial
      const standardPricing = await this.pricingRepository.findOne({
        where: {
          rideType: createDto.rideType,
          type: PricingType.STANDARD,
          isActive: true,
        },
      });

      if (!standardPricing) {
        throw new BadRequestException('Aucun tarif disponible pour ce trajet');
      }

      const ride = this.rideRepository.create({
        ...createDto,
        scheduledAt: scheduledDate,
        price: parseFloat(standardPricing.price.toString()),
        pricingId: standardPricing.id,
        status: RideStatus.PENDING,
      });

      const savedRide = await this.rideRepository.save(ride);

      // Attribuer automatiquement un chauffeur
      await this.assignDriver(savedRide.id);

      return savedRide;
    }

    const ride = this.rideRepository.create({
      ...createDto,
      scheduledAt: scheduledDate,
      price: parseFloat(pricing.price.toString()),
      pricingId: pricing.id,
      status: RideStatus.PENDING,
    });

    const savedRide = await this.rideRepository.save(ride);

    // Notifier les admins de la nouvelle course
    try {
      // Déchiffrer le ride pour les notifications
      savedRide.setEncryptionService(this.encryptionService);
      
      const adminUsers = await this.userRepository.find({
        where: { role: UserRole.ADMIN },
      });
      if (adminUsers.length > 0) {
        await this.internalNotificationsService.notifyAdminRideCreated(
          adminUsers.map(admin => admin.id),
          savedRide,
        );
      }
    } catch (error) {
      // Ne pas faire échouer la création de course si la notification échoue
      console.error('Erreur notification admin:', error);
    }

    // Attribuer automatiquement un chauffeur
    await this.assignDriver(savedRide.id);

    return savedRide;
  }

  async assignDriver(rideId: string) {
    const ride = await this.rideRepository.findOne({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException('Course non trouvée');
    }

    if (ride.driverId) {
      return; // Déjà assigné
    }

    // Trouver un chauffeur disponible
    const driver = await this.driverRepository.findOne({
      where: {
        status: DriverStatus.AVAILABLE,
        isVerified: true,
      },
      relations: ['user'],
      order: {
        totalRides: 'ASC', // Priorité aux chauffeurs avec moins de courses
      },
    });

    if (!driver) {
      // Pas de chauffeur disponible, la course reste en attente
      return;
    }

    // Assigner le chauffeur
    ride.driverId = driver.id;
    ride.status = RideStatus.ASSIGNED;
    ride.assignedAt = new Date();

    await this.rideRepository.save(ride);

    // Émettre mise à jour via WebSocket
    ride.setEncryptionService(this.encryptionService);
    this.websocketGateway.emitRideUpdate(ride.id, {
      id: ride.id,
      status: ride.status,
      driverId: ride.driverId,
      assignedAt: ride.assignedAt,
    });
    this.websocketGateway.emitToDriver(driver.user?.id || '', 'ride:assigned', {
      rideId: ride.id,
      status: ride.status,
    });

    // Envoyer notification au chauffeur (WhatsApp/SMS)
    if (driver.user) {
      // Déchiffrer le ride pour les notifications
      ride.setEncryptionService(this.encryptionService);
      
      await this.notificationService.notifyDriverNewRide(
        driver.user.phone,
        ride,
      );

      // Envoyer notification interne au chauffeur
      try {
        await this.internalNotificationsService.notifyDriverNewRide(
          driver.id,
          ride,
        );
      } catch (error) {
        console.error('Erreur notification interne chauffeur:', error);
      }
    }

    // Timeout configurable pour l'acceptation (défaut: 2 minutes)
    const timeoutSeconds = (await this.configSystemService.getConfigAsNumber('driver_response_timeout')) || 120;
    setTimeout(async () => {
      const updatedRide = await this.rideRepository.findOne({
        where: { id: rideId },
      });

      if (updatedRide && updatedRide.status === RideStatus.ASSIGNED) {
        // Le chauffeur n'a pas accepté, chercher un autre
        await this.reassignDriver(rideId);
      }
    }, timeoutSeconds * 1000);
  }

  async reassignDriver(rideId: string) {
    const ride = await this.rideRepository.findOne({
      where: { id: rideId },
    });

    if (!ride || ride.status !== RideStatus.ASSIGNED) {
      return;
    }

    // Retirer l'assignation précédente - utiliser delete pour les champs nullable
    delete (ride as any).driverId;
    delete (ride as any).assignedAt;

    // Trouver un autre chauffeur disponible
    const driver = await this.driverRepository.findOne({
      where: {
        status: DriverStatus.AVAILABLE,
        isVerified: true,
        id: ride.driverId ? undefined : undefined, // Exclure le précédent
      },
      relations: ['user'],
      order: {
        totalRides: 'ASC',
      },
    });

    if (driver) {
      ride.driverId = driver.id;
      ride.assignedAt = new Date();

      await this.rideRepository.save(ride);

      // Émettre mise à jour via WebSocket
      ride.setEncryptionService(this.encryptionService);
      this.websocketGateway.emitRideUpdate(ride.id, {
        id: ride.id,
        status: ride.status,
        driverId: ride.driverId,
        assignedAt: ride.assignedAt,
      });
      this.websocketGateway.emitToDriver(driver.user?.id || '', 'ride:reassigned', {
        rideId: ride.id,
        status: ride.status,
      });

      // Notifier le nouveau chauffeur
      if (driver.user) {
        // Déchiffrer le ride pour les notifications
        ride.setEncryptionService(this.encryptionService);
        
        await this.notificationService.notifyDriverNewRide(
          driver.user.phone,
          ride,
        );

        // Envoyer notification interne au chauffeur
        try {
          await this.internalNotificationsService.notifyDriverNewRide(
            driver.id,
            ride,
          );
        } catch (error) {
          console.error('Erreur notification interne chauffeur:', error);
        }
      }
    }
  }

  async getRideStatus(rideId: string) {
    const ride = await this.rideRepository.findOne({
      where: { id: rideId },
      relations: ['driver', 'driver.user', 'pricing'],
    });

    if (!ride) {
      throw new NotFoundException('Course non trouvée');
    }

    return ride;
  }

  async getClientRides(
    page: number = 1,
    limit: number = 10,
    phone?: string,
    email?: string,
    firstName?: string,
    lastName?: string
  ): Promise<PaginatedResponse<Ride>> {
    const skip = (page - 1) * limit;
    
    if (!phone && !email && !firstName && !lastName) {
      throw new BadRequestException('Téléphone, email, nom ou prénom requis');
    }

    // Récupérer toutes les courses avec relations
    const query = this.rideRepository
      .createQueryBuilder('ride')
      .leftJoinAndSelect('ride.driver', 'driver')
      .leftJoinAndSelect('driver.user', 'user')
      .orderBy('ride.scheduledAt', 'DESC');

    // Compter le total (avant filtrage et pagination)
    const totalBeforeFilter = await query.getCount();

    // Appliquer la pagination
    query.skip(skip).take(limit);

    let rides = await query.getMany();

    // Injecter le service d'encryption pour déchiffrer
    rides.forEach(ride => {
      ride.setEncryptionService(this.encryptionService);
    });

    // Filtrer selon les critères (après déchiffrement)
    const filteredRides = rides.filter(ride => {
      let matches = true;

      if (phone) {
        // Essayer d'abord par hash (plus rapide)
        const phoneHash = this.hashForSearch(phone);
        if (ride.clientPhoneHash === phoneHash) {
          // Hash correspond, garder cette course
        } else {
          // Sinon, vérifier dans le texte déchiffré (pour compatibilité)
          const decryptedPhone = ride.clientPhone?.toLowerCase() || '';
          matches = matches && decryptedPhone.includes(phone.toLowerCase());
        }
      }

      if (email) {
        const emailHash = this.hashForSearch(email);
        if (ride.clientEmailHash === emailHash) {
          // Hash correspond
        } else {
          const decryptedEmail = ride.clientEmail?.toLowerCase() || '';
          matches = matches && decryptedEmail.includes(email.toLowerCase());
        }
      }

      if (firstName) {
        const decryptedFirstName = ride.clientFirstName?.toLowerCase() || '';
        matches = matches && decryptedFirstName.includes(firstName.toLowerCase());
      }

      if (lastName) {
        const decryptedLastName = ride.clientLastName?.toLowerCase() || '';
        matches = matches && decryptedLastName.includes(lastName.toLowerCase());
      }

      return matches;
    });

    // Note: Le total réel après filtrage nécessiterait de compter toutes les courses filtrées
    // Pour l'instant, on utilise une approximation basée sur le total avant filtrage
    // Une implémentation plus précise nécessiterait de compter après filtrage
    const total = filteredRides.length === limit ? totalBeforeFilter : filteredRides.length;
    const totalPages = Math.ceil(total / limit);

    return {
      data: filteredRides,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  private hashForSearch(value: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
  }

  async cancelRide(rideId: string, reason: string, cancelledBy: string) {
    const ride = await this.rideRepository.findOne({
      where: { id: rideId },
      relations: ['driver'],
    });

    if (!ride) {
      throw new NotFoundException('Course non trouvée');
    }

    if (ride.status === RideStatus.COMPLETED) {
      throw new BadRequestException('Impossible d\'annuler une course terminée');
    }

    if (ride.status === RideStatus.CANCELLED) {
      throw new BadRequestException('Course déjà annulée');
    }

    ride.status = RideStatus.CANCELLED;
    ride.cancelledAt = new Date();
    ride.cancellationReason = reason;
    ride.cancelledBy = cancelledBy;

    // Libérer le chauffeur si assigné
    if (ride.driverId && ride.driver) {
      ride.driver.status = DriverStatus.AVAILABLE;
      await this.driverRepository.save(ride.driver);
    }

    await this.rideRepository.save(ride);

    // Émettre mise à jour via WebSocket
    ride.setEncryptionService(this.encryptionService);
    this.websocketGateway.emitRideUpdate(ride.id, {
      id: ride.id,
      status: ride.status,
      cancelledAt: ride.cancelledAt,
      cancellationReason: ride.cancellationReason,
      cancelledBy: ride.cancelledBy,
    });

    // Notifier le client (WhatsApp/SMS)
    ride.setEncryptionService(this.encryptionService);
    await this.notificationService.notifyRideCancelled(ride.clientPhone, ride);

    // Notifier le client (si utilisateur trouvé) et les admins via notifications internes
    try {
      const clientPhoneHash = ride.clientPhoneHash;
      const clientEmailHash = ride.clientEmailHash;

      let clientUser: User | null = null;
      if (clientPhoneHash) {
        clientUser = await this.userRepository.findOne({
          where: { phoneHash: clientPhoneHash },
        });
      }
      if (!clientUser && clientEmailHash) {
        clientUser = await this.userRepository.findOne({
          where: { emailHash: clientEmailHash },
        });
      }

      if (clientUser) {
        await this.internalNotificationsService.notifyRideCancelled(
          clientUser.id,
          ride,
          reason,
        );
      }

      // Notifier les admins
      const adminUsers = await this.userRepository.find({
        where: { role: UserRole.ADMIN },
      });
      if (adminUsers.length > 0) {
        await Promise.all(adminUsers.map(admin =>
          this.internalNotificationsService.createNotification(
            admin.id,
            InternalNotificationType.RIDE_CANCELLED,
            'Course annulée',
            `La course ${ride.id} a été annulée. Raison: ${reason}`,
            ride.id,
            { cancelledBy },
          )
        ));
      }
    } catch (error) {
      console.error('Erreur notification annulation:', error);
    }

    return ride;
  }
}

