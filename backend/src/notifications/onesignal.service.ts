import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

const ONESIGNAL_API = 'https://api.onesignal.com/notifications';

export interface OneSignalPushPayload {
  /** User IDs (UUID) - external_id côté front = auth user id */
  externalUserIds: string[];
  title: string;
  body: string;
  /** Données custom (ex: rideId) pour le clic */
  data?: Record<string, string>;
  /** URL à ouvrir au clic (optionnel) */
  url?: string;
}

@Injectable()
export class OneSignalService {
  private readonly logger = new Logger(OneSignalService.name);
  private readonly appId: string | undefined;
  private readonly apiKey: string | undefined;
  private enabled: boolean;

  constructor(private config: ConfigService) {
    this.appId = this.config.get<string>('ONESIGNAL_APP_ID');
    this.apiKey = this.config.get<string>('ONESIGNAL_REST_API_KEY');
    this.enabled = !!(this.appId && this.apiKey);
    if (!this.enabled) {
      this.logger.warn('OneSignal: push désactivés (manque ONESIGNAL_APP_ID ou ONESIGNAL_REST_API_KEY sur Render)');
    } else {
      this.logger.log('OneSignal: push activés (app_id présent, clé API configurée)');
    }
  }

  /**
   * Envoie une notification push à des utilisateurs ciblés par external_id (user.id).
   */
  async send(payload: OneSignalPushPayload): Promise<boolean> {
    if (!this.enabled) {
      this.logger.debug('OneSignal send ignoré (service désactivé)');
      return false;
    }
    if (payload.externalUserIds.length === 0) {
      this.logger.warn('OneSignal send ignoré (aucun externalUserId)');
      return false;
    }
    try {
      this.logger.log(`OneSignal: envoi vers ${payload.externalUserIds.length} user(s) — "${payload.title}"`);
      const body: Record<string, unknown> = {
        app_id: this.appId,
        target_channel: 'push',
        include_aliases: {
          external_id: payload.externalUserIds,
        },
        contents: { en: payload.body, fr: payload.body },
        headings: { en: payload.title, fr: payload.title },
      };
      if (payload.data && Object.keys(payload.data).length > 0) {
        body.data = payload.data;
      }
      if (payload.url) {
        body.url = payload.url;
      }
      const { data } = await axios.post(ONESIGNAL_API, body, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Key ${this.apiKey}`,
        },
      });
      if (data?.id) {
        this.logger.log(`OneSignal push envoyé: ${data.id}`);
        return true;
      }
      return false;
    } catch (err: unknown) {
      const message = axios.isAxiosError(err) ? JSON.stringify(err.response?.data ?? err.message) : String(err);
      this.logger.error(`OneSignal send failed: ${message}`);
      return false;
    }
  }

  /** Notifie les admins d'une nouvelle réservation */
  async notifyAdminsNewRide(adminUserIds: string[], rideId: string, accessCode: string): Promise<void> {
    if (adminUserIds.length === 0) return;
    await this.send({
      externalUserIds: adminUserIds,
      title: '🆕 Nouvelle réservation',
      body: `Code: ${accessCode}. Consultez le tableau de bord.`,
      data: { rideId, type: 'new_ride' },
      url: `/admin/rides/${rideId}`,
    });
  }

  /** Notifie le chauffeur qu'une course lui est assignée */
  async notifyDriverAssigned(driverUserId: string, rideId: string, pickupAddress: string): Promise<void> {
    await this.send({
      externalUserIds: [driverUserId],
      title: '🚗 Nouvelle course assignée',
      body: `Départ: ${pickupAddress?.slice(0, 50) || 'Voir détails'}… Acceptez ou refusez.`,
      data: { rideId, type: 'ride_assigned' },
      url: `/driver/dashboard`,
    });
  }

  /** Notifie le client que sa course a été acceptée */
  async notifyClientRideAccepted(clientUserId: string, rideId: string): Promise<void> {
    await this.send({
      externalUserIds: [clientUserId],
      title: '✅ Course acceptée',
      body: 'Votre chauffeur a accepté. Suivez la course en direct.',
      data: { rideId, type: 'ride_accepted' },
      url: `/track/${rideId}`,
    });
  }
}
