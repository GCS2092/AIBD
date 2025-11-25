import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useRideStatus } from '../hooks/useRide';
import { useETA } from '../hooks/useGPS';
import MapComponent from '../components/MapComponent';
import NavigationBar from '../components/NavigationBar';
import './TrackingPage.css';

function TrackingPage() {
  const { rideId } = useParams<{ rideId: string }>();
  const { t } = useTranslation();
  const { data: ride, isLoading, refetch } = useRideStatus(rideId || null);
  const { data: etaData } = useETA(rideId || null, !!ride);

  // Rafraîchir automatiquement toutes les 5 secondes si la course est active
  useEffect(() => {
    if (ride && (ride.status === 'accepted' || ride.status === 'in_progress')) {
      const interval = setInterval(() => {
        refetch();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [ride, refetch]);

  if (isLoading) {
    return (
      <div className="tracking-page">
        <div className="loading">{t('common.loading')}</div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="tracking-page">
        <NavigationBar />
        <div className="error-message">
          <h2>Course non trouvée</h2>
          <Link to="/" className="btn btn-primary">Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#f39c12',
      assigned: '#3498db',
      accepted: '#3498db',
      in_progress: '#9b59b6',
      completed: '#2ecc71',
      cancelled: '#e74c3c',
    };
    return colors[status] || '#95a5a6';
  };

  const isActive = ride.status === 'accepted' || ride.status === 'in_progress';

  return (
    <div className="tracking-page">
      <NavigationBar />
      <div className="tracking-container">
        <header className="tracking-header">
          <h1>Suivi de course</h1>
        </header>

        <div className="ride-status-card">
          <div className="status-indicator" style={{ backgroundColor: getStatusColor(ride.status) }}>
            <span className="status-label">{getStatusLabel(ride.status)}</span>
          </div>
          {isActive && (
            <div className="live-indicator">
              <span className="pulse"></span>
              <span>En direct</span>
            </div>
          )}
        </div>

        <div className="ride-info-card">
          <h2>Détails de la course</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-icon">📍</span>
              <div>
                <strong>Départ</strong>
                <p>{ride.pickupAddress}</p>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">🎯</span>
              <div>
                <strong>Destination</strong>
                <p>{ride.dropoffAddress}</p>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">📅</span>
              <div>
                <strong>Date prévue</strong>
                <p>{new Date(ride.scheduledAt).toLocaleString('fr-FR')}</p>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">💰</span>
              <div>
                <strong>Prix</strong>
                <p>{ride.price} FCFA</p>
              </div>
            </div>
            {etaData && (
              <div className="info-item eta-item">
                <span className="info-icon">⏱️</span>
                <div>
                  <strong>Temps estimé</strong>
                  <p className="eta-value">{etaData.estimatedTimeFormatted}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {ride.driverLocation && (
          <div className="map-card">
            <h2>Position en temps réel</h2>
            <div className="map-container">
              <MapComponent
                driverLocation={ride.driverLocation}
                pickupLocation={ride.pickupLocation}
                dropoffLocation={ride.dropoffLocation}
              />
            </div>
          </div>
        )}

        {!ride.driverLocation && ride.status !== 'completed' && ride.status !== 'cancelled' && (
          <div className="waiting-message">
            <p>⏳ En attente de la position du chauffeur...</p>
          </div>
        )}

        {ride.status === 'completed' && (
          <div className="completed-message">
            <h3>✅ Course terminée</h3>
            <p>Merci d'avoir utilisé nos services !</p>
            <Link to="/history" className="btn btn-primary">Voir l'historique</Link>
          </div>
        )}

        {ride.status === 'cancelled' && (
          <div className="cancelled-message">
            <h3>❌ Course annulée</h3>
            <p>Cette course a été annulée.</p>
            <Link to="/" className="btn btn-primary">Réserver une nouvelle course</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackingPage;

