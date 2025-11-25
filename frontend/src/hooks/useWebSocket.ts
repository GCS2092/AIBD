import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { websocketService } from '../services/websocketService';

export const useWebSocket = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Écouter les nouvelles notifications
    const handleNewNotification = (data: any) => {
      console.log('📬 Nouvelle notification reçue:', data);
      // Invalider les queries de notifications pour rafraîchir
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    };

    // Écouter les mises à jour de compteur de notifications non lues
    const handleUnreadCount = (data: { count: number }) => {
      console.log('📊 Compteur notifications non lues:', data.count);
      queryClient.setQueryData(['unread-count'], data.count);
    };

    // Écouter les événements spécifiques de courses
    const handleRideAccepted = (data: any) => {
      console.log('✅ Course acceptée:', data);
      queryClient.invalidateQueries({ queryKey: ['my-rides'] });
      queryClient.invalidateQueries({ queryKey: ['admin-rides'] });
      queryClient.invalidateQueries({ queryKey: ['driver-rides'] });
      if (data.rideId) {
        queryClient.invalidateQueries({ queryKey: ['ride', data.rideId] });
      }
    };

    const handleRideStarted = (data: any) => {
      console.log('🚀 Course démarrée:', data);
      queryClient.invalidateQueries({ queryKey: ['my-rides'] });
      queryClient.invalidateQueries({ queryKey: ['admin-rides'] });
      queryClient.invalidateQueries({ queryKey: ['driver-rides'] });
      if (data.rideId) {
        queryClient.invalidateQueries({ queryKey: ['ride', data.rideId] });
      }
    };

    const handleRideCompleted = (data: any) => {
      console.log('🏁 Course terminée:', data);
      queryClient.invalidateQueries({ queryKey: ['my-rides'] });
      queryClient.invalidateQueries({ queryKey: ['admin-rides'] });
      queryClient.invalidateQueries({ queryKey: ['driver-rides'] });
      if (data.rideId) {
        queryClient.invalidateQueries({ queryKey: ['ride', data.rideId] });
      }
    };

    // Enregistrer les listeners
    websocketService.on('notification:new', handleNewNotification);
    websocketService.on('notification:unread-count', handleUnreadCount);
    websocketService.on('notification:read', handleNewNotification); // Rafraîchir aussi quand marqué comme lu

    // Écouter les événements spécifiques de courses
    websocketService.on('ride:accepted', handleRideAccepted);
    websocketService.on('ride:started', handleRideStarted);
    websocketService.on('ride:completed', handleRideCompleted);

    // Nettoyer les listeners à la déconnexion
    return () => {
      websocketService.off('notification:new', handleNewNotification);
      websocketService.off('notification:unread-count', handleUnreadCount);
      websocketService.off('notification:read', handleNewNotification);
      websocketService.off('ride:accepted', handleRideAccepted);
      websocketService.off('ride:started', handleRideStarted);
      websocketService.off('ride:completed', handleRideCompleted);
    };
  }, [queryClient]);

  // Fonction pour écouter les mises à jour d'une course spécifique
  const listenToRide = useCallback((rideId: string, callback: (data: any) => void) => {
    const eventName = `ride:${rideId}:update`;
    websocketService.on(eventName, callback);
    return () => {
      websocketService.off(eventName, callback);
    };
  }, []);

  return { listenToRide };
};

