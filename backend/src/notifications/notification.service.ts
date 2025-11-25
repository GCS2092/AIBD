import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, NotificationStatus } from '../entities/notification.entity';
import { Ride } from '../entities/ride.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async notifyDriverNewRide(phone: string, ride: Ride) {
    const message = `Nouvelle course assignée !\n\n` +
      `Client: ${ride.clientFirstName} ${ride.clientLastName}\n` +
      `Départ: ${ride.pickupAddress}\n` +
      `Arrivée: ${ride.dropoffAddress}\n` +
      `Date: ${new Date(ride.scheduledAt).toLocaleString('fr-FR')}\n` +
      `Prix: ${ride.price} FCFA\n\n` +
      `Veuillez accepter ou refuser dans les 2 minutes.`;

    // Envoyer via WhatsApp
    await this.sendWhatsApp(phone, 'Nouvelle course assignée', message, ride.id);

    // Envoyer notification push (si token disponible)
    // await this.sendPushNotification(phone, 'Nouvelle course', message, ride.id);
  }

  async notifyRideAccepted(clientPhone: string, ride: Ride) {
    const message = `Votre course a été acceptée !\n\n` +
      `Chauffeur en route vers: ${ride.pickupAddress}\n` +
      `Vous recevrez une notification quand il arrivera.`;

    await this.sendWhatsApp(clientPhone, 'Course acceptée', message, ride.id);
  }

  async notifyRideCancelled(phone: string, ride: Ride) {
    const message = `Votre course a été annulée.\n\n` +
      `Raison: ${ride.cancellationReason || 'Non spécifiée'}\n` +
      `Si vous avez payé, un remboursement sera effectué.`;

    await this.sendWhatsApp(phone, 'Course annulée', message, ride.id);
  }

  async notifyDriverOnWay(clientPhone: string, ride: Ride) {
    const message = `Votre chauffeur est en route !\n\n` +
      `Il devrait arriver dans quelques minutes à: ${ride.pickupAddress}`;

    await this.sendWhatsApp(clientPhone, 'Chauffeur en route', message, ride.id);
  }

  async notifyRideCompleted(clientPhone: string, ride: Ride) {
    const message = `Course terminée !\n\n` +
      `Merci d'avoir utilisé nos services.\n` +
      `N'hésitez pas à nous évaluer.`;

    await this.sendWhatsApp(clientPhone, 'Course terminée', message, ride.id);
  }

  private async sendWhatsApp(
    phone: string,
    title: string,
    message: string,
    rideId?: string,
  ) {
    try {
      // TODO: Implémenter l'intégration WhatsApp Business API
      // Pour l'instant, on log juste
      this.logger.log(`WhatsApp to ${phone}: ${title} - ${message}`);

      // Sauvegarder la notification
      const notification = this.notificationRepository.create({
        recipient: phone,
        type: NotificationType.WHATSAPP,
        title,
        message,
        rideId,
        status: NotificationStatus.SENT,
      });

      await this.notificationRepository.save(notification);

      // Si WhatsApp API est configuré, envoyer réellement
      const whatsappApiUrl = process.env.WHATSAPP_API_URL;
      const whatsappApiToken = process.env.WHATSAPP_API_TOKEN;

      if (whatsappApiUrl && whatsappApiToken) {
        // Implémentation réelle de l'envoi WhatsApp
        // await axios.post(whatsappApiUrl, { phone, message }, { headers: { Authorization: `Bearer ${whatsappApiToken}` } });
      }
    } catch (error) {
      this.logger.error(`Erreur envoi WhatsApp: ${error.message}`);
      
      const notification = this.notificationRepository.create({
        recipient: phone,
        type: NotificationType.WHATSAPP,
        title,
        message,
        rideId,
        status: NotificationStatus.FAILED,
        errorMessage: error.message,
      });

      await this.notificationRepository.save(notification);
    }
  }

  private async sendPushNotification(
    token: string,
    title: string,
    message: string,
    rideId?: string,
  ) {
    try {
      // TODO: Implémenter Firebase Cloud Messaging
      this.logger.log(`Push to ${token}: ${title} - ${message}`);

      const notification = this.notificationRepository.create({
        recipient: token,
        type: NotificationType.PUSH,
        title,
        message,
        rideId,
        status: NotificationStatus.SENT,
      });

      await this.notificationRepository.save(notification);
    } catch (error) {
      this.logger.error(`Erreur envoi Push: ${error.message}`);
    }
  }
}

