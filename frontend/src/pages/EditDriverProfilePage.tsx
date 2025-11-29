import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { driverService, DriverProfile } from '../services/driverService';
import { authService } from '../services/authService';
import DriverHeader from '../components/DriverHeader';
import DriverBottomNav from '../components/DriverBottomNav';
import './EditDriverProfilePage.css';

function EditDriverProfilePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  const { data: profile } = useQuery<DriverProfile>({
    queryKey: ['driver-profile'],
    queryFn: () => driverService.getProfile(),
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.user?.firstName || '',
        lastName: profile.user?.lastName || '',
        phone: profile.user?.phone || '',
      });
    }
  }, [profile]);

  const requestUpdateMutation = useMutation({
    mutationFn: (data: { firstName?: string; lastName?: string; phone?: string }) =>
      driverService.requestProfileUpdate(data),
    onSuccess: () => {
      alert('Demande de modification envoyée. Elle sera traitée par un administrateur.');
      navigate('/driver/dashboard');
    },
    onError: (error: any) => {
      setErrors({ submit: error.response?.data?.message || 'Erreur lors de l\'envoi de la demande' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Le téléphone est requis';
    } else if (!/^\+2(21|42)[0-9]{9}$/.test(formData.phone)) {
      newErrors.phone = 'Le téléphone doit être au format +221XXXXXXXXX (Sénégal) ou +242XXXXXXXXX (Congo)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Vérifier s'il y a des changements
    if (
      formData.firstName === profile?.user?.firstName &&
      formData.lastName === profile?.user?.lastName &&
      formData.phone === profile?.user?.phone
    ) {
      setErrors({ submit: 'Aucune modification détectée' });
      return;
    }

    // Envoyer la demande
    const changes: { firstName?: string; lastName?: string; phone?: string } = {};
    if (formData.firstName !== profile?.user?.firstName) {
      changes.firstName = formData.firstName;
    }
    if (formData.lastName !== profile?.user?.lastName) {
      changes.lastName = formData.lastName;
    }
    if (formData.phone !== profile?.user?.phone) {
      changes.phone = formData.phone;
    }

    requestUpdateMutation.mutate(changes);
  };

  return (
    <div className="edit-profile-page">
      <DriverHeader showStatusButtons={false} />
      <div className="edit-profile-container">
        <div>
          <Link to="/driver/dashboard" className="btn-back">← Retour au Dashboard</Link>
          <h1>Modifier mon profil</h1>
        </div>
        <p className="info-text">
          Les modifications doivent être approuvées par un administrateur.
        </p>

        <form onSubmit={handleSubmit} className="edit-profile-form">
          <div className="form-group">
            <label htmlFor="firstName">Prénom *</label>
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className={errors.firstName ? 'error' : ''}
            />
            {errors.firstName && <span className="field-error">{errors.firstName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Nom *</label>
            <input
              type="text"
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className={errors.lastName ? 'error' : ''}
            />
            {errors.lastName && <span className="field-error">{errors.lastName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Téléphone *</label>
            <input
              type="text"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+221XXXXXXXXX ou +242XXXXXXXXX"
              className={errors.phone ? 'error' : ''}
            />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>

          {errors.submit && <div className="error-message">{errors.submit}</div>}

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate('/driver/dashboard')}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={requestUpdateMutation.isPending}
            >
              {requestUpdateMutation.isPending ? 'Envoi...' : 'Envoyer la demande'}
            </button>
          </div>
        </form>
      </div>

      {/* Barre de navigation en bas */}
      <DriverBottomNav />
    </div>
  );
}

export default EditDriverProfilePage;

