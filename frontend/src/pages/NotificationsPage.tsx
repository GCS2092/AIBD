import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService, Notification } from '../services/notificationService';
import { authService } from '../services/authService';
import NavigationBar from '../components/NavigationBar';
import './NotificationsPage.css';

function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: () => notificationService.getAll(),
    refetchInterval: 10000, // Rafraîchir toutes les 10 secondes
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const filteredNotifications = filter === 'unread' 
    ? notifications?.filter(n => !n.read) 
    : notifications;

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      ride_created: '🚗',
      ride_accepted: '✅',
      ride_refused: '❌',
      ride_started: '🚀',
      ride_completed: '🎉',
      ride_cancelled: '🚫',
      driver_assigned: '👤',
      driver_verified: '✓',
      payment_received: '💰',
      refund_processed: '💸',
      system_alert: '⚠️',
    };
    return icons[type] || '📢';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      ride_created: '#3498db',
      ride_accepted: '#2ecc71',
      ride_refused: '#e74c3c',
      ride_started: '#9b59b6',
      ride_completed: '#2ecc71',
      ride_cancelled: '#e74c3c',
      driver_assigned: '#3498db',
      driver_verified: '#2ecc71',
      payment_received: '#f39c12',
      refund_processed: '#3498db',
      system_alert: '#e74c3c',
    };
    return colors[type] || '#95a5a6';
  };

  return (
    <div className="notifications-page">
      <NavigationBar />
      <header className="notifications-header">
        <h1>Notifications</h1>
        {unreadCount > 0 && (
          <button
            className="btn-mark-all-read"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            Tout marquer comme lu
          </button>
        )}
      </header>

      <div className="notifications-content">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Toutes ({notifications?.length || 0})
          </button>
          <button
            className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Non lues ({unreadCount})
          </button>
        </div>

        {isLoading ? (
          <div className="loading">Chargement des notifications...</div>
        ) : filteredNotifications && filteredNotifications.length > 0 ? (
          <div className="notifications-list">
            {filteredNotifications.map((notification: Notification) => (
              <div
                key={notification.id}
                className={`notification-card ${notification.read ? 'read' : 'unread'}`}
                onClick={() => {
                  if (!notification.read) {
                    markAsReadMutation.mutate(notification.id);
                  }
                  if (notification.rideId) {
                    navigate(`/track/${notification.rideId}`);
                  }
                }}
              >
                <div
                  className="notification-icon"
                  style={{ backgroundColor: getTypeColor(notification.type) }}
                >
                  {getTypeIcon(notification.type)}
                </div>
                <div className="notification-content">
                  <div className="notification-header">
                    <h3>{notification.title}</h3>
                    {!notification.read && <span className="unread-dot"></span>}
                  </div>
                  <p className="notification-message">{notification.message}</p>
                  <div className="notification-footer">
                    <span className="notification-time">
                      {new Date(notification.createdAt).toLocaleString('fr-FR')}
                    </span>
                    {notification.rideId && (
                      <span className="notification-link">Voir la course →</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-notifications">
            <p>📭 Aucune notification {filter === 'unread' ? 'non lue' : ''}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;

