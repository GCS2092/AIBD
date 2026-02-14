import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { Ride, RideStatus } from '../entities/ride.entity';
import { Driver, DriverStatus } from '../entities/driver.entity';
import { RideAssignment, RideAssignmentStatus } from '../entities/ride-assignment.entity';
import { User, UserRole } from '../entities/user.entity';
import { ConfigSystemService } from '../config-system/config-system.service';
import { NotificationService } from '../notifications/notification.service';
import { InternalNotificationsService } from '../notifications/internal-notifications.service';
import { OneSignalService } from '../notifications/onesignal.service';
import { InternalNotificationType } from '../entities/internal-notification.entity';
import { EncryptionService } from '../encryption/encryption.service';
import { WebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class RideAssignmentService {
  constructor(
    @InjectRepository(Ride)
    private rideRepository: Repository<Ride>,
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(RideAssignment)
    private rideAssignmentRepository: Repository<RideAssignment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configSystemService: ConfigSystemService,
    private notificationService: NotificationService,
    private internalNotificationsService: InternalNotificationsService,
    private oneSignalService: OneSignalService,
    private encryptionService: EncryptionService,
    @Inject(forwardRef(() => WebSocketGateway))
    private websocketGateway: WebSocketGateway,
  ) {}

  /**
   * Calcule la distance entre deux points GPS (formule de Haversine)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Détermine si une course est immédiate, du jour, ou future
   */
  private getRideTimeCategory(scheduledAt: Date): 'immediate' | 'today' | 'future' {
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    const diffHours = (scheduled.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 2) return 'immediate';
    if (diffHours < 24) return 'today';
    return 'future';
  }

  /**
   * Récupère les chauffeurs qui ont déjà refusé cette course
   */
  private async getRefusedDriverIds(rideId: string): Promise<string[]> {
    const refusedAssignments = await this.rideAssignmentRepository.find({
      where: {
        rideId,
        status: In([RideAssignmentStatus.REFUSED, RideAssignmentStatus.TIMEOUT]),
      },
      select: ['driverId'],
    });

    return refusedAssignments.map(a => a.driverId);
  }

  /**
   * Trouve les meilleurs chauffeurs pour une course (avec géolocalisation si disponible)
   */
  private async findBestDrivers(
    ride: Ride,
    count: number = 5,
    excludeDriverIds: string[] = [],
  ): Promise<Driver[]> {
    const rideTimeCategory = this.getRideTimeCategory(ride.scheduledAt);
    const maxDistance = await this.configSystemService.getConfigAsNumber('max_assignment_distance') || 50; // 50km par défaut

    // Construire la requête de base
    let query = this.driverRepository
      .createQueryBuilder('driver')
      .leftJoinAndSelect('driver.user', 'user')
      .where('driver.status = :status', { status: DriverStatus.AVAILABLE })
      .andWhere('driver.isVerified = :isVerified', { isVerified: true });

    // Exclure les chauffeurs qui ont déjà refusé
    if (excludeDriverIds.length > 0) {
      query.andWhere('driver.id NOT IN (:...excludeIds)', { excludeIds: excludeDriverIds });
    }

    // Pour les courses immédiates, prioriser la distance si on a les coordonnées
    // Note: On suppose que les coordonnées GPS du chauffeur sont dans driver.currentLocation
    // Pour l'instant, on priorise par totalRides (moins de courses = plus disponible)
    query.orderBy('driver.totalRides', 'ASC');

    // Limiter le nombre de résultats
    query.take(count);

    const drivers = await query.getMany();

    // Si on a les coordonnées GPS, trier par distance
    // TODO: Implémenter quand on aura les coordonnées GPS des chauffeurs
    // Pour l'instant, on retourne les chauffeurs triés par totalRides

    return drivers;
  }

  /**
   * Propose une course à plusieurs chauffeurs simultanément
   */
  async offerRideToMultipleDrivers(rideId: string): Promise<boolean> {
    const ride = await this.rideRepository.findOne({
      where: { id: rideId },
    });

    if (!ride || ride.driverId || ride.status !== RideStatus.PENDING) {
      return false;
    }

    // Vérifier le nombre maximum de tentatives
    const maxAttempts = await this.configSystemService.getConfigAsNumber('max_assignment_attempts') || 7;
    if (ride.assignmentAttempts >= maxAttempts) {
      // Passer en attente manuelle
      ride.status = RideStatus.PENDING; // Garder PENDING mais notifier l'admin
      
      // Notifier les admins
      const adminUsers = await this.userRepository.find({
        where: { role: UserRole.ADMIN },
      });
      
      if (adminUsers.length > 0) {
        await Promise.all(adminUsers.map(admin =>
          this.internalNotificationsService.createNotification(
            admin.id,
            InternalNotificationType.SYSTEM_ALERT,
            'Course nécessite assignation manuelle',
            `La course ${rideId} a atteint le maximum de tentatives (${maxAttempts}). Assignation manuelle requise.`,
            rideId,
            { assignmentAttempts: ride.assignmentAttempts },
          )
        ));
      }

      await this.rideRepository.save(ride);
      return false;
    }

    // Récupérer les chauffeurs qui ont déjà refusé
    const refusedDriverIds = await this.getRefusedDriverIds(rideId);

    // Nombre de chauffeurs à proposer (configurable)
    const offerCount = await this.configSystemService.getConfigAsNumber('simultaneous_offer_count') || 3;

    // Trouver les meilleurs chauffeurs
    const drivers = await this.findBestDrivers(ride, offerCount, refusedDriverIds);

    if (drivers.length === 0) {
      // Aucun chauffeur disponible, incrémenter les tentatives
      ride.assignmentAttempts += 1;
      ride.lastAssignmentAttempt = new Date();
      await this.rideRepository.save(ride);
      return false;
    }

    // Créer les propositions
    const assignments: RideAssignment[] = [];
    for (const driver of drivers) {
      const assignment = this.rideAssignmentRepository.create({
        rideId: ride.id,
        driverId: driver.id,
        status: RideAssignmentStatus.OFFERED,
        offeredAt: new Date(),
      });
      assignments.push(assignment);
    }

    await this.rideAssignmentRepository.save(assignments);

    // Incrémenter les tentatives
    ride.assignmentAttempts += 1;
    ride.lastAssignmentAttempt = new Date();
    await this.rideRepository.save(ride);

    // Notifier chaque chauffeur (SMS, interne, OneSignal push, WebSocket)
    ride.setEncryptionService(this.encryptionService);
    for (const driver of drivers) {
      if (driver.user) {
        try {
          await this.notificationService.notifyDriverNewRide(
            driver.user.phone,
            ride,
          );
        } catch (error) {
          console.error(`Erreur notification externe chauffeur ${driver.id}:`, error);
        }
        try {
          await this.internalNotificationsService.notifyDriverNewRide(
            driver.id,
            ride,
          );
        } catch (error) {
          console.error(`Erreur notification interne chauffeur ${driver.id}:`, error);
        }
        try {
          await this.oneSignalService.notifyDriverAssigned(
            driver.user.id,
            ride.id,
            ride.pickupAddress || 'Voir détails',
          );
        } catch (error) {
          console.error(`Erreur OneSignal chauffeur ${driver.id}:`, error);
        }
        try {
          this.websocketGateway.emitToDriver(driver.user.id, 'ride:offered', {
            rideId: ride.id,
            status: 'offered',
            scheduledAt: ride.scheduledAt,
          });
        } catch (error) {
          console.error(`Erreur WebSocket chauffeur ${driver.id}:`, error);
        }
      }
    }

    // Timeout configurable (plus court pour proposition multiple)
    const timeoutSeconds = await this.configSystemService.getConfigAsNumber('multiple_offer_timeout') || 90; // 90 secondes par défaut

    setTimeout(async () => {
      await this.handleOfferTimeout(rideId);
    }, timeoutSeconds * 1000);

    return true;
  }

  /**
   * Gère le timeout des propositions multiples
   */
  private async handleOfferTimeout(rideId: string) {
    const ride = await this.rideRepository.findOne({
      where: { id: rideId },
    });

    if (!ride || ride.driverId || ride.status !== RideStatus.PENDING) {
      return; // Déjà assignée ou annulée
    }

    // Marquer toutes les propositions non répondues comme timeout
    const pendingAssignments = await this.rideAssignmentRepository.find({
      where: {
        rideId,
        status: RideAssignmentStatus.OFFERED,
      },
    });

    for (const assignment of pendingAssignments) {
      assignment.status = RideAssignmentStatus.TIMEOUT;
      assignment.respondedAt = new Date();
      await this.rideAssignmentRepository.save(assignment);
    }

    // Si aucune acceptation, réessayer avec assignation séquentielle
    const acceptedAssignment = await this.rideAssignmentRepository.findOne({
      where: {
        rideId,
        status: RideAssignmentStatus.ACCEPTED,
      },
    });

    if (!acceptedAssignment) {
      // Aucun chauffeur n'a accepté, passer à l'assignation séquentielle
      await this.assignDriverSequentially(rideId);
    }
  }

  /**
   * Assignation séquentielle (fallback si proposition multiple échoue)
   */
  async assignDriverSequentially(rideId: string): Promise<boolean> {
    const ride = await this.rideRepository.findOne({
      where: { id: rideId },
    });

    if (!ride || ride.driverId || ride.status !== RideStatus.PENDING) {
      return false;
    }

    // Vérifier le nombre maximum de tentatives
    const maxAttempts = await this.configSystemService.getConfigAsNumber('max_assignment_attempts') || 7;
    if (ride.assignmentAttempts >= maxAttempts) {
      return false;
    }

    // Récupérer les chauffeurs qui ont déjà refusé
    const refusedDriverIds = await this.getRefusedDriverIds(rideId);

    // Trouver un seul chauffeur
    const drivers = await this.findBestDrivers(ride, 1, refusedDriverIds);

    if (drivers.length === 0) {
      ride.assignmentAttempts += 1;
      ride.lastAssignmentAttempt = new Date();
      await this.rideRepository.save(ride);
      return false;
    }

    const driver = drivers[0];

    // Créer l'assignation
    const assignment = this.rideAssignmentRepository.create({
      rideId: ride.id,
      driverId: driver.id,
      status: RideAssignmentStatus.OFFERED,
      offeredAt: new Date(),
    });
    await this.rideAssignmentRepository.save(assignment);

    // Assigner le chauffeur
    ride.driverId = driver.id;
    ride.status = RideStatus.ASSIGNED;
    ride.assignedAt = new Date();
    ride.assignmentAttempts += 1;
    ride.lastAssignmentAttempt = new Date();
    await this.rideRepository.save(ride);

    // Notifier le chauffeur
    ride.setEncryptionService(this.encryptionService);
    if (driver.user) {
      await this.notificationService.notifyDriverNewRide(driver.user.phone, ride);
      await this.internalNotificationsService.notifyDriverNewRide(driver.id, ride);
      await this.oneSignalService.notifyDriverAssigned(
        driver.user.id,
        ride.id,
        ride.pickupAddress || 'Voir détails',
      );
      this.websocketGateway.emitToDriver(driver.user.id, 'ride:assigned', {
        rideId: ride.id,
        status: ride.status,
      });
    }

    // Timeout pour l'acceptation
    const timeoutSeconds = await this.configSystemService.getConfigAsNumber('driver_response_timeout') || 120;
    setTimeout(async () => {
      const updatedRide = await this.rideRepository.findOne({
        where: { id: rideId },
      });

      if (updatedRide && updatedRide.status === RideStatus.ASSIGNED) {
        // Marquer comme timeout
        const assignment = await this.rideAssignmentRepository.findOne({
          where: {
            rideId,
            driverId: driver.id,
            status: RideAssignmentStatus.OFFERED,
          },
        });

        if (assignment) {
          assignment.status = RideAssignmentStatus.TIMEOUT;
          assignment.respondedAt = new Date();
          await this.rideAssignmentRepository.save(assignment);
        }

        // Réassigner
        await this.assignDriverSequentially(rideId);
      }
    }, timeoutSeconds * 1000);

    return true;
  }

  /**
   * Marque une proposition comme acceptée
   */
  async markAssignmentAccepted(rideId: string, driverId: string): Promise<void> {
    const assignment = await this.rideAssignmentRepository.findOne({
      where: {
        rideId,
        driverId,
        status: RideAssignmentStatus.OFFERED,
      },
    });

    if (assignment) {
      assignment.status = RideAssignmentStatus.ACCEPTED;
      assignment.respondedAt = new Date();
      await this.rideAssignmentRepository.save(assignment);
    }

    // Marquer toutes les autres propositions comme timeout (car une a été acceptée)
    await this.rideAssignmentRepository.update(
      {
        rideId,
        status: RideAssignmentStatus.OFFERED,
        driverId: Not(driverId),
      },
      {
        status: RideAssignmentStatus.TIMEOUT,
        respondedAt: new Date(),
      },
    );
  }

  /**
   * Marque une proposition comme refusée
   */
  async markAssignmentRefused(rideId: string, driverId: string, reason?: string): Promise<void> {
    const assignment = await this.rideAssignmentRepository.findOne({
      where: {
        rideId,
        driverId,
        status: RideAssignmentStatus.OFFERED,
      },
    });

    if (assignment) {
      assignment.status = RideAssignmentStatus.REFUSED;
      assignment.respondedAt = new Date();
      assignment.refusalReason = reason || null;
      await this.rideAssignmentRepository.save(assignment);
    }
  }
}

