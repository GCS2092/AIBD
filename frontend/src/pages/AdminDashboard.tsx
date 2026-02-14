import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useWebSocket } from '../hooks/useWebSocket';
import { adminService, AdminUser, CreateUserByAdminDto } from '../services/adminService';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { pricingService, Pricing, CreatePricingDto } from '../services/pricingService';
import { fcmService } from '../services/fcmService';
import apiClient from '../services/api';
import Pagination from '../components/Pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  Banknote, 
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
  Search,
  Eye,
  CreditCard,
  Edit,
  Shield,
  ShieldCheck,
  X,
  Plus,
  Trash2,
  Play,
  Pause,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Banknote as BanknoteIcon,
  UserCog,
  UserPlus,
} from 'lucide-react';
import './AdminDashboard.css';

// Fonction pour corriger l'encodage des caractères mal encodés
const fixEncoding = (str: string): string => {
  if (!str) return str;
  try {
    // Détecter et corriger les problèmes d'encodage courants
    return str
      .replace(/Ã©/g, 'é')
      .replace(/Ã /g, 'à')
      .replace(/Ã§/g, 'ç')
      .replace(/Ã´/g, 'ô')
      .replace(/Ã¨/g, 'è')
      .replace(/Ãª/g, 'ê')
      .replace(/Ã®/g, 'î')
      .replace(/Ã»/g, 'û')
      .replace(/â†'/g, '→')
      .replace(/â€"/g, '"')
      .replace(/â€™/g, "'")
      .replace(/â€"/g, '"')
      .replace(/â€"/g, '—')
      .replace(/â€"/g, '–');
  } catch {
    return str;
  }
};

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
    <section className="pricing-section-modern">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold text-gray-800">Gestion des Tarifs</CardTitle>
              <Button
                onClick={() => {
                  setEditingPricing(null);
                  setShowPricingModal(true);
                }}
                className="bg-primary-500 hover:bg-primary-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Tarif
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filtres */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={pricingFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPricingFilter('all')}
                  className={pricingFilter === 'all' ? 'bg-primary-500 text-white hover:bg-primary-600' : ''}
                >
                  Tous
                </Button>
                <Button
                  variant={pricingFilter === 'dakar_to_airport' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPricingFilter('dakar_to_airport')}
                  className={pricingFilter === 'dakar_to_airport' ? 'bg-primary-500 text-white hover:bg-primary-600' : ''}
                >
                  Dakar → Aéroport
                </Button>
                <Button
                  variant={pricingFilter === 'airport_to_dakar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPricingFilter('airport_to_dakar')}
                  className={pricingFilter === 'airport_to_dakar' ? 'bg-primary-500 text-white hover:bg-primary-600' : ''}
                >
                  Aéroport → Dakar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={pricingTypeFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPricingTypeFilter('all')}
                  className={pricingTypeFilter === 'all' ? 'bg-primary-500 text-white hover:bg-primary-600' : ''}
                >
                  Tous les types
                </Button>
                <Button
                  variant={pricingTypeFilter === 'standard' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPricingTypeFilter('standard')}
                  className={pricingTypeFilter === 'standard' ? 'bg-primary-500 text-white hover:bg-primary-600' : ''}
                >
                  Standard
                </Button>
                <Button
                  variant={pricingTypeFilter === 'peak_hours' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPricingTypeFilter('peak_hours')}
                  className={pricingTypeFilter === 'peak_hours' ? 'bg-primary-500 text-white hover:bg-primary-600' : ''}
                >
                  Heures de pointe
                </Button>
                <Button
                  variant={pricingTypeFilter === 'night' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPricingTypeFilter('night')}
                  className={pricingTypeFilter === 'night' ? 'bg-primary-500 text-white hover:bg-primary-600' : ''}
                >
                  Nuit
                </Button>
                <Button
                  variant={pricingTypeFilter === 'special' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPricingTypeFilter('special')}
                  className={pricingTypeFilter === 'special' ? 'bg-primary-500 text-white hover:bg-primary-600' : ''}
                >
                  Spécial
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showInactive"
                  checked={showInactivePricing}
                  onChange={(e) => setShowInactivePricing(e.target.checked)}
                  className="w-4 h-4 text-gray-800 border-gray-300 rounded focus:ring-primary-500"
                />
                <Label htmlFor="showInactive" className="text-sm text-gray-700 cursor-pointer">
                  Afficher les tarifs inactifs
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des tarifs */}
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">Chargement...</p>
            </CardContent>
          </Card>
        ) : filteredPricing.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BanknoteIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Aucun tarif trouvé</p>
              <p className="text-gray-500 text-sm mt-2">Essayez de modifier vos filtres</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPricing.map((pricing, index) => (
              <motion.div
                key={pricing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className={`hover:shadow-lg transition-shadow ${!pricing.isActive ? 'opacity-60' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Informations principales */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-bold text-gray-800">{fixEncoding(pricing.name || '')}</h3>
                          <Badge
                            variant="outline"
                            className={
                              pricing.type === 'standard' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                              pricing.type === 'peak_hours' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                              pricing.type === 'night' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                              'bg-pink-100 text-pink-800 border-pink-300'
                            }
                          >
                            {pricing.type === 'standard' ? 'Standard' :
                             pricing.type === 'peak_hours' ? 'Heures de pointe' :
                             pricing.type === 'night' ? 'Nuit' : 'Spécial'}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={pricing.isActive ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'}
                          >
                            {pricing.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Car className="w-4 h-4 text-gray-500" />
                            <span><strong>Type de trajet:</strong> {pricing.rideType === 'dakar_to_airport' ? 'Dakar → Aéroport' : 'Aéroport → Dakar'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <BanknoteIcon className="w-4 h-4 text-gray-500" />
                            <span><strong>Prix:</strong> {parseFloat(pricing.price.toString()).toLocaleString()} FCFA</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <ClockIcon className="w-4 h-4 text-gray-500" />
                            <span><strong>Horaires:</strong> {pricing.startTime && pricing.endTime ? `${pricing.startTime} - ${pricing.endTime}` : 'Toute la journée'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <CalendarIcon className="w-4 h-4 text-gray-500" />
                            <span><strong>Jours:</strong> {pricing.daysOfWeek && pricing.daysOfWeek.length > 0 ? pricing.daysOfWeek.map(d => ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][d]).join(', ') : 'Tous les jours'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex lg:flex-col justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingPricing(pricing);
                            setShowPricingModal(true);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Modifier
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            togglePricingActiveMutation.mutate({
                              id: pricing.id,
                              isActive: !pricing.isActive,
                            })
                          }
                          disabled={togglePricingActiveMutation.isPending}
                          className={`flex items-center gap-2 ${pricing.isActive ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}`}
                        >
                          {pricing.isActive ? (
                            <>
                              <Pause className="w-4 h-4" />
                              Désactiver
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              Activer
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('Êtes-vous sûr de vouloir supprimer ce tarif ?')) {
                              deletePricingMutation.mutate(pricing.id);
                            }
                          }}
                          disabled={deletePricingMutation.isPending}
                          className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
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
      </motion.div>
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
      daysOfWeek: (formData.daysOfWeek && formData.daysOfWeek.length > 0) ? formData.daysOfWeek : undefined,
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold text-gray-800">
            {pricing ? 'Modifier le Tarif' : 'Nouveau Tarif'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-800 font-semibold">Nom du tarif *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                className={errors.name ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : ''}
                placeholder="Ex: Dakar → Aéroport Standard"
                required
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-800 font-semibold">Type de trajet *</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formData.rideType === 'dakar_to_airport' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, rideType: 'dakar_to_airport' })}
                    className={formData.rideType === 'dakar_to_airport' ? 'bg-primary-500 text-white hover:bg-primary-600' : ''}
                  >
                    Dakar → Aéroport
                  </Button>
                  <Button
                    type="button"
                    variant={formData.rideType === 'airport_to_dakar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, rideType: 'airport_to_dakar' })}
                    className={formData.rideType === 'airport_to_dakar' ? 'bg-primary-500 text-white hover:bg-primary-600' : ''}
                  >
                    Aéroport → Dakar
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-800 font-semibold">Type de tarif *</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={formData.type === 'standard' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, type: 'standard' })}
                    className={formData.type === 'standard' ? 'bg-primary-500 text-white hover:bg-primary-600' : ''}
                  >
                    Standard
                  </Button>
                  <Button
                    type="button"
                    variant={formData.type === 'peak_hours' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, type: 'peak_hours' })}
                    className={formData.type === 'peak_hours' ? 'bg-primary-500 text-white hover:bg-primary-600' : ''}
                  >
                    Heures de pointe
                  </Button>
                  <Button
                    type="button"
                    variant={formData.type === 'night' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, type: 'night' })}
                    className={formData.type === 'night' ? 'bg-primary-500 text-white hover:bg-primary-600' : ''}
                  >
                    Nuit
                  </Button>
                  <Button
                    type="button"
                    variant={formData.type === 'special' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, type: 'special' })}
                    className={formData.type === 'special' ? 'bg-primary-500 text-white hover:bg-primary-600' : ''}
                  >
                    Spécial
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="text-gray-800 font-semibold">Prix (FCFA) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="100"
                value={formData.price}
                onChange={(e) => {
                  setFormData({ ...formData, price: parseFloat(e.target.value) || 0 });
                  if (errors.price) setErrors({ ...errors, price: '' });
                }}
                className={errors.price ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : ''}
                required
              />
              {errors.price && <p className="text-sm text-red-600">{errors.price}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-gray-800 font-semibold">Heure de début</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-gray-800 font-semibold">Heure de fin</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => {
                    setFormData({ ...formData, endTime: e.target.value });
                    if (errors.endTime) setErrors({ ...errors, endTime: '' });
                  }}
                  className={errors.endTime ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : ''}
                />
                {errors.endTime && <p className="text-sm text-red-600">{errors.endTime}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-800 font-semibold">Jours de la semaine</Label>
              <div className="flex flex-wrap gap-2">
                {['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map((day, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant={(formData.daysOfWeek || []).includes(index) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleDay(index)}
                    className={(formData.daysOfWeek || []).includes(index) ? 'bg-primary-500 text-white hover:bg-primary-600' : ''}
                  >
                    {day.substring(0, 3)}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-gray-500">Laissez vide pour tous les jours</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-800 font-semibold">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Description optionnelle du tarif"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-gray-800 border-gray-300 rounded focus:ring-primary-500"
              />
              <Label htmlFor="isActive" className="text-gray-800 font-semibold cursor-pointer">
                Tarif actif
              </Label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white" disabled={isSaving}>
                {isSaving ? 'Enregistrement...' : pricing ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function VehicleModal({
  onClose,
  onSave,
  isSaving,
  drivers,
}: {
  onClose: () => void;
  onSave: (data: { brand: string; model: string; licensePlate: string; color?: string; year?: number; capacity?: number; photoUrl?: string; driverId: string }) => void;
  isSaving: boolean;
  drivers: Array<{ id: string; user?: { firstName: string; lastName: string } }>;
}) {
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    licensePlate: '',
    color: '',
    year: '',
    capacity: '',
    photoUrl: '',
    driverId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
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
    if (!formData.driverId) {
      newErrors.driverId = 'Le chauffeur est requis';
    }
    if (formData.year && (isNaN(Number(formData.year)) || Number(formData.year) < 1900 || Number(formData.year) > new Date().getFullYear() + 1)) {
      newErrors.year = 'Année invalide';
    }
    if (formData.capacity && (isNaN(Number(formData.capacity)) || Number(formData.capacity) < 1)) {
      newErrors.capacity = 'Capacité invalide (minimum 1)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSave({
      brand: formData.brand.trim(),
      model: formData.model.trim(),
      licensePlate: formData.licensePlate.trim().toUpperCase(),
      color: formData.color.trim() || undefined,
      year: formData.year ? Number(formData.year) : undefined,
      capacity: formData.capacity ? Number(formData.capacity) : undefined,
      photoUrl: formData.photoUrl.trim() || undefined,
      driverId: formData.driverId,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold text-gray-800">Nouveau Véhicule</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="driverId" className="text-gray-800 font-semibold">Chauffeur *</Label>
              <select
                id="driverId"
                value={formData.driverId}
                onChange={(e) => {
                  setFormData({ ...formData, driverId: e.target.value });
                  if (errors.driverId) setErrors({ ...errors, driverId: '' });
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all ${
                  errors.driverId ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Sélectionner un chauffeur</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.user ? `${driver.user.firstName} ${driver.user.lastName}` : `Chauffeur ${driver.id}`}
                  </option>
                ))}
              </select>
              {errors.driverId && <p className="text-sm text-red-600">{errors.driverId}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand" className="text-gray-800 font-semibold">Marque *</Label>
                <Input
                  id="brand"
                  type="text"
                  value={formData.brand}
                  onChange={(e) => {
                    setFormData({ ...formData, brand: e.target.value });
                    if (errors.brand) setErrors({ ...errors, brand: '' });
                  }}
                  className={errors.brand ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : ''}
                  placeholder="Ex: Toyota"
                  required
                />
                {errors.brand && <p className="text-sm text-red-600">{errors.brand}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="model" className="text-gray-800 font-semibold">Modèle *</Label>
                <Input
                  id="model"
                  type="text"
                  value={formData.model}
                  onChange={(e) => {
                    setFormData({ ...formData, model: e.target.value });
                    if (errors.model) setErrors({ ...errors, model: '' });
                  }}
                  className={errors.model ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : ''}
                  placeholder="Ex: Corolla"
                  required
                />
                {errors.model && <p className="text-sm text-red-600">{errors.model}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="licensePlate" className="text-gray-800 font-semibold">Immatriculation *</Label>
              <Input
                id="licensePlate"
                type="text"
                value={formData.licensePlate}
                onChange={(e) => {
                  setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() });
                  if (errors.licensePlate) setErrors({ ...errors, licensePlate: '' });
                }}
                className={errors.licensePlate ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : ''}
                placeholder="Ex: AB-123-CD"
                required
              />
              {errors.licensePlate && <p className="text-sm text-red-600">{errors.licensePlate}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color" className="text-gray-800 font-semibold">Couleur</Label>
                <Input
                  id="color"
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="Ex: Blanc"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year" className="text-gray-800 font-semibold">Année</Label>
                <Input
                  id="year"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={(e) => {
                    setFormData({ ...formData, year: e.target.value });
                    if (errors.year) setErrors({ ...errors, year: '' });
                  }}
                  className={errors.year ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : ''}
                  placeholder="Ex: 2020"
                />
                {errors.year && <p className="text-sm text-red-600">{errors.year}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity" className="text-gray-800 font-semibold">Places</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => {
                    setFormData({ ...formData, capacity: e.target.value });
                    if (errors.capacity) setErrors({ ...errors, capacity: '' });
                  }}
                  className={errors.capacity ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : ''}
                  placeholder="Ex: 4"
                />
                {errors.capacity && <p className="text-sm text-red-600">{errors.capacity}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="photoUrl" className="text-gray-800 font-semibold">URL de la photo</Label>
              <Input
                id="photoUrl"
                type="url"
                value={formData.photoUrl}
                onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                placeholder="https://example.com/photo.jpg"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white" disabled={isSaving}>
                {isSaving ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function DriverModal({
  onClose,
  onSave,
  isSaving,
}: {
  onClose: () => void;
  onSave: (data: { firstName: string; lastName: string; email: string; phone: string; password: string; licenseNumber: string; serviceZone?: string }) => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    licenseNumber: '',
    serviceZone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Le téléphone est requis';
    }
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = 'Le numéro de permis est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSave({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      password: formData.password,
      licenseNumber: formData.licenseNumber.trim(),
      serviceZone: formData.serviceZone.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 min-h-screen bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto" onClick={onClose}>
      <Card className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto my-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 sm:pb-4">
          <CardTitle className="text-lg sm:text-2xl font-bold text-gray-800 truncate pr-2">Nouveau Chauffeur</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="firstName" className="text-gray-800 font-semibold text-sm sm:text-base">Prénom *</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => {
                    setFormData({ ...formData, firstName: e.target.value });
                    if (errors.firstName) setErrors({ ...errors, firstName: '' });
                  }}
                  className={`min-h-[44px] sm:min-h-0 ${errors.firstName ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : ''}`}
                  placeholder="Ex: Amadou"
                  required
                />
                {errors.firstName && <p className="text-sm text-red-600">{errors.firstName}</p>}
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="lastName" className="text-gray-800 font-semibold text-sm sm:text-base">Nom *</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => {
                    setFormData({ ...formData, lastName: e.target.value });
                    if (errors.lastName) setErrors({ ...errors, lastName: '' });
                  }}
                  className={errors.lastName ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : ''}
                  placeholder="Ex: Diallo"
                  required
                />
                {errors.lastName && <p className="text-sm text-red-600">{errors.lastName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-800 font-semibold">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  className={errors.email ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : ''}
                  placeholder="Ex: amadou.diallo@example.com"
                  required
                />
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-800 font-semibold">Téléphone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (errors.phone) setErrors({ ...errors, phone: '' });
                  }}
                  className={errors.phone ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : ''}
                  placeholder="Ex: +221771234567"
                  required
                />
                {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-800 font-semibold">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  className={errors.password ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : ''}
                  placeholder="Minimum 6 caractères"
                  required
                />
                {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-800 font-semibold">Confirmer le mot de passe *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value });
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                  }}
                  className={errors.confirmPassword ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : ''}
                  placeholder="Répétez le mot de passe"
                  required
                />
                {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="licenseNumber" className="text-gray-800 font-semibold">Numéro de permis *</Label>
              <Input
                id="licenseNumber"
                type="text"
                value={formData.licenseNumber}
                onChange={(e) => {
                  setFormData({ ...formData, licenseNumber: e.target.value });
                  if (errors.licenseNumber) setErrors({ ...errors, licenseNumber: '' });
                }}
                className={errors.licenseNumber ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : ''}
                placeholder="Ex: ABC123456"
                required
              />
              {errors.licenseNumber && <p className="text-sm text-red-600">{errors.licenseNumber}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceZone" className="text-gray-800 font-semibold">Zone de service</Label>
              <Input
                id="serviceZone"
                type="text"
                value={formData.serviceZone}
                onChange={(e) => setFormData({ ...formData, serviceZone: e.target.value })}
                placeholder="Ex: Dakar, Plateau"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto min-h-[44px] sm:min-h-0">
                Annuler
              </Button>
              <Button type="submit" className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 text-white min-h-[44px] sm:min-h-0" disabled={isSaving}>
                {isSaving ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function CreateUserModal({
  onClose,
  onSave,
  isSaving,
}: {
  onClose: () => void;
  onSave: (data: CreateUserByAdminDto) => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'driver' as 'admin' | 'driver',
    isActive: true,
    licenseNumber: '',
    serviceZone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'Le prénom est requis';
    if (!formData.lastName.trim()) newErrors.lastName = 'Le nom est requis';
    if (!formData.email.trim()) newErrors.email = "L'email est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email invalide';
    if (!formData.phone.trim()) newErrors.phone = 'Le téléphone est requis';
    if (!formData.password) newErrors.password = 'Le mot de passe est requis';
    else if (formData.password.length < 6) newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    if (formData.role === 'driver' && !formData.licenseNumber.trim()) newErrors.licenseNumber = 'Le numéro de permis est requis pour un chauffeur';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const data: CreateUserByAdminDto = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      password: formData.password,
      role: formData.role,
      isActive: formData.isActive,
      serviceZone: formData.serviceZone.trim() || undefined,
    };
    if (formData.role === 'driver') data.licenseNumber = formData.licenseNumber.trim();
    onSave(data);
  };

  return (
    <div className="fixed inset-0 min-h-screen bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto" onClick={onClose}>
      <Card className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto my-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 sm:pb-4">
          <CardTitle className="text-lg sm:text-2xl font-bold text-gray-800 truncate pr-2">Créer un utilisateur</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-gray-800 font-semibold text-sm sm:text-base">Prénom *</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => { setFormData({ ...formData, firstName: e.target.value }); if (errors.firstName) setErrors({ ...errors, firstName: '' }); }}
                  className={`min-h-[44px] sm:min-h-0 ${errors.firstName ? 'border-red-500' : ''}`}
                  placeholder="Prénom"
                />
                {errors.firstName && <p className="text-sm text-red-600">{errors.firstName}</p>}
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-gray-800 font-semibold text-sm sm:text-base">Nom *</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => { setFormData({ ...formData, lastName: e.target.value }); if (errors.lastName) setErrors({ ...errors, lastName: '' }); }}
                  className={`min-h-[44px] sm:min-h-0 ${errors.lastName ? 'border-red-500' : ''}`}
                  placeholder="Nom"
                />
                {errors.lastName && <p className="text-sm text-red-600">{errors.lastName}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-gray-800 font-semibold text-sm sm:text-base">Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => { setFormData({ ...formData, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: '' }); }}
                  className={`min-h-[44px] sm:min-h-0 ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="email@example.com"
                />
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-gray-800 font-semibold text-sm sm:text-base">Téléphone *</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => { setFormData({ ...formData, phone: e.target.value }); if (errors.phone) setErrors({ ...errors, phone: '' }); }}
                  className={`min-h-[44px] sm:min-h-0 ${errors.phone ? 'border-red-500' : ''}`}
                  placeholder="+221771234567"
                />
                {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-gray-800 font-semibold text-sm sm:text-base">Mot de passe *</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => { setFormData({ ...formData, password: e.target.value }); if (errors.password) setErrors({ ...errors, password: '' }); }}
                  className={`min-h-[44px] sm:min-h-0 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="Min. 6 caractères"
                />
                {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-gray-800 font-semibold text-sm sm:text-base">Confirmer *</Label>
                <Input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => { setFormData({ ...formData, confirmPassword: e.target.value }); if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' }); }}
                  className={`min-h-[44px] sm:min-h-0 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder="Répétez le mot de passe"
                />
                {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-gray-800 font-semibold text-sm sm:text-base">Rôle *</Label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'driver' })}
                  className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-base"
                >
                  <option value="admin">Admin</option>
                  <option value="driver">Chauffeur</option>
                </select>
              </div>
              <div className="space-y-1.5 sm:space-y-2 flex items-end pb-1 sm:pt-6 sm:pb-0">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded border-gray-300"
                  />
                  <span className="text-gray-800 font-semibold text-sm sm:text-base">Compte actif</span>
                </label>
              </div>
            </div>
            {formData.role === 'driver' && (
              <>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-gray-800 font-semibold text-sm sm:text-base">Numéro de permis *</Label>
                  <Input
                    value={formData.licenseNumber}
                    onChange={(e) => { setFormData({ ...formData, licenseNumber: e.target.value }); if (errors.licenseNumber) setErrors({ ...errors, licenseNumber: '' }); }}
                    className={`min-h-[44px] sm:min-h-0 ${errors.licenseNumber ? 'border-red-500' : ''}`}
                    placeholder="Ex: ABC123456"
                  />
                  {errors.licenseNumber && <p className="text-sm text-red-600">{errors.licenseNumber}</p>}
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-gray-800 font-semibold text-sm sm:text-base">Zone de service</Label>
                  <Input
                    value={formData.serviceZone}
                    onChange={(e) => setFormData({ ...formData, serviceZone: e.target.value })}
                    className="min-h-[44px] sm:min-h-0"
                    placeholder="Ex: Dakar, Plateau"
                  />
                </div>
              </>
            )}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto min-h-[44px] sm:min-h-0">
                Annuler
              </Button>
              <Button type="submit" className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 text-white min-h-[44px] sm:min-h-0" disabled={isSaving}>
                {isSaving ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'drivers' | 'rides' | 'pricing' | 'vehicles' | 'users'>('overview');
  const [driverFilter, setDriverFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [rideFilter, setRideFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [showClearCompletedModal, setShowClearCompletedModal] = useState(false);
  const [clearCompletedPassword, setClearCompletedPassword] = useState('');
  const [rideSearch, setRideSearch] = useState<string>('');
  const [selectedDriverId] = useState<string>('all');
  const [vehicleDriverFilter, setVehicleDriverFilter] = useState<string>('all');
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [driverSearch, setDriverSearch] = useState<string>('');
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [testingNotification, setTestingNotification] = useState(false);
  
  // États de pagination
  const [driversPage, setDriversPage] = useState(1);
  const [ridesPage, setRidesPage] = useState(1);
  const [vehiclesPage, setVehiclesPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
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

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', usersPage],
    queryFn: () => adminService.getAllUsers(usersPage, pageSize),
    enabled: selectedTab === 'users',
    refetchInterval: 30000,
  });

  const createVehicleMutation = useMutation({
    mutationFn: (data: { brand: string; model: string; licensePlate: string; color?: string; year?: number; capacity?: number; photoUrl?: string; driverId: string }) => 
      adminService.createVehicle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vehicles'] });
      setShowVehicleModal(false);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erreur lors de la création du véhicule');
    },
  });

  const createDriverMutation = useMutation({
    mutationFn: (data: { firstName: string; lastName: string; email: string; phone: string; password: string; licenseNumber: string; serviceZone?: string }) => 
      adminService.createDriver(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-drivers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setShowDriverModal(false);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erreur lors de la création du chauffeur');
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserByAdminDto) => adminService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-drivers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setShowUserModal(false);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erreur lors de la création de l\'utilisateur');
    },
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
    const interval = setInterval(fetchUnreadCount, 15000); // Toutes les 15 s pour voir les nouvelles courses sans autorisation navigateur
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

  const clearCompletedRidesMutation = useMutation({
    mutationFn: (password: string) => adminService.clearCompletedRides(password),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-rides'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setShowClearCompletedModal(false);
      setClearCompletedPassword('');
      alert(`${data.deleted} course(s) terminée(s) supprimée(s).`);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erreur (vérifiez votre mot de passe).');
    },
  });

  // Les filtres sont maintenant gérés côté serveur via les query params
  // Pas besoin de filteredDrivers/filteredRides car la pagination se fait côté serveur

  // Écouter les événements de changement d'onglet depuis la navigation
  // IMPORTANT: Ce useEffect doit être AVANT tout return conditionnel pour respecter les règles des hooks
  useEffect(() => {
    const handleSwitchTab = (event: CustomEvent) => {
      const tab = event.detail as 'overview' | 'drivers' | 'rides' | 'pricing' | 'vehicles' | 'users';
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
          title="Notifications (nouvelles réservations, etc.) — fonctionne sans autorisation du navigateur"
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
                          : parseFloat(String(stats.revenue.total) || '0').toLocaleString())
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
                      ? parseFloat(String(stats.drivers.avgRating)).toFixed(1)
                      : '0.0'}
                  </p>
                </div>
              </div>
            </section>

            {/* Section de test des notifications push */}
            <section className="stats-section" style={{ marginTop: '2rem' }}>
              <Card>
                <CardHeader>
                  <CardTitle>🔔 Test des Notifications Push</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <p style={{ marginBottom: '0.5rem' }}>
                        <strong>Token FCM:</strong> {fcmToken ? (
                          <code style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                            {fcmToken.substring(0, 50)}...
                          </code>
                        ) : (
                          <span style={{ color: '#999' }}>Non obtenu</span>
                        )}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Button
                        onClick={async () => {
                          try {
                            const { token, registered } = await fcmService.initialize();
                            if (token) {
                              setFcmToken(token);
                              if (registered) {
                                alert('✅ Token FCM obtenu et enregistré avec succès !');
                              } else {
                                alert('✅ Token FCM obtenu.\n⚠️ Enregistrement sur le serveur a échoué. Vérifiez que le backend est démarré (port 3001).');
                              }
                            } else {
                              alert('❌ Impossible d\'obtenir le token. Vérifiez que vous avez autorisé les notifications.');
                            }
                          } catch (error: any) {
                            alert('❌ Erreur: ' + (error?.message || error));
                          }
                        }}
                        variant="outline"
                      >
                        📱 Obtenir Token FCM
                      </Button>
                      <Button
                        onClick={async () => {
                          const token = fcmToken || fcmService.getToken();
                          if (!token) {
                            alert('❌ Aucun token disponible. Cliquez d\'abord sur "Obtenir Token FCM"');
                            return;
                          }
                          
                          setTestingNotification(true);
                          try {
                            const response = await apiClient.post('/test/push-notification', {
                              token,
                              title: 'Test Notification',
                              message: 'Ceci est une notification de test depuis le dashboard admin ! 🎉'
                            });
                            
                            if (response.data.success) {
                              alert('✅ Notification envoyée avec succès ! Vérifiez votre navigateur.');
                            } else {
                              alert('❌ Erreur: ' + (response.data.error || 'Erreur inconnue'));
                            }
                          } catch (error: any) {
                            alert('❌ Erreur: ' + (error.response?.data?.error || error.message));
                          } finally {
                            setTestingNotification(false);
                          }
                        }}
                        disabled={testingNotification || !fcmToken}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {testingNotification ? 'Envoi...' : '🚀 Envoyer Notification de Test'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                        <Banknote className="price-icon" />
                        <strong>{
                          ride.price != null 
                            ? (typeof ride.price === 'number' 
                                ? ride.price.toLocaleString() 
                                : parseFloat(String(ride.price) || '0').toLocaleString())
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
              <div className="flex justify-between items-center mb-4">
                <h2 className="section-title-modern">Gestion des Chauffeurs</h2>
                <Button
                  onClick={() => setShowDriverModal(true)}
                  className="bg-primary-500 text-white hover:bg-primary-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau chauffeur
                </Button>
              </div>
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
                                    : parseFloat(String(driver.rating) || '0').toFixed(1))
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
          <section className="rides-section-modern">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-800">Gestion des Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Filtres */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={rideFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setRideFilter('all')}
                        className={rideFilter === 'all' ? 'bg-primary-500 text-white hover:bg-primary-600' : ''}
                      >
                        Toutes
                      </Button>
                      <Button
                        variant={rideFilter === 'pending' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setRideFilter('pending')}
                        className={rideFilter === 'pending' ? 'bg-primary-500 text-white hover:bg-primary-600' : ''}
                      >
                        En attente
                      </Button>
                      <Button
                        variant={rideFilter === 'completed' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setRideFilter('completed')}
                        className={rideFilter === 'completed' ? 'bg-primary-500 text-white hover:bg-primary-600' : ''}
                      >
                        Terminées
                      </Button>
                      <Button
                        variant={rideFilter === 'cancelled' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setRideFilter('cancelled')}
                        className={rideFilter === 'cancelled' ? 'bg-primary-500 text-white hover:bg-primary-600' : ''}
                      >
                        Annulées
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowClearCompletedModal(true)}
                        className="ml-2 border-amber-300 text-amber-800 hover:bg-amber-50"
                        title="Supprimer toutes les courses terminées (avec validation mot de passe)"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Vider les terminées
                      </Button>
                    </div>
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          type="text"
                          placeholder="Rechercher par nom, prénom, téléphone ou email..."
                          value={rideSearch}
                          onChange={(e) => setRideSearch(e.target.value)}
                          className="pl-10 bg-white border-gray-300 focus:border-gray-900 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Modal vider les courses terminées */}
              {showClearCompletedModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => !clearCompletedRidesMutation.isPending && setShowClearCompletedModal(false)}>
                  <Card className="w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg">Vider les courses terminées</CardTitle>
                      <Button variant="ghost" size="icon" onClick={() => !clearCompletedRidesMutation.isPending && setShowClearCompletedModal(false)}><X className="w-4 h-4" /></Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Toutes les courses au statut &quot;Terminée&quot; seront définitivement supprimées. Cette action est irréversible.
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="clear-completed-password">Mot de passe admin</Label>
                        <Input
                          id="clear-completed-password"
                          type="password"
                          placeholder="Votre mot de passe"
                          value={clearCompletedPassword}
                          onChange={(e) => setClearCompletedPassword(e.target.value)}
                          className="bg-white"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setShowClearCompletedModal(false)} disabled={clearCompletedRidesMutation.isPending}>
                          Annuler
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => clearCompletedRidesMutation.mutate(clearCompletedPassword)}
                          disabled={!clearCompletedPassword.trim() || clearCompletedRidesMutation.isPending}
                        >
                          {clearCompletedRidesMutation.isPending ? 'Suppression...' : 'Supprimer les terminées'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Liste des courses */}
              <div className="space-y-4">
                {ridesLoading ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-gray-600">Chargement...</p>
                    </CardContent>
                  </Card>
                ) : rides.length > 0 ? (
                  rides.map((ride, index) => (
                    <motion.div
                      key={ride.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row gap-6">
                            {/* Informations principales */}
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-bold text-gray-800">
                                  {ride.rideType === 'city_to_airport' ? 'Ville → Aéroport' : 
                                   ride.rideType === 'airport_to_city' ? 'Aéroport → Ville' : 
                                   'Ville → Ville'}
                                </h3>
                                <Badge 
                                  variant="outline"
                                  className={
                                    ride.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                    ride.status === 'completed' ? 'bg-green-100 text-green-800 border-green-300' :
                                    ride.status === 'cancelled' ? 'bg-red-100 text-red-800 border-red-300' :
                                    ride.status === 'in_progress' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                    'bg-gray-100 text-gray-800 border-gray-300'
                                  }
                                >
                                  {ride.status === 'pending' ? 'En attente' :
                                   ride.status === 'completed' ? 'Terminée' :
                                   ride.status === 'cancelled' ? 'Annulée' :
                                   ride.status === 'in_progress' ? 'En cours' :
                                   ride.status}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2 text-gray-700">
                                  <User className="w-4 h-4 text-gray-500" />
                                  <span><strong>Client:</strong> {ride.clientFirstName} {ride.clientLastName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                  <Phone className="w-4 h-4 text-gray-500" />
                                  <span><strong>Téléphone:</strong> {ride.clientPhone}</span>
                                </div>
                                {ride.clientEmail && (
                                  <div className="flex items-center gap-2 text-gray-700">
                                    <Mail className="w-4 h-4 text-gray-500" />
                                    <span><strong>Email:</strong> {ride.clientEmail}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-gray-700">
                                  <Calendar className="w-4 h-4 text-gray-500" />
                                  <span><strong>Date:</strong> {new Date(ride.scheduledAt).toLocaleString('fr-FR')}</span>
                                </div>
                                <div className="flex items-start gap-2 text-gray-700">
                                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                                  <span><strong>Départ:</strong> {ride.pickupAddress}</span>
                                </div>
                                <div className="flex items-start gap-2 text-gray-700">
                                  <Navigation className="w-4 h-4 text-gray-500 mt-0.5" />
                                  <span><strong>Arrivée:</strong> {ride.dropoffAddress}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                  <Banknote className="w-4 h-4 text-gray-500" />
                                  <span><strong>Prix:</strong> {
                                    ride.price != null 
                                      ? (typeof ride.price === 'number' 
                                          ? ride.price.toLocaleString() 
                                          : parseFloat(String(ride.price) || '0').toLocaleString())
                                      : '0'
                                  } FCFA</span>
                                </div>
                                {ride.flightNumber && (
                                  <div className="flex items-center gap-2 text-gray-700">
                                    <Car className="w-4 h-4 text-gray-500" />
                                    <span><strong>Vol:</strong> {ride.flightNumber}</span>
                                  </div>
                                )}
                              </div>
                              
                              {ride.driver && (
                                <div className="flex items-center gap-2 text-sm text-gray-700 pt-2 border-t border-gray-200">
                                  <UserCheck className="w-4 h-4 text-gray-500" />
                                  <span><strong>Chauffeur:</strong> {ride.driver.user?.firstName} {ride.driver.user?.lastName}</span>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex lg:flex-col justify-end gap-3">
                              <Button
                                asChild
                                className="bg-primary-500 hover:bg-primary-600 text-white"
                              >
                                <Link to={`/admin/rides/${ride.id}`} className="flex items-center gap-2">
                                  <Eye className="w-4 h-4" />
                                  Voir détails
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Hourglass className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">Aucune course trouvée</p>
                      <p className="text-gray-500 text-sm mt-2">Essayez de modifier vos filtres de recherche</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Pagination */}
              {ridesData && rides.length > 0 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={ridesPage}
                    totalPages={ridesData.totalPages}
                    onPageChange={setRidesPage}
                    hasNextPage={ridesData.hasNextPage}
                    hasPreviousPage={ridesData.hasPreviousPage}
                  />
                  <div className="text-center text-sm text-gray-600 mt-4">
                    Affichage de {rides.length} sur {ridesData?.total || 0} course(s)
                  </div>
                </div>
              )}
            </motion.div>
          </section>
        )}

        {selectedTab === 'pricing' && <PricingManagement />}
        {selectedTab === 'users' && (
          <section className="dashboard-section">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
              <h2 className="section-title-modern text-xl sm:text-2xl">Gestion des utilisateurs</h2>
              <Button
                onClick={() => setShowUserModal(true)}
                className="bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] sm:min-h-0"
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                Créer un utilisateur
              </Button>
            </div>
            {usersLoading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-600">Chargement...</p>
                </CardContent>
              </Card>
            ) : !usersData?.data?.length ? (
              <Card>
                <CardContent className="py-12 text-center px-4">
                  <UserCog className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Aucun utilisateur</p>
                  <p className="text-gray-500 text-sm mt-2">Créez un admin ou un chauffeur avec le bouton ci-dessus.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Tableau visible à partir de md */}
                <Card className="hidden md:block">
                  <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-left min-w-[640px]">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="px-3 sm:px-4 py-3 text-gray-800 font-semibold text-sm">Nom</th>
                          <th className="px-3 sm:px-4 py-3 text-gray-800 font-semibold text-sm">Email</th>
                          <th className="px-3 sm:px-4 py-3 text-gray-800 font-semibold text-sm">Téléphone</th>
                          <th className="px-3 sm:px-4 py-3 text-gray-800 font-semibold text-sm">Rôle</th>
                          <th className="px-3 sm:px-4 py-3 text-gray-800 font-semibold text-sm">Statut</th>
                          <th className="px-3 sm:px-4 py-3 text-gray-800 font-semibold text-sm">Créé le</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(usersData?.data || []).map((u: AdminUser) => (
                          <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-3 sm:px-4 py-3 text-sm">{u.firstName} {u.lastName}</td>
                            <td className="px-3 sm:px-4 py-3 text-sm break-all">{u.email}</td>
                            <td className="px-3 sm:px-4 py-3 text-sm">{u.phone}</td>
                            <td className="px-3 sm:px-4 py-3">
                              <Badge variant="outline" className={u.role === 'admin' ? 'bg-purple-100 text-purple-800 border-purple-300' : 'bg-blue-100 text-blue-800 border-blue-300'}>
                                {u.role === 'admin' ? 'Admin' : 'Chauffeur'}
                              </Badge>
                            </td>
                            <td className="px-3 sm:px-4 py-3">
                              <Badge variant="outline" className={u.isActive ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'}>
                                {u.isActive ? 'Actif' : 'Inactif'}
                              </Badge>
                            </td>
                            <td className="px-3 sm:px-4 py-3 text-gray-600 text-sm">{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
                {/* Cartes sur mobile (< md) */}
                <div className="md:hidden space-y-3">
                  {(usersData?.data || []).map((u: AdminUser) => (
                    <Card key={u.id} className="overflow-hidden">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-semibold text-gray-800">{u.firstName} {u.lastName}</span>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <Badge variant="outline" className={u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}>
                              {u.role === 'admin' ? 'Admin' : 'Chauffeur'}
                            </Badge>
                            <Badge variant="outline" className={u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {u.isActive ? 'Actif' : 'Inactif'}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 break-all">{u.email}</p>
                        <p className="text-sm text-gray-600">{u.phone}</p>
                        <p className="text-xs text-gray-500">{new Date(u.createdAt).toLocaleDateString('fr-FR')}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {usersData && usersData.totalPages > 1 && (
                  <div className="mt-4 flex justify-center">
                    <Pagination
                      currentPage={usersPage}
                      totalPages={usersData.totalPages}
                      hasNextPage={usersData.hasNextPage}
                      hasPreviousPage={usersData.hasPreviousPage}
                      onPageChange={setUsersPage}
                    />
                  </div>
                )}
                <p className="text-center text-sm text-gray-600 mt-4 px-2">
                  {(usersData?.data?.length || 0)} / {usersData?.total || 0} utilisateur(s)
                </p>
              </>
            )}
          </section>
        )}

        {selectedTab === 'vehicles' && (
          <section className="vehicles-section-modern">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl font-bold text-gray-800">Gestion des Véhicules</CardTitle>
                    <Button
                      onClick={() => setShowVehicleModal(true)}
                      className="bg-primary-500 text-white hover:bg-primary-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nouveau véhicule
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={vehicleDriverFilter === 'all' && vehicleStatusFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setVehicleDriverFilter('all');
                        setVehicleStatusFilter('all');
                      }}
                      className={vehicleDriverFilter === 'all' && vehicleStatusFilter === 'all' ? 'bg-primary-500 text-white hover:bg-primary-600' : ''}
                    >
                      Tous les véhicules
                    </Button>
                    <Button
                      variant={vehicleStatusFilter === 'active' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setVehicleStatusFilter('active')}
                      className={vehicleStatusFilter === 'active' ? 'bg-green-600 text-white hover:bg-green-700' : ''}
                    >
                      Actifs
                    </Button>
                    <Button
                      variant={vehicleStatusFilter === 'inactive' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setVehicleStatusFilter('inactive')}
                      className={vehicleStatusFilter === 'inactive' ? 'bg-red-600 text-white hover:bg-red-700' : ''}
                    >
                      Inactifs
                    </Button>
                    <Input
                      type="text"
                      placeholder="Filtrer par ID chauffeur..."
                      value={vehicleDriverFilter === 'all' ? '' : vehicleDriverFilter}
                      onChange={(e) => setVehicleDriverFilter(e.target.value || 'all')}
                      className="w-64 bg-white border-gray-300 focus:border-gray-900 focus:ring-primary-500"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Liste des véhicules */}
              {vehiclesLoading ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-600">Chargement...</p>
                  </CardContent>
                </Card>
              ) : vehicles && vehicles.length > 0 ? (
                <div className="space-y-4">
                  {vehicles
                    .filter((vehicle) => {
                      if (vehicleStatusFilter === 'active') return vehicle.isActive;
                      if (vehicleStatusFilter === 'inactive') return !vehicle.isActive;
                      return true;
                    })
                    .map((vehicle, index) => (
                    <motion.div
                      key={vehicle.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card className={`hover:shadow-lg transition-shadow ${!vehicle.isActive ? 'opacity-60' : ''}`}>
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row gap-6">
                            {/* Informations principales */}
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="text-lg font-bold text-gray-800">
                                  {vehicle.brand} {vehicle.model}
                                </h3>
                                <Badge
                                  variant="outline"
                                  className="bg-gray-100 text-gray-800 border-gray-300 font-mono text-sm"
                                >
                                  {vehicle.licensePlate}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={vehicle.isActive ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'}
                                >
                                  {vehicle.isActive ? 'Actif' : 'Inactif'}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                                <div className="flex items-center gap-2 text-gray-700">
                                  <User className="w-4 h-4 text-gray-500" />
                                  <span><strong>Chauffeur:</strong> {vehicle.driver?.user ? `${vehicle.driver.user.firstName} ${vehicle.driver.user.lastName}` : 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                  <Truck className="w-4 h-4 text-gray-500" />
                                  <span><strong>Marque:</strong> {vehicle.brand}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                  <Car className="w-4 h-4 text-gray-500" />
                                  <span><strong>Modèle:</strong> {vehicle.model}</span>
                                </div>
                                {vehicle.color && (
                                  <div className="flex items-center gap-2 text-gray-700">
                                    <div 
                                      className="w-4 h-4 rounded border border-gray-300" 
                                      style={{ backgroundColor: vehicle.color }}
                                      title={vehicle.color}
                                    />
                                    <span><strong>Couleur:</strong> {vehicle.color}</span>
                                  </div>
                                )}
                                {vehicle.year && (
                                  <div className="flex items-center gap-2 text-gray-700">
                                    <CalendarIcon className="w-4 h-4 text-gray-500" />
                                    <span><strong>Année:</strong> {vehicle.year}</span>
                                  </div>
                                )}
                                {vehicle.capacity && (
                                  <div className="flex items-center gap-2 text-gray-700">
                                    <Users className="w-4 h-4 text-gray-500" />
                                    <span><strong>Places:</strong> {vehicle.capacity}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-gray-700">
                                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                                  <span><strong>Enregistré le:</strong> {new Date(vehicle.createdAt).toLocaleDateString('fr-FR')}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Aucun véhicule enregistré</p>
                    <p className="text-gray-500 text-sm mt-2">Les véhicules enregistrés par les chauffeurs apparaîtront ici</p>
                  </CardContent>
                </Card>
              )}

              {/* Pagination */}
              {vehiclesData && vehicles.length > 0 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={vehiclesPage}
                    totalPages={vehiclesData.totalPages}
                    onPageChange={setVehiclesPage}
                    hasNextPage={vehiclesData.hasNextPage}
                    hasPreviousPage={vehiclesData.hasPreviousPage}
                  />
                  <div className="text-center text-sm text-gray-600 mt-4">
                    Affichage de {vehicles.length} sur {vehiclesData?.total || 0} véhicule(s)
                  </div>
                </div>
              )}
            </motion.div>
          </section>
        )}

        {/* Modal de création de véhicule */}
        {showVehicleModal && (
          <VehicleModal
            onClose={() => {
              setShowVehicleModal(false);
            }}
            onSave={(data: { brand: string; model: string; licensePlate: string; color?: string; year?: number; capacity?: number; photoUrl?: string; driverId: string }) => createVehicleMutation.mutate(data)}
            isSaving={createVehicleMutation.isPending}
            drivers={driversData?.data || []}
          />
        )}

        {/* Modal de création de chauffeur */}
        {showDriverModal && (
          <DriverModal
            onClose={() => setShowDriverModal(false)}
            onSave={(data: { firstName: string; lastName: string; email: string; phone: string; password: string; licenseNumber: string; serviceZone?: string }) => createDriverMutation.mutate(data)}
            isSaving={createDriverMutation.isPending}
          />
        )}
        {showUserModal && (
          <CreateUserModal
            onClose={() => setShowUserModal(false)}
            onSave={(data) => createUserMutation.mutate(data)}
            isSaving={createUserMutation.isPending}
          />
        )}
      </div>

      {/* Barre de navigation en bas - fixe en bas de l'écran (Portal) */}
      {createPortal(
        <nav className="bottom-nav bottom-nav-fixed" aria-label="Navigation principale">
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
            <Banknote className="nav-icon" />
            <span className="nav-label">Tarifs</span>
          </button>
          <button 
            className={`nav-item ${selectedTab === 'users' ? 'active' : ''}`}
            onClick={() => setSelectedTab('users')}
          >
            <UserCog className="nav-icon" />
            <span className="nav-label">Utilisateurs</span>
          </button>
          <button 
            className={`nav-item ${selectedTab === 'vehicles' ? 'active' : ''}`}
            onClick={() => setSelectedTab('vehicles')}
          >
            <Truck className="nav-icon" />
            <span className="nav-label">Véhicules</span>
          </button>
        </nav>,
        document.body
      )}
    </div>
  );
}

export default AdminDashboard;
