import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MapPin, Calendar, User, Phone, Mail, Users, Luggage, Plane, Clock, ArrowRight, X } from 'lucide-react';
import { useCreateRide } from '../hooks/useRide';
import { usePricing } from '../hooks/usePricing';
import NavigationBar from '../components/NavigationBar';
import AccessCodeModal from '../components/AccessCodeModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import './BookingPage.css';

function BookingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutate: createRide, isPending } = useCreateRide();
  const { data: pricing } = usePricing();
  const formRef = useRef<HTMLFormElement>(null);

  const [phonePrefix, setPhonePrefix] = useState<string>('+221');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');
  const [showAccessCodeModal, setShowAccessCodeModal] = useState(false);
  const [accessCode, setAccessCode] = useState<string>('');
  const [rideId, setRideId] = useState<string>('');

  // Empêcher le zoom automatique sur mobile
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
        // Désactiver le zoom en forçant la taille de police à 16px minimum
        if (window.innerWidth <= 768) {
          const input = target as HTMLInputElement;
          if (input.style.fontSize === '' || parseFloat(input.style.fontSize) < 16) {
            input.style.fontSize = '16px';
          }
        }
        // Scroll smooth vers le champ
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
              // Dernier champ, soumettre le formulaire
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

  const [formData, setFormData] = useState<{
    clientFirstName: string;
    clientLastName: string;
    clientPhone: string;
    clientEmail: string;
    pickupAddress: string;
    dropoffAddress: string;
    scheduledAt: string;
    rideType: 'city_to_airport' | 'airport_to_city' | 'city_to_city';
    flightNumber: string;
    numberOfPassengers: number;
    numberOfBags: number;
    specialRequests: string;
  }>({
    clientFirstName: '',
    clientLastName: '',
    clientPhone: '',
    clientEmail: '',
    pickupAddress: '',
    dropoffAddress: '',
    scheduledAt: '',
    rideType: 'city_to_airport',
    flightNumber: '',
    numberOfPassengers: 1,
    numberOfBags: 0,
    specialRequests: '',
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.pickupAddress?.trim()) {
      newErrors.pickupAddress = 'Veuillez entrer une adresse de départ';
    }

    if (formData.rideType === 'city_to_airport') {
      if (!formData.dropoffAddress?.trim()) {
        formData.dropoffAddress = 'Aéroport International Blaise Diagne (AIBD)';
      }
    } else if (!formData.dropoffAddress?.trim()) {
      newErrors.dropoffAddress = 'Veuillez entrer une adresse de destination';
    }

    if (!formData.scheduledAt) {
      newErrors.scheduledAt = 'Veuillez sélectionner une date et heure';
    }

    if (!formData.clientFirstName?.trim()) {
      newErrors.clientFirstName = 'Veuillez entrer votre prénom';
    }

    if (!formData.clientLastName?.trim()) {
      newErrors.clientLastName = 'Veuillez entrer votre nom';
    }

    if (!phoneNumber || phoneNumber.trim() === '') {
      newErrors.phoneNumber = 'Veuillez entrer un numéro de téléphone';
    } else {
      const cleanNumber = phoneNumber.replace(/\s/g, '').replace(/\D/g, '');
      if (cleanNumber.length !== 9) {
        newErrors.phoneNumber = 'Le numéro de téléphone doit contenir 9 chiffres';
      }
    }

    // Email est optionnel, mais s'il est fourni, il doit être valide
    if (formData.clientEmail?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      newErrors.clientEmail = 'Veuillez entrer un email valide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    
    if (!validateForm()) {
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`) || 
                       document.querySelector(`[data-field="${firstErrorField}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const cleanNumber = phoneNumber.replace(/\s/g, '').replace(/\D/g, '');
    const fullPhone = phonePrefix + cleanNumber;
    
    const rideTypeMap: Record<string, 'dakar_to_airport' | 'airport_to_dakar'> = {
      'city_to_airport': 'dakar_to_airport',
      'airport_to_city': 'airport_to_dakar',
      'city_to_city': 'dakar_to_airport',
    };
    
    const mappedRideType = rideTypeMap[formData.rideType] || 'dakar_to_airport';
    
    let finalDropoffAddress = formData.dropoffAddress;
    if (formData.rideType === 'city_to_airport' && !finalDropoffAddress?.trim()) {
      finalDropoffAddress = 'Aéroport International Blaise Diagne (AIBD)';
    }
    
    const submitData: any = {
      ...formData,
      clientPhone: fullPhone,
      clientEmail: formData.clientEmail?.trim() || undefined, // Email optionnel, envoyer undefined si non fourni
      dropoffAddress: finalDropoffAddress,
      rideType: mappedRideType,
    };

    createRide(submitData, {
      onSuccess: (ride) => {
        // Sauvegarder le code d'accès dans localStorage pour l'afficher dans la barre de navigation
        if (ride.accessCode) {
          try {
            console.log('💾 Sauvegarde du code d\'accès dans localStorage:', ride.accessCode);
            localStorage.setItem('activeAccessCode', ride.accessCode);
            // Déclencher un événement personnalisé pour mettre à jour la navigation immédiatement
            const event = new CustomEvent('activeAccessCodeUpdated');
            window.dispatchEvent(event);
            console.log('📢 Événement activeAccessCodeUpdated déclenché');
          } catch (error) {
            // localStorage peut être indisponible (mode privé, désactivé, etc.)
            // Ce n'est pas critique : le code est affiché dans la modal et l'utilisateur peut toujours rechercher
            console.warn('Impossible de sauvegarder le code dans localStorage:', error);
          }
          setAccessCode(ride.accessCode);
          setRideId(ride.id);
          setShowAccessCodeModal(true);
        } else {
          // Si pas de code, rediriger directement
          navigate(`/track/${ride.id}`);
        }
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.message || error?.message || 'Erreur lors de la réservation';
        setSubmitError(errorMessage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  };

  const calculatePrice = () => {
    if (!pricing || pricing.length === 0) return 0;
    
    const rideTypeMap: Record<string, 'dakar_to_airport' | 'airport_to_dakar'> = {
      'city_to_airport': 'dakar_to_airport',
      'airport_to_city': 'airport_to_dakar',
      'city_to_city': 'dakar_to_airport',
    };
    
    const mappedRideType = rideTypeMap[formData.rideType] || 'dakar_to_airport';
    
    const priceConfig = pricing.find((p) => 
      p.rideType === mappedRideType && 
      p.isActive &&
      p.type === 'standard'
    ) || pricing.find((p) => 
      p.rideType === mappedRideType && 
      p.isActive
    ) || pricing.find((p) => p.rideType === mappedRideType);
    
    if (!priceConfig) return 0;
    
    let price = parseFloat(priceConfig.price?.toString() || '0');
    return price;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-700/20 rounded-full blur-3xl"></div>
      </div>

      <NavigationBar />

      <main className="relative max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-8 sm:py-12">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 sm:mb-8"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white/10 backdrop-blur-lg rounded-2xl border-2 border-white/20 shadow-2xl mb-3 sm:mb-4">
            <Plane className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 text-white px-2">{t('booking.title')}</h1>
          <p className="text-sm sm:text-base text-gray-300 px-4">Réservez votre transport vers l'aéroport</p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-white border-gray-200 shadow-2xl">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-xl sm:text-2xl text-gray-900">Informations de réservation</CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600">Remplissez tous les champs pour réserver votre course</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {submitError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200"
                  >
                    <X className="w-4 h-4 flex-shrink-0" />
                    <span>{submitError}</span>
                  </motion.div>
                )}

                {/* Adresse de départ */}
                <div className="space-y-2">
                  <Label htmlFor="pickupAddress" className="text-gray-900 font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {t('booking.from')}
                  </Label>
                  <Input
                    id="pickupAddress"
                    name="pickupAddress"
                    data-field="pickupAddress"
                    type="text"
                    value={formData.pickupAddress}
                    onChange={(e) => {
                      setFormData({ ...formData, pickupAddress: e.target.value });
                      if (errors.pickupAddress) {
                        setErrors(prev => ({ ...prev, pickupAddress: '' }));
                      }
                    }}
                    required
                    placeholder="Adresse de départ"
                    className={`bg-gray-50 border-gray-300 text-gray-900 transition-all duration-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 focus:shadow-md hover:border-gray-400 ${errors.pickupAddress ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : ''}`}
                  />
                  {errors.pickupAddress && <span className="text-red-600 text-sm">{errors.pickupAddress}</span>}
                </div>

                {/* Type de trajet et destination */}
                <div className="space-y-2">
                  <Label htmlFor="rideType" className="text-gray-900 font-semibold flex items-center gap-2">
                    <Plane className="w-4 h-4" />
                    {t('booking.to')}
                  </Label>
                  <select
                    id="rideType"
                    value={formData.rideType}
                    onChange={(e) => {
                      const newRideType = e.target.value as 'city_to_airport' | 'airport_to_city' | 'city_to_city';
                      const updates: any = { rideType: newRideType };
                      if (newRideType === 'city_to_airport') {
                        updates.dropoffAddress = 'Aéroport International Blaise Diagne (AIBD)';
                      } else if (formData.rideType === 'city_to_airport') {
                        updates.dropoffAddress = '';
                      }
                      setFormData({ ...formData, ...updates });
                    }}
                    required
                    className="w-full h-10 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 transition-all duration-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 focus:shadow-md focus:outline-none hover:border-gray-400"
                  >
                    <option value="city_to_airport">Ville → Aéroport</option>
                    <option value="airport_to_city">Aéroport → Ville</option>
                    <option value="city_to_city">Ville → Ville</option>
                  </select>
                  
                  {(formData.rideType === 'airport_to_city' || formData.rideType === 'city_to_city') && (
                    <div className="space-y-2">
                      <Input
                        name="dropoffAddress"
                        data-field="dropoffAddress"
                        type="text"
                        value={formData.dropoffAddress}
                        onChange={(e) => {
                          setFormData({ ...formData, dropoffAddress: e.target.value });
                          if (errors.dropoffAddress) {
                            setErrors(prev => ({ ...prev, dropoffAddress: '' }));
                          }
                        }}
                        placeholder="Adresse de destination"
                        required
                        className={`bg-gray-50 border-gray-300 text-gray-900 transition-all duration-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 focus:shadow-md hover:border-gray-400 ${errors.dropoffAddress ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : ''}`}
                      />
                      {errors.dropoffAddress && <span className="text-red-600 text-sm">{errors.dropoffAddress}</span>}
                    </div>
                  )}
                  
                  {formData.rideType === 'city_to_airport' && (
                    <div className="space-y-2">
                      <Input
                        type="text"
                        value={formData.dropoffAddress || 'Aéroport International Blaise Diagne (AIBD)'}
                        onChange={(e) => setFormData({ ...formData, dropoffAddress: e.target.value || 'Aéroport International Blaise Diagne (AIBD)' })}
                        placeholder="Aéroport International Blaise Diagne (AIBD)"
                        className="bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed"
                        readOnly
                      />
                      <Input
                        type="text"
                        value={formData.flightNumber}
                        onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value })}
                        placeholder="Numéro de vol (optionnel)"
                        className="bg-gray-50 border-gray-300 text-gray-900 transition-all duration-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 focus:shadow-md hover:border-gray-400"
                      />
                    </div>
                  )}
                </div>

                {/* Date et heure */}
                <div className="space-y-2">
                  <Label htmlFor="scheduledAt" className="text-gray-900 font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {t('booking.date')}
                  </Label>
                  <Input
                    id="scheduledAt"
                    name="scheduledAt"
                    data-field="scheduledAt"
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => {
                      setFormData({ ...formData, scheduledAt: e.target.value });
                      if (errors.scheduledAt) {
                        setErrors(prev => ({ ...prev, scheduledAt: '' }));
                      }
                    }}
                    required
                        className={`bg-gray-50 border-gray-300 text-gray-900 transition-all duration-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 focus:shadow-md hover:border-gray-400 ${errors.scheduledAt ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : ''}`}
                  />
                  {errors.scheduledAt && <span className="text-red-600 text-sm">{errors.scheduledAt}</span>}
                </div>

                {/* Nom et prénom */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientFirstName" className="text-gray-900 font-semibold flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Prénom
                    </Label>
                    <Input
                      id="clientFirstName"
                      name="clientFirstName"
                      data-field="clientFirstName"
                      type="text"
                      value={formData.clientFirstName}
                      onChange={(e) => {
                        setFormData({ ...formData, clientFirstName: e.target.value });
                        if (errors.clientFirstName) {
                          setErrors(prev => ({ ...prev, clientFirstName: '' }));
                        }
                      }}
                      required
                      className={`bg-gray-50 border-gray-300 text-gray-900 transition-all duration-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 focus:shadow-md hover:border-gray-400 ${errors.clientFirstName ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : ''}`}
                    />
                    {errors.clientFirstName && <span className="text-red-600 text-sm">{errors.clientFirstName}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientLastName" className="text-gray-900 font-semibold flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Nom
                    </Label>
                    <Input
                      id="clientLastName"
                      name="clientLastName"
                      data-field="clientLastName"
                      type="text"
                      value={formData.clientLastName}
                      onChange={(e) => {
                        setFormData({ ...formData, clientLastName: e.target.value });
                        if (errors.clientLastName) {
                          setErrors(prev => ({ ...prev, clientLastName: '' }));
                        }
                      }}
                      required
                      className={`bg-gray-50 border-gray-300 text-gray-900 transition-all duration-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 focus:shadow-md hover:border-gray-400 ${errors.clientLastName ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : ''}`}
                    />
                    {errors.clientLastName && <span className="text-red-600 text-sm">{errors.clientLastName}</span>}
                  </div>
                </div>

                {/* Téléphone et Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-gray-900 font-semibold flex items-center gap-2">
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
                        id="phoneNumber"
                        name="phoneNumber"
                        data-field="phoneNumber"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 9) {
                            setPhoneNumber(value);
                            if (errors.phoneNumber) {
                              setErrors(prev => ({ ...prev, phoneNumber: '' }));
                            }
                          }
                        }}
                        required
                        placeholder={phonePrefix === '+221' ? '771234567' : '061234567'}
                        maxLength={9}
                        className={`flex-1 bg-gray-50 border-gray-300 text-gray-900 transition-all duration-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 focus:shadow-md hover:border-gray-400 ${errors.phoneNumber ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : ''}`}
                      />
                    </div>
                    {errors.phoneNumber && <span className="text-red-600 text-sm">{errors.phoneNumber}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail" className="text-gray-900 font-semibold flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email <span className="text-gray-500 font-normal text-xs">(optionnel)</span>
                    </Label>
                    <Input
                      id="clientEmail"
                      name="clientEmail"
                      data-field="clientEmail"
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => {
                        setFormData({ ...formData, clientEmail: e.target.value });
                        if (errors.clientEmail) {
                          setErrors(prev => ({ ...prev, clientEmail: '' }));
                        }
                      }}
                      placeholder="votre@email.com (optionnel)"
                      className={`bg-gray-50 border-gray-300 text-gray-900 transition-all duration-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 focus:shadow-md hover:border-gray-400 ${errors.clientEmail ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : ''}`}
                    />
                    {errors.clientEmail && <span className="text-red-600 text-sm">{errors.clientEmail}</span>}
                  </div>
                </div>

                {/* Passagers et bagages */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numberOfPassengers" className="text-gray-900 font-semibold flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {t('booking.passengers')}
                    </Label>
                    <Input
                      id="numberOfPassengers"
                      type="number"
                      min="1"
                      max="8"
                      value={formData.numberOfPassengers || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 1 : parseInt(e.target.value) || 1;
                        setFormData({ ...formData, numberOfPassengers: value });
                      }}
                      required
                      className="bg-gray-50 border-gray-300 text-gray-900 transition-all duration-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 focus:shadow-md hover:border-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numberOfBags" className="text-gray-900 font-semibold flex items-center gap-2">
                      <Luggage className="w-4 h-4" />
                      {t('booking.bags')}
                    </Label>
                    <Input
                      id="numberOfBags"
                      type="number"
                      min="0"
                      value={formData.numberOfBags || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                        setFormData({ ...formData, numberOfBags: value });
                      }}
                      required
                      className="bg-gray-50 border-gray-300 text-gray-900 transition-all duration-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 focus:shadow-md hover:border-gray-400"
                    />
                  </div>
                </div>

                {/* Prix */}
                <div className="bg-gray-100 rounded-lg p-3 sm:p-4 border-2 border-gray-300">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-base sm:text-lg font-semibold text-gray-900">Prix:</span>
                    <span className="text-xl sm:text-2xl font-bold text-gray-900">{calculatePrice().toLocaleString()} FCFA</span>
                  </div>
                </div>

                {/* Bouton de soumission */}
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={isPending}
                  className="w-full bg-gray-900 text-white hover:bg-gray-800 text-base sm:text-lg font-semibold py-4 sm:py-6 shadow-xl"
                >
                  {isPending ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="mr-2"
                      >
                        <Clock className="w-5 h-5" />
                      </motion.div>
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      {t('booking.book')}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Modal du code d'accès */}
      <AccessCodeModal
        isOpen={showAccessCodeModal}
        accessCode={accessCode}
        rideId={rideId}
        onClose={() => {
          setShowAccessCodeModal(false);
          if (rideId) {
            navigate(`/track/${rideId}`);
          }
        }}
      />
    </div>
  );
}

export default BookingPage;
