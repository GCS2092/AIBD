import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCreateRide } from '../hooks/useRide';
import { usePricing } from '../hooks/usePricing';
import NavigationBar from '../components/NavigationBar';
import './BookingPage.css';

function BookingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutate: createRide, isPending } = useCreateRide();
  const { data: pricing } = usePricing();

  const [phonePrefix, setPhonePrefix] = useState<string>('+221');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');

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

    // Pour "Ville → Aéroport", dropoffAddress doit avoir une valeur par défaut
    if (formData.rideType === 'city_to_airport') {
      // S'assurer que dropoffAddress a toujours une valeur pour ce type
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

    if (!formData.clientEmail?.trim()) {
      newErrors.clientEmail = 'Veuillez entrer votre email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      newErrors.clientEmail = 'Veuillez entrer un email valide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    
    if (!validateForm()) {
      // Scroll vers la première erreur
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`) || 
                       document.querySelector(`[data-field="${firstErrorField}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Nettoyer le numéro (supprimer les espaces et caractères non numériques)
    const cleanNumber = phoneNumber.replace(/\s/g, '').replace(/\D/g, '');
    
    // Construire le numéro de téléphone complet avec le préfixe
    const fullPhone = phonePrefix + cleanNumber;
    
    // Mapper les types de course frontend vers backend
    const rideTypeMap: Record<string, 'dakar_to_airport' | 'airport_to_dakar'> = {
      'city_to_airport': 'dakar_to_airport',
      'airport_to_city': 'airport_to_dakar',
      'city_to_city': 'dakar_to_airport', // Par défaut, utiliser dakar_to_airport pour city_to_city
    };
    
    const mappedRideType = rideTypeMap[formData.rideType] || 'dakar_to_airport';
    
    // Pour "Ville → Aéroport", s'assurer que dropoffAddress a une valeur
    let finalDropoffAddress = formData.dropoffAddress;
    if (formData.rideType === 'city_to_airport' && !finalDropoffAddress?.trim()) {
      finalDropoffAddress = 'Aéroport International Blaise Diagne (AIBD)';
    }
    
    const submitData: any = {
      ...formData,
      clientPhone: fullPhone,
      dropoffAddress: finalDropoffAddress,
      rideType: mappedRideType,
    };

    console.log('Soumission formulaire:', submitData);

    createRide(submitData, {
      onSuccess: (ride) => {
        console.log('Course créée:', ride);
        navigate(`/track/${ride.id}`);
      },
      onError: (error: any) => {
        console.error('Erreur réservation:', error);
        const errorMessage = error?.response?.data?.message || error?.message || 'Erreur lors de la réservation';
        setSubmitError(errorMessage);
        // Scroll vers le haut pour voir l'erreur
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  };

  const calculatePrice = () => {
    if (!pricing || pricing.length === 0) return 0;
    
    // Mapper les types de course frontend vers backend pour la recherche de pricing
    const rideTypeMap: Record<string, 'dakar_to_airport' | 'airport_to_dakar'> = {
      'city_to_airport': 'dakar_to_airport',
      'airport_to_city': 'airport_to_dakar',
      'city_to_city': 'dakar_to_airport', // Par défaut, utiliser dakar_to_airport pour city_to_city
    };
    
    const mappedRideType = rideTypeMap[formData.rideType] || 'dakar_to_airport';
    
    // Trouver le pricing standard (type 'standard') pour ce type de course
    // Prioriser les pricing actifs et de type 'standard'
    const priceConfig = pricing.find((p) => 
      p.rideType === mappedRideType && 
      p.isActive &&
      p.type === 'standard'
    ) || pricing.find((p) => 
      p.rideType === mappedRideType && 
      p.isActive
    ) || pricing.find((p) => p.rideType === mappedRideType);
    
    if (!priceConfig) return 0;
    
    // Utiliser le champ 'price' de l'entité Pricing
    let price = parseFloat(priceConfig.price?.toString() || '0');
    
    // Pour les bagages supplémentaires, on pourrait ajouter un montant fixe
    // Pour l'instant, on utilise juste le prix de base
    // TODO: Implémenter la logique des bagages supplémentaires si nécessaire
    
    return price;
  };

  return (
    <div className="booking-page">
      <NavigationBar />
      <div className="booking-container">
        <h1>{t('booking.title')}</h1>

        <form onSubmit={handleSubmit} className="booking-form">
          {submitError && (
            <div className="error-message" role="alert">
              {submitError}
            </div>
          )}

          <div className="form-group">
            <label>{t('booking.from')}</label>
            <input
              type="text"
              name="pickupAddress"
              data-field="pickupAddress"
              value={formData.pickupAddress}
              onChange={(e) => {
                setFormData({ ...formData, pickupAddress: e.target.value });
                if (errors.pickupAddress) {
                  setErrors(prev => ({ ...prev, pickupAddress: '' }));
                }
              }}
              required
              placeholder="Adresse de départ"
              className={errors.pickupAddress ? 'error' : ''}
            />
            {errors.pickupAddress && <span className="field-error">{errors.pickupAddress}</span>}
          </div>

          <div className="form-group">
            <label>{t('booking.to')}</label>
            <select
              value={formData.rideType}
              onChange={(e) => {
                const newRideType = e.target.value as 'city_to_airport' | 'airport_to_city' | 'city_to_city';
                const updates: any = { rideType: newRideType };
                // Si c'est "Ville → Aéroport", définir automatiquement dropoffAddress
                if (newRideType === 'city_to_airport') {
                  updates.dropoffAddress = 'Aéroport International Blaise Diagne (AIBD)';
                } else if (formData.rideType === 'city_to_airport') {
                  // Si on change depuis "Ville → Aéroport", vider dropoffAddress
                  updates.dropoffAddress = '';
                }
                setFormData({ ...formData, ...updates });
              }}
              required
            >
              <option value="city_to_airport">Ville → Aéroport</option>
              <option value="airport_to_city">Aéroport → Ville</option>
              <option value="city_to_city">Ville → Ville</option>
            </select>
            {(formData.rideType === 'airport_to_city' || formData.rideType === 'city_to_city') && (
              <>
                <input
                  type="text"
                  name="dropoffAddress"
                  data-field="dropoffAddress"
                  value={formData.dropoffAddress}
                  onChange={(e) => {
                    setFormData({ ...formData, dropoffAddress: e.target.value });
                    if (errors.dropoffAddress) {
                      setErrors(prev => ({ ...prev, dropoffAddress: '' }));
                    }
                  }}
                  placeholder="Adresse de destination"
                  required
                  className={errors.dropoffAddress ? 'error' : ''}
                />
                {errors.dropoffAddress && <span className="field-error">{errors.dropoffAddress}</span>}
              </>
            )}
            {formData.rideType === 'city_to_airport' && (
              <>
                <input
                  type="text"
                  value={formData.dropoffAddress || 'Aéroport International Blaise Diagne (AIBD)'}
                  onChange={(e) => setFormData({ ...formData, dropoffAddress: e.target.value || 'Aéroport International Blaise Diagne (AIBD)' })}
                  placeholder="Aéroport International Blaise Diagne (AIBD)"
                  style={{ marginBottom: '0.5rem', backgroundColor: '#f5f5f5' }}
                  readOnly
                />
                <input
                  type="text"
                  value={formData.flightNumber}
                  onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value })}
                  placeholder="Numéro de vol (optionnel)"
                />
              </>
            )}
          </div>

          <div className="form-group">
            <label>{t('booking.date')}</label>
            <input
              type="datetime-local"
              name="scheduledAt"
              data-field="scheduledAt"
              value={formData.scheduledAt}
              onChange={(e) => {
                setFormData({ ...formData, scheduledAt: e.target.value });
                if (errors.scheduledAt) {
                  setErrors(prev => ({ ...prev, scheduledAt: '' }));
                }
              }}
              required
              className={errors.scheduledAt ? 'error' : ''}
            />
            {errors.scheduledAt && <span className="field-error">{errors.scheduledAt}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Prénom</label>
              <input
                type="text"
                name="clientFirstName"
                data-field="clientFirstName"
                value={formData.clientFirstName}
                onChange={(e) => {
                  setFormData({ ...formData, clientFirstName: e.target.value });
                  if (errors.clientFirstName) {
                    setErrors(prev => ({ ...prev, clientFirstName: '' }));
                  }
                }}
                required
                className={errors.clientFirstName ? 'error' : ''}
              />
              {errors.clientFirstName && <span className="field-error">{errors.clientFirstName}</span>}
            </div>
            <div className="form-group">
              <label>Nom</label>
              <input
                type="text"
                name="clientLastName"
                data-field="clientLastName"
                value={formData.clientLastName}
                onChange={(e) => {
                  setFormData({ ...formData, clientLastName: e.target.value });
                  if (errors.clientLastName) {
                    setErrors(prev => ({ ...prev, clientLastName: '' }));
                  }
                }}
                required
                className={errors.clientLastName ? 'error' : ''}
              />
              {errors.clientLastName && <span className="field-error">{errors.clientLastName}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Téléphone</label>
              <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={phonePrefix}
                    onChange={(e) => setPhonePrefix(e.target.value)}
                    style={{ width: '120px', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    <option value="+221">🇸🇳 +221 (Sénégal)</option>
                    <option value="+242">🇨🇬 +242 (Congo)</option>
                  </select>
                  <input
                    type="tel"
                    name="phoneNumber"
                    data-field="phoneNumber"
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
                    style={{ flex: 1 }}
                    className={errors.phoneNumber ? 'error' : ''}
                  />
                </div>
                {errors.phoneNumber && <span className="field-error">{errors.phoneNumber}</span>}
              </div>
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="clientEmail"
                data-field="clientEmail"
                value={formData.clientEmail}
                onChange={(e) => {
                  setFormData({ ...formData, clientEmail: e.target.value });
                  if (errors.clientEmail) {
                    setErrors(prev => ({ ...prev, clientEmail: '' }));
                  }
                }}
                required
                className={errors.clientEmail ? 'error' : ''}
              />
              {errors.clientEmail && <span className="field-error">{errors.clientEmail}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('booking.passengers')}</label>
              <input
                type="number"
                min="1"
                max="8"
                value={formData.numberOfPassengers || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? 1 : parseInt(e.target.value) || 1;
                  setFormData({ ...formData, numberOfPassengers: value });
                }}
                required
              />
            </div>
            <div className="form-group">
              <label>{t('booking.bags')}</label>
              <input
                type="number"
                min="0"
                value={formData.numberOfBags || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                  setFormData({ ...formData, numberOfBags: value });
                }}
                required
              />
            </div>
          </div>

          <div className="price-display">
            <strong>{t('booking.price')}: {calculatePrice().toLocaleString()} FCFA</strong>
          </div>

          <button type="submit" className="btn-submit" disabled={isPending}>
            {isPending ? t('common.loading') : t('booking.book')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default BookingPage;

