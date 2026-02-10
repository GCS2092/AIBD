import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ride, RideStatus, RideType } from '../entities/ride.entity';
import { CreateRideDto } from './dto/create-ride.dto';
import { UpdateRideByCodeDto } from './dto/update-ride-by-code.dto';
import { Driver, DriverStatus } from '../entities/driver.entity';
import { Pricing, PricingType } from '../entities/pricing.entity';
import { RideAssignment, RideAssignmentStatus } from '../entities/ride-assignment.entity';
import { NotificationService } from '../notifications/notification.service';
import { InternalNotificationsService } from '../notifications/internal-notifications.service';
import { ConfigSystemService } from '../config-system/config-system.service';
import { EncryptionService } from '../encryption/encryption.service';
import { User, UserRole } from '../entities/user.entity';
import { LessThanOrEqual, MoreThanOrEqual, In, Not } from 'typeorm';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { InternalNotificationType } from '../entities/internal-notification.entity';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { Inject, forwardRef } from '@nestjs/common';
import { RideAssignmentService } from './ride-assignment.service';
import { GeocodingService } from '../geocoding/geocoding.service';

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
    @InjectRepository(RideAssignment)
    private rideAssignmentRepository: Repository<RideAssignment>,
    private notificationService: NotificationService,
    private internalNotificationsService: InternalNotificationsService,
    private configSystemService: ConfigSystemService,
    private encryptionService: EncryptionService,
    @Inject(forwardRef(() => WebSocketGateway))
    private websocketGateway: WebSocketGateway,
    private assignmentService: RideAssignmentService,
    private geocodingService: GeocodingService,
  ) {}

  async createRide(createDto: CreateRideDto) {
    if (!createDto.tripType && !createDto.rideType) {
      throw new BadRequestException('Indiquez le type de course (tripType ou rideType)');
    }

    const accessCode = await this.generateAccessCode();
    let pickupLocation: { lat: number; lng: number } | null = null;
    let dropoffLocation: { lat: number; lng: number } | null = null;

    try {
      pickupLocation = await this.geocodingService.geocodeAddress(createDto.pickupAddress);
    } catch (error) {
      console.error('Erreur lors du géocodage de l\'adresse de départ:', error);
    }
    try {
      dropoffLocation = await this.geocodingService.geocodeAddress(createDto.dropoffAddress);
    } catch (error) {
      console.error('Erreur lors du géocodage de l\'adresse de destination:', error);
    }

    const scheduledDate = new Date(createDto.scheduledAt);
    const hour = scheduledDate.getHours();
    let rideType: RideType = createDto.rideType ?? RideType.DAKAR_TO_AIRPORT;
    let tripType: string | undefined = createDto.tripType;
    let pricing: Pricing | null = null;

    if (createDto.tripType) {
      rideType = createDto.tripType === 'retour_simple' ? RideType.AIRPORT_TO_DAKAR : RideType.DAKAR_TO_AIRPORT;
      pricing = await this.pricingRepository.findOne({
        where: {
          tripType: createDto.tripType,
          type: PricingType.STANDARD,
          isActive: true,
        },
      });
      if (!pricing) {
        throw new BadRequestException('Aucun tarif disponible pour ce type de course');
      }
    } else {
      let pricingType = PricingType.STANDARD;
      if (hour >= 22 || hour < 6) pricingType = PricingType.NIGHT;
      else if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) pricingType = PricingType.PEAK_HOURS;
      pricing = await this.pricingRepository.findOne({
        where: { rideType: createDto.rideType, type: pricingType, isActive: true },
      });
      if (!pricing) {
        pricing = await this.pricingRepository.findOne({
          where: { rideType: createDto.rideType, type: PricingType.STANDARD, isActive: true },
        });
      }
      if (!pricing) {
        throw new BadRequestException('Aucun tarif disponible pour ce trajet');
      }
    }

    const price = parseFloat(pricing.price.toString());
    const ride = this.rideRepository.create({
      ...createDto,
      rideType,
      tripType: tripType ?? undefined,
      scheduledAt: scheduledDate,
      price,
      pricingId: pricing.id,
      status: RideStatus.PENDING,
      accessCode,
      pickupLocation: pickupLocation || undefined,
      dropoffLocation: dropoffLocation || undefined,
      pickupCountry: createDto.pickupCountry,
      pickupCity: createDto.pickupCity,
      pickupQuartier: createDto.pickupQuartier,
      dropoffCountry: createDto.dropoffCountry,
      dropoffCity: createDto.dropoffCity,
      dropoffQuartier: createDto.dropoffQuartier,
    });

    const savedRide = await this.rideRepository.save(ride) as Ride;

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

    // Utiliser le service d'assignation injecté
    // Phase 1: Proposition multiple (3-5 chauffeurs simultanément)
    const offered = await this.assignmentService.offerRideToMultipleDrivers(rideId);
    
    if (!offered) {
      // Si la proposition multiple n'a pas fonctionné, passer à l'assignation séquentielle
      await this.assignmentService.assignDriverSequentially(rideId);
      }
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
      relations: ['driver', 'driver.user', 'driver.vehicles', 'pricing'],
    });

    if (!ride) {
      throw new NotFoundException('Course non trouvée');
    }

    // Injecter le service d'encryption pour déchiffrer les données sensibles
    ride.setEncryptionService(this.encryptionService);
    if (ride.driver && ride.driver.user) {
      ride.driver.user.setEncryptionService(this.encryptionService);
    }

    return ride;
  }

  async getClientRides(
    page: number = 1,
    limit: number = 10,
    phone?: string,
    email?: string,
    firstName?: string,
    lastName?: string,
    accessCode?: string
  ): Promise<PaginatedResponse<Ride>> {
    const skip = (page - 1) * limit;
    
    // Le code d'accès est maintenant obligatoire pour la sécurité
    if (!accessCode) {
      throw new BadRequestException('Code d\'accès requis pour consulter vos trajets');
    }
    
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
      // Vérifier d'abord le code d'accès
      if (ride.accessCode !== accessCode) {
        return false;
      }

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

  private async generateAccessCode(): Promise<string> {
    // Générer un code de 8 caractères (chiffres et lettres majuscules)
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      // Vérifier l'unicité
      const existingRide = await this.rideRepository.findOne({
        where: { accessCode: code },
      });
      
      if (!existingRide) {
        return code;
      }
      
      attempts++;
    }
    
    // Si on n'a pas trouvé de code unique après plusieurs tentatives, utiliser un timestamp
    const timestamp = Date.now().toString(36).toUpperCase().slice(-6);
    const randomChars = chars.charAt(Math.floor(Math.random() * chars.length)) + 
                       chars.charAt(Math.floor(Math.random() * chars.length));
    return (timestamp + randomChars).slice(0, 8);
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

  async getRideByAccessCode(accessCode: string, phone: string): Promise<Ride> {
    if (!accessCode?.trim() || !phone?.trim()) {
      throw new BadRequestException('Code d\'accès et téléphone requis');
    }
    const ride = await this.rideRepository.findOne({
      where: { accessCode: accessCode.trim().toUpperCase() },
      relations: ['driver', 'driver.user', 'driver.vehicles', 'pricing'],
    });
    if (!ride) {
      throw new NotFoundException('Réservation non trouvée pour ce code');
    }
    ride.setEncryptionService(this.encryptionService);
    // Normalisation : sans espaces, format international
    let normalizedPhone = phone.trim().replace(/\s/g, '');
    const digitsOnly = normalizedPhone.replace(/\D/g, '');
    if (digitsOnly.length === 9 && (digitsOnly.startsWith('7') || digitsOnly.startsWith('6'))) {
      normalizedPhone = '+221' + digitsOnly;
    } else if (digitsOnly.length >= 9 && !normalizedPhone.startsWith('+')) {
      normalizedPhone = '+' + digitsOnly;
    } else if (digitsOnly.length >= 12 && normalizedPhone.startsWith('+')) {
      normalizedPhone = '+' + digitsOnly;
    }
    const phoneHash = this.hashForSearch(normalizedPhone);
    const hashMatches = ride.clientPhoneHash === phoneHash;
    if (!hashMatches) {
      // Fallback pour les anciennes réservations : comparer avec le téléphone déchiffré
      let decryptedMatch = false;
      try {
        const rawStored = ride.clientPhone;
        if (rawStored && typeof rawStored === 'string' && rawStored.includes(':')) {
          const decrypted = this.encryptionService.decrypt(rawStored);
          const storedNormalized = decrypted.replace(/\s/g, '').trim();
          const inputNorm = normalizedPhone.replace(/\D/g, '');
          const storedNorm = storedNormalized.replace(/\D/g, '');
          decryptedMatch = storedNorm === inputNorm || storedNorm.endsWith(inputNorm.slice(-9)) || inputNorm.endsWith(storedNorm.slice(-9));
        }
      } catch (_) {}
      if (!decryptedMatch) {
        throw new BadRequestException('Téléphone ne correspond pas à cette réservation. Vérifiez le numéro utilisé lors de la réservation.');
      }
    }
    if (ride.driver?.user) {
      ride.driver.user.setEncryptionService(this.encryptionService);
    }
    return ride;
  }

  async updateRideByAccessCode(accessCode: string, phone: string, dto: UpdateRideByCodeDto): Promise<Ride> {
    const ride = await this.getRideByAccessCode(accessCode, phone);
    if (ride.status !== RideStatus.PENDING && ride.status !== RideStatus.ASSIGNED) {
      throw new BadRequestException('Seules les réservations en attente ou assignées peuvent être modifiées');
    }
    const updatable: Partial<Ride> = {};
    if (dto.clientFirstName !== undefined) updatable.clientFirstName = dto.clientFirstName;
    if (dto.clientLastName !== undefined) updatable.clientLastName = dto.clientLastName;
    if (dto.clientPhone !== undefined) updatable.clientPhone = dto.clientPhone;
    if (dto.clientEmail !== undefined) updatable.clientEmail = dto.clientEmail;
    if (dto.pickupAddress !== undefined) updatable.pickupAddress = dto.pickupAddress;
    if (dto.dropoffAddress !== undefined) updatable.dropoffAddress = dto.dropoffAddress;
    if (dto.pickupCountry !== undefined) updatable.pickupCountry = dto.pickupCountry;
    if (dto.pickupCity !== undefined) updatable.pickupCity = dto.pickupCity;
    if (dto.pickupQuartier !== undefined) updatable.pickupQuartier = dto.pickupQuartier;
    if (dto.dropoffCountry !== undefined) updatable.dropoffCountry = dto.dropoffCountry;
    if (dto.dropoffCity !== undefined) updatable.dropoffCity = dto.dropoffCity;
    if (dto.dropoffQuartier !== undefined) updatable.dropoffQuartier = dto.dropoffQuartier;
    if (dto.flightNumber !== undefined) updatable.flightNumber = dto.flightNumber;
    if (dto.scheduledAt !== undefined) updatable.scheduledAt = new Date(dto.scheduledAt);
    if (dto.tripType !== undefined) {
      updatable.tripType = dto.tripType;
      updatable.rideType = dto.tripType === 'retour_simple' ? RideType.AIRPORT_TO_DAKAR : RideType.DAKAR_TO_AIRPORT;
      const pricing = await this.pricingRepository.findOne({
        where: { tripType: dto.tripType, type: PricingType.STANDARD, isActive: true },
      });
      if (pricing) {
        updatable.price = parseFloat(pricing.price.toString());
        updatable.pricingId = pricing.id;
      }
    } else if (dto.rideType !== undefined) {
      updatable.rideType = dto.rideType;
      const pricing = await this.pricingRepository.findOne({
        where: { rideType: dto.rideType, type: PricingType.STANDARD, isActive: true },
      });
      if (pricing) {
        updatable.price = parseFloat(pricing.price.toString());
        updatable.pricingId = pricing.id;
      }
    }
    Object.assign(ride, updatable);
    const saved = await this.rideRepository.save(ride) as Ride;
    saved.setEncryptionService(this.encryptionService);
    if (saved.driver?.user) saved.driver.user.setEncryptionService(this.encryptionService);
    return saved;
  }
}

