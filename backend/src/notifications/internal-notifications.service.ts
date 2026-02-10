import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InternalNotification, InternalNotificationType } from '../entities/internal-notification.entity';
import { FcmToken } from '../entities/fcm-token.entity';
import { Driver } from '../entities/driver.entity';
import { Ride, RideStatus } from '../entities/ride.entity';
import { WebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class InternalNotificationsService {
  constructor(
    @InjectRepository(InternalNotification)
    private notificationRepository: Repository<InternalNotification>,
    @InjectRepository(FcmToken)
    private fcmTokenRepository: Repository<FcmToken>,
    @Inject(forwardRef(() => WebSocketGateway))
    private websocketGateway: WebSocketGateway,
  ) {}

  async createNotification(
    userId: string,
    type: InternalNotificationType,
    title: string,
    message: string,
    rideId?: string,
    metadata?: Record<string, any>,
  ): Promise<InternalNotification> {
    const notification = this.notificationRepository.create({
      userId,
      type,
      title,
      message,
      rideId,
      metadata,
      read: false,
    });

    const savedNotification = await this.notificationRepository.save(notification);

    // Émettre via WebSocket
    this.websocketGateway.emitToUser(userId, 'notification:new', {
      id: savedNotification.id,
      type: savedNotification.type,
      title: savedNotification.title,
      message: savedNotification.message,
      rideId: savedNotification.rideId,
      metadata: savedNotification.metadata,
      read: savedNotification.read,
      createdAt: savedNotification.createdAt,
    });

    // Émettre aussi le compteur de notifications non lues
    const unreadCount = await this.getUnreadCount(userId);
    this.websocketGateway.emitToUser(userId, 'notification:unread-count', {
      count: unreadCount,
    });

    return savedNotification;
  }

  // Notifications pour les clients
  async notifyRideCreated(userId: string, ride: Ride) {
    return this.createNotification(
      userId,
      InternalNotificationType.RIDE_CREATED,
      'Course créée',
      `Votre course a été créée avec succès. Un chauffeur sera assigné sous peu.`,
      ride.id,
      { rideType: ride.rideType, price: ride.price },
    );
  }

  async notifyRideAccepted(userId: string, ride: Ride, driver: Driver) {
    return this.createNotification(
      userId,
      InternalNotificationType.RIDE_ACCEPTED,
      'Course acceptée',
      `Votre course a été acceptée par le chauffeur. Il sera bientôt en route.`,
      ride.id,
      { driverName: `${driver.user?.firstName} ${driver.user?.lastName}` },
    );
  }

  async notifyRideStarted(userId: string, ride: Ride) {
    return this.createNotification(
      userId,
      InternalNotificationType.RIDE_STARTED,
      'Course démarrée',
      `Votre chauffeur a démarré la course. Vous pouvez suivre sa progression en temps réel.`,
      ride.id,
    );
  }

  async notifyRideCompleted(userId: string, ride: Ride) {
    return this.createNotification(
      userId,
      InternalNotificationType.RIDE_COMPLETED,
      'Course terminée',
      `Votre course a été terminée avec succès. Merci d'avoir utilisé nos services !`,
      ride.id,
    );
  }

  async notifyRideCancelled(userId: string, ride: Ride, reason?: string) {
    return this.createNotification(
      userId,
      InternalNotificationType.RIDE_CANCELLED,
      'Course annulée',
      `Votre course a été annulée.${reason ? ` Raison: ${reason}` : ''}`,
      ride.id,
      { reason },
    );
  }

  // Notifications pour les chauffeurs
  async notifyDriverNewRide(driverId: string, ride: Ride) {
    const driver = await this.notificationRepository.manager
      .getRepository(Driver)
      .findOne({ where: { id: driverId }, relations: ['user'] });

    if (!driver?.user) return;

    return this.createNotification(
      driver.user.id,
      InternalNotificationType.DRIVER_ASSIGNED,
      'Nouvelle course assignée',
      `Une nouvelle course vous a été assignée. Veuillez accepter ou refuser dans les 2 minutes.`,
      ride.id,
      {
        pickupAddress: ride.pickupAddress,
        dropoffAddress: ride.dropoffAddress,
        price: ride.price,
      },
    );
  }

  async notifyRideRefused(driverId: string, ride: Ride) {
    const driver = await this.notificationRepository.manager
      .getRepository(Driver)
      .findOne({ where: { id: driverId }, relations: ['user'] });

    if (!driver?.user) return;

    return this.createNotification(
      driver.user.id,
      InternalNotificationType.RIDE_REFUSED,
      'Course refusée',
      `Vous avez refusé la course. Une autre course vous sera assignée prochainement.`,
      ride.id,
    );
  }

  // Notifications pour les admins
  async notifyAdminRideCreated(adminIds: string[], ride: Ride) {
    const notifications = adminIds.map(adminId =>
      this.createNotification(
        adminId,
        InternalNotificationType.RIDE_CREATED,
        'Nouvelle course',
        `Une nouvelle course a été créée par ${ride.clientFirstName} ${ride.clientLastName}.`,
        ride.id,
        { clientName: `${ride.clientFirstName} ${ride.clientLastName}` },
      ),
    );

    return Promise.all(notifications);
  }

  async notifyAdminDriverVerified(adminIds: string[], driver: Driver) {
    const notifications = adminIds.map(adminId =>
      this.createNotification(
        adminId,
        InternalNotificationType.DRIVER_VERIFIED,
        'Chauffeur vérifié',
        `Le chauffeur ${driver.user?.firstName} ${driver.user?.lastName} a été vérifié.`,
        undefined,
        { driverId: driver.id },
      ),
    );

    return Promise.all(notifications);
  }

  // Récupérer les notifications d'un utilisateur
  async getUserNotifications(userId: string, unreadOnly: boolean = false) {
    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC');

    if (unreadOnly) {
      query.andWhere('notification.read = false');
    }

    return query.getMany();
  }

  // Marquer comme lu
  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notification non trouvée');
    }

    notification.read = true;
    notification.readAt = new Date();

    const savedNotification = await this.notificationRepository.save(notification);

    // Émettre via WebSocket
    this.websocketGateway.emitToUser(userId, 'notification:read', {
      id: savedNotification.id,
      read: savedNotification.read,
    });

    // Émettre le nouveau compteur
    const unreadCount = await this.getUnreadCount(userId);
    this.websocketGateway.emitToUser(userId, 'notification:unread-count', {
      count: unreadCount,
    });

    return savedNotification;
  }

  // Compter les notifications non lues
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, read: false },
    });
  }

  // Enregistrer un token FCM pour les notifications push
  async registerFcmToken(userId: string, token: string, deviceLabel?: string): Promise<{ registered: boolean }> {
    const existing = await this.fcmTokenRepository.findOne({
      where: { userId, token },
    });
    if (existing) {
      if (deviceLabel) existing.deviceLabel = deviceLabel;
      await this.fcmTokenRepository.save(existing);
      return { registered: true };
    }
    const fcmToken = this.fcmTokenRepository.create({
      userId,
      token,
      deviceLabel: deviceLabel || null,
    });
    await this.fcmTokenRepository.save(fcmToken);
    return { registered: true };
  }
}

