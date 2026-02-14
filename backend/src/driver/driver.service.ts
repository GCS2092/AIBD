import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull } from 'typeorm';
import { Driver, DriverStatus } from '../entities/driver.entity';
import { Ride, RideStatus } from '../entities/ride.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { User } from '../entities/user.entity';
import { RideAssignment } from '../entities/ride-assignment.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ConfigSystemService } from '../config-system/config-system.service';
import { InternalNotificationsService } from '../notifications/internal-notifications.service';
import { OneSignalService } from '../notifications/onesignal.service';
import { EncryptionService } from '../encryption/encryption.service';
import { RequestProfileUpdateDto } from './dto/request-profile-update.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UserRole } from '../entities/user.entity';
import { InternalNotificationType } from '../entities/internal-notification.entity';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { Inject, forwardRef } from '@nestjs/common';

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(Ride)
    private rideRepository: Repository<Ride>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RideAssignment)
    private rideAssignmentRepository: Repository<RideAssignment>,
    private configSystemService: ConfigSystemService,
    private internalNotificationsService: InternalNotificationsService,
    private oneSignalService: OneSignalService,
    private encryptionService: EncryptionService,
    @Inject(forwardRef(() => WebSocketGateway))
    private websocketGateway: WebSocketGateway,
  ) {}

  async getMyProfile(userId: string) {
    const driver = await this.driverRepository.findOne({
      where: { userId },
      relations: ['user', 'vehicles', 'rides'],
    });

    if (!driver) {
      throw new NotFoundException('Chauffeur non trouvé');
    }

    // Injecter le service d'encryption pour déchiffrer
    driver.setEncryptionService(this.encryptionService);
    
    // Déchiffrer les données du chauffeur
    if (driver.licenseNumber && driver.licenseNumber.includes(':')) {
      try {
        driver.licenseNumber = this.encryptionService.decrypt(driver.licenseNumber);
      } catch (e) {
        // Ignorer si échec
      }
    }

    // Déchiffrer les données de l'utilisateur
    if (driver.user) {
      driver.user.setEncryptionService(this.encryptionService);
      
      // Forcer le déchiffrement en accédant aux propriétés
      if (driver.user.email && driver.user.email.includes(':')) {
        try {
          driver.user.email = this.encryptionService.decrypt(driver.user.email);
        } catch (e) {
          // Ignorer si échec
        }
      }
      
      if (driver.user.phone && driver.user.phone.includes(':')) {
        try {
          driver.user.phone = this.encryptionService.decrypt(driver.user.phone);
        } catch (e) {
          // Ignorer si échec
        }
      }
    }

    return driver;
  }

  async updateStatus(userId: string, status: DriverStatus) {
    const driver = await this.driverRepository.findOne({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Chauffeur non trouvé');
    }

    // Ne peut pas changer de statut si en course
    if (driver.status === DriverStatus.ON_RIDE && status !== DriverStatus.ON_RIDE) {
      const activeRide = await this.rideRepository.findOne({
        where: {
          driverId: driver.id,
          status: RideStatus.IN_PROGRESS,
        },
      });

      if (activeRide) {
        throw new BadRequestException('Vous avez une course en cours. Terminez-la d\'abord.');
      }
    }

    driver.status = status;
    await this.driverRepository.save(driver);

    return driver;
  }

  async getMyRides(
    userId: string,
    page: number = 1,
    limit: number = 10,
    status?: RideStatus
  ): Promise<PaginatedResponse<Ride>> {
    const skip = (page - 1) * limit;
    
    const driver = await this.driverRepository.findOne({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Chauffeur non trouvé');
    }

    // Récupérer les courses assignées au chauffeur
    const query = this.rideRepository
      .createQueryBuilder('ride')
      .where('ride.driverId = :driverId', { driverId: driver.id })
      .orderBy('ride.scheduledAt', 'DESC');

    if (status) {
      query.andWhere('ride.status = :status', { status });
    }

    // Compter le total
    const total = await query.getCount();

    // Appliquer la pagination
    query.skip(skip).take(limit);

    const assignedRides = await query.getMany();

    // Injecter le service d'encryption pour déchiffrer
    assignedRides.forEach(ride => {
      ride.setEncryptionService(this.encryptionService);
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: assignedRides,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async getAvailableRides(userId: string) {
    const driver = await this.driverRepository.findOne({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Chauffeur non trouvé');
    }

    if (driver.status !== DriverStatus.AVAILABLE) {
      return []; // Pas de courses disponibles si le chauffeur n'est pas disponible
    }

    // Récupérer les courses en attente (pending) qui n'ont pas encore de chauffeur assigné
    const availableRides = await this.rideRepository.find({
      where: {
        status: RideStatus.PENDING,
        driverId: null as any,
      },
      order: { scheduledAt: 'ASC' },
      take: 10, // Limiter à 10 courses disponibles
    });

    // Récupérer aussi les courses déjà acceptées par d'autres chauffeurs pour informer
    const acceptedRides = await this.rideRepository
      .createQueryBuilder('ride')
      .where('ride.status IN (:...statuses)', { 
        statuses: [RideStatus.ASSIGNED, RideStatus.ACCEPTED] 
      })
      .andWhere('ride.driverId IS NOT NULL')
      .orderBy('ride.scheduledAt', 'ASC')
      .take(10)
      .getMany();

    // Injecter le service d'encryption pour déchiffrer
    availableRides.forEach(ride => {
      ride.setEncryptionService(this.encryptionService);
    });

    // Pour les courses acceptées, masquer les infos du chauffeur et marquer comme acceptée
    acceptedRides.forEach(ride => {
      ride.setEncryptionService(this.encryptionService);
      // Marquer comme acceptée par un autre chauffeur
      (ride as any).acceptedByOther = true;
      // Retirer les infos du chauffeur pour la confidentialité
      ride.driver = null as any;
      ride.driverId = null as any;
    });

    // Combiner les courses disponibles et les courses acceptées
    return [...availableRides, ...acceptedRides];
  }

  async acceptRide(userId: string, rideId: string) {
    const driver = await this.driverRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!driver) {
      throw new NotFoundException('Chauffeur non trouvé');
    }

    // Vérifier que le chauffeur est disponible
    if (driver.status !== DriverStatus.AVAILABLE) {
      throw new BadRequestException('Vous devez être disponible pour accepter une course');
    }

    // Vérifier qu'il n'a pas déjà une course active (non terminée)
    const activeRide = await this.rideRepository.findOne({
      where: {
        driverId: driver.id,
        status: In([
          RideStatus.ASSIGNED,
          RideStatus.ACCEPTED,
          RideStatus.DRIVER_ON_WAY,
          RideStatus.PICKED_UP,
          RideStatus.IN_PROGRESS,
        ]),
      },
    });

    if (activeRide) {
      throw new BadRequestException(
        `Vous avez déjà une course active (${activeRide.id.substring(0, 8)}). Veuillez terminer cette course avant d'en accepter une autre.`
      );
    }

    // Chercher la course - peut être soit assignée au chauffeur, soit disponible (PENDING sans driverId)
    const ride = await this.rideRepository.findOne({
      where: [
        { id: rideId, driverId: driver.id }, // Course déjà assignée au chauffeur
        { id: rideId, status: RideStatus.PENDING, driverId: null as any }, // Course disponible
      ],
    });

    if (!ride) {
      throw new NotFoundException('Course non trouvée ou non disponible');
    }

    // Vérifier s'il y a une proposition (RideAssignment) pour ce chauffeur
    const RideAssignmentStatus = {
      OFFERED: 'offered',
      ACCEPTED: 'accepted',
      REFUSED: 'refused',
      TIMEOUT: 'timeout',
    };
    
    const assignment = await this.rideAssignmentRepository.findOne({
      where: {
        rideId: ride.id,
        driverId: driver.id,
        status: RideAssignmentStatus.OFFERED as any,
      },
    });

    // Si la course n'est pas encore assignée, l'assigner au chauffeur
    if (!ride.driverId) {
      ride.driverId = driver.id;
      ride.assignedAt = new Date();
      ride.status = RideStatus.ASSIGNED;
    }

    // Vérifier que la course est en statut ASSIGNED ou PENDING
    if (ride.status !== RideStatus.ASSIGNED && ride.status !== RideStatus.PENDING) {
      throw new BadRequestException('Cette course n\'est pas en attente d\'acceptation');
    }

    // Marquer l'assignation comme acceptée si elle existe
    if (assignment) {
      assignment.status = RideAssignmentStatus.ACCEPTED as any;
      assignment.respondedAt = new Date();
      await this.rideAssignmentRepository.save(assignment);
    }

    // Accepter la course
    ride.status = RideStatus.ACCEPTED;
    ride.acceptedAt = new Date();
    driver.status = DriverStatus.ON_RIDE;
    driver.consecutiveRides += 1;

    await this.rideRepository.save(ride);
    await this.driverRepository.save(driver);

    // Notifier le client (si utilisateur trouvé) et les admins
    try {
      // Chercher l'utilisateur client par email ou phone hash
      ride.setEncryptionService(this.encryptionService);
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

      // Émettre mise à jour via WebSocket
      this.websocketGateway.emitRideUpdate(ride.id, {
        id: ride.id,
        status: ride.status,
        driverId: ride.driverId,
        acceptedAt: ride.acceptedAt,
      });
      if (clientUser) {
        this.websocketGateway.emitToClient(clientUser.id, 'ride:accepted', {
          rideId: ride.id,
          status: ride.status,
          driverName: driver.user?.firstName && driver.user?.lastName ? `${driver.user.firstName} ${driver.user.lastName}`.trim() : 'Le chauffeur',
        });
      }

      // Si client trouvé, lui envoyer une notification
      if (clientUser) {
        await this.internalNotificationsService.notifyRideAccepted(
          clientUser.id,
          ride,
          driver,
        );
        await this.oneSignalService.notifyClientRideAccepted(clientUser.id, ride.id);
      }

      // Notifier les admins
      const adminUsers = await this.userRepository.find({
        where: { role: UserRole.ADMIN },
      });
      if (adminUsers.length > 0) {
        await Promise.all(adminUsers.map(admin =>
          this.internalNotificationsService.createNotification(
            admin.id,
            InternalNotificationType.RIDE_ACCEPTED,
            'Course acceptée',
            `La course ${ride.id} a été acceptée par le chauffeur ${driver.user?.firstName && driver.user?.lastName ? `${driver.user.firstName} ${driver.user.lastName}`.trim() : 'assigné'}`,
            ride.id,
            { driverId: driver.id },
          )
        ));
      }
    } catch (error) {
      console.error('Erreur notification acceptation:', error);
    }

    return ride;
  }

  async refuseRide(userId: string, rideId: string, reason?: string) {
    const driver = await this.driverRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!driver) {
      throw new NotFoundException('Chauffeur non trouvé');
    }

    const ride = await this.rideRepository.findOne({
      where: { id: rideId, driverId: driver.id },
    });

    if (!ride) {
      throw new NotFoundException('Course non trouvée');
    }

    if (ride.status !== RideStatus.ASSIGNED && ride.status !== RideStatus.PENDING) {
      throw new BadRequestException('Cette course ne peut pas être refusée');
    }

    // Marquer l'assignation comme refusée si elle existe
    const RideAssignmentStatus = {
      OFFERED: 'offered',
      ACCEPTED: 'accepted',
      REFUSED: 'refused',
      TIMEOUT: 'timeout',
    };
    
    const assignment = await this.rideAssignmentRepository.findOne({
      where: {
        rideId: ride.id,
        driverId: driver.id,
        status: RideAssignmentStatus.OFFERED as any,
      },
    });

    if (assignment) {
      assignment.status = RideAssignmentStatus.REFUSED as any;
      assignment.respondedAt = new Date();
      assignment.refusalReason = reason || null;
      await this.rideAssignmentRepository.save(assignment);
    }

    // Retirer l'attribution
    ride.driverId = null as any;
    ride.status = RideStatus.PENDING;
    ride.assignedAt = null as any;

    await this.rideRepository.save(ride);

    // Notifier le chauffeur et les admins
    try {
      await this.internalNotificationsService.notifyRideRefused(
        driver.id,
        ride,
      );

      // Notifier les admins
      const adminUsers = await this.userRepository.find({
        where: { role: UserRole.ADMIN },
      });
      if (adminUsers.length > 0) {
        await Promise.all(adminUsers.map(admin =>
          this.internalNotificationsService.createNotification(
            admin.id,
            InternalNotificationType.RIDE_REFUSED,
            'Course refusée',
            `La course ${ride.id} a été refusée par le chauffeur ${driver.user?.firstName && driver.user?.lastName ? `${driver.user.firstName} ${driver.user.lastName}`.trim() : 'assigné'}`,
            ride.id,
            { driverId: driver.id },
          )
        ));
      }
    } catch (error) {
      console.error('Erreur notification refus:', error);
    }

    return { message: 'Course refusée avec succès' };
  }

  async startRide(userId: string, rideId: string) {
    const driver = await this.driverRepository.findOne({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Chauffeur non trouvé');
    }

    const ride = await this.rideRepository.findOne({
      where: { id: rideId, driverId: driver.id },
    });

    if (!ride) {
      throw new NotFoundException('Course non trouvée');
    }

    if (ride.status !== RideStatus.ACCEPTED && ride.status !== RideStatus.DRIVER_ON_WAY) {
      throw new BadRequestException('Course non prête à démarrer');
    }

    // Vérifier que la course peut être démarrée (date prévue dans le passé ou aujourd'hui)
    const now = new Date();
    const scheduledDate = new Date(ride.scheduledAt);
    // Permettre de démarrer jusqu'à 2 heures avant la date prévue (pour les courses à l'aéroport)
    const allowedStartTime = new Date(scheduledDate.getTime() - 2 * 60 * 60 * 1000);
    
    if (now < allowedStartTime) {
      const daysUntilRide = Math.ceil((scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      throw new BadRequestException(
        `Cette course est prévue pour le ${scheduledDate.toLocaleDateString('fr-FR')} à ${scheduledDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}. ` +
        `Vous ne pouvez pas démarrer une course ${daysUntilRide > 1 ? `${daysUntilRide} jours` : 'avant sa date prévue'}.`
      );
    }

    ride.status = RideStatus.IN_PROGRESS;
    ride.startedAt = new Date();

    await this.rideRepository.save(ride);

    // Émettre mise à jour via WebSocket
    ride.setEncryptionService(this.encryptionService);
    this.websocketGateway.emitRideUpdate(ride.id, {
      id: ride.id,
      status: ride.status,
      startedAt: ride.startedAt,
    });

    // Notifier le client (si utilisateur trouvé) et les admins
    try {
      ride.setEncryptionService(this.encryptionService);
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
        this.websocketGateway.emitToClient(clientUser.id, 'ride:started', {
          rideId: ride.id,
          status: ride.status,
        });
        await this.internalNotificationsService.notifyRideStarted(
          clientUser.id,
          ride,
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
            InternalNotificationType.RIDE_STARTED,
            'Course démarrée',
            `La course ${ride.id} a été démarrée par le chauffeur`,
            ride.id,
            { driverId: driver.id },
          )
        ));
      }
    } catch (error) {
      console.error('Erreur notification démarrage:', error);
    }

    return ride;
  }

  async completeRide(userId: string, rideId: string) {
    const driver = await this.driverRepository.findOne({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Chauffeur non trouvé');
    }

    const ride = await this.rideRepository.findOne({
      where: { id: rideId, driverId: driver.id },
    });

    if (!ride) {
      throw new NotFoundException('Course non trouvée');
    }

    if (ride.status !== RideStatus.IN_PROGRESS && ride.status !== RideStatus.PICKED_UP) {
      throw new BadRequestException('Course non en cours');
    }

    // Vérifier que la course a bien été démarrée (startedAt doit exister)
    if (!ride.startedAt) {
      throw new BadRequestException('Impossible de terminer une course qui n\'a pas été démarrée');
    }

    ride.status = RideStatus.COMPLETED;
    ride.completedAt = new Date();

    // Réinitialiser le statut du chauffeur
    driver.status = DriverStatus.AVAILABLE;

    // Vérifier si pause automatique nécessaire (configurable)
    const autoBreakAfter = (await this.configSystemService.getConfigAsNumber('auto_break_after_rides')) || 5;
    if (driver.consecutiveRides >= autoBreakAfter) {
      driver.status = DriverStatus.ON_BREAK;
      driver.consecutiveRides = 0;
    }

    await this.rideRepository.save(ride);
    await this.driverRepository.save(driver);

    // Émettre mise à jour via WebSocket
    ride.setEncryptionService(this.encryptionService);
    this.websocketGateway.emitRideUpdate(ride.id, {
      id: ride.id,
      status: ride.status,
      completedAt: ride.completedAt,
    });

    // Notifier le client (si utilisateur trouvé) et les admins
    try {
      ride.setEncryptionService(this.encryptionService);
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
        this.websocketGateway.emitToClient(clientUser.id, 'ride:completed', {
          rideId: ride.id,
          status: ride.status,
        });
        await this.internalNotificationsService.notifyRideCompleted(
          clientUser.id,
          ride,
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
            InternalNotificationType.RIDE_COMPLETED,
            'Course terminée',
            `La course ${ride.id} a été terminée`,
            ride.id,
            { driverId: driver.id },
          )
        ));
      }
    } catch (error) {
      console.error('Erreur notification complétion:', error);
    }

    return ride;
  }

  async requestProfileUpdate(userId: string, updateDto: RequestProfileUpdateDto) {
    const driver = await this.driverRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!driver) {
      throw new NotFoundException('Chauffeur non trouvé');
    }

    // Créer une notification interne pour l'admin
    const changes: string[] = [];
    if (updateDto.firstName) changes.push(`Prénom: ${driver.user.firstName} → ${updateDto.firstName}`);
    if (updateDto.lastName) changes.push(`Nom: ${driver.user.lastName} → ${updateDto.lastName}`);
    if (updateDto.phone) changes.push(`Téléphone: ${driver.user.phone} → ${updateDto.phone}`);

    if (changes.length === 0) {
      throw new BadRequestException('Aucune modification demandée');
    }

    // Récupérer tous les admins
    const admins = await this.userRepository.find({
      where: { role: UserRole.ADMIN },
    });

    // Envoyer une notification à chaque admin
    const notifications = admins.map(admin =>
      this.internalNotificationsService.createNotification(
        admin.id,
        InternalNotificationType.SYSTEM_ALERT,
        'Demande de modification de profil',
        `Le chauffeur ${driver.user.firstName} ${driver.user.lastName} demande une modification:\n${changes.join('\n')}`,
        undefined,
        {
          driverId: driver.id,
          requestedChanges: updateDto,
        },
      ),
    );

    await Promise.all(notifications);

    return {
      message: 'Demande de modification envoyée. Elle sera traitée par un administrateur.',
    };
  }

  async registerVehicle(userId: string, vehicleDto: CreateVehicleDto) {
    const driver = await this.driverRepository.findOne({
      where: { userId },
      relations: ['vehicles'],
    });

    if (!driver) {
      throw new NotFoundException('Chauffeur non trouvé');
    }

    // Vérifier qu'il n'a pas déjà un véhicule
    if (driver.vehicles && driver.vehicles.length > 0) {
      throw new BadRequestException('Vous avez déjà un véhicule enregistré. Contactez un administrateur pour modifier.');
    }

    // Vérifier que l'immatriculation n'existe pas déjà
    const existingVehicle = await this.vehicleRepository.findOne({
      where: { licensePlate: vehicleDto.licensePlate },
    });

    if (existingVehicle) {
      throw new BadRequestException('Cette immatriculation est déjà enregistrée');
    }

    const vehicle = this.vehicleRepository.create({
      ...vehicleDto,
      driverId: driver.id,
    });

    const savedVehicle = await this.vehicleRepository.save(vehicle);

    // Récupérer tous les admins
    const admins = await this.userRepository.find({
      where: { role: UserRole.ADMIN },
    });

    // Notifier chaque admin
    const notifications = admins.map(admin =>
      this.internalNotificationsService.createNotification(
        admin.id,
        InternalNotificationType.SYSTEM_ALERT,
        'Nouveau véhicule enregistré',
        `Le chauffeur ${driver.user.firstName} ${driver.user.lastName} a enregistré un véhicule: ${vehicleDto.brand} ${vehicleDto.model} (${vehicleDto.licensePlate})`,
        undefined,
        {
          driverId: driver.id,
          vehicleId: savedVehicle.id,
        },
      ),
    );

    await Promise.all(notifications);

    return savedVehicle;
  }

  async getMyVehicle(userId: string) {
    const driver = await this.driverRepository.findOne({
      where: { userId },
      relations: ['vehicles'],
    });

    if (!driver) {
      throw new NotFoundException('Chauffeur non trouvé');
    }

    return driver.vehicles && driver.vehicles.length > 0 ? driver.vehicles[0] : null;
  }

  async getRideById(userId: string, rideId: string): Promise<Ride> {
    const driver = await this.driverRepository.findOne({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Chauffeur non trouvé');
    }

    // D'abord, chercher la course par ID
    const ride = await this.rideRepository.findOne({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException('Course non trouvée');
    }

    // Vérifier si la course est assignée à ce chauffeur
    if (ride.driverId === driver.id) {
      // Course assignée à ce chauffeur - autoriser l'accès
      ride.setEncryptionService(this.encryptionService);
      return ride;
    }

    // Si la course n'est pas assignée, vérifier si elle est disponible (PENDING ou ASSIGNED sans driverId)
    if (!ride.driverId && (ride.status === RideStatus.PENDING || ride.status === RideStatus.ASSIGNED)) {
      // Course disponible - autoriser l'accès pour voir les détails avant acceptation
      ride.setEncryptionService(this.encryptionService);
      return ride;
    }

    // Course assignée à un autre chauffeur ou statut non autorisé
    if (ride.driverId && ride.driverId !== driver.id) {
      throw new NotFoundException('Cette course est assignée à un autre chauffeur');
    }

    throw new NotFoundException('Course non accessible');
  }
}

