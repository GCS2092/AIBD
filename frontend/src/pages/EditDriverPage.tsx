import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, Driver } from '../services/adminService';
import { authService } from '../services/authService';
import NavigationBar from '../components/NavigationBar';
import './EditDriverPage.css';

function EditDriverPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');

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
      <div className="edit-driver-page">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  if (error || !driver) {
    return (
      <div className="edit-driver-page">
        <div className="error-message">
          {error ? 'Erreur lors du chargement du chauffeur' : 'Chauffeur non trouvé'}
        </div>
        <Link to="/admin/dashboard?tab=drivers" className="btn-back">
          Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="edit-driver-page">
      <NavigationBar />
      <div className="edit-driver-container">
        <div className="page-header">
          <Link to="/admin/dashboard" className="btn-back">← Retour au Dashboard</Link>
          <h1>Modifier le Chauffeur</h1>
        </div>

        {submitError && (
          <div className="error-message" role="alert">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="edit-driver-form">
          <div className="form-section">
            <h2>Informations Personnelles</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Prénom *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => {
                    setFormData({ ...formData, firstName: e.target.value });
                    if (errors.firstName) setErrors({ ...errors, firstName: '' });
                  }}
                  className={errors.firstName ? 'error' : ''}
                  required
                />
                {errors.firstName && <span className="field-error">{errors.firstName}</span>}
              </div>
              <div className="form-group">
                <label>Nom *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => {
                    setFormData({ ...formData, lastName: e.target.value });
                    if (errors.lastName) setErrors({ ...errors, lastName: '' });
                  }}
                  className={errors.lastName ? 'error' : ''}
                  required
                />
                {errors.lastName && <span className="field-error">{errors.lastName}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  className={errors.email ? 'error' : ''}
                  required
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label>Téléphone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (errors.phone) setErrors({ ...errors, phone: '' });
                  }}
                  placeholder="+221XXXXXXXXX ou +242XXXXXXXXX"
                  className={errors.phone ? 'error' : ''}
                  required
                />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Informations Professionnelles</h2>
            <div className="form-group">
              <label>Numéro de Permis *</label>
              <input
                type="text"
                value={formData.licenseNumber}
                onChange={(e) => {
                  setFormData({ ...formData, licenseNumber: e.target.value });
                  if (errors.licenseNumber) setErrors({ ...errors, licenseNumber: '' });
                }}
                className={errors.licenseNumber ? 'error' : ''}
                required
              />
              {errors.licenseNumber && <span className="field-error">{errors.licenseNumber}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Statut</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="available">Disponible</option>
                  <option value="unavailable">Indisponible</option>
                  <option value="busy">Occupé</option>
                </select>
              </div>
              <div className="form-group">
                <label>Zone de Service</label>
                <input
                  type="text"
                  value={formData.serviceZone}
                  onChange={(e) => setFormData({ ...formData, serviceZone: e.target.value })}
                  placeholder="Ex: Dakar, Thies, etc."
                />
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isVerified}
                  onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
                />
                <span>Chauffeur vérifié</span>
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard?tab=drivers')}
              className="btn-cancel"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={updateDriverMutation.isPending}
            >
              {updateDriverMutation.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditDriverPage;

