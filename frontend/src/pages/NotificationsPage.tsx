import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Car,
  Rocket,
  AlertCircle,
  DollarSign,
  User,
  Check,
  ArrowRight,
  Clock,
  Inbox,
  CheckCheck,
  Filter,
  ArrowLeft,
  Trash2
} from 'lucide-react';
import { notificationService, Notification } from '../services/notificationService';
import { authService } from '../services/authService';
import NavigationBar from '../components/NavigationBar';
import DriverHeader from '../components/DriverHeader';
import DriverBottomNav from '../components/DriverBottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import './NotificationsPage.css';

function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [localNotifications, setLocalNotifications] = useState<Notification[] | undefined>(undefined);
  const userRole = authService.getRole();

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

  // Utiliser les notifications locales si elles existent, sinon utiliser celles du serveur
  const displayNotifications = localNotifications !== undefined ? localNotifications : notifications;

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
      setLocalNotifications(undefined); // Réinitialiser les notifications locales
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => notificationService.deleteAll(),
    onSuccess: () => {
      // Vider les notifications locales
      setLocalNotifications([]);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const handleGoBack = () => {
    if (userRole === 'admin') {
      navigate('/admin/dashboard');
    } else if (userRole === 'driver') {
      navigate('/driver/dashboard');
    } else {
      navigate('/');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    
    if (notification.rideId) {
      // Rediriger selon le rôle de l'utilisateur
      if (userRole === 'admin') {
        navigate(`/admin/rides/${notification.rideId}`);
      } else if (userRole === 'driver') {
        navigate(`/driver/track/${notification.rideId}`);
      } else {
        // Client ou utilisateur non authentifié
        navigate(`/track/${notification.rideId}`);
      }
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? displayNotifications?.filter(n => !n.read) 
    : displayNotifications;

  const unreadCount = displayNotifications?.filter(n => !n.read).length || 0;

  const getTypeIcon = (type: string) => {
    // Mapping basé sur le type de notification
    const iconMap: Record<string, React.ReactNode> = {
      ride_created: <Car className="w-5 h-5" />,
      ride_accepted: <CheckCircle2 className="w-5 h-5" />,
      ride_refused: <XCircle className="w-5 h-5" />,
      ride_started: <Rocket className="w-5 h-5" />,
      ride_completed: <CheckCircle2 className="w-5 h-5" />,
      ride_cancelled: <XCircle className="w-5 h-5" />,
      driver_assigned: <User className="w-5 h-5" />,
      driver_verified: <Check className="w-5 h-5" />,
      payment_received: <DollarSign className="w-5 h-5" />,
      refund_processed: <DollarSign className="w-5 h-5" />,
      system_alert: <AlertCircle className="w-5 h-5" />,
      info: <Bell className="w-5 h-5" />,
      success: <CheckCircle2 className="w-5 h-5" />,
      warning: <AlertCircle className="w-5 h-5" />,
      error: <XCircle className="w-5 h-5" />,
    };
    return iconMap[type] || <Bell className="w-5 h-5" />;
  };

  const getTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      ride_created: '#3b82f6', // blue
      ride_accepted: '#10b981', // green
      ride_refused: '#ef4444', // red
      ride_started: '#8b5cf6', // purple
      ride_completed: '#10b981', // green
      ride_cancelled: '#ef4444', // red
      driver_assigned: '#3b82f6', // blue
      driver_verified: '#10b981', // green
      payment_received: '#f59e0b', // amber
      refund_processed: '#3b82f6', // blue
      system_alert: '#ef4444', // red
      info: '#3b82f6', // blue
      success: '#10b981', // green
      warning: '#f59e0b', // amber
      error: '#ef4444', // red
    };
    return colorMap[type] || '#6b7280'; // gray
  };

  const getTypeVariant = (type: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (type.includes('error') || type.includes('refused') || type.includes('cancelled')) {
      return 'destructive';
    }
    if (type.includes('success') || type.includes('accepted') || type.includes('completed')) {
      return 'default';
    }
    return 'secondary';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-700/20 rounded-full blur-3xl"></div>
      </div>

      {userRole === 'driver' ? <DriverHeader showStatusButtons={false} /> : <NavigationBar />}

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative text-center py-8 sm:py-12 px-4 sm:px-6"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 mb-6 bg-white/10 backdrop-blur-lg rounded-2xl border-2 border-white/20 shadow-2xl"
        >
          <Bell className="w-10 h-10 md:w-12 md:h-12 text-white" />
        </motion.div>
        <div className="flex items-center justify-center gap-4 mb-4">
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-3 sm:mb-4 drop-shadow-2xl tracking-tight text-white px-2">
          Notifications
        </h1>
        {unreadCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full"
          >
            <span className="text-sm font-semibold text-red-300">
              {unreadCount} non {unreadCount === 1 ? 'lue' : 'lues'}
            </span>
          </motion.div>
        )}
      </motion.header>

      <main className={`relative max-w-4xl mx-auto px-3 sm:px-4 md:px-6 pb-8 sm:pb-12 ${userRole === 'driver' ? 'pb-24 sm:pb-28' : ''}`}>
        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-6"
        >
          <Card className="bg-white border-gray-200 shadow-xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
              </div>
              <div className="flex gap-3">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilter('all')}
                  className={`flex-1 ${filter === 'all' ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  <Inbox className="w-4 h-4 mr-2" />
                  Toutes ({displayNotifications?.length || 0})
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'outline'}
                  onClick={() => setFilter('unread')}
                  className={`flex-1 ${filter === 'unread' ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Non lues ({unreadCount})
                </Button>
              </div>
              <div className="flex gap-3 mt-4">
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => markAllAsReadMutation.mutate()}
                    disabled={markAllAsReadMutation.isPending}
                    className="flex-1 bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                  >
                    <CheckCheck className="w-4 h-4 mr-2" />
                    {markAllAsReadMutation.isPending ? 'Traitement...' : 'Tout marquer comme lu'}
                  </Button>
                )}
                {(displayNotifications && displayNotifications.length > 0) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (window.confirm('Êtes-vous sûr de vouloir vider toutes les notifications ? Cette action est irréversible.')) {
                        deleteAllMutation.mutate();
                      }
                    }}
                    disabled={deleteAllMutation.isPending}
                    className={`flex-1 bg-red-50 text-red-700 border-red-300 hover:bg-red-100 ${unreadCount > 0 ? '' : 'w-full'}`}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleteAllMutation.isPending ? 'Suppression...' : 'Vider toutes'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications List */}
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="inline-flex items-center gap-3 text-gray-300">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span className="text-lg">Chargement des notifications...</span>
            </div>
          </motion.div>
        ) : filteredNotifications && filteredNotifications.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-4"
          >
            <AnimatePresence>
              {filteredNotifications.map((notification: Notification, index: number) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card
                    className={`cursor-pointer transition-all duration-200 hover:shadow-xl ${
                      notification.read
                        ? 'bg-white border-gray-200'
                        : 'bg-gray-50 border-gray-300 border-l-4 border-l-blue-500'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex gap-4">
                        {/* Icon */}
                        <div
                          className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: getTypeColor(notification.type) }}
                        >
                          {getTypeIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className={`font-semibold text-base sm:text-lg ${
                                  notification.read ? 'text-gray-700' : 'text-gray-900'
                                }`}>
                                  {notification.title}
                                </h3>
                                {!notification.read && (
                                  <Badge variant="default" className="bg-blue-500 text-white text-xs px-2 py-0">
                                    Nouveau
                                  </Badge>
                                )}
                              </div>
                              <p className={`text-sm sm:text-base ${
                                notification.read ? 'text-gray-600' : 'text-gray-700'
                              }`}>
                                {notification.message}
                              </p>
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>{formatTimeAgo(notification.createdAt)}</span>
                            </div>
                            {notification.rideId && (
                              <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600 font-medium">
                                <span>Voir la course</span>
                                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center py-16"
          >
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
              <CardContent className="p-8 sm:p-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4">
                  <Inbox className="w-8 h-8 text-white/70" />
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">
                  Aucune notification {filter === 'unread' ? 'non lue' : ''}
                </h3>
                <p className="text-gray-300 text-sm sm:text-base">
                  {filter === 'unread'
                    ? 'Toutes vos notifications ont été lues'
                    : 'Vous n\'avez pas encore de notifications'}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>

      {/* Barre de navigation en bas pour les chauffeurs */}
      {userRole === 'driver' && <DriverBottomNav />}
    </div>
  );
}

export default NotificationsPage;
