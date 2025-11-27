import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Calendar, Clock, RefreshCw, ArrowLeft, Radio, Car, Users, Luggage } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverService } from '../services/driverService';
import { authService } from '../services/authService';
import MapComponent from '../components/MapComponent';
import DriverHeader from '../components/DriverHeader';
import DriverBottomNav from '../components/DriverBottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import './DriverTrackingPage.css';

function DriverTrackingPage() {
  const { rideId } = useParams<{ rideId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    // Vérifier que l'utilisateur est chauffeur
    if (authService.getRole() !== 'driver') {
      navigate('/');
    }
  }, [navigate]);

  const queryClient = useQueryClient();

  const { data: ride, isLoading, refetch } = useQuery({
    queryKey: ['driver-ride', rideId],
    queryFn: async () => {
      return driverService.getRideById(rideId!);
    },
    enabled: !!rideId,
    refetchInterval: 5000, // Rafraîchir toutes les 5 secondes
  });

  const startRideMutation = useMutation({
    mutationFn: (id: string) => driverService.startRide(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-ride', rideId] });
      queryClient.invalidateQueries({ queryKey: ['driver-rides'] });
      alert('Course démarrée !');
    },
    onError: (error: any) => {
      alert(`Erreur au démarrage: ${error?.response?.data?.message || error.message}`);
    },
  });

  const completeRideMutation = useMutation({
    mutationFn: (id: string) => driverService.completeRide(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-ride', rideId] });
      queryClient.invalidateQueries({ queryKey: ['driver-rides'] });
      alert('Course terminée !');
      navigate('/driver/dashboard');
    },
    onError: (error: any) => {
      alert(`Erreur à la fin de la course: ${error?.response?.data?.message || error.message}`);
    },
  });

  // Rafraîchir automatiquement si la course est active
  useEffect(() => {
    if (ride && (ride.status === 'accepted' || ride.status === 'in_progress')) {
      const interval = setInterval(() => {
        refetch();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [ride, refetch]);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      assigned: 'Assignée',
      accepted: 'Acceptée',
      driver_on_way: 'En route',
      picked_up: 'Client pris en charge',
      in_progress: 'En cours',
      completed: 'Terminée',
      cancelled: 'Annulée',
    };
    return labels[status] || status;
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
      pending: 'warning',
      assigned: 'default',
      accepted: 'default',
      driver_on_way: 'secondary',
      picked_up: 'secondary',
      in_progress: 'secondary',
      completed: 'success',
      cancelled: 'destructive',
    };
    return variants[status] || 'default';
  };

  // Calculer la distance et le temps estimé
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getEstimatedTime = (distance: number): string => {
    const averageSpeed = 30; // km/h en moyenne en ville
    const timeInHours = distance / averageSpeed;
    const timeInMinutes = Math.ceil(timeInHours * 60);
    
    if (timeInMinutes < 60) {
      return `${timeInMinutes} min`;
    }
    const hours = Math.floor(timeInMinutes / 60);
    const minutes = timeInMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  };

  let distanceToDestination = null;
  let estimatedTime = null;

  if (ride?.driverLocation && ride?.dropoffLocation) {
    distanceToDestination = calculateDistance(
      ride.driverLocation.lat,
      ride.driverLocation.lng,
      ride.dropoffLocation.lat,
      ride.dropoffLocation.lng
    );
    estimatedTime = getEstimatedTime(distanceToDestination);
  } else if (ride?.driverLocation && ride?.pickupLocation && ride.status === 'accepted') {
    // Si on va chercher le client
    distanceToDestination = calculateDistance(
      ride.driverLocation.lat,
      ride.driverLocation.lng,
      ride.pickupLocation.lat,
      ride.pickupLocation.lng
    );
    estimatedTime = getEstimatedTime(distanceToDestination);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <DriverHeader showStatusButtons={false} />
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-4"
          >
            <RefreshCw className="w-12 h-12 text-white/60" />
          </motion.div>
          <p className="text-lg text-gray-300">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <DriverHeader showStatusButtons={false} />
        <div className="flex items-center justify-center min-h-screen px-4">
          <Card className="bg-white border-gray-200 shadow-2xl text-center py-12 max-w-md">
            <CardContent>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Course non trouvée</h2>
              <p className="text-gray-600 mb-6">La course demandée n'existe pas ou a été supprimée.</p>
              <Button asChild size="lg" className="bg-gray-900 hover:bg-gray-800 text-white font-semibold shadow-lg">
                <Link to="/driver/dashboard" className="flex items-center">
                  <ArrowLeft className="mr-2 w-5 h-5" />
                  Retour au dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isActive = ride.status === 'accepted' || ride.status === 'in_progress' || ride.status === 'driver_on_way' || ride.status === 'picked_up';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-700/20 rounded-full blur-3xl"></div>
      </div>

      <DriverHeader showStatusButtons={false} />

      <main className="relative max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-8 sm:py-12 pb-24 sm:pb-28">
        <div className="mb-4 sm:mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/driver/dashboard')}
            className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 sm:mb-8"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white/10 backdrop-blur-lg rounded-2xl border-2 border-white/20 shadow-2xl mb-3 sm:mb-4">
            <Car className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 text-white px-2">Suivi de course</h1>
          <p className="text-sm sm:text-base text-gray-300 px-4">Suivez votre course en temps réel</p>
        </motion.header>

        {/* Statut de la course */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <Card className="bg-white border-gray-200 shadow-2xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-gray-100 rounded-xl">
                    <Car className="w-6 h-6 sm:w-8 sm:h-8 text-gray-900" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Statut de la course</p>
                    <Badge variant={getStatusVariant(ride.status)} className="text-sm sm:text-lg font-bold px-3 sm:px-4 py-1.5 sm:py-2">
                      {getStatusLabel(ride.status)}
                    </Badge>
                  </div>
                </div>
                {isActive && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full border-2 border-red-200">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-3 h-3 bg-red-500 rounded-full"
                    />
                    <span className="text-red-700 font-semibold">En direct</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Informations de distance et temps */}
        {distanceToDestination !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8"
          >
            <Card className="bg-white border-gray-200 shadow-2xl">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-xl sm:text-2xl text-gray-900">Informations de trajet</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Navigation className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-blue-600 uppercase mb-1">Distance</p>
                      <p className="text-2xl font-bold text-gray-900">{distanceToDestination.toFixed(1)} km</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <Clock className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-600 uppercase mb-1">Temps estimé</p>
                      <p className="text-2xl font-bold text-gray-900">{estimatedTime}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Informations client */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <Card className="bg-white border-gray-200 shadow-2xl">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-xl sm:text-2xl text-gray-900">Informations client</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase mb-1">Nom complet</p>
                    <p className="text-base text-gray-900 font-medium">
                      {ride.clientFirstName} {ride.clientLastName}
                    </p>
                  </div>
                </div>

                {ride.clientPhone && (
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <span className="text-base font-semibold text-green-600">📞</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500 uppercase mb-1">Téléphone</p>
                      <p className="text-base text-gray-900 font-medium">{ride.clientPhone}</p>
                    </div>
                  </div>
                )}

                {ride.clientEmail && (
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <span className="text-base font-semibold text-purple-600">✉️</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500 uppercase mb-1">Email</p>
                      <p className="text-base text-gray-900 font-medium">{ride.clientEmail}</p>
                    </div>
                  </div>
                )}

                {ride.flightNumber && (
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-100 rounded-xl">
                      <span className="text-base font-semibold text-orange-600">✈️</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500 uppercase mb-1">Numéro de vol</p>
                      <p className="text-base text-gray-900 font-medium">{ride.flightNumber}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Détails de la course */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mb-8"
        >
          <Card className="bg-white border-gray-200 shadow-2xl">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-xl sm:text-2xl text-gray-900">Détails du trajet</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-100 rounded-xl">
                    <MapPin className="w-6 h-6 text-gray-900" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-500 uppercase mb-1">Départ</p>
                    <p className="text-base text-gray-900 font-medium">{ride.pickupAddress}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-100 rounded-xl">
                    <Navigation className="w-6 h-6 text-gray-900" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-500 uppercase mb-1">Destination</p>
                    <p className="text-base text-gray-900 font-medium">{ride.dropoffAddress}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-100 rounded-xl">
                    <Calendar className="w-6 h-6 text-gray-900" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase mb-1">Date prévue</p>
                    <p className="text-base text-gray-900 font-medium">{new Date(ride.scheduledAt).toLocaleString('fr-FR')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-100 rounded-xl">
                    <span className="text-base font-semibold text-gray-900">Prix:</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase mb-1">Montant</p>
                    <p className="text-xl font-bold text-gray-900">{ride.price} FCFA</p>
                  </div>
                </div>

                {(ride.numberOfPassengers !== undefined && ride.numberOfPassengers > 0) && (
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-100 rounded-xl">
                      <Users className="w-6 h-6 text-gray-900" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500 uppercase mb-1">Passagers</p>
                      <p className="text-base text-gray-900 font-medium">{ride.numberOfPassengers}</p>
                    </div>
                  </div>
                )}

                {(ride.numberOfBags !== undefined && ride.numberOfBags > 0) && (
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-100 rounded-xl">
                      <Luggage className="w-6 h-6 text-gray-900" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500 uppercase mb-1">Bagages</p>
                      <p className="text-base text-gray-900 font-medium">{ride.numberOfBags}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Carte interactive */}
        {(ride.pickupLocation || ride.dropoffLocation || ride.driverLocation) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-8"
          >
            <Card className="bg-white border-gray-200 shadow-2xl">
              <CardHeader className="px-4 sm:px-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg">
                    <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" />
                  </div>
                  <CardTitle className="text-lg sm:text-2xl text-gray-900">
                    {ride.driverLocation ? 'Position en temps réel' : 'Carte du trajet'}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="rounded-lg overflow-hidden border-2 border-gray-200" style={{ height: '400px' }}>
                  <MapComponent
                    driverLocation={ride.driverLocation}
                    pickupLocation={ride.pickupLocation}
                    dropoffLocation={ride.dropoffLocation}
                  />
                </div>
                {!ride.driverLocation && isActive && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Activez le suivi GPS pour voir votre position en temps réel
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Actions du chauffeur */}
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-8"
          >
            <Card className="bg-white border-gray-200 shadow-2xl">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-xl sm:text-2xl text-gray-900">Actions de la course</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 flex flex-col sm:flex-row gap-4">
                {ride.status === 'accepted' && (() => {
                  const now = new Date();
                  const scheduledDate = new Date(ride.scheduledAt);
                  // Permettre de démarrer jusqu'à 2 heures avant la date prévue
                  const allowedStartTime = new Date(scheduledDate.getTime() - 2 * 60 * 60 * 1000);
                  const canStart = now >= allowedStartTime;
                  const daysUntilRide = Math.ceil((scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div className="flex-1">
                      <Button
                        onClick={() => startRideMutation.mutate(ride.id)}
                        disabled={startRideMutation.isPending || !canStart}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 sm:py-4 shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {startRideMutation.isPending ? 'Démarrage...' : '🚗 Démarrer la course'}
                      </Button>
                      {!canStart && (
                        <p className="text-xs text-gray-600 mt-2 text-center">
                          {daysUntilRide > 1 
                            ? `Course prévue pour dans ${daysUntilRide} jours (${scheduledDate.toLocaleDateString('fr-FR')} à ${scheduledDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})`
                            : `Course prévue pour ${scheduledDate.toLocaleDateString('fr-FR')} à ${scheduledDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}. Vous pourrez démarrer 2h avant.`}
                        </p>
                      )}
                    </div>
                  );
                })()}
                {(ride.status === 'in_progress' || ride.status === 'picked_up') && (
                  <Button
                    onClick={() => completeRideMutation.mutate(ride.id)}
                    disabled={completeRideMutation.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 sm:py-4 shadow-lg"
                  >
                    {completeRideMutation.isPending ? 'Terminaison...' : '✅ Terminer la course'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Bouton retour */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <Button asChild size="lg" className="bg-gray-900 hover:bg-gray-800 text-white font-semibold shadow-lg">
            <Link to="/driver/dashboard" className="flex items-center">
              <ArrowLeft className="mr-2 w-5 h-5" />
              Retour au dashboard
            </Link>
          </Button>
        </motion.div>
      </main>

      {/* Barre de navigation en bas */}
      <DriverBottomNav />
    </div>
  );
}

export default DriverTrackingPage;

