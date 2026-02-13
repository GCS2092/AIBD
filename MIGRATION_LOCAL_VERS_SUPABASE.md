# Passer de la base locale à Supabase

Ce guide explique comment faire fonctionner le projet AIBD avec **Supabase** comme base de données PostgreSQL à la place d’une base locale (ou Neon, etc.).

---

## En bref (déjà connecté front + back)

Si tu as déjà récupéré l’URL Supabase et branché le frontend et le backend :

1. **Backend** : définir la variable **`DATABASE_URL`** (dans `.env` ou sur ton hébergeur backend) avec l’URL Supabase complète, par ex.  
   `postgresql://postgres.xxx:motdepasse@...pooler.supabase.com:6543/postgres?sslmode=require`
2. **Base Supabase** : créer le schéma (tables) soit en important `aibd_export.sql`, soit en exécutant les migrations dans `backend/database/`.
3. Redémarrer (ou redéployer) le backend. L’app utilisera alors Supabase.

Le reste du document détaille chaque étape.

---

## 1. Prérequis

- Un compte [Supabase](https://supabase.com)
- Un projet Supabase créé
- Le frontend et le backend du projet AIBD

---

## 2. Récupérer l’URL de connexion Supabase

1. Va sur [app.supabase.com](https://app.supabase.com) et ouvre ton **projet**.
2. **Settings** (icône engrenage) → **Database**.
3. Dans **Connection string**, choisis **URI**.
4. Copie l’URL du type :
   ```text
   postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
5. Remplace **`[YOUR-PASSWORD]`** par le mot de passe de l’utilisateur `postgres` (celui défini à la création du projet, ou réinitialise-le dans **Database** → **Database password**).

Tu obtiens une URL complète, par exemple :
```text
postgresql://postgres.xxxxx:MonMotDePasse@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

---

## 3. Créer le schéma sur Supabase

Supabase part d’une base vide. Il faut y créer les tables (schéma + migrations).

### Option A : Exporter depuis l’ancienne base puis importer

Si tu as encore une base locale (ou Neon) avec les bonnes tables :

1. **Exporter** (depuis ta machine, avec la base source) :
   ```bash
   pg_dump -U postgres -d AIBD -F p -f aibd_export.sql
   ```
2. **Importer dans Supabase** (remplace `<URL_SUPABASE>` par ton URL complète) :
   ```bash
   psql "<URL_SUPABASE>" -f aibd_export.sql
   ```

### Option B : Exécuter les migrations du projet

Si tu n’as pas de dump mais que tu as les fichiers SQL dans `backend/database/` :

1. Créer d’abord les **extensions** et **types** (en suivant l’ordre des migrations dans le repo).
2. Exécuter chaque fichier `.sql` sur la base Supabase, par exemple :
   ```bash
   psql "<URL_SUPABASE>" -f backend/database/migration_fcm_tokens.sql
   # etc.
   ```
3. Ou exécuter un **schéma complet** s’il existe (ex. `backend/database/schema_complete.sql`) :
   ```bash
   psql "<URL_SUPABASE>" -f backend/database/schema_complete.sql
   ```

---

## 4. Backend : configurer la connexion

Le backend peut utiliser soit une **URL unique** (`DATABASE_URL`), soit les variables séparées (`DB_HOST`, `DB_PORT`, etc.).

### Avec Supabase : utiliser `DATABASE_URL`

1. Ouvre le fichier **`.env`** à la racine de **`backend/`** (ou les variables d’environnement de ton hébergeur : Vercel, Render, etc.).
2. **Ajoute ou modifie** :
   ```env
   DATABASE_URL=postgresql://postgres.xxxxx:TON_MOT_DE_PASSE@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require
   ```
   - Utilise **ta** propre URL Supabase (celle copiée à l’étape 2).
   - En général Supabase exige le SSL : ajoute **`?sslmode=require`** à la fin de l’URL si ce n’est pas déjà indiqué.
3. Tu peux **laisser ou commenter** les anciennes variables locales :
   ```env
   # DB_HOST=localhost
   # DB_PORT=5432
   # DB_USERNAME=postgres
   # DB_PASSWORD=...
   # DB_DATABASE=AIBD
   ```
   Dès que **`DATABASE_URL`** est définie, le backend l’utilise en priorité.

### En production (backend hébergé)

- Dans le **dashboard** de ton hébergeur (Vercel, Render, etc.), ajoute une variable d’environnement :
  - **Nom** : `DATABASE_URL`
  - **Valeur** : l’URL Supabase complète (avec `?sslmode=require` si nécessaire).
- Redéploie le backend pour que la nouvelle variable soit prise en compte.

---

## 5. Frontend : configurer l’API

Le frontend n’a pas besoin de l’URL de la base. Il appelle uniquement **l’API du backend**.

- En local : l’API est par exemple sur `http://localhost:3001`.
- En production : configure la variable qui définit l’URL de l’API (ex. `VITE_API_URL` ou `REACT_APP_API_URL`) avec l’URL de ton backend déployé (définir VITE_API_URL sur Vercel).

Aucune configuration Supabase n’est nécessaire dans le frontend.

---

## 6. Vérifications

1. **Backend** : redémarre le backend (local ou redéploiement) et regarde les logs au démarrage. Tu ne dois pas avoir d’erreur de connexion TypeORM/Postgres.
2. **Connexion** : ouvre l’app (frontend), connecte-toi ou fais une action qui lit la base (ex. liste des courses). Si tout est correct, les données viennent de Supabase.
3. **Supabase** : dans le dashboard Supabase, **Table Editor** ou **SQL Editor** pour vérifier que les tables et les données sont bien là.

---

## 7. Résumé des étapes

| Étape | Action |
|-------|--------|
| 1 | Créer un projet Supabase et récupérer l’URL de connexion (Database → Connection string URI). |
| 2 | Remplacer `[YOUR-PASSWORD]` dans l’URL par le mot de passe de l’utilisateur `postgres`. |
| 3 | Créer le schéma sur Supabase : importer un dump (`aibd_export.sql`) ou exécuter les migrations du repo. |
| 4 | Mettre **`DATABASE_URL`** dans le `.env` du backend (et sur l’hébergeur en prod) avec l’URL Supabase + `?sslmode=require`. |
| 5 | Redémarrer (ou redéployer) le backend et vérifier que l’app fonctionne avec Supabase. |

---

## 8. Dépannage

- **Connexion refusée / timeout** : vérifier que l’URL est correcte, que le mot de passe est le bon, et que `sslmode=require` est bien présent si Supabase l’exige.
- **Tables manquantes** : réimporter le schéma ou exécuter les migrations (étape 3).
- **Backend qui ne prend pas en compte l’URL** : s’assurer que la variable s’appelle bien **`DATABASE_URL`** et qu’aucune autre config (ex. `DB_HOST`) ne surcharge la connexion. Le code du backend est prévu pour utiliser `DATABASE_URL` en priorité quand elle est définie.

---

*Document pour le projet AIBD – migration base locale / Neon vers Supabase.*
