import { requestNotificationPermission, onMessageListener } from '../config/firebase';
import apiClient from './api';
import { API_ENDPOINTS } from '../config/api';

/**
 * Service pour gérer les notifications push Firebase Cloud Messaging
 */
class FCMService {
  private token: string | null = null;

  /**
   * Initialiser FCM et demander la permission (à appeler quand l'utilisateur est connecté).
   * @returns { token, registered } - token si obtenu, registered true si l'enregistrement backend a réussi
   */
  async initialize(): Promise<{ token: string | null; registered: boolean }> {
    try {
      const token = await requestNotificationPermission();
      if (!token) {
        return { token: null, registered: false };
      }
      this.token = token;
      const registered = await this.registerToken(token);
      this.setupMessageListener();
      return { token, registered };
    } catch (error) {
      console.error('Erreur lors de l\'initialisation FCM:', error);
      return { token: null, registered: false };
    }
  }

  /**
   * Enregistrer le token FCM auprès du backend (utilise le token JWT en cours).
   * @returns true si l'enregistrement a réussi, false sinon
   */
  private async registerToken(token: string): Promise<boolean> {
    try {
      const deviceLabel = typeof navigator !== 'undefined' && navigator.userAgent
        ? navigator.userAgent.slice(0, 500)
        : undefined;
      await apiClient.post(API_ENDPOINTS.NOTIFICATIONS_REGISTER_FCM, {
        token,
        ...(deviceLabel ? { deviceLabel } : {}),
      });
      return true;
    } catch (error) {
      console.warn('Enregistrement du token FCM (backend):', error);
      return false;
    }
  }

  /**
   * Configurer l'écoute des messages push
   */
  private setupMessageListener(): void {
    onMessageListener()
      .then((payload: any) => {
        console.log('Notification reçue:', payload);
        // Afficher une notification si l'app est ouverte
        if (payload && payload.notification) {
          this.showNotification(
            payload.notification.title || 'Nouvelle notification',
            payload.notification.body || ''
          );
        }
      })
      .catch((error) => {
        console.error('Erreur lors de l\'écoute des messages:', error);
      });
  }

  /**
   * Afficher une notification dans le navigateur
   */
  private showNotification(title: string, body: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon-192x192.png', // À adapter selon votre icône
        badge: '/icon-192x192.png',
      });
    }
  }

  /**
   * Obtenir le token actuel
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Vérifier si les notifications sont supportées
   */
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Vérifier si la permission est accordée
   */
  async checkPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      return 'denied';
    }
    return Notification.permission;
  }
}

export const fcmService = new FCMService();

