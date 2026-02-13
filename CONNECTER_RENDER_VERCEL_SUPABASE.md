# Connecter Render + Vercel + Supabase

Ton backend est en ligne : **https://aibd.onrender.com**

---

## Schéma

```
[Vercel - Frontend]  →  [Render - Backend]  →  [Supabase ou Render Postgres - Base]
     (React)                  (NestJS)                    (PostgreSQL)
```

- Le **frontend** (Vercel) appelle uniquement le **backend** (Render).
- Le **backend** (Render) se connecte à la **base** (Supabase ou Render Postgres).

---

## 1. Vercel ↔ Render (frontend → backend)

Le frontend doit connaître l’URL du backend.

1. Va sur **Vercel** → ton projet (ex. aibd-fsdx) → **Settings** → **Environment Variables**.
2. **Modifie ou ajoute** :
   - **Name** : `VITE_API_URL`
   - **Value** : `https://aibd.onrender.com`  
   (sans slash à la fin, pas d’URL Supabase ici.)
3. **Environments** : coche au moins **Production** (et Preview si tu veux).
4. **Save**.
5. **Redéploie** le frontend : **Deployments** → **…** sur le dernier déploiement → **Redeploy**.

Ensuite, ton site Vercel (ex. https://aibd-fsdx.vercel.app) enverra toutes les requêtes API vers **https://aibd.onrender.com**.

---

## 2. Render ↔ Supabase (backend → base de données)

Si tu utilises **Supabase** pour la base PostgreSQL :

1. Va sur **Supabase** → ton projet → **Settings** (engrenage) → **Database**.
2. Dans **Connection string**, choisis **URI**.
3. Copie l’URL (ex. `postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-xxx.pooler.supabase.com:6543/postgres`).
4. Remplace **`[YOUR-PASSWORD]`** par le mot de passe de l’utilisateur `postgres` (celui de la base Supabase).
5. Ajoute **`?sslmode=require`** à la fin si ce n’est pas déjà dans l’URL.
6. Va sur **Render** → ton **Web Service** (backend) → **Environment**.
7. **Modifie ou ajoute** :
   - **Key** : `DATABASE_URL`
   - **Value** : l’URL Supabase complète (avec le mot de passe et `?sslmode=require`).
8. **Save** → Render redéploie automatiquement (ou lance un **Manual Deploy**).

Le backend sur Render utilisera alors Supabase comme base.

---

## 2bis. Render ↔ Render Postgres (si ta base est sur Render)

Si tu as créé une base **PostgreSQL sur Render** (et pas Supabase) :

1. **Render** → ta base **PostgreSQL** → onglet **Info** ou **Connections**.
2. Copie **Internal Database URL** (recommandé pour un backend sur le même compte Render).
3. **Render** → ton **Web Service** (backend) → **Environment**.
4. **Key** : `DATABASE_URL`  
   **Value** : l’**Internal Database URL** copiée.
5. **Save** (et redéploiement si besoin).

---

## 3. Vérifier que tout est connecté

| Test | URL | Résultat attendu |
|------|-----|------------------|
| Backend vivant | https://aibd.onrender.com/health | `{"status":"ok",...}` |
| Backend + base | https://aibd.onrender.com/test/database | `"database":"connected"`, tables en `"ok"` |
| Frontend | https://aibd-fsdx.vercel.app | Page d’accueil, réservation, etc. sans erreur réseau |
| Test connexion | https://aibd-fsdx.vercel.app/test-connexion | Les 3 blocs (API, health, base) en vert |

---

## Récap

| Lien | Où configurer | Variable | Valeur |
|------|----------------|----------|--------|
| **Vercel → Render** | Vercel (projet frontend) | `VITE_API_URL` | `https://aibd.onrender.com` |
| **Render → Supabase** | Render (Web Service backend) | `DATABASE_URL` | URL Postgres Supabase (avec mot de passe + `?sslmode=require`) |
| **Render → Render Postgres** | Render (Web Service backend) | `DATABASE_URL` | Internal Database URL de la base Render |

Une fois **VITE_API_URL** sur Vercel et **DATABASE_URL** sur Render renseignés (et redéploiements faits), tout est connecté.
