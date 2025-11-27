import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Car, 
  RefreshCw, 
  X, 
  Phone, 
  Shield, 
  Navigation,
  Plane,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  History,
  BookOpen,
  Star,
  Users,
  TrendingUp,
  Key
} from 'lucide-react';
import { rideService, Ride } from '../services/rideService';
import Pagination from '../components/Pagination';
import NavigationBar from '../components/NavigationBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import './HomePage.css';

function HomePage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useState<{
    phone?: string;
    accessCode?: string;
  }>({});
  const [phonePrefix, setPhonePrefix] = useState<string>('+221');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [accessCode, setAccessCode] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');
  const [accessCodeError, setAccessCodeError] = useState<string>('');
  const [showAccessCodeForm, setShowAccessCodeForm] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  // Code de test pour visualisation
  const [testAccessCode] = useState<string>('A1B2C3D4');
  const [pageSize] = useState(10);

  useEffect(() => {
    const storedPhone = localStorage.getItem('clientPhone');
    if (storedPhone) {
      if (storedPhone.startsWith('+221')) {
        setPhonePrefix('+221');
        setPhoneNumber(storedPhone.substring(4));
      } else if (storedPhone.startsWith('+242')) {
        setPhonePrefix('+242');
        setPhoneNumber(storedPhone.substring(4));
      } else {
        setPhoneNumber(storedPhone);
      }
      setSearchParams({ phone: storedPhone });
    }
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchParams]);

  const hasSearchParams = !!(searchParams.phone && searchParams.accessCode);

  const { data: ridesData, isLoading } = useQuery({
    queryKey: ['my-rides', searchParams, page],
    queryFn: async () => {
      try {
        return await rideService.getMyRides(
          page,
          pageSize,
          searchParams.phone,
          undefined,
          undefined,
          undefined,
          searchParams.accessCode
        );
      } catch (error: any) {
        console.error('Erreur lors de la récupération des courses:', error);
        if (error?.response?.data?.message?.includes('Code d\'accès')) {
          setAccessCodeError('Code d\'accès incorrect ou manquant');
          setShowAccessCodeForm(true);
        }
        return { data: [], total: 0, page: 1, limit: pageSize, totalPages: 0, hasNextPage: false, hasPreviousPage: false };
      }
    },
    enabled: hasSearchParams,
    refetchInterval: 30000,
  });

  const rides = ridesData?.data || [];
  
  const activeRidesList = rides.filter(
    (ride: Ride) => 
      ride && ride.status && (
        ride.status === 'pending' || 
        ride.status === 'assigned' || 
        ride.status === 'accepted' || 
        ride.status === 'in_progress'
      )
  );

  // Mettre à jour le code d'accès actif dans localStorage si des courses actives existent
  useEffect(() => {
    if (activeRidesList.length > 0 && searchParams.accessCode) {
      localStorage.setItem('activeAccessCode', searchParams.accessCode);
    } else if (activeRidesList.length === 0) {
      // Plus de courses actives, retirer le code
      localStorage.removeItem('activeAccessCode');
    }
  }, [activeRidesList.length, searchParams.accessCode]);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');
    
    const cleanNumber = phoneNumber.replace(/\s|-|\./g, '');
    
    if (!cleanNumber) {
      setPhoneError('Veuillez entrer votre numéro de téléphone');
      return;
    }
    
    if (cleanNumber.length !== 9) {
      setPhoneError('Le numéro de téléphone doit contenir 9 chiffres (ex: 771234567)');
      return;
    }
    
    if (!/^[0-9]{9}$/.test(cleanNumber)) {
      setPhoneError('Le numéro de téléphone ne doit contenir que des chiffres');
      return;
    }
    
    const fullPhone = phonePrefix + cleanNumber;
    setSearchParams({ phone: fullPhone });
    localStorage.setItem('clientPhone', fullPhone);
    setPhoneError('');
    setShowAccessCodeForm(true);
  };

  const handleAccessCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAccessCodeError('');
    
    if (!accessCode || accessCode.trim().length !== 8) {
      setAccessCodeError('Le code d\'accès doit contenir 8 caractères');
      return;
    }
    
    setSearchParams(prev => ({ ...prev, accessCode: accessCode.toUpperCase().trim() }));
    setAccessCodeError('');
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-700/20 rounded-full blur-3xl"></div>
      </div>

      <NavigationBar />
      
      {/* Hero Section */}
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
          <Plane className="w-10 h-10 md:w-12 md:h-12 text-white" />
        </motion.div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-3 sm:mb-4 drop-shadow-2xl tracking-tight text-white px-2">
          AIBD
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl opacity-90 font-light text-gray-300 px-4">
          Transport vers l'aéroport de Dakar
        </p>
        <div className="flex items-center justify-center gap-2 mt-4 flex-wrap px-4">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          <span className="text-xs sm:text-sm opacity-80 text-gray-300 text-center">Service professionnel et fiable</span>
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      </motion.header>

      <main className="relative max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pb-20 sm:pb-24">
        {/* Formulaire de recherche */}
        {!hasSearchParams && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-16 sm:mb-20"
          >
            <Card className="bg-white border-gray-200 shadow-2xl max-w-2xl mx-auto">
              <CardHeader className="text-center pb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-full mb-4">
                  {!showAccessCodeForm ? <Search className="w-8 h-8 text-white" /> : <Key className="w-8 h-8 text-white" />}
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 px-2">
                  {!showAccessCodeForm ? 'Rechercher mes courses' : 'Code d\'accès requis'}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 px-2">
                  {!showAccessCodeForm 
                    ? 'Entrez votre numéro de téléphone pour accéder à toutes vos réservations'
                    : 'Entrez le code d\'accès unique que vous avez reçu lors de votre réservation'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!showAccessCodeForm ? (
                  <form onSubmit={handlePhoneSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <div className={`flex items-center rounded-xl border-2 transition-all duration-200 shadow-sm ${
                      phoneError 
                        ? 'border-red-400 bg-red-50 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20' 
                        : 'border-gray-300 focus-within:border-gray-900 focus-within:ring-4 focus-within:ring-gray-900/20 focus-within:shadow-lg'
                    }`}>
                      <div className="flex items-center px-3 sm:px-5 py-3 sm:py-4 bg-gray-900 text-white font-bold border-r-2 border-gray-700 rounded-l-xl">
                        <Phone className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                        <span className="text-base sm:text-lg">{phonePrefix}</span>
                      </div>
                      <Input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 9) {
                            setPhoneNumber(value);
                            setPhoneError('');
                          }
                        }}
                        placeholder="771234567"
                        maxLength={9}
                        className="border-0 bg-transparent text-gray-900 placeholder:text-gray-400 focus-visible:ring-0 text-base sm:text-xl font-semibold py-3 sm:py-4"
                      />
                    </div>
                    
                    {phoneError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200"
                      >
                        <X className="w-4 h-4 flex-shrink-0" />
                        <span>{phoneError}</span>
                      </motion.div>
                    )}
                    
                    <div className="flex gap-2 sm:gap-3 justify-center flex-wrap">
                      <Button
                        type="button"
                        variant={phonePrefix === '+221' ? 'default' : 'outline'}
                        size="lg"
                        onClick={() => {
                          setPhonePrefix('+221');
                          setPhoneError('');
                        }}
                        className={`font-semibold transition-all text-sm sm:text-base px-3 sm:px-5 ${
                          phonePrefix === '+221' 
                            ? 'bg-green-600 text-white shadow-lg hover:bg-green-700 border-2 border-green-700' 
                            : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200 hover:border-green-400'
                        }`}
                      >
                        <span className="text-2xl sm:text-3xl mr-2" style={{ filter: phonePrefix === '+221' ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none' }}>🇸🇳</span>
                        +221
                      </Button>
                      <Button
                        type="button"
                        variant={phonePrefix === '+242' ? 'default' : 'outline'}
                        size="lg"
                        onClick={() => {
                          setPhonePrefix('+242');
                          setPhoneError('');
                        }}
                        className={`font-semibold transition-all text-sm sm:text-base px-3 sm:px-5 ${
                          phonePrefix === '+242' 
                            ? 'bg-yellow-500 text-white shadow-lg hover:bg-yellow-600 border-2 border-yellow-600' 
                            : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200 hover:border-yellow-400'
                        }`}
                      >
                        <span className="text-2xl sm:text-3xl mr-2" style={{ filter: phonePrefix === '+242' ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none' }}>🇨🇬</span>
                        +242
                      </Button>
                    </div>
                    
                    <p className="text-xs text-center text-gray-500">
                      Format: {phonePrefix}XXXXXXXXX (9 chiffres)
                    </p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full bg-gray-900 text-white hover:bg-gray-800 text-base sm:text-lg font-semibold py-4 sm:py-6 shadow-xl hover:shadow-2xl transition-all"
                  >
                    <Search className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Rechercher mes courses</span>
                    <span className="sm:hidden">Rechercher</span>
                    <ArrowRight className="ml-2 sm:ml-3 w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </form>
                ) : (
                  <form onSubmit={handleAccessCodeSubmit} className="space-y-6">
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-900">
                          <p className="font-semibold mb-1">🔐 Sécurité de vos données</p>
                          <p className="text-xs">Le code d'accès protège vos informations personnelles. Vous l'avez reçu lors de votre réservation. Faites une capture d'écran et conservez-le précieusement.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="accessCode" className="text-gray-900 font-semibold flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        Code d'accès (8 caractères)
                      </Label>
                      <Input
                        id="accessCode"
                        type="text"
                        value={accessCode}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
                          setAccessCode(value);
                          setAccessCodeError('');
                        }}
                        placeholder="Ex: A1B2C3D4"
                        maxLength={8}
                        className={`bg-gray-50 border-gray-300 text-gray-900 transition-all duration-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 focus:shadow-md hover:border-gray-400 text-center text-2xl font-bold tracking-widest ${accessCodeError ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : ''}`}
                      />
                      {accessCodeError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200"
                        >
                          <X className="w-4 h-4 flex-shrink-0" />
                          <span>{accessCodeError}</span>
                        </motion.div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => {
                          setShowAccessCodeForm(false);
                          setAccessCode('');
                          setAccessCodeError('');
                        }}
                        className="flex-1 bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                      >
                        <ArrowRight className="mr-2 w-4 h-4 rotate-180" />
                        Retour
                      </Button>
                      <Button 
                        type="submit" 
                        size="lg" 
                        className="flex-1 bg-gray-900 text-white hover:bg-gray-800 text-base sm:text-lg font-semibold py-4 sm:py-6 shadow-xl hover:shadow-2xl transition-all"
                      >
                        <Key className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5" />
                        Vérifier
                        <ArrowRight className="ml-2 sm:ml-3 w-4 h-4 sm:w-5 sm:h-5" />
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Courses actives */}
            {hasSearchParams && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            {/* En-tête de section avec informations de recherche */}
            <div className="mb-8 sm:mb-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 mb-6">
                <div className="flex-1">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 text-white">
                    Mes Courses Actives
                  </h2>
                  <p className="text-sm sm:text-base text-gray-300">
                    Suivez l'état de vos réservations en temps réel
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-3 px-4 sm:px-5 py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 min-w-0">
                    <div className="p-2 bg-gray-800 rounded-lg flex-shrink-0">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-400 mb-1">Recherche</p>
                      <p className="text-sm font-semibold text-white truncate">{searchParams.phone}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setSearchParams({});
                      setPhoneNumber('');
                      setAccessCode('');
                      setShowAccessCodeForm(false);
                      localStorage.removeItem('clientPhone');
                    }}
                    className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm whitespace-nowrap"
                  >
                    <RefreshCw className="mr-2 w-5 h-5" />
                    <span className="hidden sm:inline">Nouvelle recherche</span>
                    <span className="sm:hidden">Nouvelle</span>
                  </Button>
                </div>
              </div>
              
              {/* Séparateur visuel */}
              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            </div>

            {isLoading ? (
              <div className="text-center py-16">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-block mb-4"
                >
                  <RefreshCw className="w-12 h-12 text-white/60" />
                </motion.div>
                <p className="text-lg text-gray-300">Chargement de vos courses...</p>
              </div>
            ) : activeRidesList.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
                  {activeRidesList.map((ride: Ride, index: number) => (
                    <motion.div
                      key={ride.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Card className="bg-white shadow-xl hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden group">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-900 to-gray-700"></div>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-gray-100 rounded-lg">
                                <Plane className="w-5 h-5 text-gray-900" />
                              </div>
                              <CardTitle className="text-lg font-bold text-gray-900">
                                {ride.rideType === 'city_to_airport' 
                                  ? 'Ville → Aéroport' 
                                  : ride.rideType === 'airport_to_city'
                                  ? 'Aéroport → Ville'
                                  : 'Ville → Ville'}
                              </CardTitle>
                            </div>
                            <Badge variant={getStatusVariant(ride.status)} className="font-semibold">
                              {getStatusLabel(ride.status)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg mt-0.5">
                              <MapPin className="w-4 h-4 text-gray-900" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Départ</p>
                              <p className="text-sm text-gray-900 font-medium leading-tight">{ride.pickupAddress}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg mt-0.5">
                              <Navigation className="w-4 h-4 text-gray-900" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Arrivée</p>
                              <p className="text-sm text-gray-900 font-medium leading-tight">{ride.dropoffAddress}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-xs text-gray-600">{new Date(ride.scheduledAt).toLocaleDateString('fr-FR')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-xs text-gray-600">{new Date(ride.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-600">Prix:</span>
                              <span className="text-lg font-bold text-gray-900">{ride.price} FCFA</span>
                            </div>
                            {ride.driverId && (
                              <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                <CheckCircle2 className="w-3 h-3 text-gray-900" />
                                <span>Chauffeur assigné</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="flex gap-2 pt-0">
                          <Button
                            asChild
                            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-semibold shadow-lg"
                          >
                            <Link to={`/track/${ride.id}`} className="flex items-center justify-center">
                              <MapPin className="mr-2 w-4 h-4" />
                              Suivre la course
                            </Link>
                          </Button>
                          {ride.status === 'pending' && (
                            <Button
                              variant="destructive"
                              size="default"
                              onClick={async () => {
                                if (confirm('Êtes-vous sûr de vouloir annuler cette course ?')) {
                                  try {
                                    await rideService.cancelRide(ride.id, 'Annulée par le client', 'client');
                                    window.location.reload();
                                  } catch (error) {
                                    alert('Erreur lors de l\'annulation');
                                  }
                                }
                              }}
                              className="font-semibold"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </div>
                {/* Pagination et informations */}
                <div className="space-y-4 mt-8 sm:mt-10">
                  {ridesData && (
                    <div className="flex justify-center">
                      <Pagination
                        currentPage={page}
                        totalPages={ridesData.totalPages}
                        onPageChange={setPage}
                        hasNextPage={ridesData.hasNextPage}
                        hasPreviousPage={ridesData.hasPreviousPage}
                      />
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-sm sm:text-base text-white/80">
                      Affichage de <strong className="text-white">{activeRidesList.length}</strong> course(s) active(s) 
                      {ridesData?.total && ridesData.total > 0 && (
                        <> sur <strong className="text-white">{ridesData.total}</strong> course(s) totale(s)</>
                      )}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <Card className="bg-white border-gray-200 shadow-2xl text-center py-12 sm:py-16 max-w-2xl mx-auto">
                <CardContent className="px-6 sm:px-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full mb-4 sm:mb-6">
                    <Search className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                    Aucune course active
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto">
                    Aucune course active trouvée pour ce numéro de téléphone.
                  </p>
                  <Button asChild size="lg" className="bg-gray-900 hover:bg-gray-800 text-white font-semibold shadow-lg">
                    <Link to="/book" className="flex items-center justify-center">
                      <BookOpen className="mr-2 w-5 h-5" />
                      Réserver une course
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.section>
        )}

        {/* Actions principales */}
        {!hasSearchParams && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-16 sm:mb-20"
          >
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
                Que souhaitez-vous faire ?
              </h2>
              <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
                Réservez une nouvelle course ou consultez votre historique
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto mb-16 sm:mb-20">
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                asChild
                size="lg"
                className="w-full bg-white text-gray-900 hover:bg-gray-100 text-base sm:text-xl font-bold py-6 sm:py-8 h-auto shadow-2xl hover:shadow-3xl transition-all group border-2 border-gray-900"
              >
                <Link to="/book" className="flex items-center justify-center">
                  <div className="p-2 sm:p-3 bg-gray-900 rounded-xl mr-2 sm:mr-4 group-hover:bg-gray-800 transition-colors">
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <span className="text-sm sm:text-base md:text-xl">{t('booking.title')}</span>
                  <ArrowRight className="ml-2 sm:ml-4 w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full bg-white/10 backdrop-blur-lg text-white border-2 border-white/30 hover:bg-white/20 text-base sm:text-xl font-bold py-6 sm:py-8 h-auto shadow-xl hover:shadow-2xl transition-all group"
              >
                <Link to="/history" className="flex items-center justify-center">
                  <div className="p-2 sm:p-3 bg-white/20 rounded-xl mr-2 sm:mr-4 group-hover:bg-white/30 transition-colors">
                    <History className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-sm sm:text-base md:text-xl">Historique</span>
                  <ArrowRight className="ml-2 sm:ml-4 w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
            </div>
          </motion.div>
        )}

        {/* Features */}
        {!hasSearchParams && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-8 sm:mb-12"
          >
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
                Pourquoi choisir AIBD ?
              </h2>
              <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
                Un service professionnel et fiable pour vos déplacements vers l'aéroport
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all h-full shadow-xl">
                <CardContent className="p-6 sm:p-8 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl mb-4 sm:mb-6">
                    <Car className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-white">Transport fiable</h3>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed">Chauffeurs vérifiés et professionnels pour votre sécurité</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all h-full shadow-xl">
                <CardContent className="p-6 sm:p-8 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl mb-4 sm:mb-6">
                    <Navigation className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-white">Suivi en temps réel</h3>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed">Suivez votre chauffeur en direct sur la carte</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all h-full shadow-xl">
                <CardContent className="p-6 sm:p-8 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl mb-4 sm:mb-6">
                    <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-white">Tarifs transparents</h3>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed">Prix clairs et fixes avant réservation</p>
                </CardContent>
              </Card>
            </motion.div>
            </div>
          </motion.div>
        )}
      </main>

    </div>
  );
}

export default HomePage;
