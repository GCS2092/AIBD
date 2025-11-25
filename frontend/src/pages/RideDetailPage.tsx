import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, Ride, Driver } from '../services/adminService';
import { authService } from '../services/authService';
import NavigationBar from '../components/NavigationBar';
import './RideDetailPage.css';

function RideDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  const { data: ride, isLoading: rideLoading } = useQuery({
    queryKey: ['admin-ride', id],
    queryFn: () => adminService.getRideById(id!),
    enabled: !!id,
    refetchInterval: 15000, // Rafraîchir toutes les 15 secondes pour voir les changements de statut
  });

  const { data: drivers } = useQuery({
    queryKey: ['admin-drivers'],
    queryFn: () => adminService.getAllDrivers(),
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  const assignMutation = useMutation({
    mutationFn: (driverId: string) => adminService.assignRideToDriver(id!, driverId),
    onSuccess: () => {
      // Invalider toutes les queries liées pour rafraîchir automatiquement
      queryClient.invalidateQueries({ queryKey: ['admin-ride', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-rides'] });
      queryClient.invalidateQueries({ queryKey: ['admin-drivers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      alert('Course assignée avec succès !');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erreur lors de l\'attribution');
    },
  });

  const availableDrivers = drivers?.filter(d => 
    d.isVerified && 
    (d.status === 'available' || d.status === 'unavailable') &&
    d.id !== ride?.driverId
  ) || [];

  if (rideLoading) {
    return <div className="loading">Chargement...</div>;
  }

  if (!ride) {
    return (
      <div className="error-page">
        <h2>Course non trouvée</h2>
        <Link to="/admin/dashboard" className="btn btn-primary">Retour au dashboard</Link>
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

  return (
    <div className="ride-detail-page">
      <NavigationBar />
      <header className="detail-header">
        <Link to="/admin/dashboard" className="btn-back">← Retour au Dashboard</Link>
        <h1>Détails de la course</h1>
      </header>

      <div className="detail-content">
        {/* Informations client */}
        <section className="info-section">
          <h2>Informations Client</h2>
          <div className="info-grid">
            <div className="info-item">
              <strong>Nom complet:</strong>
              <p>{ride.clientFirstName} {ride.clientLastName}</p>
            </div>
            <div className="info-item">
              <strong>Téléphone:</strong>
              <p>{ride.clientPhone}</p>
            </div>
            <div className="info-item">
              <strong>Email:</strong>
              <p>{ride.clientEmail || 'N/A'}</p>
            </div>
          </div>
        </section>

        {/* Informations course */}
        <section className="info-section">
          <h2>Informations Course</h2>
          <div className="info-grid">
            <div className="info-item">
              <strong>Type:</strong>
              <p>
                {ride.rideType === 'city_to_airport' 
                  ? 'Ville → Aéroport' 
                  : ride.rideType === 'airport_to_city'
                  ? 'Aéroport → Ville'
                  : 'Ville → Ville'}
              </p>
            </div>
            <div className="info-item">
              <strong>Départ:</strong>
              <p>{ride.pickupAddress}</p>
            </div>
            <div className="info-item">
              <strong>Destination:</strong>
              <p>{ride.dropoffAddress}</p>
            </div>
            <div className="info-item">
              <strong>Date prévue:</strong>
              <p>{new Date(ride.scheduledAt).toLocaleString('fr-FR')}</p>
            </div>
            <div className="info-item">
              <strong>Prix:</strong>
              <p className="price">
                {ride.price != null 
                  ? (typeof ride.price === 'number' 
                      ? ride.price.toLocaleString() 
                      : parseFloat(ride.price.toString() || '0').toLocaleString())
                  : '0'} FCFA
              </p>
            </div>
            {ride.flightNumber && (
              <div className="info-item">
                <strong>Numéro de vol:</strong>
                <p>{ride.flightNumber}</p>
              </div>
            )}
            <div className="info-item">
              <strong>Statut:</strong>
              <span 
                className="status-badge" 
                style={{ backgroundColor: getStatusColor(ride.status) }}
              >
                {getStatusLabel(ride.status)}
              </span>
            </div>
          </div>
        </section>

        {/* Chauffeur assigné */}
        {ride.driver ? (
          <section className="info-section">
            <h2>Chauffeur Assigné</h2>
            <div className="driver-info">
              <p><strong>Nom:</strong> {ride.driver.user?.firstName} {ride.driver.user?.lastName}</p>
              <p><strong>Email:</strong> {ride.driver.user?.email || 'N/A'}</p>
              <p><strong>Téléphone:</strong> {ride.driver.user?.phone || 'N/A'}</p>
              <p><strong>Permis:</strong> {ride.driver.licenseNumber || 'N/A'}</p>
              <p><strong>Statut:</strong> {ride.driver.status}</p>
            </div>
          </section>
        ) : (
          <section className="info-section">
            <h2>Attribuer un Chauffeur</h2>
            {availableDrivers.length > 0 ? (
              <div className="assign-section">
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="driver-select"
                >
                  <option value="">Sélectionner un chauffeur</option>
                  {availableDrivers.map((driver: Driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.user?.firstName} {driver.user?.lastName} 
                      {' - '}
                      {driver.user?.email || 'N/A'} 
                      {' - '}
                      {driver.status === 'available' ? '✅ Disponible' : '⏸️ Indisponible'}
                    </option>
                  ))}
                </select>
                <button
                  className="btn-assign"
                  onClick={() => {
                    if (selectedDriverId) {
                      if (confirm('Êtes-vous sûr de vouloir attribuer cette course à ce chauffeur ?')) {
                        assignMutation.mutate(selectedDriverId);
                      }
                    } else {
                      alert('Veuillez sélectionner un chauffeur');
                    }
                  }}
                  disabled={!selectedDriverId || assignMutation.isPending}
                >
                  {assignMutation.isPending ? 'Attribution...' : 'Attribuer la course'}
                </button>
              </div>
            ) : (
              <p className="no-drivers">Aucun chauffeur disponible pour le moment.</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default RideDetailPage;

