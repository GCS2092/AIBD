import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '../hooks/useWebSocket';
import { adminService } from '../services/adminService';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { pricingService, Pricing, CreatePricingDto } from '../services/pricingService';
import { websocketService } from '../services/websocketService';
import Pagination from '../components/Pagination';
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  DollarSign, 
  Truck, 
  Clock, 
  Wifi, 
  WifiOff,
  CheckCircle2,
  Hourglass,
  UserCheck,
  TrendingUp,
  Star,
  MapPin,
  Calendar,
  Phone,
  Navigation,
  User,
  Mail,
  CreditCard,
  Edit,
  Shield,
  ShieldCheck,
  Search,
  X
} from 'lucide-react';
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
        <button 
          className={pricingFilter === 'all' ? 'active' : ''}
          onClick={() => setPricingFilter('all')}
        >
          Tous
        </button>
        <button 
          className={pricingFilter === 'dakar_to_airport' ? 'active' : ''}
          onClick={() => setPricingFilter('dakar_to_airport')}
        >
          Dakar → Aéroport
        </button>
        <button 
          className={pricingFilter === 'airport_to_dakar' ? 'active' : ''}
          onClick={() => setPricingFilter('airport_to_dakar')}
        >
          Aéroport → Dakar
        </button>
        <button 
          className={pricingTypeFilter === 'all' ? 'active' : ''}
          onClick={() => setPricingTypeFilter('all')}
        >
          Tous les types
        </button>
        <button 
          className={pricingTypeFilter === 'standard' ? 'active' : ''}
          onClick={() => setPricingTypeFilter('standard')}
        >
          Standard
        </button>
        <button 
          className={pricingTypeFilter === 'peak_hours' ? 'active' : ''}
          onClick={() => setPricingTypeFilter('peak_hours')}
        >
          Heures de pointe
        </button>
        <button 
          className={pricingTypeFilter === 'night' ? 'active' : ''}
          onClick={() => setPricingTypeFilter('night')}
        >
          Nuit
        </button>
        <button 
          className={pricingTypeFilter === 'special' ? 'active' : ''}
          onClick={() => setPricingTypeFilter('special')}
        >
          Spécial
        </button>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={showInactivePricing}
            onChange={(e) => setShowInactivePricing(e.target.checked)}
          />
          Afficher les tarifs inactifs
        </label>
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
              <div className="button-group">
                <button
                  type="button"
                  className={`option-button ${formData.rideType === 'dakar_to_airport' ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, rideType: 'dakar_to_airport' })}
                >
                  Dakar → Aéroport
                </button>
                <button
                  type="button"
                  className={`option-button ${formData.rideType === 'airport_to_dakar' ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, rideType: 'airport_to_dakar' })}
                >
                  Aéroport → Dakar
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Type de tarif *</label>
              <div className="button-group">
                <button
                  type="button"
                  className={`option-button ${formData.type === 'standard' ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, type: 'standard' })}
                >
                  Standard
                </button>
                <button
                  type="button"
                  className={`option-button ${formData.type === 'peak_hours' ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, type: 'peak_hours' })}
                >
                  Heures de pointe
                </button>
                <button
                  type="button"
                  className={`option-button ${formData.type === 'night' ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, type: 'night' })}
                >
                  Nuit
                </button>
                <button
                  type="button"
                  className={`option-button ${formData.type === 'special' ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, type: 'special' })}
                >
                  Spécial
                </button>
              </div>
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [driverSearch, setDriverSearch] = useState<string>('');
  
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

  // Mise à jour de l'horloge
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Vérifier le statut de connexion
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Vérifier le statut WebSocket
    const checkWebSocketStatus = () => {
      const wsConnected = websocketService.isConnected();
      setIsOnline(navigator.onLine && wsConnected);
    };
    
    const wsInterval = setInterval(checkWebSocketStatus, 2000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(wsInterval);
    };
  }, []);

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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="admin-dashboard">
      {/* Header avec horloge et statut */}
      <header className="dashboard-top-header">
        <div className="header-clock">
          <Clock className="clock-icon" />
          <div className="clock-content">
            <div className="clock-time">{formatTime(currentTime)}</div>
            <div className="clock-date">{formatDate(currentTime)}</div>
          </div>
        </div>
        <div className={`header-status ${isOnline ? 'status-online' : 'status-offline'}`}>
          {isOnline ? <Wifi className="status-icon" /> : <WifiOff className="status-icon" />}
          <span className="status-text">{isOnline ? 'En ligne' : 'Hors ligne'}</span>
        </div>
      </header>

      {/* Boutons flottants - Notifications et Déconnexion */}
      <div className="floating-buttons">
        <button 
          className="floating-notifications-btn" 
          onClick={() => navigate('/admin/notifications')}
          title="Notifications"
        >
          🔔 {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </button>
        <button 
          className="floating-logout-btn" 
          onClick={handleLogout}
          title="Déconnexion"
        >
          🚪
        </button>
      </div>

      <div className="dashboard-content">
        {selectedTab === 'overview' && (
          <>
            {/* Statistiques principales - Grille 3x2 */}
            <section className="stats-section">
              <div className="stats-grid-modern">
                <div className="stat-card-modern">
                  <div className="stat-icon-wrapper">
                    <Car className="stat-icon" />
                  </div>
                  <h3>Total Courses</h3>
                  <p className="stat-value">{stats?.rides.total || 0}</p>
                </div>
                <div className="stat-card-modern">
                  <div className="stat-icon-wrapper">
                    <CheckCircle2 className="stat-icon" />
                  </div>
                  <h3>Courses Terminées</h3>
                  <p className="stat-value">{stats?.rides.completed || 0}</p>
                </div>
                <div className="stat-card-modern">
                  <div className="stat-icon-wrapper">
                    <Hourglass className="stat-icon" />
                  </div>
                  <h3>Courses en Attente</h3>
                  <p className="stat-value">{stats?.rides.pending || 0}</p>
                </div>
                <div className="stat-card-modern">
                  <div className="stat-icon-wrapper">
                    <UserCheck className="stat-icon" />
                  </div>
                  <h3>Chauffeurs Actifs</h3>
                  <p className="stat-value">{stats?.drivers.active || 0} / {stats?.drivers.total || 0}</p>
                </div>
                <div className="stat-card-modern">
                  <div className="stat-icon-wrapper">
                    <TrendingUp className="stat-icon" />
                  </div>
                  <h3>Revenus Totaux</h3>
                  <p className="stat-value">
                    {stats?.revenue?.total 
                      ? (typeof stats.revenue.total === 'number' 
                          ? stats.revenue.total.toLocaleString() 
                          : parseFloat(stats.revenue.total.toString() || '0').toLocaleString())
                      : '0'} FCFA
                  </p>
                </div>
                <div className="stat-card-modern">
                  <div className="stat-icon-wrapper">
                    <Star className="stat-icon" />
                  </div>
                  <h3>Note Moyenne</h3>
                  <p className="stat-value">
                    {stats?.drivers?.avgRating 
                      ? parseFloat(stats.drivers.avgRating.toString()).toFixed(1)
                      : '0.0'}
                  </p>
                </div>
              </div>
            </section>

            {/* Courses récentes - Grille 2x2 - Style comme les stats */}
            <section className="rides-section-modern">
              <h2 className="section-title-modern">Courses Récentes</h2>
              <div className="rides-grid-modern">
                {rides
                  ?.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
                  .slice(0, 4)
                  .map((ride) => (
                  <div key={ride.id} className="ride-card-stat-style">
                    <div className="ride-card-header-stat">
                      <span className="ride-type-badge-stat">
                        {ride.rideType === 'city_to_airport' ? 'Ville → Aéroport' : ride.rideType === 'airport_to_city' ? 'Aéroport → Ville' : 'Ville → Ville'}
                      </span>
                      <span className={`status-badge-stat status-${ride.status}`}>
                        {ride.status}
                      </span>
                    </div>
                    <div className="ride-card-body-stat">
                      <div className="ride-client-name-stat">
                        <strong>{ride.clientFirstName} {ride.clientLastName}</strong>
                      </div>
                      <div className="ride-details-stat">
                        <div className="ride-detail-stat">
                          <Phone className="ride-detail-icon" />
                          <span>{ride.clientPhone}</span>
                        </div>
                        <div className="ride-detail-stat">
                          <MapPin className="ride-detail-icon" />
                          <span>{ride.pickupAddress.substring(0, 25)}...</span>
                        </div>
                        <div className="ride-detail-stat">
                          <Navigation className="ride-detail-icon" />
                          <span>{ride.dropoffAddress.substring(0, 25)}...</span>
                        </div>
                        <div className="ride-detail-stat">
                          <Calendar className="ride-detail-icon" />
                          <span>{new Date(ride.scheduledAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <div className="ride-price-stat">
                        <DollarSign className="price-icon" />
                        <strong>{
                          ride.price != null 
                            ? (typeof ride.price === 'number' 
                                ? ride.price.toLocaleString() 
                                : parseFloat(ride.price.toString() || '0').toLocaleString())
                            : '0'
                        } FCFA</strong>
                      </div>
                      {ride.driver && (
                        <div className="ride-driver-stat">
                          <User className="driver-icon" />
                          <span>{ride.driver.user?.firstName} {ride.driver.user?.lastName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {selectedTab === 'drivers' && (
          <section className="drivers-section-modern">
            <div className="section-header-modern">
              <h2 className="section-title-modern">Gestion des Chauffeurs</h2>
              <div className="drivers-controls">
                <div className="search-box-modern">
                  <Search className="search-icon" />
                  <input
                    type="text"
                    placeholder="Rechercher un chauffeur..."
                    value={driverSearch}
                    onChange={(e) => setDriverSearch(e.target.value)}
                    className="search-input-modern"
                  />
                  {driverSearch && (
                    <button
                      className="clear-search-btn"
                      onClick={() => setDriverSearch('')}
                      title="Effacer"
                    >
                      <X className="clear-icon" />
                    </button>
                  )}
                </div>
                <div className="filters-modern">
                  <button 
                    className={`filter-btn-modern ${driverFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setDriverFilter('all')}
                  >
                    Tous
                  </button>
                  <button 
                    className={`filter-btn-modern ${driverFilter === 'verified' ? 'active' : ''}`}
                    onClick={() => setDriverFilter('verified')}
                  >
                    <ShieldCheck className="filter-icon" />
                    Vérifiés
                  </button>
                  <button 
                    className={`filter-btn-modern ${driverFilter === 'unverified' ? 'active' : ''}`}
                    onClick={() => setDriverFilter('unverified')}
                  >
                    <Shield className="filter-icon" />
                    Non vérifiés
                  </button>
                </div>
              </div>
            </div>
            <div className="drivers-grid-modern">
              {drivers
                .filter((driver) => {
                  // Filtre par statut de vérification
                  if (driverFilter === 'verified' && !driver.isVerified) return false;
                  if (driverFilter === 'unverified' && driver.isVerified) return false;
                  
                  // Filtre par recherche
                  if (driverSearch) {
                    const searchLower = driverSearch.toLowerCase();
                    const fullName = `${driver.user?.firstName || ''} ${driver.user?.lastName || ''}`.toLowerCase();
                    const email = (driver.user?.email || '').toLowerCase();
                    const phone = (driver.user?.phone || '').toLowerCase();
                    const license = (driver.licenseNumber || '').toLowerCase();
                    
                    if (!fullName.includes(searchLower) && 
                        !email.includes(searchLower) && 
                        !phone.includes(searchLower) &&
                        !license.includes(searchLower)) {
                      return false;
                    }
                  }
                  
                  return true;
                })
                .map((driver) => (
                  <div key={driver.id} className="driver-card-modern">
                    <div className="driver-card-header-modern">
                      <div className="driver-avatar-modern">
                        <User className="avatar-icon" />
                      </div>
                      <div className="driver-name-section">
                        <h3 className="driver-name-modern">
                          {driver.user?.firstName} {driver.user?.lastName}
                        </h3>
                        <div className="driver-badges">
                          <span className={`status-badge-modern status-${driver.status}`}>
                            {driver.status === 'available' ? 'Disponible' : 
                             driver.status === 'unavailable' ? 'Indisponible' : 
                             driver.status === 'on_break' ? 'En pause' : 
                             driver.status === 'on_ride' ? 'En course' : driver.status}
                          </span>
                          {driver.isVerified ? (
                            <span className="verified-badge-modern">
                              <ShieldCheck className="verified-icon" />
                              Vérifié
                            </span>
                          ) : (
                            <span className="unverified-badge-modern">
                              <Shield className="unverified-icon" />
                              Non vérifié
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="driver-card-body-modern">
                      <div className="driver-info-row-modern">
                        <Mail className="info-icon" />
                        <span className="info-label">Email:</span>
                        <span className="info-value">{driver.user?.email || 'N/A'}</span>
                      </div>
                      <div className="driver-info-row-modern">
                        <Phone className="info-icon" />
                        <span className="info-label">Téléphone:</span>
                        <span className="info-value">{driver.user?.phone || 'N/A'}</span>
                      </div>
                      <div className="driver-info-row-modern">
                        <CreditCard className="info-icon" />
                        <span className="info-label">Permis:</span>
                        <span className="info-value">{driver.licenseNumber || 'N/A'}</span>
                      </div>
                      <div className="driver-stats-modern">
                        <div className="stat-item-modern">
                          <Car className="stat-icon-modern" />
                          <div className="stat-content">
                            <span className="stat-label">Courses</span>
                            <span className="stat-value">{driver.totalRides || 0}</span>
                          </div>
                        </div>
                        <div className="stat-item-modern">
                          <Star className="stat-icon-modern" />
                          <div className="stat-content">
                            <span className="stat-label">Note</span>
                            <span className="stat-value">
                              {driver.rating != null 
                                ? (typeof driver.rating === 'number' 
                                    ? driver.rating.toFixed(1)
                                    : parseFloat(driver.rating.toString() || '0').toFixed(1))
                                : '0.0'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="driver-card-actions-modern">
                      {!driver.isVerified && (
                        <button
                          className="btn-verify-modern"
                          onClick={() => verifyDriverMutation.mutate(driver.id)}
                          disabled={verifyDriverMutation.isPending}
                          title="Vérifier le chauffeur"
                        >
                          <ShieldCheck className="btn-icon-modern" />
                          Valider
                        </button>
                      )}
                      <button
                        className="btn-edit-modern"
                        onClick={() => navigate(`/admin/drivers/${driver.id}/edit`)}
                        title="Modifier le chauffeur"
                      >
                        <Edit className="btn-icon-modern" />
                        Modifier
                      </button>
                    </div>
                  </div>
                ))}
            </div>
            {drivers.length === 0 && (
              <div className="no-drivers-modern">
                <Users className="no-drivers-icon" />
                <p>Aucun chauffeur trouvé</p>
              </div>
            )}
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
              Affichage de {drivers.filter((driver) => {
                if (driverFilter === 'verified' && !driver.isVerified) return false;
                if (driverFilter === 'unverified' && driver.isVerified) return false;
                if (driverSearch) {
                  const searchLower = driverSearch.toLowerCase();
                  const fullName = `${driver.user?.firstName || ''} ${driver.user?.lastName || ''}`.toLowerCase();
                  const email = (driver.user?.email || '').toLowerCase();
                  const phone = (driver.user?.phone || '').toLowerCase();
                  const license = (driver.licenseNumber || '').toLowerCase();
                  if (!fullName.includes(searchLower) && !email.includes(searchLower) && !phone.includes(searchLower) && !license.includes(searchLower)) return false;
                }
                return true;
              }).length} sur {driversData?.total || 0} chauffeur(s)
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

      {/* Barre de navigation en bas - Style WhatsApp */}
      <nav className="bottom-nav">
        <button 
          className={`nav-item ${selectedTab === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedTab('overview')}
        >
          <LayoutDashboard className="nav-icon" />
          <span className="nav-label">Statuts</span>
        </button>
        <button 
          className={`nav-item ${selectedTab === 'drivers' ? 'active' : ''}`}
          onClick={() => setSelectedTab('drivers')}
        >
          <Users className="nav-icon" />
          <span className="nav-label">Chauffeurs</span>
        </button>
        <button 
          className={`nav-item ${selectedTab === 'rides' ? 'active' : ''}`}
          onClick={() => setSelectedTab('rides')}
        >
          <Car className="nav-icon" />
          <span className="nav-label">Courses</span>
        </button>
        <button 
          className={`nav-item ${selectedTab === 'pricing' ? 'active' : ''}`}
          onClick={() => setSelectedTab('pricing')}
        >
          <DollarSign className="nav-icon" />
          <span className="nav-label">Tarifs</span>
        </button>
        <button 
          className={`nav-item ${selectedTab === 'vehicles' ? 'active' : ''}`}
          onClick={() => setSelectedTab('vehicles')}
        >
          <Truck className="nav-icon" />
          <span className="nav-label">Véhicules</span>
        </button>
      </nav>
    </div>
  );
}

export default AdminDashboard;
