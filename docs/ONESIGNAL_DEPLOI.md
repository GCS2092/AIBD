# OneSignal : comment ça marche et déploiement (Vercel, Render, Supabase)

## Comment ça marche concrètement

1. **Dans le navigateur (frontend)**
   - Au chargement de l’app, le SDK OneSignal s’initialise avec ton **App ID** (variable `VITE_ONESIGNAL_APP_ID`).
   - Le **Service Worker** (`public/OneSignalSDK-v16-ServiceWorker/OneSignalSDKWorker.js`) est enregistré pour recevoir les notifications push.
   - Si l’utilisateur est **connecté**, on appelle `OneSignal.login(userId)` : OneSignal associe cet appareil à ton `userId` (External ID). Tu pourras ensuite cibler les notifications par utilisateur depuis le dashboard ou l’API.

2. **Envoi des notifications**
   - **Depuis le dashboard OneSignal** : tu choisis une audience (tous, segment, ou par External ID) et tu envoies le message. Aucun code backend nécessaire.
   - **Depuis ton backend (optionnel)** : ton API NestJS sur Render peut appeler l’API REST OneSignal pour envoyer une push (ex. « Nouvelle course assignée ») en utilisant l’External ID du chauffeur. Cela demande d’ajouter une clé API OneSignal côté backend (voir plus bas).

3. **Supabase**
   - OneSignal ne se connecte pas à Supabase. Supabase = base de données ; OneSignal = envoi de push. Aucune configuration OneSignal à faire sur Supabase.

---

## Ce que tu dois faire sur chaque plateforme

### Vercel (frontend)

- **Une seule chose à faire** : définir la variable d’environnement pour que le build ait l’App ID.
  1. Vercel → ton projet → **Settings** → **Environment Variables**.
  2. Ajouter :
     - **Name** : `VITE_ONESIGNAL_APP_ID`
     - **Value** : ton App ID OneSignal (Dashboard OneSignal → **Settings** → **Keys & IDs**).
  3. **Redéployer** le frontend (les variables `VITE_*` sont injectées au build).

Sans cette variable, OneSignal ne s’initialise pas en production ; avec elle, tout fonctionne côté front. **Rien d’autre à faire sur Vercel.**

---

### Render (backend)

- **Pour recevoir les notifications sur le site** : rien à faire sur Render. Les push sont gérées entre le navigateur et OneSignal.
- **Si tu veux que ton backend envoie des notifications** (ex. « Course #123 assignée » au chauffeur) :
  1. Dashboard OneSignal → **Settings** → **Keys & IDs** → copier la **REST API Key** (ou créer une clé avec droit d’envoi).
  2. Sur Render → ton service backend → **Environment** → ajouter par exemple :
     - `ONESIGNAL_APP_ID` = ton App ID
     - `ONESIGNAL_REST_API_KEY` = ta clé API
  3. Dans ton code NestJS, appeler l’API OneSignal (POST) pour envoyer une notification vers un `external_id` (ton `userId`). Aucune config spéciale Render au-delà de ces variables.

Si tu n’envoies des notifications que depuis le dashboard OneSignal, tu n’as **rien à configurer sur Render** pour OneSignal.

---

### Supabase

- **Rien à faire** pour OneSignal. Supabase sert de base de données ; les notifications passent par OneSignal, pas par Supabase.

---

## Résumé

| Plateforme | Action pour OneSignal |
|------------|------------------------|
| **Vercel** | Ajouter `VITE_ONESIGNAL_APP_ID` dans les variables d’environnement, puis redéployer. |
| **Render** | Rien si tu n’envoies que depuis le dashboard. Optionnel : ajouter `ONESIGNAL_APP_ID` + `ONESIGNAL_REST_API_KEY` si le backend envoie des push. |
| **Supabase** | Rien. |

Une fois `VITE_ONESIGNAL_APP_ID` configuré sur Vercel et le front redéployé, les visiteurs pourront s’abonner aux notifications et, une fois connectés, être identifiés par External ID dans OneSignal.
