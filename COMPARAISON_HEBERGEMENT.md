# Comparaison : où héberger le projet AIBD

Deux options possibles. Les deux fonctionnent.

---

## Option 1 : Réparti (Vercel + Supabase + Render)

| Composant | Où | Rôle |
|-----------|-----|------|
| **Frontend** | **Vercel** | Site React (SPA), CDN mondial, déploiement Git automatique |
| **Base de données** | **Supabase** | PostgreSQL géré, déjà en place |
| **Backend** | **Render** | API NestJS + WebSockets |

### Configuration

- **Vercel** (projet frontend) : variable `VITE_API_URL` = URL du backend Render (ex. `https://aibd-backend.onrender.com`).
- **Render** (backend) : variable `DATABASE_URL` = chaîne de connexion Supabase (Settings → Database → Connection string).
- **Supabase** : rien à changer, tu gardes ta base actuelle.

### Avantages

- **Vercel** : très bon pour le front (gratuit, rapide, prévu pour React/Vite).
- **Supabase** : base déjà configurée, schéma importé.
- Chaque service fait ce pour quoi il est fait.

### Inconvénients

- 3 plateformes à gérer (3 comptes, 3 dashboards).
- Si un service est en panne, une partie de l’app ne marche pas.

---

## Option 2 : Tout sur Render

| Composant | Où | Rôle |
|-----------|-----|------|
| **Frontend** | **Render (Static Site)** | Même app React, déployée comme site statique |
| **Backend** | **Render (Web Service)** | Même API NestJS + WebSockets |
| **Base de données** | **Supabase** (recommandé) ou **Render PostgreSQL** | Tu peux garder Supabase ou passer sur la base Render |

### Configuration

- **Render** : 2 services dans le même projet :
  1. **Web Service** = backend (dossier `backend/`, build Nest, `DATABASE_URL` vers Supabase ou Render Postgres).
  2. **Static Site** = frontend (dossier `frontend/`, build Vite, variable `VITE_API_URL` = URL du Web Service Render).
- Si tu gardes **Supabase** pour la base : tu n’as rien à changer côté données, seulement 2 services Render (front + back).

### Avantages

- Un seul endroit : tout est sur Render (sauf la DB si tu restes sur Supabase).
- Un seul dashboard pour front + back.
- Facturation / monitoring regroupés.

### Inconvénients

- Le front sur Render (Static Site) est un peu moins “optimisé” pour le déploiement front que Vercel (Vercel est pensé pour ça).
- Si tu prenais **Render PostgreSQL** au lieu de Supabase : migration de la base à prévoir ; avec Supabase tu ne changes rien.

---

## Recommandation

- **Garder le front sur Vercel** + **BD sur Supabase** + **backend sur Render** (Option 1) est un très bon choix :
  - Vercel = idéal pour le front.
  - Supabase = déjà en place.
  - Render = idéal pour NestJS + WebSockets.

- **Tout mettre sur Render** (Option 2) est possible si tu préfères tout au même endroit ; tu peux garder Supabase pour la base et mettre seulement **front + back** sur Render.

En résumé : **tu peux garder Frontend sur Vercel, BD sur Supabase, et héberger le backend sur Render** ; ou tout mettre sur Render (front + back, avec Supabase ou Render Postgres). Les deux sont valides, la première option est souvent la plus pratique pour ton cas.
