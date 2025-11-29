import { requestNotificationPermission, onMessageListener } from '../config/firebase';
import { apiClient } from './api';

/**
 * Service pour gérer les notifications push Firebase Cloud Messaging
 */
class FCMService {
  private token: string | null = null;

  /**
   * Initialiser FCM et demander la permission
   */
  async initialize(): Promise<string | null> {
    try {
      const token = await requestNotificationPermission();
      if (token) {
        this.token = token;
        // Envoyer le token au backend pour l'associer à l'utilisateur
        await this.registerToken(token);
        // Écouter les messages
        this.setupMessageListener();
      }
      return token;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation FCM:', error);
      return null;
    }
  }

  /**
   * Enregistrer le token FCM auprès du backend
   */
  private async registerToken(token: string): Promise<void> {
    try {
      // TODO: Créer un endpoint dans le backend pour enregistrer le token
      // Exemple: await fetch('/api/notifications/register-token', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ token })
      // });
      console.log('Token FCM à enregistrer:', token);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du token:', error);
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

