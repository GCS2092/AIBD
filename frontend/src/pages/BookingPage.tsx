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
import { Card, CardContent } from '@/components/ui/card';
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
  const [step, setStep] = useState<1 | 2>(1);

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
    tripType: 'aller_retour' | 'aller_simple' | 'retour_simple';
    pickupCountry: string;
    pickupCity: string;
    pickupQuartier: string;
    dropoffCountry: string;
    dropoffCity: string;
    dropoffQuartier: string;
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
    tripType: 'aller_simple',
    pickupCountry: 'Sénégal',
    pickupCity: '',
    pickupQuartier: '',
    dropoffCountry: 'Sénégal',
    dropoffCity: '',
    dropoffQuartier: '',
    flightNumber: '',
    numberOfPassengers: 1,
    numberOfBags: 0,
    specialRequests: '',
  });

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.pickupAddress?.trim()) newErrors.pickupAddress = 'Adresse de départ requise';
    if (formData.tripType !== 'aller_simple' && !formData.dropoffAddress?.trim()) {
      newErrors.dropoffAddress = 'Adresse de destination requise';
    }
    if (!formData.scheduledAt) newErrors.scheduledAt = 'Date et heure requises';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.pickupAddress?.trim()) newErrors.pickupAddress = 'Adresse de départ requise';
    if (formData.tripType !== 'aller_simple' && !formData.dropoffAddress?.trim()) {
      newErrors.dropoffAddress = 'Adresse de destination requise';
    }
    if (!formData.scheduledAt) newErrors.scheduledAt = 'Date et heure requises';
    if (!formData.clientFirstName?.trim()) newErrors.clientFirstName = 'Prénom requis';
    if (!formData.clientLastName?.trim()) newErrors.clientLastName = 'Nom requis';
    if (!phoneNumber || phoneNumber.trim() === '') {
      newErrors.phoneNumber = 'Téléphone requis';
    } else {
      const cleanNumber = phoneNumber.replace(/\s/g, '').replace(/\D/g, '');
      if (cleanNumber.length !== 9) newErrors.phoneNumber = '9 chiffres requis';
    }
    if (formData.clientEmail?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      newErrors.clientEmail = 'Email invalide';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const first = Object.keys(newErrors)[0];
      setTimeout(() => {
        const el = document.querySelector(`[name="${first}"]`) || document.querySelector(`[data-field="${first}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!validateForm()) return;

    const cleanNumber = phoneNumber.replace(/\s/g, '').replace(/\D/g, '');
    const fullPhone = phonePrefix + cleanNumber;
    let finalDropoffAddress = formData.dropoffAddress;
    if (formData.tripType === 'aller_simple' && !finalDropoffAddress?.trim()) {
      finalDropoffAddress = 'Aéroport International Blaise Diagne (AIBD)';
    }
    const submitData = {
      ...formData,
      clientPhone: fullPhone,
      clientEmail: formData.clientEmail?.trim() || undefined,
      dropoffAddress: finalDropoffAddress,
      tripType: formData.tripType,
      pickupCountry: formData.pickupCountry?.trim() || undefined,
      pickupCity: formData.pickupCity?.trim() || undefined,
      pickupQuartier: formData.pickupQuartier?.trim() || undefined,
      dropoffCountry: formData.dropoffCountry?.trim() || undefined,
      dropoffCity: formData.dropoffCity?.trim() || undefined,
      dropoffQuartier: formData.dropoffQuartier?.trim() || undefined,
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
    const byTripType: Record<string, number> = {
      aller_retour: 25000,
      aller_simple: 20000,
      retour_simple: 20000,
    };
    if (byTripType[formData.tripType] != null) return byTripType[formData.tripType];
    if (pricing?.length) {
      const p = pricing.find((x: any) => x.tripType === formData.tripType && x.isActive);
      if (p) return parseFloat(p.price?.toString() || '0');
    }
    return 20000;
  };

  const inputClass = (field: string) =>
    `bg-gray-50 border text-gray-900 rounded-md h-10 px-3 py-2 w-full transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] ${errors[field] ? 'border-red-500' : 'border-gray-300'}`;

  return (
    <div className="min-h-screen bg-[var(--color-page-bg)] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[var(--color-primary)] opacity-[0.06] rounded-full blur-3xl" />
      </div>

      <NavigationBar />

      <main className="relative w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-24">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--color-primary-light)] border border-[var(--color-primary-border)] mb-3">
            <Plane className="w-7 h-7 text-[var(--color-primary)]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">{t('booking.title')}</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {step === 1 ? 'Où et quand ?' : 'Vos coordonnées'}
          </p>
        </motion.header>

        {/* Indicateur d'étapes */}
        <div className="flex justify-center gap-2 mb-6">
          <span className={`h-1.5 rounded-full w-12 transition-colors ${step === 1 ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`} />
          <span className={`h-1.5 rounded-full w-12 transition-colors ${step === 2 ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`} />
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: step === 2 ? 12 : -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Card className="bg-[var(--color-surface-elevated)] border-[var(--color-border)] shadow-md">
            <CardContent className="p-4 sm:p-6">
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {submitError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                    <X className="w-4 h-4 flex-shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {step === 1 && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-[var(--color-text)] font-medium flex items-center gap-2">
                        Type de course
                      </Label>
                      <select
                        value={formData.tripType}
                        onChange={(e) => {
                          const v = e.target.value as 'aller_retour' | 'aller_simple' | 'retour_simple';
                          setFormData({
                            ...formData,
                            tripType: v,
                            dropoffAddress: v === 'aller_simple' ? 'Aéroport International Blaise Diagne (AIBD)' : formData.dropoffAddress,
                          });
                        }}
                        className={inputClass('tripType')}
                      >
                        <option value="aller_simple">Aller simple — 20 000 FCFA</option>
                        <option value="retour_simple">Retour simple — 20 000 FCFA</option>
                        <option value="aller_retour">Aller retour — 25 000 FCFA</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[var(--color-text)] font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Lieu de prise en charge
                      </Label>
                      <Input
                        name="pickupAddress"
                        data-field="pickupAddress"
                        value={formData.pickupAddress}
                        onChange={(e) => { setFormData({ ...formData, pickupAddress: e.target.value }); setErrors(prev => ({ ...prev, pickupAddress: '' })); }}
                        placeholder="Adresse de départ"
                        className={inputClass('pickupAddress')}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Input
                          placeholder="Pays"
                          value={formData.pickupCountry}
                          onChange={(e) => setFormData({ ...formData, pickupCountry: e.target.value })}
                          className="bg-gray-50 border border-gray-300 rounded-md h-10 px-3 py-2 text-gray-900"
                        />
                        <Input
                          placeholder="Ville"
                          value={formData.pickupCity}
                          onChange={(e) => setFormData({ ...formData, pickupCity: e.target.value })}
                          className="bg-gray-50 border border-gray-300 rounded-md h-10 px-3 py-2 text-gray-900"
                        />
                        <Input
                          placeholder="Quartier"
                          value={formData.pickupQuartier}
                          onChange={(e) => setFormData({ ...formData, pickupQuartier: e.target.value })}
                          className="bg-gray-50 border border-gray-300 rounded-md h-10 px-3 py-2 text-gray-900"
                        />
                      </div>
                      {errors.pickupAddress && <span className="text-red-600 text-sm">{errors.pickupAddress}</span>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[var(--color-text)] font-medium flex items-center gap-2">
                        <Plane className="w-4 h-4" /> Lieu de destination
                      </Label>
                      {(formData.tripType === 'retour_simple' || formData.tripType === 'aller_retour') && (
                        <Input
                          name="dropoffAddress"
                          data-field="dropoffAddress"
                          value={formData.dropoffAddress}
                          onChange={(e) => { setFormData({ ...formData, dropoffAddress: e.target.value }); setErrors(prev => ({ ...prev, dropoffAddress: '' })); }}
                          placeholder="Adresse de destination"
                          className={inputClass('dropoffAddress')}
                        />
                      )}
                      {formData.tripType === 'aller_simple' && (
                        <>
                          <Input
                            type="text"
                            value="Aéroport International Blaise Diagne (AIBD)"
                            readOnly
                            className="bg-gray-100 border border-gray-300 rounded-md h-10 px-3 py-2 w-full text-gray-600"
                          />
                          <Input
                            type="text"
                            value={formData.flightNumber}
                            onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value })}
                            placeholder="Numéro de vol (optionnel)"
                            className="bg-gray-50 border border-gray-300 rounded-md h-10 px-3 py-2 w-full text-gray-900"
                          />
                        </>
                      )}
                      {(formData.tripType === 'retour_simple' || formData.tripType === 'aller_retour') && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <Input
                            placeholder="Pays"
                            value={formData.dropoffCountry}
                            onChange={(e) => setFormData({ ...formData, dropoffCountry: e.target.value })}
                            className="bg-gray-50 border border-gray-300 rounded-md h-10 px-3 py-2 text-gray-900"
                          />
                          <Input
                            placeholder="Ville"
                            value={formData.dropoffCity}
                            onChange={(e) => setFormData({ ...formData, dropoffCity: e.target.value })}
                            className="bg-gray-50 border border-gray-300 rounded-md h-10 px-3 py-2 text-gray-900"
                          />
                          <Input
                            placeholder="Quartier"
                            value={formData.dropoffQuartier}
                            onChange={(e) => setFormData({ ...formData, dropoffQuartier: e.target.value })}
                            className="bg-gray-50 border border-gray-300 rounded-md h-10 px-3 py-2 text-gray-900"
                          />
                        </div>
                      )}
                      {formData.tripType === 'aller_simple' && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <Input value="Sénégal" readOnly className="bg-gray-100 border border-gray-300 rounded-md h-10 px-3 py-2 text-gray-600" />
                          <Input value="Diamniadio" readOnly className="bg-gray-100 border border-gray-300 rounded-md h-10 px-3 py-2 text-gray-600" />
                          <Input value="AIBD" readOnly className="bg-gray-100 border border-gray-300 rounded-md h-10 px-3 py-2 text-gray-600" />
                        </div>
                      )}
                      {errors.dropoffAddress && <span className="text-red-600 text-sm">{errors.dropoffAddress}</span>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[var(--color-text)] font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> {t('booking.date')}
                      </Label>
                      <Input
                        name="scheduledAt"
                        data-field="scheduledAt"
                        type="datetime-local"
                        value={formData.scheduledAt}
                        onChange={(e) => { setFormData({ ...formData, scheduledAt: e.target.value }); setErrors(prev => ({ ...prev, scheduledAt: '' })); }}
                        className={inputClass('scheduledAt')}
                      />
                      {errors.scheduledAt && <span className="text-red-600 text-sm">{errors.scheduledAt}</span>}
                    </div>

                      <Button
                        type="button"
                        size="lg"
                        className="w-full bg-[var(--color-primary)] text-white hover:opacity-90 py-5 font-semibold"
                        onClick={() => {
                          if (!validateStep1()) return;
                          if (formData.tripType === 'aller_simple' && !formData.dropoffAddress?.trim()) {
                            setFormData(prev => ({ ...prev, dropoffAddress: 'Aéroport International Blaise Diagne (AIBD)' }));
                          }
                          setStep(2);
                        }}
                      >
                      Suivant <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-[var(--color-text)] font-medium flex items-center gap-1"><User className="w-3.5 h-3.5" /> Prénom</Label>
                        <Input
                          name="clientFirstName"
                          data-field="clientFirstName"
                          value={formData.clientFirstName}
                          onChange={(e) => { setFormData({ ...formData, clientFirstName: e.target.value }); setErrors(prev => ({ ...prev, clientFirstName: '' })); }}
                          placeholder="Prénom"
                          className={inputClass('clientFirstName')}
                        />
                        {errors.clientFirstName && <span className="text-red-600 text-xs">{errors.clientFirstName}</span>}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[var(--color-text)] font-medium flex items-center gap-1"><User className="w-3.5 h-3.5" /> Nom</Label>
                        <Input
                          name="clientLastName"
                          data-field="clientLastName"
                          value={formData.clientLastName}
                          onChange={(e) => { setFormData({ ...formData, clientLastName: e.target.value }); setErrors(prev => ({ ...prev, clientLastName: '' })); }}
                          placeholder="Nom"
                          className={inputClass('clientLastName')}
                        />
                        {errors.clientLastName && <span className="text-red-600 text-xs">{errors.clientLastName}</span>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[var(--color-text)] font-medium flex items-center gap-2"><Phone className="w-4 h-4" /> Téléphone</Label>
                      <div className="flex gap-2">
                        <select
                          value={phonePrefix}
                          onChange={(e) => setPhonePrefix(e.target.value)}
                          className="w-28 h-10 rounded-md border border-gray-300 bg-gray-50 px-2 text-gray-900 text-sm"
                        >
                          <option value="+221">🇸🇳 +221</option>
                          <option value="+242">🇨🇬 +242</option>
                        </select>
                        <Input
                          name="phoneNumber"
                          data-field="phoneNumber"
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, '').slice(0, 9);
                            setPhoneNumber(v);
                            if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: '' }));
                          }}
                          placeholder={phonePrefix === '+221' ? '771234567' : '061234567'}
                          maxLength={9}
                          className={`flex-1 ${inputClass('phoneNumber')}`}
                        />
                      </div>
                      {errors.phoneNumber && <span className="text-red-600 text-sm">{errors.phoneNumber}</span>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[var(--color-text)] font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4" /> Email <span className="text-[var(--color-text-muted)] font-normal text-xs">(optionnel)</span>
                      </Label>
                      <Input
                        name="clientEmail"
                        data-field="clientEmail"
                        type="email"
                        value={formData.clientEmail}
                        onChange={(e) => { setFormData({ ...formData, clientEmail: e.target.value }); setErrors(prev => ({ ...prev, clientEmail: '' })); }}
                        placeholder="votre@email.com"
                        className={errors.clientEmail ? inputClass('clientEmail') : 'bg-gray-50 border border-gray-300 rounded-md h-10 px-3 py-2 w-full text-gray-900'}
                      />
                      {errors.clientEmail && <span className="text-red-600 text-sm">{errors.clientEmail}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-[var(--color-text)] font-medium flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Passagers</Label>
                        <Input
                          type="number"
                          min={1}
                          max={8}
                          value={formData.numberOfPassengers || 1}
                          onChange={(e) => setFormData({ ...formData, numberOfPassengers: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="bg-gray-50 border border-gray-300 rounded-md h-10 px-3 py-2 text-gray-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[var(--color-text)] font-medium flex items-center gap-1"><Luggage className="w-3.5 h-3.5" /> Bagages</Label>
                        <Input
                          type="number"
                          min={0}
                          value={formData.numberOfBags ?? 0}
                          onChange={(e) => setFormData({ ...formData, numberOfBags: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="bg-gray-50 border border-gray-300 rounded-md h-10 px-3 py-2 text-gray-900"
                        />
                      </div>
                    </div>

                    <div className="bg-[var(--color-primary-light)] rounded-lg p-4 border border-[var(--color-primary-border)]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[var(--color-text)]">Prix</span>
                        <span className="text-xl font-bold text-[var(--color-primary)]">{calculatePrice().toLocaleString()} FCFA</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="flex-1 border-[var(--color-border)] text-[var(--color-text)]"
                        onClick={() => setStep(1)}
                      >
                        Retour
                      </Button>
                      <Button
                        type="submit"
                        size="lg"
                        disabled={isPending}
                        className="flex-1 bg-[var(--color-primary)] text-white hover:opacity-90 py-5 font-semibold"
                      >
                        {isPending ? (
                          <>
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Clock className="w-5 h-5 inline mr-1" /></motion.div>
                            {t('common.loading')}
                          </>
                        ) : (
                          <>{t('booking.book')} <ArrowRight className="ml-1 w-4 h-4" /></>
                        )}
                      </Button>
                    </div>
                  </>
                )}
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
