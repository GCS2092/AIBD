import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Calendar, Clock, RefreshCw, CheckCircle2, XCircle, Plane, ArrowLeft, Radio, Users, Car } from 'lucide-react';
import { useRideStatus } from '../hooks/useRide';
import { useETA } from '../hooks/useGPS';
import MapComponent from '../components/MapComponent';
import NavigationBar from '../components/NavigationBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import './TrackingPage.css';

function TrackingPage() {
  const { rideId } = useParams<{ rideId: string }>();
  const { t } = useTranslation();
  const { data: ride, isLoading, refetch } = useRideStatus(rideId || null);
  const { data: etaData } = useETA(rideId || null, !!ride);

  // Rafraîchir automatiquement toutes les 5 secondes si la course est active
  useEffect(() => {
    if (ride && (ride.status === 'pending' || ride.status === 'assigned' || ride.status === 'accepted' || ride.status === 'in_progress' || ride.status === 'driver_on_way' || ride.status === 'picked_up')) {
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
      in_progress: 'secondary',
      completed: 'success',
      cancelled: 'destructive',
    };
    return variants[status] || 'default';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <NavigationBar />
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-4"
          >
            <RefreshCw className="w-12 h-12 text-white/60" />
          </motion.div>
          <p className="text-lg text-gray-300">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <NavigationBar />
        <div className="flex items-center justify-center min-h-screen px-4">
          <Card className="bg-white border-gray-200 shadow-2xl text-center py-12 max-w-md">
            <CardContent>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                <XCircle className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Course non trouvée</h2>
              <p className="text-gray-600 mb-6">La course demandée n'existe pas ou a été supprimée.</p>
              <Button asChild size="lg" className="bg-gray-900 hover:bg-gray-800 text-white font-semibold shadow-lg">
                <Link to="/" className="flex items-center">
                  <ArrowLeft className="mr-2 w-5 h-5" />
                  Retour à l'accueil
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isActive = ride.status === 'accepted' || ride.status === 'in_progress';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-700/20 rounded-full blur-3xl"></div>
      </div>

      <NavigationBar />

      <main className="relative max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-8 sm:py-12">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 sm:mb-8"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white/10 backdrop-blur-lg rounded-2xl border-2 border-white/20 shadow-2xl mb-3 sm:mb-4">
            <Navigation className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
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
                    <Plane className="w-6 h-6 sm:w-8 sm:h-8 text-gray-900" />
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

        {/* Informations du chauffeur (quand accepté) */}
        {ride.driver && (ride.status === 'accepted' || ride.status === 'assigned' || ride.status === 'in_progress' || ride.status === 'driver_on_way' || ride.status === 'picked_up') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8"
          >
            <Card className="bg-white border-gray-200 shadow-2xl">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-xl sm:text-2xl text-gray-900">Votre chauffeur</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Users className="w-6 h-6 text-blue-900" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500 uppercase mb-1">Nom du chauffeur</p>
                      <p className="text-base text-gray-900 font-medium">
                        {ride.driver.user?.firstName} {ride.driver.user?.lastName}
                      </p>
                    </div>
                  </div>

                  {ride.driver.vehicles && ride.driver.vehicles.length > 0 && ride.driver.vehicles[0] && (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-xl">
                          <Car className="w-6 h-6 text-green-900" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-500 uppercase mb-1">Véhicule</p>
                          <p className="text-base text-gray-900 font-medium">
                            {ride.driver.vehicles[0].brand} {ride.driver.vehicles[0].model}
                            {ride.driver.vehicles[0].year && ` (${ride.driver.vehicles[0].year})`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:col-span-2">
                        <div className="p-3 bg-yellow-100 rounded-xl">
                          <span className="text-lg font-bold text-yellow-900">🚗</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-500 uppercase mb-1">Plaque d'immatriculation</p>
                          <p className="text-xl font-bold text-gray-900 tracking-wider">
                            {ride.driver.vehicles[0].licensePlate}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Détails de la course */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <Card className="bg-white border-gray-200 shadow-2xl">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-xl sm:text-2xl text-gray-900">Détails de la course</CardTitle>
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

                {etaData && (
                  <div className="flex items-center gap-4 md:col-span-2">
                    <div className="p-3 bg-gray-100 rounded-xl">
                      <Clock className="w-6 h-6 text-gray-900" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500 uppercase mb-1">Temps estimé</p>
                      <p className="text-2xl font-bold text-gray-900">{etaData.estimatedTimeFormatted}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Carte - Afficher toujours si on a au moins pickup ou dropoff, ou si un chauffeur est assigné */}
        {(ride.pickupLocation || ride.dropoffLocation || ride.driverLocation || (ride.driver && ride.status !== 'pending')) && (
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
                <div className="rounded-lg overflow-hidden border-2 border-gray-200" style={{ height: '300px' }}>
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
                      En attente de la position du chauffeur en temps réel...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Message d'état seulement si aucune localisation n'est disponible */}
        {!ride.driverLocation && !ride.pickupLocation && !ride.dropoffLocation && ride.status !== 'completed' && ride.status !== 'cancelled' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl text-center py-12">
              <CardContent>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="inline-block mb-4"
                >
                  <Clock className="w-12 h-12 text-white/60" />
                </motion.div>
                <p className="text-lg text-white/90">En attente de la position du chauffeur...</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {ride.status === 'completed' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Card className="bg-white border-gray-200 shadow-2xl text-center py-12">
              <CardContent>
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full mb-4 sm:mb-6">
                  <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Course terminée</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Merci d'avoir utilisé nos services !</p>
                <Button asChild size="lg" className="bg-gray-900 hover:bg-gray-800 text-white font-semibold shadow-lg text-sm sm:text-base py-3 sm:py-4">
                  <Link to="/history" className="flex items-center">
                    Voir l'historique
                    <ArrowLeft className="ml-2 w-4 h-4 sm:w-5 sm:h-5 rotate-180" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {ride.status === 'cancelled' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Card className="bg-white border-gray-200 shadow-2xl text-center py-12">
              <CardContent>
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full mb-4 sm:mb-6">
                  <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Course annulée</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Cette course a été annulée.</p>
                <Button asChild size="lg" className="bg-gray-900 hover:bg-gray-800 text-white font-semibold shadow-lg text-sm sm:text-base py-3 sm:py-4">
                  <Link to="/" className="flex items-center">
                    <span className="hidden sm:inline">Réserver une nouvelle course</span>
                    <span className="sm:hidden">Nouvelle course</span>
                    <ArrowLeft className="ml-2 w-4 h-4 sm:w-5 sm:h-5 rotate-180" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default TrackingPage;
