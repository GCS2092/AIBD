import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '../hooks/useWebSocket';
import { driverService } from '../services/driverService';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import Pagination from '../components/Pagination';
import DriverHeader from '../components/DriverHeader';
import DriverBottomNav from '../components/DriverBottomNav';
import { 
  Bell, 
  LogOut, 
  User, 
  Car, 
  Hourglass, 
  TrendingUp, 
  Star,
  MapPin,
  Navigation,
  Calendar,
  Phone,
  Edit,
  Car as CarIcon,
  List,
  History,
  DollarSign,
  LayoutDashboard,
  CheckCircle2
} from 'lucide-react';
import './DriverDashboard.css';

function DriverDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [ridesPage, setRidesPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'available' | 'active' | 'history'>('overview');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  // Réinitialiser la page quand le filtre change
  useEffect(() => {
    setRidesPage(1);
  }, [statusFilter]);

  const { data: profile } = useQuery({
    queryKey: ['driver-profile'],
    queryFn: () => driverService.getProfile(),
    refetchInterval: 30000,
  });

  const { data: ridesData } = useQuery({
    queryKey: ['driver-rides', statusFilter, ridesPage],
    queryFn: () => driverService.getMyRides(ridesPage, pageSize, statusFilter || undefined),
    refetchInterval: 20000, // Rafraîchir toutes les 20 secondes
  });

  const rides = ridesData?.data || [];

  const { data: availableRides } = useQuery({
    queryKey: ['driver-available-rides'],
    queryFn: () => driverService.getAvailableRides(),
    refetchInterval: 10000, // Rafraîchir toutes les 10 secondes
    enabled: profile?.status === 'available',
  });


  const acceptRideMutation = useMutation({
    mutationFn: (rideId: string) => driverService.acceptRide(rideId),
    onSuccess: () => {
      // Invalider toutes les queries liées pour rafraîchir automatiquement
      queryClient.invalidateQueries({ queryKey: ['driver-rides'] });
      queryClient.invalidateQueries({ queryKey: ['driver-available-rides'] });
      queryClient.invalidateQueries({ queryKey: ['driver-profile'] });
    },
  });

  const refuseRideMutation = useMutation({
    mutationFn: (rideId: string) => driverService.refuseRide(rideId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-rides'] });
      queryClient.invalidateQueries({ queryKey: ['driver-available-rides'] });
    },
  });

  const startRideMutation = useMutation({
    mutationFn: (rideId: string) => driverService.startRide(rideId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-rides'] });
      queryClient.invalidateQueries({ queryKey: ['driver-profile'] });
    },
  });

  const completeRideMutation = useMutation({
    mutationFn: (rideId: string) => driverService.completeRide(rideId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-rides'] });
      queryClient.invalidateQueries({ queryKey: ['driver-profile'] });
    },
  });

  // Utiliser WebSocket pour les mises à jour en temps réel
  useWebSocket();

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const count = await notificationService.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Erreur récupération notifications:', error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const pendingRides = rides.filter(r => r.status === 'pending' || r.status === 'assigned');
  const activeRides = rides.filter(r => r.status === 'accepted' || r.status === 'in_progress' || r.status === 'driver_on_way' || r.status === 'picked_up');
  const completedRides = rides.filter(r => r.status === 'completed');

  // Calculer les statistiques
  const totalRides = rides.length;
  const totalRevenue = rides
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => {
      const price = typeof r.price === 'number' ? r.price : (r.price ? Number(r.price) : 0);
      return sum + price;
    }, 0);

  return (
    <div className="driver-dashboard">
      {/* Header avec horloge et statut */}
      <DriverHeader showStatusButtons={true} />

      {/* Boutons flottants */}
      <div className="floating-buttons">
        <button 
          className="floating-notifications-btn" 
          onClick={() => navigate('/driver/notifications')}
          title="Notifications"
        >
          <Bell className="floating-btn-icon" />
          {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </button>
        <button 
          className="floating-logout-btn" 
          onClick={handleLogout}
          title="Déconnexion"
        >
          <LogOut className="floating-btn-icon" />
        </button>
      </div>

      <div className="dashboard-content">
        {selectedTab === 'overview' && (
          <>
            {/* Statistiques principales */}
            <section className="stats-section">
              <div className="stats-grid-modern">
                <div className="stat-card-modern">
                  <div className="stat-icon-wrapper">
                    <Car className="stat-icon" />
                  </div>
                  <h3>Total Courses</h3>
                  <p className="stat-value">{totalRides}</p>
                </div>
                <div className="stat-card-modern">
                  <div className="stat-icon-wrapper">
                    <CheckCircle2 className="stat-icon" />
                  </div>
                  <h3>Courses Terminées</h3>
                  <p className="stat-value">{completedRides.length}</p>
                </div>
                <div className="stat-card-modern">
                  <div className="stat-icon-wrapper">
                    <Hourglass className="stat-icon" />
                  </div>
                  <h3>En Cours</h3>
                  <p className="stat-value">{activeRides.length}</p>
                </div>
                <div className="stat-card-modern">
                  <div className="stat-icon-wrapper">
                    <TrendingUp className="stat-icon" />
                  </div>
                  <h3>Revenus Totaux</h3>
                  <p className="stat-value">{totalRevenue.toLocaleString()} FCFA</p>
                </div>
                <div className="stat-card-modern">
                  <div className="stat-icon-wrapper">
                    <Star className="stat-icon" />
                  </div>
                  <h3>Note Moyenne</h3>
                  <p className="stat-value">
                    {profile?.rating != null 
                      ? (typeof profile.rating === 'number' 
                          ? profile.rating.toFixed(1)
                          : Number(profile.rating || 0).toFixed(1))
                      : '0.0'}
                  </p>
                </div>
                <div className="stat-card-modern">
                  <div className="stat-icon-wrapper">
                    <User className="stat-icon" />
                  </div>
                  <h3>Statut</h3>
                  <p className="stat-value">
                    {profile?.status === 'available' ? 'Disponible' : 
                     profile?.status === 'unavailable' ? 'Indisponible' : 
                     profile?.status === 'on_break' ? 'En pause' : 
                     profile?.status === 'on_ride' ? 'En course' : profile?.status || 'N/A'}
                  </p>
                </div>
              </div>
            </section>

            {/* Profil et statut */}
            <section className="profile-section">
              <h2 className="section-title-modern">Mon Profil</h2>
              <div className="profile-buttons-grid">
                <button
                  className="profile-button-modern"
                  onClick={() => navigate('/driver/profile/edit')}
                >
                  <Edit className="profile-button-icon" />
                  <div className="profile-button-content">
                    <span className="profile-button-label">Modifier le profil</span>
                    <span className="profile-button-value">
                      {profile?.user?.firstName} {profile?.user?.lastName}
                    </span>
                  </div>
                </button>
                <button
                  className="profile-button-modern"
                  onClick={() => {}}
                  disabled
                >
                  <Phone className="profile-button-icon" />
                  <div className="profile-button-content">
                    <span className="profile-button-label">Téléphone</span>
                    <span className="profile-button-value">{profile?.user?.phone}</span>
                  </div>
                </button>
                <button
                  className="profile-button-modern"
                  onClick={() => {}}
                  disabled
                >
                  <Star className="profile-button-icon" />
                  <div className="profile-button-content">
                    <span className="profile-button-label">Note moyenne</span>
                    <span className="profile-button-value">
                      {profile?.rating != null 
                        ? (typeof profile.rating === 'number' 
                            ? profile.rating.toFixed(1)
                            : Number(profile.rating || 0).toFixed(1))
                        : '0.0'} ⭐ ({profile?.totalRides || 0} courses)
                    </span>
                  </div>
                </button>
                {profile?.vehicles && profile.vehicles.length > 0 ? (
                  <button
                    className="profile-button-modern"
                    onClick={() => navigate('/driver/vehicle/register')}
                  >
                    <CarIcon className="profile-button-icon" />
                    <div className="profile-button-content">
                      <span className="profile-button-label">Véhicule</span>
                      <span className="profile-button-value">
                        {profile.vehicles[0].brand} {profile.vehicles[0].model} ({profile.vehicles[0].licensePlate})
                      </span>
                    </div>
                  </button>
                ) : (
                  <button
                    className="profile-button-modern profile-button-action"
                    onClick={() => navigate('/driver/vehicle/register')}
                  >
                    <CarIcon className="profile-button-icon" />
                    <div className="profile-button-content">
                      <span className="profile-button-label">Enregistrer un véhicule</span>
                      <span className="profile-button-value">Cliquez pour ajouter</span>
                    </div>
                  </button>
                )}
              </div>
              <div className="status-controls-modern">
                <div className="status-display-modern">
                  <span className={`status-badge ${profile?.status === 'available' ? 'available' : 'unavailable'}`}>
                    {profile?.status === 'available' ? 'Disponible' : 'Indisponible'}
                  </span>
                </div>
              </div>
            </section>
          </>
        )}

        {selectedTab === 'available' && (
          <section className="rides-section-modern">
            <h2 className="section-title-modern">Courses Disponibles {availableRides && availableRides.length > 0 && `(${availableRides.length})`}</h2>
            {availableRides && availableRides.length > 0 ? (
              <div className="rides-grid-modern">
                {availableRides.map((ride) => (
                <div key={ride.id} className="ride-card-stat-style">
                  <div className="ride-card-header-stat">
                    <span className="ride-type-badge-stat">
                      {ride.rideType === 'city_to_airport' ? 'Ville → Aéroport' : 'Aéroport → Ville'}
                    </span>
                    <span className="status-badge-stat status-pending">Disponible</span>
                  </div>
                  <div className="ride-card-body-stat">
                    <div className="ride-details-stat">
                      <div className="ride-detail-stat">
                        <MapPin className="ride-detail-icon" />
                        <span>{ride.pickupAddress.substring(0, 30)}...</span>
                      </div>
                      <div className="ride-detail-stat">
                        <Navigation className="ride-detail-icon" />
                        <span>{ride.dropoffAddress.substring(0, 30)}...</span>
                      </div>
                      <div className="ride-detail-stat">
                        <Calendar className="ride-detail-icon" />
                        <span>{new Date(ride.scheduledAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <div className="ride-price-stat">
                      <DollarSign className="price-icon" />
                      <strong>{typeof ride.price === 'number' ? ride.price.toLocaleString() : Number(ride.price || 0).toLocaleString()} FCFA</strong>
                    </div>
                    <button
                      className="btn-accept-modern"
                      onClick={() => {
                        if (confirm('Voulez-vous accepter cette course ?')) {
                          acceptRideMutation.mutate(ride.id);
                        }
                      }}
                      disabled={acceptRideMutation.isPending}
                    >
                      <CheckCircle2 className="btn-icon" />
                      Accepter
                    </button>
                  </div>
                </div>
              ))}
              </div>
            ) : (
              <div className="empty-state-modern">
                <Car className="empty-icon" />
                <p className="empty-message">Aucune course disponible pour le moment</p>
                <p className="empty-submessage">Les nouvelles courses apparaîtront ici lorsque vous serez disponible</p>
              </div>
            )}
          </section>
        )}

        {selectedTab === 'active' && (
          <>
            <section className="rides-section-modern">
              <h2 className="section-title-modern">Courses en Cours {activeRides.length > 0 && `(${activeRides.length})`}</h2>
              {activeRides.length > 0 ? (
                <>
                <div className="rides-grid-modern">
                  {activeRides.map((ride) => (
                    <div key={ride.id} className="ride-card-stat-style">
                      <div className="ride-card-header-stat">
                        <span className="ride-type-badge-stat">
                          {ride.rideType === 'city_to_airport' ? 'Ville → Aéroport' : 'Aéroport → Ville'}
                        </span>
                        <span className={`status-badge-stat status-${ride.status}`}>
                          {ride.status}
                        </span>
                      </div>
                      <div className="ride-card-body-stat">
                        <div className="ride-details-stat">
                          <div className="ride-detail-stat">
                            <MapPin className="ride-detail-icon" />
                            <span>{ride.pickupAddress.substring(0, 30)}...</span>
                          </div>
                          <div className="ride-detail-stat">
                            <Navigation className="ride-detail-icon" />
                            <span>{ride.dropoffAddress.substring(0, 30)}...</span>
                          </div>
                          <div className="ride-detail-stat">
                            <Calendar className="ride-detail-icon" />
                            <span>{new Date(ride.scheduledAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        <div className="ride-price-stat">
                          <DollarSign className="price-icon" />
                          <strong>{typeof ride.price === 'number' ? ride.price.toLocaleString() : Number(ride.price || 0).toLocaleString()} FCFA</strong>
                        </div>
                        <div className="ride-actions-modern">
                          {ride.status === 'accepted' && (() => {
                            const now = new Date();
                            const scheduledDate = new Date(ride.scheduledAt);
                            const allowedStartTime = new Date(scheduledDate.getTime() - 2 * 60 * 60 * 1000);
                            const canStart = now >= allowedStartTime;
                            
                            return (
                              <button
                                className="btn-start-modern"
                                onClick={() => startRideMutation.mutate(ride.id)}
                                disabled={startRideMutation.isPending || !canStart}
                                title={!canStart ? `Course prévue pour ${scheduledDate.toLocaleDateString('fr-FR')} à ${scheduledDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}. Vous pourrez démarrer 2h avant.` : ''}
                              >
                                <Car className="btn-icon" />
                                Démarrer
                              </button>
                            );
                          })()}
                          {ride.status === 'in_progress' && (
                            <button
                              className="btn-complete-modern"
                              onClick={() => completeRideMutation.mutate(ride.id)}
                              disabled={completeRideMutation.isPending}
                            >
                              <CheckCircle2 className="btn-icon" />
                              Terminer
                            </button>
                          )}
                          <button
                            className="btn-track-modern"
                            onClick={() => navigate(`/driver/track/${ride.id}`)}
                          >
                            <Navigation className="btn-icon" />
                            Suivre
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
              ) : (
                <div className="empty-state-modern">
                  <Hourglass className="empty-icon" />
                  <p className="empty-message">Aucune course en cours</p>
                  <p className="empty-submessage">Vos courses actives apparaîtront ici</p>
                </div>
              )}
            </section>
            {pendingRides.length > 0 && (
              <section className="rides-section-modern">
                <h2 className="section-title-modern">Courses en Attente ({pendingRides.length})</h2>
                <div className="rides-grid-modern">
                  {pendingRides.map((ride) => (
                    <div key={ride.id} className="ride-card-stat-style">
                      <div className="ride-card-header-stat">
                        <span className="ride-type-badge-stat">
                          {ride.rideType === 'city_to_airport' ? 'Ville → Aéroport' : 'Aéroport → Ville'}
                        </span>
                        <span className="status-badge-stat status-pending">En attente</span>
                      </div>
                      <div className="ride-card-body-stat">
                        <div className="ride-details-stat">
                          <div className="ride-detail-stat">
                            <MapPin className="ride-detail-icon" />
                            <span>{ride.pickupAddress.substring(0, 30)}...</span>
                          </div>
                          <div className="ride-detail-stat">
                            <Navigation className="ride-detail-icon" />
                            <span>{ride.dropoffAddress.substring(0, 30)}...</span>
                          </div>
                          <div className="ride-detail-stat">
                            <Calendar className="ride-detail-icon" />
                            <span>{new Date(ride.scheduledAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        <div className="ride-price-stat">
                          <DollarSign className="price-icon" />
                          <strong>{typeof ride.price === 'number' ? ride.price.toLocaleString() : Number(ride.price || 0).toLocaleString()} FCFA</strong>
                        </div>
                        <div className="ride-actions-modern">
                          <button
                            className="btn-accept-modern"
                            onClick={() => acceptRideMutation.mutate(ride.id)}
                            disabled={acceptRideMutation.isPending}
                          >
                            <CheckCircle2 className="btn-icon" />
                            Accepter
                          </button>
                          <button
                            className="btn-refuse-modern"
                            onClick={() => refuseRideMutation.mutate(ride.id)}
                            disabled={refuseRideMutation.isPending}
                          >
                            Refuser
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {selectedTab === 'history' && (
          <section className="rides-section-modern">
            <h2 className="section-title-modern">Historique des Courses</h2>
            <div className="filter-controls-modern">
              <button
                className={`filter-btn-modern ${statusFilter === '' ? 'active' : ''}`}
                onClick={() => setStatusFilter('')}
              >
                Toutes
              </button>
              <button
                className={`filter-btn-modern ${statusFilter === 'completed' ? 'active' : ''}`}
                onClick={() => setStatusFilter('completed')}
              >
                Terminées
              </button>
              <button
                className={`filter-btn-modern ${statusFilter === 'cancelled' ? 'active' : ''}`}
                onClick={() => setStatusFilter('cancelled')}
              >
                Annulées
              </button>
            </div>
            <div className="rides-grid-modern">
              {rides.map((ride) => (
                <div 
                  key={ride.id} 
                  className="ride-card-stat-style clickable"
                  onClick={() => navigate(`/driver/track/${ride.id}`)}
                >
                  <div className="ride-card-header-stat">
                    <span className="ride-type-badge-stat">
                      {ride.rideType === 'city_to_airport' ? 'Ville → Aéroport' : 'Aéroport → Ville'}
                    </span>
                    <span className={`status-badge-stat status-${ride.status}`}>
                      {ride.status}
                    </span>
                  </div>
                  <div className="ride-card-body-stat">
                    <div className="ride-details-stat">
                      <div className="ride-detail-stat">
                        <MapPin className="ride-detail-icon" />
                        <span>{ride.pickupAddress.substring(0, 30)}...</span>
                      </div>
                      <div className="ride-detail-stat">
                        <Navigation className="ride-detail-icon" />
                        <span>{ride.dropoffAddress.substring(0, 30)}...</span>
                      </div>
                      <div className="ride-detail-stat">
                        <Calendar className="ride-detail-icon" />
                        <span>{new Date(ride.scheduledAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <div className="ride-price-stat">
                      <DollarSign className="price-icon" />
                      <strong>{typeof ride.price === 'number' ? ride.price.toLocaleString() : Number(ride.price || 0).toLocaleString()} FCFA</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {ridesData && (
              <Pagination
                currentPage={ridesPage}
                totalPages={ridesData.totalPages}
                onPageChange={setRidesPage}
                hasNextPage={ridesData.hasNextPage}
                hasPreviousPage={ridesData.hasPreviousPage}
              />
            )}
            <div className="pagination-info">
              Affichage de {rides.length} sur {ridesData?.total || 0} course(s)
            </div>
          </section>
        )}
      </div>

      {/* Barre de navigation en bas - Style WhatsApp */}
      <DriverBottomNav selectedTab={selectedTab} onTabChange={setSelectedTab} />
    </div>
  );
}

export default DriverDashboard;

