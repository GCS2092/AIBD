import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { rideService, Ride } from '../services/rideService';
import Pagination from '../components/Pagination';
import NavigationBar from '../components/NavigationBar';
import './HistoryPage.css';

function HistoryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState<{
    phone?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  }>({});
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    const storedPhone = localStorage.getItem('clientPhone');
    if (storedPhone) {
      setSearchParams({ phone: storedPhone });
    }
  }, []);

  // Réinitialiser la page quand les paramètres de recherche changent
  useEffect(() => {
    setPage(1);
  }, [searchParams]);

  const hasSearchParams = !!(searchParams.phone || searchParams.email || searchParams.firstName || searchParams.lastName);

  const { data: ridesData, isLoading, refetch } = useQuery({
    queryKey: ['my-rides', searchParams, page],
    queryFn: () => rideService.getMyRides(
      page,
      pageSize,
      searchParams.phone,
      searchParams.email,
      searchParams.firstName,
      searchParams.lastName
    ),
    enabled: hasSearchParams,
    refetchInterval: 20000, // Rafraîchir toutes les 20 secondes pour voir les changements de statut
  });

  const rides = ridesData?.data || [];

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    
    const params: any = {};
    if (phone) params.phone = phone;
    if (email) params.email = email;
    if (firstName) params.firstName = firstName;
    if (lastName) params.lastName = lastName;
    
    if (Object.keys(params).length > 0) {
      setSearchParams(params);
      if (phone) {
        localStorage.setItem('clientPhone', phone);
      }
      refetch();
    } else {
      alert('Veuillez remplir au moins un champ de recherche');
    }
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

  return (
    <div className="history-page">
      <NavigationBar />
      <div className="history-container">
        <header className="history-header">
          <h1>Historique des courses</h1>
        </header>

        {!hasSearchParams ? (
          <div className="phone-form-container">
            <form onSubmit={handlePhoneSubmit} className="phone-form">
              <h2>Voir mon historique</h2>
              <p>Recherchez vos courses par téléphone, email, nom ou prénom</p>
              <div className="form-row">
                <input
                  type="tel"
                  name="phone"
                  placeholder="Téléphone (+221XXXXXXXXX)"
                  className="phone-input"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className="phone-input"
                />
              </div>
              <div className="form-row">
                <input
                  type="text"
                  name="firstName"
                  placeholder="Prénom"
                  className="phone-input"
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Nom"
                  className="phone-input"
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Rechercher mes courses
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="history-controls">
              <button 
                className="btn-change-phone"
                onClick={() => {
                  setSearchParams({});
                  localStorage.removeItem('clientPhone');
                }}
              >
                Nouvelle recherche
              </button>
            </div>

            {isLoading ? (
              <div className="loading">Chargement de l'historique...</div>
            ) : rides && rides.length > 0 ? (
              <>
                <div className="rides-list">
                  {rides.map((ride: Ride) => (
                  <div key={ride.id} className="ride-card">
                    <div className="ride-header">
                      <h3>
                        {ride.rideType === 'city_to_airport' 
                          ? 'Ville → Aéroport' 
                          : ride.rideType === 'airport_to_city'
                          ? 'Aéroport → Ville'
                          : 'Ville → Ville'}
                      </h3>
                      <span 
                        className="status-badge" 
                        style={{ backgroundColor: getStatusColor(ride.status) }}
                      >
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
                      {ride.completedAt && (
                        <p><strong>✅ Terminée le:</strong> {new Date(ride.completedAt).toLocaleString('fr-FR')}</p>
                      )}
                      {ride.cancelledAt && (
                        <p><strong>❌ Annulée le:</strong> {new Date(ride.cancelledAt).toLocaleString('fr-FR')}</p>
                      )}
                    </div>
                    <div className="ride-actions">
                      {(ride.status === 'pending' || 
                        ride.status === 'assigned' || 
                        ride.status === 'accepted' || 
                        ride.status === 'in_progress') && (
                        <Link 
                          to={`/track/${ride.id}`} 
                          className="btn btn-track"
                        >
                          📍 Suivre la course
                        </Link>
                      )}
                      {ride.status === 'completed' && (
                        <Link 
                          to={`/track/${ride.id}`} 
                          className="btn btn-view"
                        >
                          📋 Voir les détails
                        </Link>
                      )}
                      {ride.status === 'pending' && (
                        <button
                          className="btn btn-cancel"
                          onClick={async () => {
                            if (confirm('Êtes-vous sûr de vouloir annuler cette course ?')) {
                              try {
                                await rideService.cancelRide(ride.id, 'Annulée par le client', 'client');
                                refetch();
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
                  Affichage de {rides.length} sur {ridesData?.total || 0} course(s)
                </div>
              </>
            ) : (
              <div className="no-rides">
                <p>Aucune course dans l'historique pour ce numéro.</p>
                <Link to="/book" className="btn btn-primary">
                  Réserver votre première course →
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default HistoryPage;
