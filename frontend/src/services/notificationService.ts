import apiClient from './api';
import { API_ENDPOINTS } from '../config/api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  rideId?: string;
  createdAt: string;
}

export const notificationService = {
  getAll: async (): Promise<Notification[]> => {
    const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS);
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT);
    return response.data.count || 0;
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.NOTIFICATIONS_READ(id));
  },

  markAllAsRead: async (): Promise<void> => {
    const notifications = await notificationService.getAll();
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => notificationService.markAsRead(n.id)));
  },

  deleteAll: async (): Promise<void> => {
    // Pour l'instant, on marque toutes comme lues
    // Si un endpoint DELETE existe côté backend, on l'utilisera
    const notifications = await notificationService.getAll();
    await Promise.all(notifications.map(n => notificationService.markAsRead(n.id)));
  },
};

