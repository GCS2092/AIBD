import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OneSignal from 'react-onesignal';

/**
 * Écoute les clics sur les notifications OneSignal et redirige selon data (rideId, url).
 */
export function useNotificationHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (event: { notification?: { additionalData?: object; launchURL?: string }; result?: { url?: string } }) => {
      const data = (event?.notification?.additionalData ?? {}) as Record<string, string>;
      const url = event?.notification?.launchURL ?? event?.result?.url ?? data?.url;
      const rideId = data?.rideId;

      if (url && typeof url === 'string' && url.startsWith('/')) {
        navigate(url);
        return;
      }
      if (rideId) {
        const type = data?.type;
        if (type === 'ride_assigned' || type === 'new_ride') {
          navigate('/driver/dashboard');
        } else if (type === 'ride_accepted') {
          navigate(`/track/${rideId}`);
        } else {
          navigate(`/admin/rides/${rideId}`);
        }
      }
    };

    OneSignal.Notifications.addEventListener('click', handler);
    return () => {
      OneSignal.Notifications.removeEventListener('click', handler);
    };
  }, [navigate]);
}
