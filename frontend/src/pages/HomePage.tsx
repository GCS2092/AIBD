import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  Key,
  HelpCircle
} from 'lucide-react';
import { rideService, Ride } from '../services/rideService';
import Pagination from '../components/Pagination';
import NavigationBar from '../components/NavigationBar';
import { useOnboarding } from '../hooks/useOnboarding';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import './HomePage.css';

function HomePage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
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
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [page, setPage] = useState(1);
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

  // Garder le code tant que la course n'est pas terminée ; le retirer seulement quand la course est terminée ou annulée
  useEffect(() => {
    if (activeRidesList.length > 0 && searchParams.accessCode) {
      localStorage.setItem('activeAccessCode', searchParams.accessCode);
    } else if (rides.length > 0 && searchParams.accessCode) {
      const rideWithCode = rides.find((r: Ride) => r.accessCode === searchParams.accessCode);
      if (rideWithCode && (rideWithCode.status === 'completed' || rideWithCode.status === 'cancelled')) {
        localStorage.removeItem('activeAccessCode');
      }
    }
  }, [rides, activeRidesList.length, searchParams.accessCode]);

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
    setShowSearchModal(false);
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

  const { startOnboarding } = useOnboarding({
    context: 'visitor_home',
    autoRunDelay: 800,
  });

  return (
    <div className="home-page min-h-screen relative overflow-hidden">
      {/* Légère décoration de fond */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[var(--color-primary)] opacity-[0.06] rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[var(--color-primary)] opacity-[0.04] rounded-full blur-3xl" />
      </div>

      <NavigationBar />
      
      {/* Bouton aide onboarding - relancer le guide */}
      <button
        type="button"
        onClick={() => startOnboarding()}
        className="fixed top-16 right-4 z-50 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] shadow-sm text-sm"
        title="Voir l'aide"
        aria-label="Voir l'aide"
      >
        <HelpCircle className="w-4 h-4" />
        <span className="hidden sm:inline">Aide</span>
      </button>

      {/* Hero */}
      <motion.header 
        data-onboarding="welcome"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative text-center py-12 sm:py-16 px-5 sm:px-8"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 mb-8 rounded-2xl bg-[var(--color-primary-light)] border border-[var(--color-primary-border)] shadow-sm"
        >
          <Plane className="w-8 h-8 md:w-10 md:h-10 text-[var(--color-primary)]" strokeWidth={2} />
        </motion.div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 tracking-tight text-[var(--color-text)] px-2">
          AIBD
        </h1>
        <p className="text-base sm:text-lg md:text-xl font-medium text-[var(--color-text-muted)] px-4">
          Transport vers l'aéroport de Dakar
        </p>
        <div className="flex items-center justify-center gap-2 mt-5 flex-wrap px-4">
          <Sparkles className="w-4 h-4 text-[var(--color-primary)] opacity-80" />
          <span className="text-xs sm:text-sm text-[var(--color-text-muted)] text-center">Service professionnel et fiable</span>
          <Sparkles className="w-4 h-4 text-[var(--color-primary)] opacity-80" />
        </div>
      </motion.header>

      <main className="relative w-full flex-1 px-4 sm:px-5 md:px-6 lg:px-8 pb-24 sm:pb-28">
        {/* Courses actives */}
            {hasSearchParams && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-14 sm:mb-16"
          >
            {/* En-tête de section avec informations de recherche */}
            <div className="mb-10 sm:mb-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 sm:gap-8 mb-8">
                <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 text-[var(--color-text)]">
                    Mes Courses Actives
                  </h2>
                  <p className="text-sm sm:text-base text-[var(--color-text-muted)]">
                    Suivez l'état de vos réservations en temps réel
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
                  <div className="flex items-center gap-4 px-5 sm:px-6 py-4 bg-[var(--color-surface-elevated)] rounded-xl border border-[var(--color-border)] min-w-0">
                    <div className="p-2 bg-[var(--color-primary-light)] rounded-lg flex-shrink-0">
                      <Phone className="w-5 h-5 text-[var(--color-primary)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[var(--color-text-muted)] mb-1">Recherche</p>
                      <p className="text-sm font-semibold text-[var(--color-text)] truncate">{searchParams.phone}</p>
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
                    className="bg-[var(--color-surface-elevated)] text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-surface)] whitespace-nowrap"
                  >
                    <RefreshCw className="mr-2 w-5 h-5" />
                    <span className="hidden sm:inline">Nouvelle recherche</span>
                    <span className="sm:hidden">Nouvelle</span>
                  </Button>
                </div>
              </div>
              <div className="h-px bg-[var(--color-border)]" />
            </div>

            {isLoading ? (
              <div className="text-center py-20">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-block mb-4"
                >
                  <RefreshCw className="w-12 h-12 text-[var(--color-text-muted)]" />
                </motion.div>
                <p className="text-lg text-[var(--color-text-muted)]">Chargement de vos courses...</p>
              </div>
            ) : activeRidesList.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8 mb-10 sm:mb-12">
                  {activeRidesList.map((ride: Ride, index: number) => (
                    <motion.div
                      key={ride.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Card className="bg-[var(--color-surface-elevated)] shadow-md hover:shadow-lg transition-all duration-300 border border-[var(--color-border)] overflow-hidden group">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--color-primary)]" />
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
                            className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold shadow-lg"
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
                                    await queryClient.invalidateQueries({ queryKey: ['my-rides'] });
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
                    <p className="text-sm sm:text-base text-[var(--color-text-muted)]">
                      Affichage de <strong className="text-[var(--color-text)]">{activeRidesList.length}</strong> course(s) active(s) 
                      {ridesData?.total && ridesData.total > 0 && (
                        <> sur <strong className="text-[var(--color-text)]">{ridesData.total}</strong> course(s) totale(s)</>
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
                  <Button asChild size="lg" className="bg-primary-500 hover:bg-primary-600 text-white font-semibold shadow-lg">
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
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="relative mb-14 sm:mb-16"
          >
            <div className="text-center mb-8">
              <h2 className="text-lg sm:text-xl font-bold text-[var(--color-text)] mb-2">
                Que souhaitez-vous faire ?
              </h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                Réserver ou consulter l'historique
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full mb-5">
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-[var(--color-primary)] hover:opacity-90 text-white text-base font-semibold py-6 h-auto shadow-md hover:shadow-lg transition-all group border-0"
                >
                  <Link to="/book" className="flex items-center justify-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    <span>{t('booking.title')}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full bg-[var(--color-surface-elevated)] text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-surface)] hover:border-[var(--color-primary-border)] text-base font-semibold py-6 h-auto transition-all group"
                >
                  <Link to="/history" className="flex items-center justify-center gap-2">
                    <History className="w-5 h-5 text-[var(--color-primary)]" />
                    <span>Historique</span>
                    <ArrowRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </Button>
              </motion.div>
            </div>
            <div className="w-full">
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={() => setShowSearchModal(true)}
                className="w-full bg-[var(--color-surface-elevated)] text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-surface)] hover:border-[var(--color-primary-border)] text-base font-semibold py-6 h-auto"
              >
                <Search className="w-5 h-5 mr-2 text-[var(--color-primary)]" />
                Rechercher mes courses
              </Button>
            </div>
          </motion.div>
        )}

        {/* Modal Rechercher mes courses */}
        {showSearchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowSearchModal(false)}>
            <Card className="bg-[var(--color-surface-elevated)] border-[var(--color-border)] shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1.5">
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    {!showAccessCodeForm ? <Search className="w-5 h-5" /> : <Key className="w-5 h-5" />}
                    {!showAccessCodeForm ? 'Rechercher mes courses' : 'Code d\'accès'}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                    {!showAccessCodeForm ? 'Entrez votre numéro pour accéder à vos réservations' : 'Code reçu lors de votre réservation'}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowSearchModal(false)} className="shrink-0">
                  <X className="w-5 h-5" />
                </Button>
              </CardHeader>
              <CardContent>
                {!showAccessCodeForm ? (
                  <form onSubmit={handlePhoneSubmit} className="space-y-4">
                    <div className={`flex items-center rounded-lg border transition-all ${phoneError ? 'border-red-400 bg-red-50' : 'border-gray-300 focus-within:border-primary-500'}`}>
                      <div className="flex items-center px-3 py-2.5 bg-[var(--color-primary)] text-white text-sm font-medium rounded-l-lg">
                        <Phone className="w-4 h-4 mr-1" />
                        {phonePrefix}
                      </div>
                      <Input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 9); setPhoneNumber(v); setPhoneError(''); }}
                        placeholder="771234567"
                        maxLength={9}
                        className="border-0 rounded-r-lg text-base py-2.5 focus-visible:ring-0"
                      />
                    </div>
                    {phoneError && <p className="text-red-600 text-sm">{phoneError}</p>}
                    <div className="flex gap-2 flex-wrap">
                      <Button type="button" variant={phonePrefix === '+221' ? 'default' : 'outline'} size="sm" onClick={() => { setPhonePrefix('+221'); setPhoneError(''); }} className={phonePrefix === '+221' ? 'bg-green-600 hover:bg-green-700' : ''}>🇸🇳 +221</Button>
                      <Button type="button" variant={phonePrefix === '+242' ? 'default' : 'outline'} size="sm" onClick={() => { setPhonePrefix('+242'); setPhoneError(''); }} className={phonePrefix === '+242' ? 'bg-amber-500 hover:bg-amber-600' : ''}>🇨🇬 +242</Button>
                    </div>
                    <p className="text-xs text-gray-500">Format: 9 chiffres</p>
                    <Button type="submit" className="w-full bg-primary-500 hover:bg-primary-600">
                      <Search className="w-4 h-4 mr-2" />
                      Rechercher
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleAccessCodeSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="modalAccessCode" className="text-sm font-medium">Code d'accès (8 caractères)</Label>
                      <Input
                        id="modalAccessCode"
                        type="text"
                        value={accessCode}
                        onChange={(e) => { const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8); setAccessCode(v); setAccessCodeError(''); }}
                        placeholder="A1B2C3D4"
                        maxLength={8}
                        className={`text-center text-lg font-mono tracking-widest ${accessCodeError ? 'border-red-500' : ''}`}
                      />
                      {accessCodeError && <p className="text-red-600 text-sm">{accessCodeError}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowAccessCodeForm(false); setAccessCode(''); setAccessCodeError(''); }}>Retour</Button>
                      <Button type="submit" className="flex-1 bg-primary-500 hover:bg-primary-600">Vérifier</Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pourquoi choisir AIBD */}
        {!hasSearchParams && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="relative mb-14 sm:mb-16"
          >
            <h2 className="text-base sm:text-lg font-bold text-[var(--color-text)] mb-2 text-center">Pourquoi choisir AIBD ?</h2>
            <p className="text-xs text-[var(--color-text-muted)] text-center mb-6">Service professionnel vers l'aéroport</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 w-full">
              <div className="flex items-start gap-4 p-5 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] hover:border-[var(--color-primary-border)] transition-colors">
                <div className="shrink-0 w-11 h-11 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center">
                  <Car className="w-5 h-5 text-[var(--color-primary)]" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">Transport fiable</h3>
                  <p className="text-xs text-[var(--color-text-muted)] leading-snug mt-1">Chauffeurs vérifiés pour votre sécurité</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] hover:border-[var(--color-primary-border)] transition-colors">
                <div className="shrink-0 w-11 h-11 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-[var(--color-primary)]" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">Suivi en temps réel</h3>
                  <p className="text-xs text-[var(--color-text-muted)] leading-snug mt-1">Suivez votre chauffeur sur la carte</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] hover:border-[var(--color-primary-border)] transition-colors">
                <div className="shrink-0 w-11 h-11 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[var(--color-primary)]" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">Tarifs transparents</h3>
                  <p className="text-xs text-[var(--color-text-muted)] leading-snug mt-1">Prix fixes avant réservation</p>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </main>

    </div>
  );
}

export default HomePage;
