# Tester la connexion Supabase ↔ Backend ↔ Frontend Vercel

Tu utilises **Supabase** (base de données) et **Vercel** (frontend).  
La chaîne est : **Vercel (frontend)** → **Backend (NestJS)** → **Supabase (PostgreSQL)**.  
Le frontend ne se connecte jamais directement à Supabase ; il appelle uniquement l’API du backend.

---

## 1. Où héberger le backend ?

Le backend NestJS doit tourner quelque part pour parler à Supabase :

- **Option A** : Backend sur **Vercel** (même compte) — déployer le dossier `backend/` comme projet Vercel séparé ou en API serverless. L’URL aura la forme `https://ton-backend.vercel.app`.
- **Option B** : Backend sur un autre hébergeur (Render, Fly.io, etc.) avec **`DATABASE_URL`** pointant vers Supabase.

Une fois le backend déployé, tu obtiens une URL publique (ex. `https://xxx.vercel.app` ou `https://xxx.onrender.com`). C’est cette URL que tu configures dans le frontend (voir ci‑dessous).

---

## 2. Vérifier les variables d’environnement

### Backend (où qu’il soit hébergé)

- **`DATABASE_URL`** = URL de connexion Supabase  
  Ex. : `postgresql://postgres.xxx:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require`  
  À récupérer dans Supabase → **Settings** → **Database** → **Connection string** (URI).

### Frontend (Vercel)

- **`VITE_API_URL`** = URL publique de ton backend  
  Ex. : `https://ton-backend.vercel.app` ou `https://ton-backend.onrender.com`  
  **À faire** : Vercel → ton projet → **Settings** → **Environment Variables** → ajouter **`VITE_API_URL`** avec l’URL du backend → **Redéployer**.

---

## 2. Tester Backend ↔ Supabase (base de données)

Le backend expose deux routes utiles :

| URL | Rôle |
|-----|------|
| `https://TON_BACKEND_URL/health` | Backend vivant (sans base) |
| `https://TON_BACKEND_URL/test/database` | Connexion à la base + test des tables |

**Dans un navigateur ou avec curl :**

1. **Health (backend seul)**  
   Ouvre : `https://TON_BACKEND_URL/health`  
   Réponse attendue : `{ "status": "ok", "timestamp": "...", "uptime": ... }`

2. **Test base (Backend → Supabase)**  
   Ouvre : `https://TON_BACKEND_URL/test/database`  
   - Si Supabase est bien connectée : `success: true`, `database: "connected"`, et les tables (`users`, `drivers`, `rides`, `pricing`, etc.) avec `status: "ok"`.  
   - Si erreur : `success: false`, `database: "error"` et un message d’erreur (connexion, tables manquantes, etc.).

Remplace `TON_BACKEND_URL` par l’URL réelle de ton backend (Vercel, Render, etc.).

---

## 3. Tester Frontend Vercel → Backend

1. Ouvre ton site déployé sur Vercel (ex. `https://ton-app.vercel.app`).
2. Ouvre les **Outils de développement** (F12) → onglet **Console** : au chargement, tu devrais voir une ligne du type :  
   `🔗 API URL configurée: https://ton-backend...`  
   Vérifie que l’URL affichée est bien celle de ton backend.
3. Fais une action qui appelle l’API :
   - **Connexion** : essaie de te connecter (login).
   - **Page d’accueil** : si elle charge des tarifs ou des infos depuis l’API, c’est bon.
   - **Admin** : si tu as un tableau de bord admin, ouvre-le (liste des courses, chauffeurs, etc.).
4. Onglet **Réseau (Network)** : filtre par « Fetch/XHR ». Tu dois voir des requêtes vers ton backend avec statut **200** (ou 201).  
   Si tu as des **404** ou **CORS** ou **Failed to fetch**, vérifie **`VITE_API_URL`** sur Vercel et les réglages CORS du backend.

---

## 4. Résumé : tout est OK quand…

| Étape | Test | OK si… |
|-------|------|--------|
| 1 | `GET /health` | `status: "ok"` |
| 2 | `GET /test/database` | `success: true`, `database: "connected"`, tables en `"ok"` |
| 3 | Frontend Vercel | Console affiche la bonne API URL, et les appels réseau vers le backend renvoient 200 |
| 4 | Connexion / données | Login ou liste des courses / tarifs s’affichent sans erreur |

Si **1** et **2** sont OK, Supabase est correctement connectée au backend.  
Si **3** et **4** sont OK, le frontend Vercel est correctement connecté au backend (et donc indirectement à Supabase).

---

## 5. Erreurs fréquentes

- **Backend : "connection refused" / timeout vers la base**  
  Vérifier `DATABASE_URL` (mot de passe, `?sslmode=require`), et que l’IP du backend est autorisée si Supabase restreint les IP (sinon désactiver la restriction pour tester).

- **Frontend : "Failed to fetch" / CORS**  
  Vérifier que **`VITE_API_URL`** sur Vercel pointe vers l’URL réelle du backend, et que le backend autorise l’origine Vercel dans CORS (ex. `https://ton-app.vercel.app`).

- **`/test/database` renvoie des erreurs sur des tables**  
  Les tables n’existent pas ou le schéma est incomplet sur Supabase : réexécuter `aibd_export.sql` (ou les migrations) dans l’éditeur SQL Supabase.
