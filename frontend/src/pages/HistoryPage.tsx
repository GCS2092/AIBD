import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, MapPin, Calendar, Car, RefreshCw, Phone, Mail, User, X, Navigation, Plane, Clock, CheckCircle2, Key, Shield, ArrowRight } from 'lucide-react';
import { rideService, Ride } from '../services/rideService';
import Pagination from '../components/Pagination';
import NavigationBar from '../components/NavigationBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import './HistoryPage.css';

function HistoryPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [searchParams, setSearchParams] = useState<{
    phone?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    accessCode?: string;
  }>({});
  const [phonePrefix, setPhonePrefix] = useState<string>('+221');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [accessCode, setAccessCode] = useState<string>('');
  const [accessCodeError, setAccessCodeError] = useState<string>('');
  const [showAccessCodeForm, setShowAccessCodeForm] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Empêcher le zoom automatique sur mobile
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
        if (window.innerWidth <= 768) {
          const input = target as HTMLInputElement;
          if (input.style.fontSize === '' || parseFloat(input.style.fontSize) < 16) {
            input.style.fontSize = '16px';
          }
        }
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'SELECT') {
          e.preventDefault();
          const form = target.closest('form');
          if (form) {
            const inputs = Array.from(form.querySelectorAll('input, select, textarea')) as HTMLElement[];
            const currentIndex = inputs.indexOf(target);
            if (currentIndex < inputs.length - 1) {
              const nextInput = inputs[currentIndex + 1];
              nextInput.focus();
              nextInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
              form.requestSubmit();
            }
          }
        }
      }
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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

  const hasSearchParams = !!(searchParams.phone || searchParams.email || searchParams.firstName || searchParams.lastName) && !!searchParams.accessCode;

  const { data: ridesData, isLoading, refetch } = useQuery({
    queryKey: ['my-rides', searchParams, page],
    queryFn: () => rideService.getMyRides(
      page,
      pageSize,
      searchParams.phone,
      searchParams.email,
      searchParams.firstName,
      searchParams.lastName,
      searchParams.accessCode
    ),
    enabled: hasSearchParams,
    refetchInterval: 20000,
  });

  const rides = ridesData?.data || [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params: any = {};
    
    if (phoneNumber.trim()) {
      const cleanNumber = phoneNumber.replace(/\s|-|\./g, '');
      if (cleanNumber.length === 9) {
        params.phone = phonePrefix + cleanNumber;
        localStorage.setItem('clientPhone', params.phone);
      }
    }
    if (email.trim()) params.email = email.trim();
    if (firstName.trim()) params.firstName = firstName.trim();
    if (lastName.trim()) params.lastName = lastName.trim();
    
    if (Object.keys(params).length > 0) {
      setSearchParams(params);
      setShowAccessCodeForm(true);
    } else {
      alert('Veuillez remplir au moins un champ de recherche');
    }
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

      <main className="relative max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-8 sm:py-12">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 sm:mb-8"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white/10 backdrop-blur-lg rounded-2xl border-2 border-white/20 shadow-2xl mb-3 sm:mb-4">
            <Search className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 text-white px-2">Historique des courses</h1>
          <p className="text-sm sm:text-base text-gray-300 px-4">Consultez toutes vos réservations</p>
        </motion.header>

        {!hasSearchParams ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-white border-gray-200 shadow-2xl max-w-2xl mx-auto">
              <CardHeader className="px-4 sm:px-6">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gray-900 rounded-full mb-3 sm:mb-4 mx-auto">
                  {!showAccessCodeForm ? <Search className="w-6 h-6 sm:w-8 sm:h-8 text-white" /> : <Key className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
                </div>
                <CardTitle className="text-xl sm:text-2xl text-center text-gray-900">
                  {!showAccessCodeForm ? 'Rechercher mon historique' : 'Code d\'accès requis'}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-center text-gray-600">
                  {!showAccessCodeForm 
                    ? 'Recherchez vos courses par téléphone, email, nom ou prénom'
                    : 'Entrez le code d\'accès unique que vous avez reçu lors de votre réservation'}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                {!showAccessCodeForm ? (
                  <form ref={formRef} onSubmit={handleSearchSubmit} className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-900 font-semibold flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Téléphone
                    </Label>
                    <div className="flex gap-2">
                      <select
                        value={phonePrefix}
                        onChange={(e) => setPhonePrefix(e.target.value)}
                        className="w-32 h-10 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 transition-all duration-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 focus:shadow-md focus:outline-none hover:border-gray-400"
                      >
                        <option value="+221">🇸🇳 +221</option>
                        <option value="+242">🇨🇬 +242</option>
                      </select>
                      <Input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 9) {
                            setPhoneNumber(value);
                          }
                        }}
                        placeholder="771234567"
                        maxLength={9}
                        className="flex-1 bg-gray-50 border-gray-300 text-gray-900 transition-all duration-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 focus:shadow-md hover:border-gray-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-900 font-semibold flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email <span className="text-gray-500 font-normal text-xs">(optionnel)</span>
                    </Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.com (optionnel)"
                      className="bg-gray-50 border-gray-300 text-gray-900 transition-all duration-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 focus:shadow-md hover:border-gray-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-900 font-semibold flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Prénom
                      </Label>
                      <Input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Prénom"
                        className="bg-gray-50 border-gray-300 text-gray-900 transition-all duration-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 focus:shadow-md hover:border-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-900 font-semibold flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Nom
                      </Label>
                      <Input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Nom"
                        className="bg-gray-50 border-gray-300 text-gray-900 transition-all duration-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 focus:shadow-md hover:border-gray-400"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full bg-gray-900 text-white hover:bg-gray-800 text-base sm:text-lg font-semibold py-4 sm:py-6 shadow-xl"
                  >
                    <Search className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Rechercher mes courses</span>
                    <span className="sm:hidden">Rechercher</span>
                  </Button>
                </form>
                ) : (
                  <form ref={formRef} onSubmit={handleAccessCodeSubmit} className="space-y-4 sm:space-y-6">
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
                        className="flex-1 bg-gray-900 text-white hover:bg-gray-800 text-base sm:text-lg font-semibold py-4 sm:py-6 shadow-xl"
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
        ) : (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-white">Mes Courses</h2>
                <p className="text-sm sm:text-base text-gray-300">Historique complet de vos réservations</p>
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setSearchParams({});
                  setPhoneNumber('');
                  setEmail('');
                  setFirstName('');
                  setLastName('');
                  setAccessCode('');
                  setShowAccessCodeForm(false);
                  localStorage.removeItem('clientPhone');
                }}
                className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm"
              >
                <RefreshCw className="mr-2 w-5 h-5" />
                Nouvelle recherche
              </Button>
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
                <p className="text-lg text-gray-300">Chargement de l'historique...</p>
              </div>
            ) : rides && rides.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  {rides.map((ride: Ride, index: number) => (
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
                          {ride.completedAt && (
                            <div className="flex items-center gap-2 text-xs text-gray-600 pt-2 border-t border-gray-100">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span>Terminée le: {new Date(ride.completedAt).toLocaleString('fr-FR')}</span>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="flex gap-2 pt-0">
                          {(ride.status === 'pending' || 
                            ride.status === 'assigned' || 
                            ride.status === 'accepted' || 
                            ride.status === 'in_progress') && (
                            <Button
                              asChild
                              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-semibold shadow-lg"
                            >
                              <Link to={`/track/${ride.id}`} className="flex items-center justify-center">
                                <MapPin className="mr-2 w-4 h-4" />
                                Suivre la course
                              </Link>
                            </Button>
                          )}
                          {ride.status === 'completed' && (
                            <Button
                              asChild
                              variant="outline"
                              className="flex-1 border-gray-300 text-gray-900 hover:bg-gray-100"
                            >
                              <Link to={`/track/${ride.id}`} className="flex items-center justify-center">
                                Voir les détails
                              </Link>
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </div>
                {ridesData && (
                  <div className="mb-6">
                    <Pagination
                      currentPage={page}
                      totalPages={ridesData.totalPages}
                      onPageChange={setPage}
                      hasNextPage={ridesData.hasNextPage}
                      hasPreviousPage={ridesData.hasPreviousPage}
                    />
                  </div>
                )}
                <p className="text-center text-white/80 text-sm">
                  Affichage de <strong>{rides.length}</strong> course(s) sur <strong>{ridesData?.total || 0}</strong> course(s) totale(s)
                </p>
              </>
            ) : (
              <Card className="bg-white border-gray-200 shadow-2xl text-center py-16">
                <CardContent>
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                    <Search className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Aucune course trouvée</h3>
                  <p className="text-gray-600 mb-6">Aucune course dans l'historique pour ces critères de recherche.</p>
                  <Button asChild size="lg" className="bg-gray-900 hover:bg-gray-800 text-white font-semibold shadow-lg">
                    <Link to="/book" className="flex items-center">
                      Réserver votre première course
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.section>
        )}
      </main>
    </div>
  );
}

export default HistoryPage;
