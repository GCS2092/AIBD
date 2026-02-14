# Checklist OneSignal – Notifications selon les actions

## Ce qui est déjà fait dans le code

### Backend
- **`OneSignalService`** (`backend/src/notifications/onesignal.service.ts`) : envoi de push via l’API REST OneSignal (external_id = user.id).
- **Intégration** :
  - **Nouvelle réservation** : après `createRide`, envoi d’une push à tous les **admins** (« Nouvelle réservation » + code + lien vers la course).
  - **Course assignée au chauffeur** : dans `assignDriverSequentially`, envoi d’une push au **chauffeur** (« Nouvelle course assignée » + adresse de départ).
  - **Course acceptée** : dans `acceptRide`, envoi d’une push au **client** (« Course acceptée » + lien suivi).

### Frontend
- **OneSignal init** dans `App.tsx` (appId, login avec userId, tags `role` après connexion).
- **Hook `useNotificationHandler`** : au clic sur une notification, redirection selon `data` (rideId, type) vers dashboard chauffeur, détail course admin ou page suivi client.
- **Tags utilisateur** : après `OneSignal.login(userId)`, `OneSignal.User.addTags({ role })` pour le ciblage (segments admin/driver).

### Déploiement
- **Vercel** : worker OneSignal à la racine (`public/OneSignalSDKWorker.js`), headers dans `vercel.json`.
- **Render** : variables d’environnement à définir (voir ci‑dessous).

---

## À faire de ton côté

### 1. Variables d’environnement

**Vercel (frontend)**  
- `VITE_ONESIGNAL_APP_ID` = ton App ID OneSignal (ex. `9a923f92-cdeb-47d7-85f8-f65dd0768166`).

**Render (backend)**  
- `ONESIGNAL_APP_ID` = même App ID.
- `ONESIGNAL_REST_API_KEY` = clé **REST API Key** (OneSignal Dashboard → **Settings** → **Keys & IDs**). Sans cette clé, le backend ne pourra pas envoyer de push (le service restera silencieux).

### 2. OneSignal Dashboard

- **Settings → All Browsers → Site URL** : ajouter `https://aibd-fsdx.vercel.app` (et éventuellement `http://localhost:5173` pour le dev).
- **Settings → All Browsers → Action Buttons** : activer si tu veux des boutons sur les notifications (ex. Accepter/Refuser).
- **Settings → All Browsers → Rich Notifications** : activer images / boutons si besoin.
- **Audience → Segments** : tu peux créer des segments par tag `role` (ex. `role` = `admin`, `role` = `driver`) pour tester l’envoi depuis le dashboard.
- **Settings → Keys & IDs** : noter l’**App ID** et la **REST API Key** pour les env vars ci‑dessus.

### 3. Test du flux

1. Créer une réservation depuis le front → les admins connectés (avec push autorisé) reçoivent « Nouvelle réservation ».
2. Assignation automatique d’un chauffeur → le chauffeur reçoit « Nouvelle course assignée ».
3. Chauffeur accepte la course → le client (si trouvé par email/phone et connecté avec le même user) reçoit « Course acceptée ».
4. Clic sur une notification → l’app s’ouvre sur la bonne page (dashboard, détail course, suivi).

---

## Résumé des fichiers concernés

| Fichier | Rôle |
|--------|------|
| `backend/src/notifications/onesignal.service.ts` | Envoi des push (admins, chauffeur, client). |
| `backend/src/ride/ride.service.ts` | Appel `notifyAdminsNewRide` après création de course. |
| `backend/src/ride/ride-assignment.service.ts` | Appel `notifyDriverAssigned` après assignation. |
| `backend/src/driver/driver.service.ts` | Appel `notifyClientRideAccepted` après acceptation. |
| `frontend/src/App.tsx` | Init OneSignal, login, tags `role`, hook `useNotificationHandler`. |
| `frontend/src/hooks/useNotificationHandler.ts` | Redirection au clic sur une notification. |
