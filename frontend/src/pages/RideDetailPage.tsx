import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Phone, Mail, MapPin, Navigation, Calendar, Car, UserCheck, AlertCircle, RefreshCw, Play, CheckCircle2, XCircle } from 'lucide-react';
import { adminService, Driver } from '../services/adminService';
import { authService } from '../services/authService';
import NavigationBar from '../components/NavigationBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import './RideDetailPage.css';

function RideDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    // Vérifier que l'utilisateur est admin
    if (authService.getRole() !== 'admin') {
      navigate('/');
    }
  }, [navigate]);

  const { data: ride, isLoading: rideLoading } = useQuery({
    queryKey: ['admin-ride', id],
    queryFn: () => adminService.getRideById(id!),
    enabled: !!id,
    refetchInterval: 15000,
  });

  const { data: driversData } = useQuery({
    queryKey: ['admin-drivers'],
    queryFn: () => adminService.getAllDrivers(1, 100),
    refetchInterval: 30000,
  });

  const assignMutation = useMutation({
    mutationFn: (driverId: string) => adminService.assignRideToDriver(id!, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ride', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-rides'] });
      queryClient.invalidateQueries({ queryKey: ['admin-drivers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      alert('Course assignée avec succès !');
      setSelectedDriverId('');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erreur lors de l\'attribution');
    },
  });

  const invalidateRide = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-ride', id] });
    queryClient.invalidateQueries({ queryKey: ['admin-rides'] });
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
  };

  const acceptMutation = useMutation({
    mutationFn: () => adminService.acceptRide(id!),
    onSuccess: () => { invalidateRide(); alert('Course acceptée.'); },
    onError: (error: any) => { alert(error.response?.data?.message || 'Erreur'); },
  });
  const startMutation = useMutation({
    mutationFn: () => adminService.startRide(id!),
    onSuccess: () => { invalidateRide(); alert('Course démarrée.'); },
    onError: (error: any) => { alert(error.response?.data?.message || 'Erreur'); },
  });
  const completeMutation = useMutation({
    mutationFn: () => adminService.completeRide(id!),
    onSuccess: () => { invalidateRide(); alert('Course terminée.'); },
    onError: (error: any) => { alert(error.response?.data?.message || 'Erreur'); },
  });
  const cancelMutation = useMutation({
    mutationFn: (reason?: string) => adminService.cancelRide(id!, reason),
    onSuccess: () => { invalidateRide(); alert('Course annulée.'); },
    onError: (error: any) => { alert(error.response?.data?.message || 'Erreur'); },
  });

  const drivers = driversData?.data || [];
  const availableDrivers = drivers.filter((d: Driver) => 
    d.isVerified && 
    (d.status === 'available' || d.status === 'unavailable') &&
    d.id !== ride?.driverId
  );

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      assigned: 'Assignée',
      accepted: 'Acceptée',
      driver_on_way: 'Chauffeur en route',
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
      driver_on_way: 'default',
      picked_up: 'secondary',
      in_progress: 'secondary',
      completed: 'success',
      cancelled: 'destructive',
    };
    return variants[status] || 'default';
  };

  if (rideLoading) {
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
          <p className="text-lg text-gray-300">Chargement...</p>
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
                <AlertCircle className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Course non trouvée</h2>
              <Button asChild size="lg" className="bg-gray-900 hover:bg-gray-800 text-white font-semibold shadow-lg">
                <Link to="/admin/dashboard" className="flex items-center">
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
          className="mb-6 sm:mb-8"
        >
          <Button
            asChild
            variant="outline"
            className="mb-3 sm:mb-4 bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm text-xs sm:text-sm"
          >
            <Link to="/admin/dashboard" className="flex items-center">
              <ArrowLeft className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Retour au Dashboard</span>
              <span className="sm:hidden">Retour</span>
            </Link>
          </Button>
          <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 text-white">Détails de la course</h1>
              <p className="text-xs sm:text-sm text-gray-300">Informations complètes sur la réservation</p>
            </div>
            <Badge variant={getStatusVariant(ride.status)} className="text-sm sm:text-lg font-semibold px-3 sm:px-4 py-1.5 sm:py-2">
              {getStatusLabel(ride.status)}
            </Badge>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Informations client */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-white border-gray-200 shadow-2xl h-full">
              <CardHeader className="px-4 sm:px-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl text-gray-900">Informations Client</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Nom complet</p>
                    <p className="text-base text-gray-900 font-semibold break-words">
                      {ride.clientFirstName || ''} {ride.clientLastName || ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Phone className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Téléphone</p>
                    <p className="text-base text-gray-900 font-medium break-all">
                      {ride.clientPhone && !ride.clientPhone.includes(':') 
                        ? ride.clientPhone 
                        : ride.clientPhone || 'Non disponible'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Mail className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Email</p>
                    <p className="text-base text-gray-900 font-medium break-all">
                      {ride.clientEmail && !ride.clientEmail.includes(':') 
                        ? ride.clientEmail 
                        : ride.clientEmail || 'Non disponible'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Informations course */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="bg-white border-gray-200 shadow-2xl h-full">
              <CardHeader className="px-4 sm:px-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl text-gray-900">Informations Course</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <span className="text-sm font-semibold text-gray-900">Type</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Trajet</p>
                    <p className="text-base text-gray-900 font-semibold">
                      {(ride.rideType === 'dakar_to_airport' || ride.rideType === 'city_to_airport')
                        ? 'Ville → Aéroport' 
                        : (ride.rideType === 'airport_to_dakar' || ride.rideType === 'airport_to_city')
                        ? 'Aéroport → Ville'
                        : 'Ville → Ville'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Départ</p>
                    <p className="text-base text-gray-900 font-medium">{ride.pickupAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Navigation className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Destination</p>
                    <p className="text-base text-gray-900 font-medium">{ride.dropoffAddress}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Date prévue</p>
                    <p className="text-base text-gray-900 font-medium">{new Date(ride.scheduledAt).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                  <span className="text-base font-semibold text-gray-900">Prix:</span>
                  <span className="text-xl font-bold text-gray-900">
                    {ride.price != null 
                      ? (typeof ride.price === 'number' 
                          ? ride.price.toLocaleString() 
                          : parseFloat(String(ride.price) || '0').toLocaleString())
                      : '0'} FCFA
                  </span>
                </div>
                {ride.flightNumber && (
                  <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Numéro de vol:</span>
                    <span className="text-base text-gray-900 font-medium">{ride.flightNumber}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Chauffeur assigné ou Attribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-6"
        >
          {ride.driver ? (
            <Card className="bg-white border-gray-200 shadow-2xl">
              <CardHeader className="px-4 sm:px-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg">
                    <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl text-gray-900">Chauffeur Assigné</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Nom complet</p>
                      <p className="text-base text-gray-900 font-semibold break-words">
                        {ride.driver.user?.firstName || ''} {ride.driver.user?.lastName || ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Mail className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Email</p>
                      <p className="text-base text-gray-900 font-medium break-all">
                        {ride.driver.user?.email && !ride.driver.user.email.includes(':') 
                          ? ride.driver.user.email 
                          : 'Non disponible'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Phone className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Téléphone</p>
                      <p className="text-base text-gray-900 font-medium break-all">
                        {ride.driver.user?.phone && !ride.driver.user.phone.includes(':') 
                          ? ride.driver.user.phone 
                          : 'Non disponible'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Car className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Numéro de permis</p>
                      <p className="text-base text-gray-900 font-semibold break-all">
                        {ride.driver.licenseNumber && !ride.driver.licenseNumber.includes(':') 
                          ? ride.driver.licenseNumber 
                          : 'Non disponible'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white border-gray-200 shadow-2xl">
              <CardHeader className="px-4 sm:px-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg">
                    <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl text-gray-900">Attribuer un Chauffeur</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                {availableDrivers.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="driver-select" className="text-gray-900 font-semibold">
                        Sélectionner un chauffeur
                      </Label>
                      <select
                        id="driver-select"
                        value={selectedDriverId}
                        onChange={(e) => setSelectedDriverId(e.target.value)}
                        className="w-full h-10 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 transition-all duration-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 focus:shadow-md focus:outline-none hover:border-gray-400"
                      >
                        <option value="">Sélectionner un chauffeur</option>
                        {availableDrivers.map((driver: Driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.user?.firstName} {driver.user?.lastName} 
                            {' - '}
                            {driver.user?.email || 'N/A'} 
                            {' - '}
                            {driver.status === 'available' ? '✅ Disponible' : '⏸️ Indisponible'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button
                      onClick={() => {
                        if (selectedDriverId) {
                          if (confirm('Êtes-vous sûr de vouloir attribuer cette course à ce chauffeur ?')) {
                            assignMutation.mutate(selectedDriverId);
                          }
                        } else {
                          alert('Veuillez sélectionner un chauffeur');
                        }
                      }}
                      disabled={!selectedDriverId || assignMutation.isPending}
                      size="lg"
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold shadow-lg text-sm sm:text-base py-3 sm:py-4"
                    >
                      {assignMutation.isPending ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="mr-2"
                          >
                            <RefreshCw className="w-5 h-5" />
                          </motion.div>
                          Attribution...
                        </>
                      ) : (
                        <>
                          <UserCheck className="mr-2 w-5 h-5" />
                          Attribuer la course
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun chauffeur disponible pour le moment.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Actions sur la course (comme le chauffeur) */}
        {ride && !['completed', 'cancelled'].includes(ride.status) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-6"
          >
            <Card className="bg-white border-gray-200 shadow-2xl">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl text-gray-900">Actions sur la course</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Effectuer les mêmes actions que le chauffeur (accepter, démarrer, terminer, annuler).</p>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 flex flex-wrap gap-3">
                {ride.status === 'assigned' && ride.driverId && (
                  <Button
                    onClick={() => acceptMutation.mutate()}
                    disabled={acceptMutation.isPending}
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    {acceptMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <UserCheck className="w-4 h-4 mr-2" />}
                    Accepter pour le chauffeur
                  </Button>
                )}
                {(ride.status === 'accepted' || ride.status === 'driver_on_way') && (
                  <Button
                    onClick={() => startMutation.mutate()}
                    disabled={startMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {startMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    Démarrer la course
                  </Button>
                )}
                {(ride.status === 'in_progress' || ride.status === 'picked_up') && (
                  <Button
                    onClick={() => completeMutation.mutate()}
                    disabled={completeMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {completeMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Terminer la course
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => {
                    const reason = window.prompt('Raison de l\'annulation (optionnel) :');
                    if (reason === null) return;
                    if (!confirm('Annuler cette course ?')) return;
                    cancelMutation.mutate(reason || undefined);
                  }}
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                  Annuler la course
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default RideDetailPage;
