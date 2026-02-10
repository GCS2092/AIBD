import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, User, Mail, MapPin, Plane, Calendar, Loader2, ArrowRight } from 'lucide-react';
import { rideService, Ride, TripType } from '../services/rideService';
import NavigationBar from '../components/NavigationBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const TRIP_TYPE_OPTIONS: { value: TripType; label: string }[] = [
  { value: 'aller_simple', label: 'Aller simple — 20 000 FCFA' },
  { value: 'retour_simple', label: 'Retour simple — 20 000 FCFA' },
  { value: 'aller_retour', label: 'Aller retour — 25 000 FCFA' },
];

function EditRideByCodePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'search' | 'form'>('search');
  const [accessCode, setAccessCode] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+221');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [ride, setRide] = useState<Ride | null>(null);
  const [loadError, setLoadError] = useState('');
  const [loadPending, setLoadPending] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [form, setForm] = useState<{
    clientFirstName: string;
    clientLastName: string;
    clientEmail: string;
    pickupAddress: string;
    dropoffAddress: string;
    tripType: TripType;
    scheduledAt: string;
    flightNumber: string;
    pickupCountry: string;
    pickupCity: string;
    pickupQuartier: string;
    dropoffCountry: string;
    dropoffCity: string;
    dropoffQuartier: string;
  }>({
    clientFirstName: '',
    clientLastName: '',
    clientEmail: '',
    pickupAddress: '',
    dropoffAddress: '',
    tripType: 'aller_simple',
    scheduledAt: '',
    flightNumber: '',
    pickupCountry: 'Sénégal',
    pickupCity: '',
    pickupQuartier: '',
    dropoffCountry: 'Sénégal',
    dropoffCity: '',
    dropoffQuartier: '',
  });

  const fullPhone = () => (phonePrefix + phoneNumber.replace(/\D/g, '').slice(0, 9)).replace(/\s/g, '');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadError('');
    const code = accessCode.trim().toUpperCase();
    const phone = fullPhone();
    if (!code || phone.length < 12) {
      setLoadError('Code d\'accès et téléphone (9 chiffres) requis.');
      return;
    }
    setLoadPending(true);
    try {
      const data = await rideService.getRideByAccessCode(code, phone);
      setRide(data);
      const scheduled = data.scheduledAt
        ? new Date(data.scheduledAt).toISOString().slice(0, 16)
        : '';
      setForm({
        clientFirstName: data.clientFirstName || '',
        clientLastName: data.clientLastName || '',
        clientEmail: data.clientEmail || '',
        pickupAddress: data.pickupAddress || '',
        dropoffAddress: data.dropoffAddress || '',
        tripType: (data.tripType as TripType) || 'aller_simple',
        scheduledAt: scheduled,
        flightNumber: data.flightNumber || '',
        pickupCountry: data.pickupCountry || 'Sénégal',
        pickupCity: data.pickupCity || '',
        pickupQuartier: data.pickupQuartier || '',
        dropoffCountry: data.dropoffCountry || 'Sénégal',
        dropoffCity: data.dropoffCity || '',
        dropoffQuartier: data.dropoffQuartier || '',
      });
      setStep('form');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setLoadError(
        Array.isArray(msg) ? msg[0] : msg || err?.message || 'Réservation non trouvée ou téléphone incorrect.'
      );
    } finally {
      setLoadPending(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ride) return;
    setSaveError('');
    setSavePending(true);
    try {
      const code = accessCode.trim().toUpperCase();
      const phone = fullPhone();
      await rideService.updateRideByAccessCode(code, phone, {
        clientFirstName: form.clientFirstName,
        clientLastName: form.clientLastName,
        clientEmail: form.clientEmail || undefined,
        pickupAddress: form.pickupAddress,
        dropoffAddress: form.dropoffAddress,
        tripType: form.tripType,
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
        flightNumber: form.flightNumber || undefined,
        pickupCountry: form.pickupCountry || undefined,
        pickupCity: form.pickupCity || undefined,
        pickupQuartier: form.pickupQuartier || undefined,
        dropoffCountry: form.dropoffCountry || undefined,
        dropoffCity: form.dropoffCity || undefined,
        dropoffQuartier: form.dropoffQuartier || undefined,
      });
      if (ride.id) navigate(`/track/${ride.id}`);
      else navigate('/history');
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || err?.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSavePending(false);
    }
  };

  const canEdit = ride && (ride.status === 'pending' || ride.status === 'assigned');

  return (
    <div className="min-h-screen bg-[var(--color-page-bg)]">
      <NavigationBar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-light)] border border-[var(--color-primary-border)] flex items-center justify-center">
            <Key className="w-6 h-6 text-[var(--color-primary)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text)]">Modifier ma réservation</h1>
            <p className="text-sm text-[var(--color-text-muted)]">Code d'accès et téléphone</p>
          </div>
        </div>

        {step === 'search' && (
          <Card className="border-[var(--color-border)]">
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[var(--color-text)]">Code d'accès</Label>
                  <Input
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    placeholder="Ex: AB12CD34"
                    maxLength={8}
                    className="bg-gray-50 border border-gray-300 text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[var(--color-text)]">Téléphone</Label>
                  <div className="flex gap-2">
                    <select
                      value={phonePrefix}
                      onChange={(e) => setPhonePrefix(e.target.value)}
                      className="w-28 h-10 rounded-md border border-gray-300 bg-gray-50 px-2 text-gray-900"
                    >
                      <option value="+221">+221</option>
                      <option value="+242">+242</option>
                    </select>
                    <Input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
                      placeholder="771234567"
                      className="flex-1 bg-gray-50 border border-gray-300 text-gray-900"
                    />
                  </div>
                </div>
                {loadError && <p className="text-red-600 text-sm">{loadError}</p>}
                <Button type="submit" disabled={loadPending} className="w-full bg-[var(--color-primary)] text-white">
                  {loadPending ? <><Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Chargement...</> : 'Voir ma réservation'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'form' && ride && (
          <Card className="border-[var(--color-border)]">
            <CardContent className="p-6">
              {!canEdit && (
                <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                  Cette réservation ne peut plus être modifiée (statut: {ride.status}).
                </div>
              )}
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-[var(--color-text)] flex items-center gap-1"><User className="w-3.5 h-3.5" /> Prénom</Label>
                    <Input
                      value={form.clientFirstName}
                      onChange={(e) => setForm(f => ({ ...f, clientFirstName: e.target.value }))}
                      className="bg-gray-50 border border-gray-300 text-gray-900"
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[var(--color-text)] flex items-center gap-1"><User className="w-3.5 h-3.5" /> Nom</Label>
                    <Input
                      value={form.clientLastName}
                      onChange={(e) => setForm(f => ({ ...f, clientLastName: e.target.value }))}
                      className="bg-gray-50 border border-gray-300 text-gray-900"
                      disabled={!canEdit}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[var(--color-text)] flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email (optionnel)</Label>
                  <Input
                    type="email"
                    value={form.clientEmail}
                    onChange={(e) => setForm(f => ({ ...f, clientEmail: e.target.value }))}
                    className="bg-gray-50 border border-gray-300 text-gray-900"
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[var(--color-text)]">Type de course</Label>
                  <select
                    value={form.tripType}
                    onChange={(e) => setForm(f => ({ ...f, tripType: e.target.value as TripType }))}
                    className="w-full h-10 rounded-md border border-gray-300 bg-gray-50 px-3 text-gray-900"
                    disabled={!canEdit}
                  >
                    {TRIP_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[var(--color-text)] flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Adresse de départ</Label>
                  <Input
                    value={form.pickupAddress}
                    onChange={(e) => setForm(f => ({ ...f, pickupAddress: e.target.value }))}
                    className="bg-gray-50 border border-gray-300 text-gray-900"
                    disabled={!canEdit}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Input placeholder="Pays" value={form.pickupCountry} onChange={(e) => setForm(f => ({ ...f, pickupCountry: e.target.value }))} disabled={!canEdit} className="bg-gray-50 border border-gray-300 text-gray-900" />
                    <Input placeholder="Ville" value={form.pickupCity} onChange={(e) => setForm(f => ({ ...f, pickupCity: e.target.value }))} disabled={!canEdit} className="bg-gray-50 border border-gray-300 text-gray-900" />
                    <Input placeholder="Quartier" value={form.pickupQuartier} onChange={(e) => setForm(f => ({ ...f, pickupQuartier: e.target.value }))} disabled={!canEdit} className="bg-gray-50 border border-gray-300 text-gray-900" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[var(--color-text)] flex items-center gap-1"><Plane className="w-3.5 h-3.5" /> Adresse d'arrivée</Label>
                  <Input
                    value={form.dropoffAddress}
                    onChange={(e) => setForm(f => ({ ...f, dropoffAddress: e.target.value }))}
                    className="bg-gray-50 border border-gray-300 text-gray-900"
                    disabled={!canEdit}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Input placeholder="Pays" value={form.dropoffCountry} onChange={(e) => setForm(f => ({ ...f, dropoffCountry: e.target.value }))} disabled={!canEdit} className="bg-gray-50 border border-gray-300 text-gray-900" />
                    <Input placeholder="Ville" value={form.dropoffCity} onChange={(e) => setForm(f => ({ ...f, dropoffCity: e.target.value }))} disabled={!canEdit} className="bg-gray-50 border border-gray-300 text-gray-900" />
                    <Input placeholder="Quartier" value={form.dropoffQuartier} onChange={(e) => setForm(f => ({ ...f, dropoffQuartier: e.target.value }))} disabled={!canEdit} className="bg-gray-50 border border-gray-300 text-gray-900" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[var(--color-text)] flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Date et heure</Label>
                  <Input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(e) => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                    className="bg-gray-50 border border-gray-300 text-gray-900"
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[var(--color-text)]">Numéro de vol (optionnel)</Label>
                  <Input
                    value={form.flightNumber}
                    onChange={(e) => setForm(f => ({ ...f, flightNumber: e.target.value }))}
                    className="bg-gray-50 border border-gray-300 text-gray-900"
                    disabled={!canEdit}
                  />
                </div>
                {saveError && <p className="text-red-600 text-sm">{saveError}</p>}
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep('search')} className="flex-1">
                    Retour
                  </Button>
                  {canEdit && (
                    <Button type="submit" disabled={savePending} className="flex-1 bg-[var(--color-primary)] text-white">
                      {savePending ? <><Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Enregistrement...</> : <>Enregistrer <ArrowRight className="w-4 h-4 inline ml-1" /></>}
                    </Button>
                  )}
                  {ride.id && (
                    <Button type="button" variant="outline" onClick={() => navigate(`/track/${ride.id}`)}>
                      Suivre la course
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

export default EditRideByCodePage;
