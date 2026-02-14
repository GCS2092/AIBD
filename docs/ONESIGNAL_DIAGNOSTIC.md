# Diagnostic : les notifications OneSignal ne arrivent pas (PWA)

## Ce qui a été corrigé dans le code

- **OneSignal n’était envoyé que dans l’assignation séquentielle.**  
  La première étape est la **proposition à plusieurs chauffeurs** ; si des chauffeurs sont trouvés, ils recevaient SMS / interne / WebSocket mais **pas de push OneSignal**.  
  → **Correction** : envoi OneSignal ajouté aussi dans `offerRideToMultipleDrivers` pour chaque chauffeur à qui la course est proposée.

---

## Vérifications à faire (dans l’ordre)

### 1. Backend (Render) – variables d’environnement

Sans ces variables, le backend **n’envoie aucune** push OneSignal (le service se désactive au démarrage).

- **ONESIGNAL_APP_ID** = ton App ID (ex. `9a923f92-cdeb-47d7-85f8-f65dd0768166`)
- **ONESIGNAL_REST_API_KEY** = la clé **REST API Key** (OneSignal Dashboard → **Settings** → **Keys & IDs**)

À la mise en route du backend sur Render, les logs doivent contenir :

- Si tout est ok : `OneSignal: push activés (app_id présent, clé API configurée)`
- Si une variable manque : `OneSignal: push désactivés (manque ONESIGNAL_APP_ID ou ONESIGNAL_REST_API_KEY sur Render)`

Si tu vois « push désactivés », ajoute les deux variables sur Render puis redéploie.

---

### 2. Le chauffeur doit avoir « souscrit » aux push sur son appareil

OneSignal ne peut envoyer une push que si :

1. Le **chauffeur** a ouvert l’app (PWA) sur **cet appareil**.
2. Il s’est **connecté** (login).
3. Le front a appelé **OneSignal.login(userId)** (déjà fait dans ton `App.tsx` après connexion).
4. Il a **accepté** la permission « Notifications » quand le navigateur/PWA l’a demandée.

Si le chauffeur n’a jamais fait ça sur l’appareil où il attend la notif (ou s’il a refusé les notifs), il n’y a **aucun abonnement** pour son `user.id` → OneSignal ne peut pas envoyer.

**À faire** : sur l’appareil du chauffeur, ouvrir la PWA, se connecter, accepter les notifications si demandé, et laisser l’onglet/PWA ouverte au moins une fois après login (pour que le Service Worker et l’external_id soient enregistrés).

---

### 3. OneSignal Dashboard – domaine et clé

- **Settings** → **All Browsers** (ou équivalent) : l’URL du site doit contenir ton domaine (ex. `https://aibd-fsdx.vercel.app`). Sinon les push web peuvent être refusées.
- **Keys & IDs** : la clé utilisée dans **ONESIGNAL_REST_API_KEY** doit être la **REST API Key** (pas seulement l’App ID). Certains comptes ont une « User Auth Key » et une « REST API Key » ; il faut la **REST API Key** pour créer des notifications.

---

### 4. Navigateur / appareil

- **Firefox « Enhanced Tracking Protection »** : peut bloquer le script OneSignal (`cdn.onesignal.com`). Dans ce cas, pas d’abonnement push possible sur ce navigateur. Tester sur Chrome/Edge ou désactiver la protection pour ton site.
- **Safari** : les push web ont des limites ; le comportement peut différer.
- **PWA installée** : une fois installée, les notifs fonctionnent comme pour un onglet du même site (même Service Worker, même external_id). Pas de config Supabase nécessaire.

---

### 5. Vérifier que le backend envoie bien (logs Render)

Après la correction, quand une course est **proposée** ou **assignée** à un chauffeur, les logs backend doivent contenir une ligne du type :

- `OneSignal: envoi vers 1 user(s) — "🚗 Nouvelle course assignée"`

Si cette ligne n’apparaît **jamais** :

- Soit les variables OneSignal sur Render manquent ou sont fausses (tu verras « push désactivés » au démarrage).
- Soit le flux ne passe pas par `offerRideToMultipleDrivers` ni `assignDriverSequentially` (ex. pas de chauffeur disponible, ou autre chemin).

Si cette ligne **apparaît** mais que le chauffeur ne reçoit rien :

- Le problème est côté **abonnement** (point 2) ou **OneSignal / navigateur** (points 3 et 4).

---

### 6. Notification « course acceptée » pour le client

La push « Course acceptée » est envoyée **uniquement** si le **client** est trouvé en base comme **User** (par hash téléphone ou email) et qu’on a son `user.id`. Beaucoup de clients réservent **sans compte** → pas de User → pas de push possible pour eux. C’est normal : seuls les clients qui ont un compte et se sont connectés (avec OneSignal.login + permission notifs) peuvent recevoir cette push.

---

## Résumé des causes possibles

| Cause | Où vérifier |
|--------|--------------|
| Variables Render manquantes | Render → Environment → ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY |
| Chauffeur jamais connecté / pas de notifs acceptées sur cet appareil | Faire login + accepter notifs sur la PWA sur l’appareil concerné |
| OneSignal bloqué par le navigateur (ETP, etc.) | Tester sur Chrome/Edge ou désactiver la protection pour le site |
| Mauvaise clé API (User Key au lieu de REST API Key) | OneSignal Dashboard → Keys & IDs → utiliser REST API Key |
| Domaine non autorisé | OneSignal → Settings → All Browsers → Site URL |
| Push envoyée uniquement en séquentiel (ancien bug) | Corrigé : push envoyée aussi en proposition multiple |

Une fois les variables Render correctes et le chauffeur « abonné » sur son appareil (login + notifs acceptées), les notifications devraient arriver quand une course lui est proposée ou assignée.
