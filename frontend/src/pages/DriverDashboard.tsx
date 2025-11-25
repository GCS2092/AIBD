import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '../hooks/useWebSocket';
import { driverService } from '../services/driverService';
import type { DriverProfile, Ride } from '../services/driverService';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import Pagination from '../components/Pagination';
import './DriverDashboard.css';

function DriverDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [ridesPage, setRidesPage] = useState(1);
  const [pageSize] = useState(10);

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
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
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

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => driverService.updateStatus(status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-profile'] });
      queryClient.invalidateQueries({ queryKey: ['driver-available-rides'] });
    },
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
    const interval = setInterval(fetchUnreadCount, 30000); // Toutes les 30 secondes (fallback)
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const pendingRides = rides.filter(r => r.status === 'pending');
  const activeRides = rides.filter(r => r.status === 'accepted' || r.status === 'in_progress');
  const completedRides = rides.filter(r => r.status === 'completed');

  return (
    <div className="driver-dashboard">
      <NavigationBar />
      <header className="dashboard-header">
        <div>
          <h1>Dashboard Chauffeur</h1>
          <p className="driver-name">
            {profile?.user.firstName} {profile?.user.lastName}
          </p>
        </div>
        <div className="header-actions">
          <button className="btn-notifications" onClick={() => navigate('/driver/notifications')}>
            🔔 Notifications {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Profil et statut */}
        <section className="profile-section">
          <div className="profile-card">
            <div className="profile-header">
              <h3>Mon Profil</h3>
              <button
                className="btn-edit-profile"
                onClick={() => navigate('/driver/profile/edit')}
              >
                ✏️ Modifier
              </button>
            </div>
            <div className="profile-info">
              <div className="profile-row">
                <p><strong>Nom complet:</strong> {profile?.user?.firstName} {profile?.user?.lastName}</p>
              </div>
              <div className="profile-row">
                <p><strong>Email:</strong> {profile?.user?.email}</p>
              </div>
              <div className="profile-row">
                <p><strong>Téléphone:</strong> {profile?.user?.phone}</p>
              </div>
              <div className="profile-row">
                <p><strong>Permis:</strong> {profile?.licenseNumber}</p>
              </div>
              <div className="profile-row">
                <p><strong>Note:</strong> {
                  profile?.rating != null 
                    ? (typeof profile.rating === 'number' 
                        ? profile.rating.toFixed(1) 
                        : parseFloat(profile.rating.toString() || '0').toFixed(1))
                    : '0.0'
                } ⭐ ({profile?.totalRides || 0} courses)</p>
              </div>
              <div className="profile-row">
                <p><strong>Statut:</strong> 
                  <span className={`status-badge status-${profile?.status}`}>
                    {profile?.status === 'available' ? 'Disponible' : 
                     profile?.status === 'unavailable' ? 'Indisponible' : 
                     profile?.status === 'on_break' ? 'En pause' : 
                     profile?.status === 'on_ride' ? 'En course' : profile?.status}
                  </span>
                </p>
              </div>
              {profile?.vehicles && profile.vehicles.length > 0 && (
                <div className="profile-row">
                  <p><strong>Véhicule:</strong> {profile.vehicles[0].brand} {profile.vehicles[0].model} ({profile.vehicles[0].licensePlate})</p>
                </div>
              )}
            </div>
            <div className="status-controls">
              <button
                className={`btn-status ${profile?.status === 'available' ? 'active' : ''}`}
                onClick={() => updateStatusMutation.mutate('available')}
                disabled={updateStatusMutation.isPending}
              >
                Disponible
              </button>
              <button
                className={`btn-status ${profile?.status === 'unavailable' ? 'active' : ''}`}
                onClick={() => updateStatusMutation.mutate('unavailable')}
                disabled={updateStatusMutation.isPending}
              >
                Indisponible
              </button>
            </div>
            {(!profile?.vehicles || profile.vehicles.length === 0) && (
              <div className="vehicle-section">
                <p>Vous n'avez pas encore enregistré de véhicule.</p>
                <button
                  className="btn-register-vehicle"
                  onClick={() => navigate('/driver/vehicle/register')}
                >
                  🚗 Enregistrer mon véhicule
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Courses disponibles */}
        {availableRides && availableRides.length > 0 && (
          <section className="rides-section">
            <h2>Courses Disponibles ({availableRides.length})</h2>
            <div className="rides-list">
              {availableRides.map((ride) => (
                <div key={ride.id} className="ride-card available">
                  <div className="ride-info">
                    <h4>{ride.rideType === 'city_to_airport' ? 'Ville → Aéroport' : 'Aéroport → Ville'}</h4>
                    <p><strong>Départ:</strong> {ride.pickupAddress}</p>
                    <p><strong>Arrivée:</strong> {ride.dropoffAddress}</p>
                    <p><strong>Date:</strong> {new Date(ride.scheduledAt).toLocaleString('fr-FR')}</p>
                    <p><strong>Prix:</strong> {ride.price} FCFA</p>
                  </div>
                  <div className="ride-actions">
                    <button
                      className="btn-accept"
                      onClick={() => {
                        if (confirm('Voulez-vous accepter cette course ?')) {
                          acceptRideMutation.mutate(ride.id);
                        }
                      }}
                      disabled={acceptRideMutation.isPending}
                    >
                      ✅ Accepter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Courses en attente */}
        {pendingRides.length > 0 && (
          <section className="rides-section">
            <h2>Mes Courses en Attente ({pendingRides.length})</h2>
            <div className="rides-list">
              {pendingRides.map((ride) => (
                <div key={ride.id} className="ride-card pending">
                  <div className="ride-info">
                    <h4>{ride.rideType === 'city_to_airport' ? 'Ville → Aéroport' : 'Aéroport → Ville'}</h4>
                    <p><strong>Départ:</strong> {ride.pickupAddress}</p>
                    <p><strong>Arrivée:</strong> {ride.dropoffAddress}</p>
                    <p><strong>Date:</strong> {new Date(ride.scheduledAt).toLocaleString('fr-FR')}</p>
                    <p><strong>Prix:</strong> {ride.price} FCFA</p>
                  </div>
                  <div className="ride-actions">
                    <button
                      className="btn-accept"
                      onClick={() => acceptRideMutation.mutate(ride.id)}
                      disabled={acceptRideMutation.isPending}
                    >
                      ✅ Accepter
                    </button>
                    <button
                      className="btn-refuse"
                      onClick={() => refuseRideMutation.mutate(ride.id)}
                      disabled={refuseRideMutation.isPending}
                    >
                      ❌ Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Courses actives */}
        {activeRides.length > 0 && (
          <section className="rides-section">
            <h2>Courses en Cours ({activeRides.length})</h2>
            <div className="rides-list">
              {activeRides.map((ride) => (
                <div key={ride.id} className="ride-card active">
                  <div className="ride-info">
                    <h4>{ride.rideType === 'city_to_airport' ? 'Ville → Aéroport' : 'Aéroport → Ville'}</h4>
                    <p><strong>Départ:</strong> {ride.pickupAddress}</p>
                    <p><strong>Arrivée:</strong> {ride.dropoffAddress}</p>
                    <p><strong>Date:</strong> {new Date(ride.scheduledAt).toLocaleString('fr-FR')}</p>
                    <p><strong>Prix:</strong> {ride.price} FCFA</p>
                  </div>
                  <div className="ride-actions">
                    {ride.status === 'accepted' && (
                      <button
                        className="btn-start"
                        onClick={() => startRideMutation.mutate(ride.id)}
                        disabled={startRideMutation.isPending}
                      >
                        🚗 Démarrer
                      </button>
                    )}
                    {ride.status === 'in_progress' && (
                      <button
                        className="btn-complete"
                        onClick={() => completeRideMutation.mutate(ride.id)}
                        disabled={completeRideMutation.isPending}
                      >
                        ✅ Terminer
                      </button>
                    )}
                    <button
                      className="btn-track"
                      onClick={() => navigate(`/track/${ride.id}`)}
                    >
                      📍 Suivre
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Historique */}
        <section className="rides-section">
          <h2>Historique des Courses</h2>
          <div className="filter-controls">
            <button
              className={`filter-btn ${statusFilter === '' ? 'active' : ''}`}
              onClick={() => setStatusFilter('')}
            >
              Toutes
            </button>
            <button
              className={`filter-btn ${statusFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setStatusFilter('completed')}
            >
              Terminées
            </button>
            <button
              className={`filter-btn ${statusFilter === 'cancelled' ? 'active' : ''}`}
              onClick={() => setStatusFilter('cancelled')}
            >
              Annulées
            </button>
          </div>
          <div className="rides-list">
            {rides.map((ride) => (
              <div key={ride.id} className="ride-card">
                <div className="ride-info">
                  <h4>{ride.rideType === 'city_to_airport' ? 'Ville → Aéroport' : 'Aéroport → Ville'}</h4>
                  <p><strong>Départ:</strong> {ride.pickupAddress}</p>
                  <p><strong>Arrivée:</strong> {ride.dropoffAddress}</p>
                  <p><strong>Date:</strong> {new Date(ride.scheduledAt).toLocaleString('fr-FR')}</p>
                  <p><strong>Prix:</strong> {ride.price} FCFA</p>
                </div>
                <div className="ride-status">
                  <span className={`status-badge status-${ride.status}`}>
                    {ride.status}
                  </span>
                </div>
              </div>
            ))}
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
          </div>
        </section>
      </div>
    </div>
  );
}

export default DriverDashboard;

