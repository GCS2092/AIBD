# Étapes après avoir créé PostgreSQL sur Render

Tu as créé la base **AIBD** sur Render. Voici quoi faire ensuite.

---

## 1. Récupérer l’URL de connexion

Dans le dashboard Render de ta base **PostgreSQL** :

- **Backend sur Render** (recommandé) : utilise **URL de base de données interne** (Internal Database URL).  
  Les services Render du même compte peuvent s’y connecter sans règle IP.
- **Test en local** : utilise **URL de base de données externe** (External Database URL).  
  Copie l’URL et garde-la pour plus tard (backend Render utilisera l’**interne**).

Clique sur **« Info »** ou ouvre l’onglet **Connexions** pour afficher :
- **Internal Database URL** (ex. `postgresql://aibd_user:xxx@dpg-xxx-a.oregon-postgres.render.com/aibd`)
- **External Database URL** (pour connexions hors Render)

---

## 2. Créer les tables (schéma) dans la base

Il faut exécuter ton schéma SQL sur cette nouvelle base.

### Option A : depuis ta machine (avec l’URL externe)

1. Ouvre **External Database URL** sur Render, copie-la.
2. Dans un terminal (PowerShell ou cmd), à la racine du projet :

```powershell
cd c:\AIBD
psql "COLLE_ICI_L_URL_EXTERNE_RENDER" -f aibd_export.sql
```

(Remplace `COLLE_ICI_L_URL_EXTERNE_RENDER` par l’URL complète, entre guillemets.)

Si `psql` n’est pas installé : installe PostgreSQL (client seul) ou utilise l’option B.

### Option B : depuis le shell Render (PSQL)

1. Dans Render → ta base PostgreSQL → onglet ou section **Connect** / **PSQL**.
2. Render affiche une commande du type :  
   `psql postgresql://...`
3. Tu peux aussi utiliser **Render Shell** (si dispo) et exécuter le contenu de `aibd_export.sql` (copier-coller par blocs si besoin).

Après exécution, les tables (users, rides, pricing, etc.) doivent exister dans la base **AIBD** sur Render.

---

## 3. Créer le Web Service (backend) sur Render

1. **Dashboard Render** → **New +** → **Web Service**.
2. Connecte ton **repo Git** (GitHub/GitLab) qui contient le projet AIBD.
3. Configuration du service :
   - **Name** : `aibd-backend` (ou autre).
   - **Region** : même que la base (ex. Oregon) si possible.
   - **Branch** : `main` (ou ta branche de prod).
   - **Root Directory** : `backend`.
   - **Runtime** : `Node`.
   - **Build Command** : `npm install && npm run build`
   - **Start Command** : `npm run start:prod`  
     (ou `node dist/main` si tu n’as pas de script `start:prod` ; vérifie dans `backend/package.json`).
4. **Variables d’environnement** (Environment) :
   - **Key** : `DATABASE_URL`  
     **Value** : **Internal Database URL** de ta base PostgreSQL Render (étape 1).  
     C’est l’URL **interne**, pas l’externe.
   - **Key** : `NODE_ENV`  
     **Value** : `production`
   - **Key** : `JWT_SECRET`  
     **Value** : une chaîne secrète (obligatoire en prod pour la sécurité). Voir ci‑dessous pour en générer une.
   - **Key** : `ENCRYPTION_KEY`  
     **Value** : une clé d’**au moins 32 caractères** — **obligatoire**, sinon le backend ne démarre pas. Voir ci‑dessous.
   - **Key** : `PORT`  
     **Value** : `3001` (ou laisser Render le définir ; le backend lit `process.env.PORT`).
   - **Si le backend affiche "self-signed certificate"** : ajouter **`DATABASE_SSL_REJECT_UNAUTHORIZED`** = **`false`** (pour accepter le certificat de Render Postgres).  
     En dernier recours : **`NODE_TLS_REJECT_UNAUTHORIZED`** = **`0`** (Node accepte tous les certificats TLS).
5. **Create Web Service**. Render va builder et démarrer le backend. Une fois déployé, tu auras une URL du type :  
   `https://aibd-backend.onrender.com`

---

## 4. Vérifier le backend

- Ouvre dans le navigateur :  
  `https://TON_BACKEND_URL/health`  
  Tu dois voir quelque chose comme : `{"status":"ok",...}`
- Puis :  
  `https://TON_BACKEND_URL/test/database`  
  Tu dois voir `"database":"connected"` et les tables en `"ok"`.

Si ça échoue : regarde les **Logs** du Web Service sur Render (erreur de build, crash, ou mauvaise `DATABASE_URL`).

---

## 5. Brancher le frontend (Vercel)

- Sur **Vercel** → ton projet frontend → **Settings** → **Environment Variables**.
- **VITE_API_URL** = URL du backend Render (ex. `https://aibd-backend.onrender.com`), **sans** slash final.
- **Redéploie** le frontend.

Ensuite, teste l’app sur l’URL Vercel : réservation, connexion, etc. Tout doit passer par le backend Render, qui lit/écrit dans la base Render.

---

## 6. Générer JWT_SECRET et ENCRYPTION_KEY

Sans **ENCRYPTION_KEY**, le backend **ne démarre pas** (erreur au lancement).  
Sans **JWT_SECRET** (ou avec la valeur par défaut), l’app tourne mais les tokens sont prévisibles → **à définir en production**.

**Générer des valeurs (une seule fois, puis les recopier dans Render) :**

Sur ta machine, dans un terminal à la racine du projet :

```powershell
cd c:\AIBD\backend
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('base64'))"
```

Tu obtiens deux lignes du type :
- `JWT_SECRET=abc123...` → copie tout sauf `JWT_SECRET=` dans la valeur de la variable **JWT_SECRET** sur Render (ou copie la ligne entière si tu préfères).
- `ENCRYPTION_KEY=xyz789...` → idem pour **ENCRYPTION_KEY**.

Ou en une seule commande pour afficher les deux :

```powershell
node -e "const c=require('crypto'); console.log('JWT_SECRET:', c.randomBytes(32).toString('hex')); console.log('ENCRYPTION_KEY:', c.randomBytes(32).toString('base64'));"
```

Garde ces valeurs (par ex. dans un fichier local non versionné) pour pouvoir les remettre si tu recrées le service. **Ne les commite pas** dans Git.

---

## 7. Rappel : expiration base gratuite

Render indique que la base **expirera le 15 mars 2026** si tu restes en gratuit. Après cette date, la base peut être supprimée si tu ne passes pas à un plan payant. Pour garder les données à long terme, prévois soit une mise à niveau Render, soit une migration vers une autre base (ex. Supabase) avant cette date.

---

## Récap

| Étape | Action |
|-------|--------|
| 1 | Copier **Internal Database URL** (et External pour psql local si besoin). |
| 2 | Exécuter `aibd_export.sql` sur la base Render (psql ou shell). |
| 3 | Créer un **Web Service** Render pour le backend, root `backend`, avec `DATABASE_URL` = Internal URL. |
| 4 | Tester `/health` et `/test/database` sur l’URL du backend. |
| 5 | Mettre **VITE_API_URL** sur Vercel = URL du backend Render, puis redéployer. |

Après ça, tu as : **Frontend (Vercel) → Backend (Render) → Base PostgreSQL (Render)**.
