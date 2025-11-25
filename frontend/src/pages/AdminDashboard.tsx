import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '../hooks/useWebSocket';
import { adminService } from '../services/adminService';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { pricingService, Pricing, CreatePricingDto } from '../services/pricingService';
import Pagination from '../components/Pagination';
import NavigationBar from '../components/NavigationBar';
import './AdminDashboard.css';

function PricingManagement() {
  const queryClient = useQueryClient();
  const [pricingFilter, setPricingFilter] = useState<'all' | 'dakar_to_airport' | 'airport_to_dakar'>('all');
  const [pricingTypeFilter, setPricingTypeFilter] = useState<'all' | 'standard' | 'peak_hours' | 'night' | 'special'>('all');
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [editingPricing, setEditingPricing] = useState<Pricing | null>(null);
  const [showInactivePricing, setShowInactivePricing] = useState(false);

  const { data: allPricing, isLoading } = useQuery({
    queryKey: ['pricing', showInactivePricing],
    queryFn: () => pricingService.getAllPricing(undefined, showInactivePricing),
  });

  const filteredPricing = allPricing?.filter(pricing => {
    if (pricingFilter !== 'all' && pricing.rideType !== pricingFilter) return false;
    if (pricingTypeFilter !== 'all' && pricing.type !== pricingTypeFilter) return false;
    if (!showInactivePricing && !pricing.isActive) return false;
    return true;
  }) || [];

  const createPricingMutation = useMutation({
    mutationFn: (data: CreatePricingDto) => pricingService.createPricing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
      setShowPricingModal(false);
      setEditingPricing(null);
    },
  });

  const updatePricingMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePricingDto> }) =>
      pricingService.updatePricing(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
      setShowPricingModal(false);
      setEditingPricing(null);
    },
  });

  const deletePricingMutation = useMutation({
    mutationFn: (id: string) => pricingService.deletePricing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
    },
  });

  const togglePricingActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      pricingService.updatePricing(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
    },
  });

  return (
    <section className="pricing-section">
      <div className="section-header">
        <h2>Gestion des Tarifs</h2>
        <button
          className="btn-primary"
          onClick={() => {
            setEditingPricing(null);
            setShowPricingModal(true);
          }}
        >
          + Nouveau Tarif
        </button>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Type de trajet:</label>
          <select
            value={pricingFilter}
            onChange={(e) => setPricingFilter(e.target.value as any)}
          >
            <option value="all">Tous</option>
            <option value="dakar_to_airport">Dakar → Aéroport</option>
            <option value="airport_to_dakar">Aéroport → Dakar</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Type de tarif:</label>
          <select
            value={pricingTypeFilter}
            onChange={(e) => setPricingTypeFilter(e.target.value as any)}
          >
            <option value="all">Tous</option>
            <option value="standard">Standard</option>
            <option value="peak_hours">Heures de pointe</option>
            <option value="night">Nuit</option>
            <option value="special">Spécial</option>
          </select>
        </div>
        <div className="filter-group">
          <label>
            <input
              type="checkbox"
              checked={showInactivePricing}
              onChange={(e) => setShowInactivePricing(e.target.checked)}
            />
            Afficher les tarifs inactifs
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Chargement...</div>
      ) : (
        <div className="pricing-list">
          {filteredPricing.length === 0 ? (
            <div className="no-data">Aucun tarif trouvé</div>
          ) : (
            <table className="pricing-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Type de trajet</th>
                  <th>Type</th>
                  <th>Prix (FCFA)</th>
                  <th>Horaires</th>
                  <th>Jours</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPricing.map((pricing) => (
                  <tr key={pricing.id} className={!pricing.isActive ? 'inactive' : ''}>
                    <td>{pricing.name}</td>
                    <td>
                      {pricing.rideType === 'dakar_to_airport' ? 'Dakar → Aéroport' : 'Aéroport → Dakar'}
                    </td>
                    <td>
                      <span className={`pricing-type-badge type-${pricing.type}`}>
                        {pricing.type === 'standard' ? 'Standard' :
                         pricing.type === 'peak_hours' ? 'Heures de pointe' :
                         pricing.type === 'night' ? 'Nuit' : 'Spécial'}
                      </span>
                    </td>
                    <td>{parseFloat(pricing.price.toString()).toLocaleString()}</td>
                    <td>
                      {pricing.startTime && pricing.endTime
                        ? `${pricing.startTime} - ${pricing.endTime}`
                        : 'Toute la journée'}
                    </td>
                    <td>
                      {pricing.daysOfWeek && pricing.daysOfWeek.length > 0
                        ? pricing.daysOfWeek.map(d => ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][d]).join(', ')
                        : 'Tous les jours'}
                    </td>
                    <td>
                      <span className={`status-badge ${pricing.isActive ? 'status-active' : 'status-inactive'}`}>
                        {pricing.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-edit"
                          onClick={() => {
                            setEditingPricing(pricing);
                            setShowPricingModal(true);
                          }}
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          className={pricing.isActive ? 'btn-deactivate' : 'btn-activate'}
                          onClick={() =>
                            togglePricingActiveMutation.mutate({
                              id: pricing.id,
                              isActive: !pricing.isActive,
                            })
                          }
                          disabled={togglePricingActiveMutation.isPending}
                        >
                          {pricing.isActive ? '⏸️ Désactiver' : '▶️ Activer'}
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => {
                            if (confirm('Êtes-vous sûr de vouloir supprimer ce tarif ?')) {
                              deletePricingMutation.mutate(pricing.id);
                            }
                          }}
                          disabled={deletePricingMutation.isPending}
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showPricingModal && (
        <PricingModal
          pricing={editingPricing}
          onClose={() => {
            setShowPricingModal(false);
            setEditingPricing(null);
          }}
          onSave={(data) => {
            if (editingPricing) {
              updatePricingMutation.mutate({ id: editingPricing.id, data });
            } else {
              createPricingMutation.mutate(data);
            }
          }}
          isSaving={createPricingMutation.isPending || updatePricingMutation.isPending}
        />
      )}
    </section>
  );
}

function PricingModal({
  pricing,
  onClose,
  onSave,
  isSaving,
}: {
  pricing: Pricing | null;
  onClose: () => void;
  onSave: (data: CreatePricingDto) => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState<CreatePricingDto>({
    name: '',
    rideType: 'dakar_to_airport',
    type: 'standard',
    price: 0,
    startTime: '',
    endTime: '',
    daysOfWeek: [],
    isActive: true,
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (pricing) {
      setFormData({
        name: pricing.name,
        rideType: pricing.rideType,
        type: pricing.type,
        price: parseFloat(pricing.price.toString()),
        startTime: pricing.startTime || '',
        endTime: pricing.endTime || '',
        daysOfWeek: pricing.daysOfWeek || [],
        isActive: pricing.isActive,
        description: pricing.description || '',
      });
    } else {
      setFormData({
        name: '',
        rideType: 'dakar_to_airport',
        type: 'standard',
        price: 0,
        startTime: '',
        endTime: '',
        daysOfWeek: [],
        isActive: true,
        description: '',
      });
    }
  }, [pricing]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Le nom est requis';
    }
    if (!formData.rideType) {
      newErrors.rideType = 'Le type de trajet est requis';
    }
    if (!formData.type) {
      newErrors.type = 'Le type de tarif est requis';
    }
    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Le prix doit être supérieur à 0';
    }
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'L\'heure de fin doit être après l\'heure de début';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitData: CreatePricingDto = {
      ...formData,
      startTime: formData.startTime || undefined,
      endTime: formData.endTime || undefined,
      daysOfWeek: formData.daysOfWeek.length > 0 ? formData.daysOfWeek : undefined,
      description: formData.description || undefined,
    };

    onSave(submitData);
  };

  const toggleDay = (day: number) => {
    const days = formData.daysOfWeek || [];
    if (days.includes(day)) {
      setFormData({ ...formData, daysOfWeek: days.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, daysOfWeek: [...days, day] });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{pricing ? 'Modifier le Tarif' : 'Nouveau Tarif'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="pricing-form">
          <div className="form-group">
            <label>Nom du tarif *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              className={errors.name ? 'error' : ''}
              placeholder="Ex: Dakar → Aéroport Standard"
              required
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Type de trajet *</label>
              <select
                value={formData.rideType}
                onChange={(e) => setFormData({ ...formData, rideType: e.target.value })}
                required
              >
                <option value="dakar_to_airport">Dakar → Aéroport</option>
                <option value="airport_to_dakar">Aéroport → Dakar</option>
              </select>
            </div>
            <div className="form-group">
              <label>Type de tarif *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                required
              >
                <option value="standard">Standard</option>
                <option value="peak_hours">Heures de pointe</option>
                <option value="night">Nuit</option>
                <option value="special">Spécial</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Prix (FCFA) *</label>
            <input
              type="number"
              min="0"
              step="100"
              value={formData.price}
              onChange={(e) => {
                setFormData({ ...formData, price: parseFloat(e.target.value) || 0 });
                if (errors.price) setErrors({ ...errors, price: '' });
              }}
              className={errors.price ? 'error' : ''}
              required
            />
            {errors.price && <span className="field-error">{errors.price}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Heure de début</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Heure de fin</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => {
                  setFormData({ ...formData, endTime: e.target.value });
                  if (errors.endTime) setErrors({ ...errors, endTime: '' });
                }}
                className={errors.endTime ? 'error' : ''}
              />
              {errors.endTime && <span className="field-error">{errors.endTime}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Jours de la semaine</label>
            <div className="days-selector">
              {['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map((day, index) => (
                <label key={index} className="day-checkbox">
                  <input
                    type="checkbox"
                    checked={(formData.daysOfWeek || []).includes(index)}
                    onChange={() => toggleDay(index)}
                  />
                  <span>{day.substring(0, 3)}</span>
                </label>
              ))}
            </div>
            <small>Laissez vide pour tous les jours</small>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Description optionnelle du tarif"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <span>Tarif actif</span>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Annuler
            </button>
            <button type="submit" className="btn-submit" disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : pricing ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'drivers' | 'rides' | 'pricing' | 'vehicles'>('overview');
  const [driverFilter, setDriverFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [rideFilter, setRideFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [rideSearch, setRideSearch] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('all');
  const [pricingFilter, setPricingFilter] = useState<'all' | 'dakar_to_airport' | 'airport_to_dakar'>('all');
  const [pricingTypeFilter, setPricingTypeFilter] = useState<'all' | 'standard' | 'peak_hours' | 'night' | 'special'>('all');
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [editingPricing, setEditingPricing] = useState<Pricing | null>(null);
  const [showInactivePricing, setShowInactivePricing] = useState(false);
  const [vehicleDriverFilter, setVehicleDriverFilter] = useState<string>('all');
  
  // États de pagination
  const [driversPage, setDriversPage] = useState(1);
  const [ridesPage, setRidesPage] = useState(1);
  const [vehiclesPage, setVehiclesPage] = useState(1);
  const [pageSize] = useState(10); // Taille de page fixe

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setDriversPage(1);
  }, [driverFilter]);

  useEffect(() => {
    setRidesPage(1);
  }, [rideFilter, rideSearch, selectedDriverId]);

  useEffect(() => {
    setVehiclesPage(1);
  }, [vehicleDriverFilter]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminService.getDashboardStats(),
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  const { data: driversData, isLoading: driversLoading } = useQuery({
    queryKey: ['admin-drivers', driversPage],
    queryFn: () => adminService.getAllDrivers(driversPage, pageSize),
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  const { data: ridesData, isLoading: ridesLoading } = useQuery({
    queryKey: ['admin-rides', rideFilter, rideSearch, selectedDriverId, ridesPage],
    queryFn: () => adminService.getAllRides(ridesPage, pageSize, {
      status: rideFilter !== 'all' ? rideFilter as any : undefined,
      driverId: selectedDriverId !== 'all' ? selectedDriverId : undefined,
      search: rideSearch || undefined,
    }),
    refetchInterval: 20000, // Rafraîchir toutes les 20 secondes
  });

  const { data: vehiclesData, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['admin-vehicles', vehicleDriverFilter, vehiclesPage],
    queryFn: () => adminService.getAllVehicles(vehiclesPage, pageSize, vehicleDriverFilter !== 'all' ? vehicleDriverFilter : undefined),
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  // Extraire les données et métadonnées de pagination
  const drivers = driversData?.data || [];
  const rides = ridesData?.data || [];
  const vehicles = vehiclesData?.data || [];

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

  const verifyDriverMutation = useMutation({
    mutationFn: (driverId: string) => adminService.updateDriver(driverId, { isVerified: true }),
    onSuccess: () => {
      // Invalider toutes les queries liées pour rafraîchir automatiquement
      queryClient.invalidateQueries({ queryKey: ['admin-drivers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-vehicles'] });
    },
  });

  // Les filtres sont maintenant gérés côté serveur via les query params
  // Pas besoin de filteredDrivers/filteredRides car la pagination se fait côté serveur

  // Écouter les événements de changement d'onglet depuis la navigation
  // IMPORTANT: Ce useEffect doit être AVANT tout return conditionnel pour respecter les règles des hooks
  useEffect(() => {
    const handleSwitchTab = (event: CustomEvent) => {
      const tab = event.detail as 'overview' | 'drivers' | 'rides' | 'pricing' | 'vehicles';
      setSelectedTab(tab);
    };

    window.addEventListener('switchTab', handleSwitchTab as EventListener);
    return () => {
      window.removeEventListener('switchTab', handleSwitchTab as EventListener);
    };
  }, []);

  if (statsLoading || driversLoading || ridesLoading) {
    return <div className="dashboard-loading">Chargement...</div>;
  }

  return (
    <div className="admin-dashboard">
      <NavigationBar />
      <header className="dashboard-header">
        <h1>Dashboard Administrateur</h1>
        <div className="header-actions">
          <button className="btn-notifications" onClick={() => navigate('/admin/notifications')}>
            🔔 Notifications {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>
        </div>
      </header>

      <div className="dashboard-tabs">
        <button 
          className={selectedTab === 'overview' ? 'active' : ''}
          onClick={() => setSelectedTab('overview')}
        >
          Vue d'ensemble
        </button>
        <button 
          className={selectedTab === 'drivers' ? 'active' : ''}
          onClick={() => setSelectedTab('drivers')}
        >
          Chauffeurs
        </button>
        <button 
          className={selectedTab === 'rides' ? 'active' : ''}
          onClick={() => setSelectedTab('rides')}
        >
          Courses
        </button>
        <button 
          className={selectedTab === 'pricing' ? 'active' : ''}
          onClick={() => setSelectedTab('pricing')}
        >
          Tarifs
        </button>
        <button 
          className={selectedTab === 'vehicles' ? 'active' : ''}
          onClick={() => setSelectedTab('vehicles')}
        >
          Véhicules
        </button>
      </div>

      <div className="dashboard-content">
        {selectedTab === 'overview' && (
          <>
            {/* Statistiques principales */}
            <section className="stats-section">
              <h2>Statistiques Générales</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Courses</h3>
                  <p className="stat-value">{stats?.rides.total || 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Courses Terminées</h3>
                  <p className="stat-value">{stats?.rides.completed || 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Courses en Attente</h3>
                  <p className="stat-value">{stats?.rides.pending || 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Chauffeurs Actifs</h3>
                  <p className="stat-value">{stats?.drivers.active || 0} / {stats?.drivers.total || 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Revenus Totaux</h3>
                  <p className="stat-value">
                    {stats?.revenue?.total 
                      ? (typeof stats.revenue.total === 'number' 
                          ? stats.revenue.total.toLocaleString() 
                          : parseFloat(stats.revenue.total.toString() || '0').toLocaleString())
                      : '0'} FCFA
                  </p>
                </div>
                <div className="stat-card">
                  <h3>Note Moyenne</h3>
                  <p className="stat-value">
                    {stats?.drivers?.avgRating 
                      ? parseFloat(stats.drivers.avgRating.toString()).toFixed(1)
                      : '0.0'} ⭐
                  </p>
                </div>
              </div>
            </section>

            {/* Métriques de performance */}
            <section className="metrics-section">
              <h2>Métriques de Performance</h2>
              <div className="metrics-grid">
                <div className="metric-card">
                  <h3>Taux d'Acceptation</h3>
                  <p className="metric-value">{stats?.metrics?.acceptanceRate || 0}%</p>
                  <p className="metric-detail">
                    {stats?.rides.accepted || 0} acceptées / {stats?.rides.assigned || 0} assignées
                  </p>
                </div>
                <div className="metric-card">
                  <h3>Taux d'Annulation</h3>
                  <p className="metric-value">{stats?.metrics?.cancellationRate || 0}%</p>
                  <p className="metric-detail">
                    {stats?.rides.cancelled || 0} annulées / {stats?.rides.total || 0} total
                  </p>
                </div>
                <div className="metric-card">
                  <h3>Temps de Réponse Moyen</h3>
                  <p className="metric-value">
                    {stats?.metrics?.avgResponseTimeMinutes 
                      ? parseFloat(stats.metrics.avgResponseTimeMinutes.toString()).toFixed(1)
                      : '0'} min
                  </p>
                  <p className="metric-detail">Temps moyen d'acceptation</p>
                </div>
              </div>
            </section>

            {/* Courses récentes */}
            <section className="rides-section">
              <h2>Courses Récentes</h2>
              <div className="rides-list">
                {rides?.slice(0, 5).map((ride) => (
                  <div key={ride.id} className="ride-card">
                    <div className="ride-info">
                      <h4>{ride.rideType === 'city_to_airport' ? 'Ville → Aéroport' : ride.rideType === 'airport_to_city' ? 'Aéroport → Ville' : 'Ville → Ville'}</h4>
                      <p><strong>Client:</strong> {ride.clientFirstName} {ride.clientLastName}</p>
                      <p><strong>Téléphone:</strong> {ride.clientPhone}</p>
                      <p><strong>Email:</strong> {ride.clientEmail}</p>
                      <p><strong>Départ:</strong> {ride.pickupAddress}</p>
                      <p><strong>Arrivée:</strong> {ride.dropoffAddress}</p>
                      <p><strong>Date:</strong> {new Date(ride.scheduledAt).toLocaleString('fr-FR')}</p>
                      <p><strong>Prix:</strong> {
                        ride.price != null 
                          ? (typeof ride.price === 'number' 
                              ? ride.price.toLocaleString() 
                              : parseFloat(ride.price.toString() || '0').toLocaleString())
                          : '0'
                      } FCFA</p>
                    </div>
                    <div className="ride-status">
                      <span className={`status-badge status-${ride.status}`}>
                        {ride.status}
                      </span>
                      {ride.driver && (
                        <p>Chauffeur: {ride.driver.user?.firstName} {ride.driver.user?.lastName}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {selectedTab === 'drivers' && (
          <section className="drivers-section">
            <div className="section-header">
              <h2>Gestion des Chauffeurs</h2>
              <div className="filters">
                <button 
                  className={driverFilter === 'all' ? 'active' : ''}
                  onClick={() => setDriverFilter('all')}
                >
                  Tous
                </button>
                <button 
                  className={driverFilter === 'verified' ? 'active' : ''}
                  onClick={() => setDriverFilter('verified')}
                >
                  Vérifiés
                </button>
                <button 
                  className={driverFilter === 'unverified' ? 'active' : ''}
                  onClick={() => setDriverFilter('unverified')}
                >
                  Non vérifiés
                </button>
              </div>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Permis</th>
                    <th>Statut</th>
                    <th>Vérifié</th>
                    <th>Courses</th>
                    <th>Note</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers
                    .filter((driver) => {
                      if (driverFilter === 'verified') return driver.isVerified;
                      if (driverFilter === 'unverified') return !driver.isVerified;
                      return true;
                    })
                    .map((driver) => (
                    <tr key={driver.id}>
                      <td>{driver.user?.firstName} {driver.user?.lastName}</td>
                      <td>{driver.user?.email || 'N/A'}</td>
                      <td>{driver.user?.phone || 'N/A'}</td>
                      <td>{driver.licenseNumber || 'N/A'}</td>
                      <td>
                        <span className={`status-badge status-${driver.status}`}>
                          {driver.status}
                        </span>
                      </td>
                      <td>{driver.isVerified ? '✅' : '❌'}</td>
                      <td>{driver.totalRides || 0}</td>
                      <td>
                        {driver.rating != null 
                          ? (typeof driver.rating === 'number' 
                              ? driver.rating.toFixed(1) 
                              : parseFloat(driver.rating.toString() || '0').toFixed(1))
                          : '0.0'} ⭐
                      </td>
                      <td>
                        {!driver.isVerified && (
                          <button
                            className="btn-verify"
                            onClick={() => verifyDriverMutation.mutate(driver.id)}
                            disabled={verifyDriverMutation.isPending}
                          >
                            Valider
                          </button>
                        )}
                        <button
                          className="btn-edit"
                          onClick={() => navigate(`/admin/drivers/${driver.id}/edit`)}
                        >
                          Modifier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {driversData && (
                <Pagination
                  currentPage={driversPage}
                  totalPages={driversData.totalPages}
                  onPageChange={setDriversPage}
                  hasNextPage={driversData.hasNextPage}
                  hasPreviousPage={driversData.hasPreviousPage}
                />
              )}
              <div className="pagination-info">
                Affichage de {drivers.length} sur {driversData?.total || 0} chauffeur(s)
              </div>
            </div>
          </section>
        )}

        {selectedTab === 'rides' && (
          <section className="rides-section">
            <div className="section-header">
              <h2>Gestion des Courses</h2>
              <div className="filters-container">
                <div className="filters">
                  <button 
                    className={rideFilter === 'all' ? 'active' : ''}
                    onClick={() => setRideFilter('all')}
                  >
                    Toutes
                  </button>
                  <button 
                    className={rideFilter === 'pending' ? 'active' : ''}
                    onClick={() => setRideFilter('pending')}
                  >
                    En attente
                  </button>
                  <button 
                    className={rideFilter === 'completed' ? 'active' : ''}
                    onClick={() => setRideFilter('completed')}
                  >
                    Terminées
                  </button>
                  <button 
                    className={rideFilter === 'cancelled' ? 'active' : ''}
                    onClick={() => setRideFilter('cancelled')}
                  >
                    Annulées
                  </button>
                </div>
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Rechercher par nom, prénom, téléphone ou email..."
                    value={rideSearch}
                    onChange={(e) => setRideSearch(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className="filter-group">
                  <label htmlFor="driverFilter">Filtrer par chauffeur:</label>
                  <select
                    id="driverFilter"
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Tous les chauffeurs</option>
                    {drivers?.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.user?.firstName} {driver.user?.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="rides-list">
              {rides.map((ride) => (
                <div key={ride.id} className="ride-card">
                  <div className="ride-info">
                    <h4>{ride.rideType === 'city_to_airport' ? 'Ville → Aéroport' : ride.rideType === 'airport_to_city' ? 'Aéroport → Ville' : 'Ville → Ville'}</h4>
                    <p><strong>Client:</strong> {ride.clientFirstName} {ride.clientLastName}</p>
                    <p><strong>Téléphone:</strong> {ride.clientPhone}</p>
                    <p><strong>Email:</strong> {ride.clientEmail}</p>
                    <p><strong>Départ:</strong> {ride.pickupAddress}</p>
                    <p><strong>Arrivée:</strong> {ride.dropoffAddress}</p>
                    <p><strong>Date:</strong> {new Date(ride.scheduledAt).toLocaleString('fr-FR')}</p>
                    <p><strong>Prix:</strong> {
                      ride.price != null 
                        ? (typeof ride.price === 'number' 
                            ? ride.price.toLocaleString() 
                            : parseFloat(ride.price.toString() || '0').toLocaleString())
                        : '0'
                    } FCFA</p>
                    {ride.flightNumber && <p><strong>Vol:</strong> {ride.flightNumber}</p>}
                  </div>
                  <div className="ride-status">
                    <span className={`status-badge status-${ride.status}`}>
                      {ride.status}
                    </span>
                    {ride.driver && (
                      <p>Chauffeur: {ride.driver.user?.firstName} {ride.driver.user?.lastName}</p>
                    )}
                    <Link
                      to={`/admin/rides/${ride.id}`}
                      className="btn-view"
                    >
                      Voir détails
                    </Link>
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
        )}

        {selectedTab === 'pricing' && <PricingManagement />}

        {selectedTab === 'vehicles' && (
          <section className="vehicles-section">
            <div className="section-header">
              <h2>Gestion des Véhicules</h2>
              <div className="filter-group">
                <label htmlFor="vehicleDriverFilter">Filtrer par chauffeur:</label>
                <select
                  id="vehicleDriverFilter"
                  value={vehicleDriverFilter}
                  onChange={(e) => setVehicleDriverFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Tous les chauffeurs</option>
                  {drivers?.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.user?.firstName} {driver.user?.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {vehiclesLoading ? (
              <div className="loading">Chargement...</div>
            ) : vehicles && vehicles.length > 0 ? (
              <div className="table-container">
                <table className="vehicles-table">
                  <thead>
                    <tr>
                      <th>Chauffeur</th>
                      <th>Marque</th>
                      <th>Modèle</th>
                      <th>Immatriculation</th>
                      <th>Couleur</th>
                      <th>Année</th>
                      <th>Places</th>
                      <th>Statut</th>
                      <th>Date d'enregistrement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((vehicle) => (
                      <tr key={vehicle.id} className={!vehicle.isActive ? 'inactive' : ''}>
                        <td>
                          {vehicle.driver?.user 
                            ? `${vehicle.driver.user.firstName} ${vehicle.driver.user.lastName}`
                            : 'N/A'}
                        </td>
                        <td>{vehicle.brand}</td>
                        <td>{vehicle.model}</td>
                        <td><strong>{vehicle.licensePlate}</strong></td>
                        <td>{vehicle.color || 'N/A'}</td>
                        <td>{vehicle.year || 'N/A'}</td>
                        <td>{vehicle.capacity || 'N/A'}</td>
                        <td>
                          <span className={`status-badge ${vehicle.isActive ? 'status-active' : 'status-inactive'}`}>
                            {vehicle.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td>{new Date(vehicle.createdAt).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {vehiclesData && (
                  <Pagination
                    currentPage={vehiclesPage}
                    totalPages={vehiclesData.totalPages}
                    onPageChange={setVehiclesPage}
                    hasNextPage={vehiclesData.hasNextPage}
                    hasPreviousPage={vehiclesData.hasPreviousPage}
                  />
                )}
                <div className="pagination-info">
                  Affichage de {vehicles.length} sur {vehiclesData?.total || 0} véhicule(s)
                </div>
              </div>
            ) : (
              <div className="no-data">Aucun véhicule enregistré</div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
