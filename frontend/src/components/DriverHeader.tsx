import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Wifi, WifiOff, CheckCircle2 } from 'lucide-react';
import { driverService } from '../services/driverService';
import { websocketService } from '../services/websocketService';
import '../pages/DriverDashboard.css';

interface DriverHeaderProps {
  showStatusButtons?: boolean;
}

export default function DriverHeader({ showStatusButtons = true }: DriverHeaderProps) {
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const { data: profile } = useQuery({
    queryKey: ['driver-profile'],
    queryFn: () => driverService.getProfile(),
    refetchInterval: 30000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => driverService.updateStatus(status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-profile'] });
      queryClient.invalidateQueries({ queryKey: ['driver-available-rides'] });
    },
  });

  // Mise à jour de l'horloge
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Vérifier le statut de connexion
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Vérifier le statut WebSocket
    const checkWebSocket = () => {
      setIsOnline(websocketService.isConnected());
    };
    const wsInterval = setInterval(checkWebSocket, 5000);
    checkWebSocket();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(wsInterval);
    };
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <header className="dashboard-top-header">
      <div className="header-left-section">
        <div className="header-clock">
          <Clock className="clock-icon" />
          <div className="clock-content">
            <div className="clock-time">{formatTime(currentTime)}</div>
            <div className="clock-date">{formatDate(currentTime)}</div>
          </div>
        </div>
      </div>
      <div className="header-right-section">
        <div className={`header-status ${isOnline ? 'status-online' : 'status-offline'}`}>
          {isOnline ? <Wifi className="status-icon" /> : <WifiOff className="status-icon" />}
          <span className="status-text">{isOnline ? 'En ligne' : 'Hors ligne'}</span>
        </div>
        {showStatusButtons && (
          <div className="header-status-buttons">
            <button
              className={`header-status-btn status-available-btn ${profile?.status === 'available' ? 'active' : ''}`}
              onClick={() => updateStatusMutation.mutate('available')}
              disabled={updateStatusMutation.isPending}
              title="Disponible"
            >
              <CheckCircle2 className="status-btn-icon" />
            </button>
            <button
              className={`header-status-btn status-unavailable-btn ${profile?.status === 'unavailable' ? 'active' : ''}`}
              onClick={() => updateStatusMutation.mutate('unavailable')}
              disabled={updateStatusMutation.isPending}
              title="Indisponible"
            >
              <WifiOff className="status-btn-icon" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

