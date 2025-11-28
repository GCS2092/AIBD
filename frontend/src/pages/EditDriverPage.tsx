import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, Driver } from '../services/adminService';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { 
  Clock, 
  Wifi, 
  WifiOff, 
  Bell, 
  LogOut, 
  ArrowLeft,
  User,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Shield,
  ShieldCheck,
  Save,
  X
} from 'lucide-react';
import './EditDriverPage.css';

function EditDriverPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [unreadCount, setUnreadCount] = useState(0);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    status: 'available' as 'available' | 'unavailable' | 'busy',
    isVerified: false,
    serviceZone: '',
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  // Mise à jour de l'horloge
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Vérifier le statut de connexion
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    // Initialiser avec le statut actuel
    setIsOnline(navigator.onLine);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Vérifier périodiquement le statut de connexion Internet
    // Note: On se base sur navigator.onLine car le WebSocket peut être déconnecté
    // pour d'autres raisons (serveur, authentification, etc.) sans que l'utilisateur soit hors ligne
    const checkConnectionStatus = () => {
      setIsOnline(navigator.onLine);
    };
    
    const statusInterval = setInterval(checkConnectionStatus, 5000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(statusInterval);
    };
  }, []);

  // Récupérer le nombre de notifications non lues
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

  const { data: driver, isLoading, error } = useQuery({
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
    queryKey: ['driver', id],
    queryFn: () => adminService.getDriverById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (driver) {
      setFormData({
        firstName: driver.user?.firstName || '',
        lastName: driver.user?.lastName || '',
        email: driver.user?.email || '',
        phone: driver.user?.phone || '',
        licenseNumber: driver.licenseNumber || '',
        status: (driver.status as 'available' | 'unavailable' | 'busy') || 'available',
        isVerified: driver.isVerified || false,
        serviceZone: (driver as any).serviceZone || '',
      });
    }
  }, [driver]);

  const updateDriverMutation = useMutation({
    mutationFn: (data: Partial<Driver>) => adminService.updateDriver(id!, data),
    onSuccess: () => {
      // Invalider toutes les queries liées pour rafraîchir automatiquement
      queryClient.invalidateQueries({ queryKey: ['driver', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-drivers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-rides'] });
      queryClient.invalidateQueries({ queryKey: ['admin-vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['driver-profile'] });
      navigate('/admin/dashboard?tab=drivers');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Erreur lors de la mise à jour';
      setSubmitError(errorMessage);
    },
  });

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

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = 'Le téléphone est requis';
    } else if (!/^\+2(21|42)[0-9]{9}$/.test(formData.phone)) {
      newErrors.phone = 'Le téléphone doit être au format +221XXXXXXXXX ou +242XXXXXXXXX';
    }

    if (!formData.licenseNumber?.trim()) {
      newErrors.licenseNumber = 'Le numéro de permis est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    updateDriverMutation.mutate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      licenseNumber: formData.licenseNumber,
      status: formData.status,
      isVerified: formData.isVerified,
      serviceZone: formData.serviceZone || undefined,
    } as any);
  };

  if (isLoading) {
    return (
      <div className="edit-driver-page-modern">
        <div className="loading-modern">Chargement...</div>
      </div>
    );
  }

  if (error || !driver) {
    return (
      <div className="edit-driver-page-modern">
        <div className="error-message-modern">
          {error ? 'Erreur lors du chargement du chauffeur' : 'Chauffeur non trouvé'}
        </div>
        <Link to="/admin/dashboard?tab=drivers" className="btn-back-modern">
          <ArrowLeft className="btn-icon" />
          Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="edit-driver-page-modern">
      {/* Header avec horloge et statut */}
      <header className="dashboard-top-header">
        <div className="header-clock">
          <Clock className="clock-icon" />
          <div className="clock-content">
            <div className="clock-time">{formatTime(currentTime)}</div>
            <div className="clock-date">{formatDate(currentTime)}</div>
          </div>
        </div>
        <div className="header-title-section">
          <h1 className="page-title-header">Modifier le Chauffeur</h1>
        </div>
        <div className={`header-status ${isOnline ? 'status-online' : 'status-offline'}`}>
          {isOnline ? <Wifi className="status-icon" /> : <WifiOff className="status-icon" />}
          <span className="status-text">{isOnline ? 'En ligne' : 'Hors ligne'}</span>
        </div>
      </header>

      {/* Boutons flottants */}
      <div className="floating-buttons">
        <button 
          className="floating-notifications-btn" 
          onClick={() => navigate('/admin/notifications')}
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

      <div className="edit-driver-container-modern">
        <div className="page-header-modern">
          <Link to="/admin/dashboard?tab=drivers" className="btn-back-modern">
            <ArrowLeft className="btn-icon" />
            Retour au Dashboard
          </Link>
        </div>

        {submitError && (
          <div className="error-message-modern" role="alert">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="edit-driver-form-modern">
          <div className="form-section-modern">
            <h2 className="form-section-title">
              <User className="section-icon" />
              Informations Personnelles
            </h2>
            <div className="form-row-modern">
              <div className="form-group-modern">
                <label className="form-label-modern">
                  <User className="label-icon" />
                  Prénom *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => {
                    setFormData({ ...formData, firstName: e.target.value });
                    if (errors.firstName) setErrors({ ...errors, firstName: '' });
                  }}
                  className={`form-input-modern ${errors.firstName ? 'error' : ''}`}
                  required
                />
                {errors.firstName && <span className="field-error-modern">{errors.firstName}</span>}
              </div>
              <div className="form-group-modern">
                <label className="form-label-modern">
                  <User className="label-icon" />
                  Nom *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => {
                    setFormData({ ...formData, lastName: e.target.value });
                    if (errors.lastName) setErrors({ ...errors, lastName: '' });
                  }}
                  className={`form-input-modern ${errors.lastName ? 'error' : ''}`}
                  required
                />
                {errors.lastName && <span className="field-error-modern">{errors.lastName}</span>}
              </div>
            </div>

            <div className="form-row-modern">
              <div className="form-group-modern">
                <label className="form-label-modern">
                  <Mail className="label-icon" />
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  className={`form-input-modern ${errors.email ? 'error' : ''}`}
                  required
                />
                {errors.email && <span className="field-error-modern">{errors.email}</span>}
              </div>
              <div className="form-group-modern">
                <label className="form-label-modern">
                  <Phone className="label-icon" />
                  Téléphone *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (errors.phone) setErrors({ ...errors, phone: '' });
                  }}
                  placeholder="+221XXXXXXXXX ou +242XXXXXXXXX"
                  className={`form-input-modern ${errors.phone ? 'error' : ''}`}
                  required
                />
                {errors.phone && <span className="field-error-modern">{errors.phone}</span>}
              </div>
            </div>
          </div>

          <div className="form-section-modern">
            <h2 className="form-section-title">
              <CreditCard className="section-icon" />
              Informations Professionnelles
            </h2>
            <div className="form-group-modern">
              <label className="form-label-modern">
                <CreditCard className="label-icon" />
                Numéro de Permis *
              </label>
              <input
                type="text"
                value={formData.licenseNumber}
                onChange={(e) => {
                  setFormData({ ...formData, licenseNumber: e.target.value });
                  if (errors.licenseNumber) setErrors({ ...errors, licenseNumber: '' });
                }}
                className={`form-input-modern ${errors.licenseNumber ? 'error' : ''}`}
                required
              />
              {errors.licenseNumber && <span className="field-error-modern">{errors.licenseNumber}</span>}
            </div>

            <div className="form-row-modern">
              <div className="form-group-modern">
                <label className="form-label-modern">
                  <User className="label-icon" />
                  Statut
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="form-input-modern"
                >
                  <option value="available">Disponible</option>
                  <option value="unavailable">Indisponible</option>
                  <option value="busy">Occupé</option>
                </select>
              </div>
              <div className="form-group-modern">
                <label className="form-label-modern">
                  <MapPin className="label-icon" />
                  Zone de Service
                </label>
                <input
                  type="text"
                  value={formData.serviceZone}
                  onChange={(e) => setFormData({ ...formData, serviceZone: e.target.value })}
                  placeholder="Ex: Dakar, Thies, etc."
                  className="form-input-modern"
                />
              </div>
            </div>

            <div className="form-group-modern">
              <label className="checkbox-label-modern">
                <input
                  type="checkbox"
                  checked={formData.isVerified}
                  onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
                  className="checkbox-input-modern"
                />
                {formData.isVerified ? (
                  <ShieldCheck className="checkbox-icon" />
                ) : (
                  <Shield className="checkbox-icon" />
                )}
                <span>Chauffeur vérifié</span>
              </label>
            </div>
          </div>

          <div className="form-actions-modern">
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard?tab=drivers')}
              className="btn-cancel-modern"
            >
              <X className="btn-icon" />
              Annuler
            </button>
            <button
              type="submit"
              className="btn-submit-modern"
              disabled={updateDriverMutation.isPending}
            >
              <Save className="btn-icon" />
              {updateDriverMutation.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditDriverPage;

