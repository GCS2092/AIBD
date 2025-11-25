import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverService } from '../services/driverService';
import { authService } from '../services/authService';
import NavigationBar from '../components/NavigationBar';
import './RegisterVehiclePage.css';

function RegisterVehiclePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    licensePlate: '',
    color: '',
    year: '',
    capacity: '',
    photoUrl: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  // Vérifier si le chauffeur a déjà un véhicule
  const { data: existingVehicle } = useQuery({
    queryKey: ['driver-vehicle'],
    queryFn: () => driverService.getMyVehicle(),
    onSuccess: (data) => {
      if (data) {
        alert('Vous avez déjà un véhicule enregistré. Contactez un administrateur pour modifier.');
        navigate('/driver/dashboard');
      }
    },
  });

  const registerVehicleMutation = useMutation({
    mutationFn: (data: {
      brand: string;
      model: string;
      licensePlate: string;
      color?: string;
      year?: number;
      capacity?: number;
      photoUrl?: string;
    }) => driverService.registerVehicle(data),
    onSuccess: () => {
      alert('Véhicule enregistré avec succès ! Il sera validé par un administrateur.');
      queryClient.invalidateQueries({ queryKey: ['driver-profile'] });
      navigate('/driver/dashboard');
    },
    onError: (error: any) => {
      setErrors({ submit: error.response?.data?.message || 'Erreur lors de l\'enregistrement' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.brand.trim()) {
      newErrors.brand = 'La marque est requise';
    }
    if (!formData.model.trim()) {
      newErrors.model = 'Le modèle est requis';
    }
    if (!formData.licensePlate.trim()) {
      newErrors.licensePlate = 'L\'immatriculation est requise';
    }
    if (formData.year && (isNaN(Number(formData.year)) || Number(formData.year) < 1900 || Number(formData.year) > new Date().getFullYear() + 1)) {
      newErrors.year = 'Année invalide';
    }
    if (formData.capacity && (isNaN(Number(formData.capacity)) || Number(formData.capacity) < 1)) {
      newErrors.capacity = 'Capacité invalide (minimum 1)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Envoyer les données
    registerVehicleMutation.mutate({
      brand: formData.brand.trim(),
      model: formData.model.trim(),
      licensePlate: formData.licensePlate.trim().toUpperCase(),
      color: formData.color.trim() || undefined,
      year: formData.year ? Number(formData.year) : undefined,
      capacity: formData.capacity ? Number(formData.capacity) : undefined,
      photoUrl: formData.photoUrl.trim() || undefined,
    });
  };

  return (
    <div className="register-vehicle-page">
      <NavigationBar />
      <div className="register-vehicle-container">
        <div>
          <Link to="/driver/dashboard" className="btn-back">← Retour au Dashboard</Link>
          <h1>Enregistrer mon véhicule</h1>
        </div>
        <p className="info-text">
          Vous ne pouvez enregistrer qu'un seul véhicule. Les modifications ultérieures doivent être faites par un administrateur.
        </p>

        <form onSubmit={handleSubmit} className="register-vehicle-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="brand">Marque *</label>
              <input
                type="text"
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Ex: Toyota"
                className={errors.brand ? 'error' : ''}
              />
              {errors.brand && <span className="field-error">{errors.brand}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="model">Modèle *</label>
              <input
                type="text"
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Ex: Corolla"
                className={errors.model ? 'error' : ''}
              />
              {errors.model && <span className="field-error">{errors.model}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="licensePlate">Immatriculation *</label>
            <input
              type="text"
              id="licensePlate"
              value={formData.licensePlate}
              onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
              placeholder="Ex: DK-1234-AB"
              className={errors.licensePlate ? 'error' : ''}
            />
            {errors.licensePlate && <span className="field-error">{errors.licensePlate}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="color">Couleur</label>
              <input
                type="text"
                id="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Ex: Blanc"
              />
            </div>

            <div className="form-group">
              <label htmlFor="year">Année</label>
              <input
                type="number"
                id="year"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                placeholder="Ex: 2020"
                min="1900"
                max={new Date().getFullYear() + 1}
                className={errors.year ? 'error' : ''}
              />
              {errors.year && <span className="field-error">{errors.year}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="capacity">Nombre de places</label>
              <input
                type="number"
                id="capacity"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="Ex: 4"
                min="1"
                className={errors.capacity ? 'error' : ''}
              />
              {errors.capacity && <span className="field-error">{errors.capacity}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="photoUrl">URL de la photo (optionnel)</label>
            <input
              type="url"
              id="photoUrl"
              value={formData.photoUrl}
              onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
              placeholder="https://..."
            />
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
              disabled={registerVehicleMutation.isPending}
            >
              {registerVehicleMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterVehiclePage;

