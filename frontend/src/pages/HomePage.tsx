import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { rideService, Ride } from '../services/rideService';
import Pagination from '../components/Pagination';
import NavigationBar from '../components/NavigationBar';
import './HomePage.css';

function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();
  const [searchParams, setSearchParams] = useState<{
    phone?: string;
  }>({});
  const [phonePrefix, setPhonePrefix] = useState<string>('+221');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Récupérer le téléphone depuis localStorage si disponible
  useEffect(() => {
    const storedPhone = localStorage.getItem('clientPhone');
    if (storedPhone) {
      // Extraire le préfixe et le numéro
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

  // Réinitialiser la page quand les paramètres de recherche changent
  useEffect(() => {
    setPage(1);
  }, [searchParams]);

  const hasSearchParams = !!searchParams.phone;

  const { data: ridesData, isLoading } = useQuery({
    queryKey: ['my-rides', searchParams, page],
    queryFn: async () => {
      try {
        return await rideService.getMyRides(
          page,
          pageSize,
          searchParams.phone
        );
      } catch (error) {
        console.error('Erreur lors de la récupération des courses:', error);
        return { data: [], total: 0, page: 1, limit: pageSize, totalPages: 0, hasNextPage: false, hasPreviousPage: false };
      }
    },
    enabled: hasSearchParams,
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
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

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');
    
    // Nettoyer le numéro de téléphone (enlever les espaces, tirets, etc.)
    const cleanNumber = phoneNumber.replace(/\s|-|\./g, '');
    
    // Validation
    if (!cleanNumber) {
      setPhoneError('Veuillez entrer votre numéro de téléphone');
      return;
    }
    
    // Vérifier que le numéro a 9 chiffres (après le préfixe)
    if (cleanNumber.length !== 9) {
      setPhoneError('Le numéro de téléphone doit contenir 9 chiffres (ex: 771234567)');
      return;
    }
    
    // Vérifier que ce sont bien des chiffres
    if (!/^[0-9]{9}$/.test(cleanNumber)) {
      setPhoneError('Le numéro de téléphone ne doit contenir que des chiffres');
      return;
    }
    
    // Construire le numéro complet avec le préfixe
    const fullPhone = phonePrefix + cleanNumber;
    
    // Sauvegarder et rechercher
    setSearchParams({ phone: fullPhone });
    localStorage.setItem('clientPhone', fullPhone);
    setPhoneError(''); // Réinitialiser l'erreur en cas de succès
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

  return (
    <div className="home-page">
      <NavigationBar />
      <header className="home-header">
        <div className="header-top">
          <h1>AIBD</h1>
          <p>Transport vers l'aéroport de Dakar</p>
        </div>
      </header>

      <main className="home-main">
        {/* Formulaire pour entrer le téléphone */}
        {!hasSearchParams && (
          <div className="phone-form-container">
            <form onSubmit={handlePhoneSubmit} className="phone-form">
              <h2>🔍 Rechercher mes courses</h2>
              <p>Entrez votre numéro de téléphone pour voir toutes vos courses</p>
              
              <div className="phone-input-wrapper">
                <div className={`phone-input-group ${phoneError ? 'error' : ''}`}>
                  <span className="phone-prefix-display">{phonePrefix}</span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      // Ne garder que les chiffres
                      const value = e.target.value.replace(/\D/g, '');
                      // Limiter à 9 chiffres
                      if (value.length <= 9) {
                        setPhoneNumber(value);
                        setPhoneError(''); // Réinitialiser l'erreur quand l'utilisateur tape
                      }
                    }}
                    placeholder="771234567"
                    className="phone-number-input"
                    maxLength={9}
                  />
                </div>
                <div className="phone-prefix-buttons">
                  <button
                    type="button"
                    onClick={() => {
                      setPhonePrefix('+221');
                      setPhoneError('');
                    }}
                    className={`prefix-btn ${phonePrefix === '+221' ? 'active' : ''}`}
                  >
                    🇸🇳 +221
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPhonePrefix('+242');
                      setPhoneError('');
                    }}
                    className={`prefix-btn ${phonePrefix === '+242' ? 'active' : ''}`}
                  >
                    🇨🇬 +242
                  </button>
                </div>
              </div>
              
              {phoneError && (
                <div className="phone-error-message">
                  ⚠️ {phoneError}
                </div>
              )}
              
              <div className="phone-hint">
                <small>Format: {phonePrefix}XXXXXXXXX (9 chiffres)</small>
              </div>
              
              <button type="submit" className="btn btn-primary btn-search">
                🔍 Rechercher mes courses
              </button>
            </form>
          </div>
        )}

        {/* Courses actives */}
        {hasSearchParams && (
          <section className="active-rides-section">
            <div className="section-header">
              <h2>Mes Courses Actives</h2>
              <div className="search-info">
                <p className="current-search">
                  📱 Recherche: <strong>{searchParams.phone}</strong>
                </p>
                <button 
                  className="btn-change-phone"
                  onClick={() => {
                    setSearchParams({});
                    setPhoneNumber('');
                    localStorage.removeItem('clientPhone');
                  }}
                >
                  🔄 Nouvelle recherche
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="loading">Chargement...</div>
            ) : activeRidesList.length > 0 ? (
              <React.Fragment>
                <div className="rides-list">
                  {activeRidesList.map((ride: Ride) => (
                    <div key={ride.id} className="ride-card">
                      <div className="ride-header">
                        <h3>
                          {ride.rideType === 'city_to_airport' 
                            ? 'Ville → Aéroport' 
                            : ride.rideType === 'airport_to_city'
                            ? 'Aéroport → Ville'
                            : 'Ville → Ville'}
                        </h3>
                        <span className={`status-badge status-${ride.status}`}>
                          {getStatusLabel(ride.status)}
                        </span>
                      </div>
                      <div className="ride-details">
                        <p><strong>📍 Départ:</strong> {ride.pickupAddress}</p>
                        <p><strong>🎯 Arrivée:</strong> {ride.dropoffAddress}</p>
                        <p><strong>📅 Date:</strong> {new Date(ride.scheduledAt).toLocaleString('fr-FR')}</p>
                        <p><strong>💰 Prix:</strong> {ride.price} FCFA</p>
                        {ride.driverId && (
                          <p><strong>🚗 Chauffeur assigné</strong></p>
                        )}
                      </div>
                      <div className="ride-actions">
                        <Link 
                          to={`/track/${ride.id}`} 
                          className="btn btn-track"
                        >
                          📍 Suivre la course
                        </Link>
                        {ride.status === 'pending' && (
                          <button
                            className="btn btn-cancel"
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
                          >
                            Annuler
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {ridesData && (
                  <Pagination
                    currentPage={page}
                    totalPages={ridesData.totalPages}
                    onPageChange={setPage}
                    hasNextPage={ridesData.hasNextPage}
                    hasPreviousPage={ridesData.hasPreviousPage}
                  />
                )}
                <div className="pagination-info">
                  Affichage de {activeRidesList.length} course(s) active(s) sur {ridesData?.total || 0} course(s) totale(s)
                </div>
              </React.Fragment>
            ) : (
              <div className="no-rides">
                <p>Aucune course active pour ce numéro.</p>
                <Link to="/book" className="btn btn-primary">
                  Réserver une course
                </Link>
              </div>
            )}
          </section>
        )}

        <div className="home-actions">
          <Link to="/book" className="btn btn-primary">
            {t('booking.title')}
          </Link>
          <Link to="/history" className="btn btn-secondary">
            Historique
          </Link>
        </div>

        <div className="home-features">
          <div className="feature">
            <h3>🚗 Transport fiable</h3>
            <p>Chauffeurs vérifiés et professionnels</p>
          </div>
          <div className="feature">
            <h3>📍 Suivi en temps réel</h3>
            <p>Suivez votre chauffeur en direct</p>
          </div>
          <div className="feature">
            <h3>💰 Tarifs transparents</h3>
            <p>Prix clairs avant réservation</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default HomePage;
