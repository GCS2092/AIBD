# 📋 Instructions de Setup - AIBD

## ✅ Ce qui a été créé

1. **Backend NestJS** dans le dossier `backend/`
2. **Toutes les entités** (User, Driver, Vehicle, Ride, Pricing, Notification, Cancellation)
3. **Configuration TypeORM** pour PostgreSQL
4. **Script SQL** pour créer les tables dans `backend/database/schema.sql`
5. **Fichier d'exemple d'environnement** `backend/env.example`

## 🎯 Actions à faire MAINTENANT

### 1. Exécuter le script SQL dans PostgreSQL

Vous avez déjà créé la base de données `AIBD`. Maintenant, exécutez le script SQL :

**Option A - Via psql en ligne de commande :**
```bash
psql -U postgres -d AIBD -f backend/database/schema.sql
```

**Option B - Depuis psql :**
```sql
\c AIBD
\i backend/database/schema.sql
```

**Option C - Copier-coller le contenu :**
- Ouvrir `backend/database/schema.sql`
- Copier tout le contenu
- L'exécuter dans votre client PostgreSQL (pgAdmin, DBeaver, etc.)

### 2. Créer le fichier .env

```bash
cd backend
copy env.example .env
```

Puis éditer `.env` avec vos informations :
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=VOTRE_MOT_DE_PASSE
DB_DATABASE=AIBD

JWT_SECRET=une_cle_secrete_longue_et_aleatoire_changez_moi
JWT_EXPIRES_IN=24h

PORT=3000
NODE_ENV=development
```

### 3. Installer et lancer

```bash
cd backend
npm install
npm run start:dev
```

## 📊 Structure de la base de données créée

Le script SQL crée :
- ✅ 7 tables principales
- ✅ Tous les index pour les performances
- ✅ Les triggers pour `updatedAt`
- ✅ Les tarifs par défaut (Dakar ↔ Aéroport à 5000 FCFA)

## 🔄 Prochaines étapes

Une fois que le backend démarre sans erreur :

1. **Créer les modules** (Auth, Admin, Driver, Ride)
2. **Implémenter les endpoints API**
3. **Créer le frontend React**
4. **Intégrer les notifications**

## 📝 Notes importantes

- En mode développement, TypeORM peut créer les tables automatiquement (`synchronize: true`)
- Mais il est recommandé d'utiliser le script SQL pour avoir le contrôle
- Le script SQL inclut les tarifs par défaut
- Tous les champs nécessaires sont présents selon le cahier des charges

## 🐛 Si vous avez des erreurs

1. **Erreur de connexion PostgreSQL** :
   - Vérifier que PostgreSQL tourne
   - Vérifier les credentials dans `.env`
   - Vérifier que la base `AIBD` existe

2. **Tables déjà existantes** :
   - Le script utilise `CREATE TABLE IF NOT EXISTS` donc pas de problème
   - Vous pouvez l'exécuter plusieurs fois

3. **Erreur "module not found"** :
   - Exécuter `npm install` dans le dossier `backend`

---

**Une fois ces étapes faites, dites-moi et on continue avec les modules et les endpoints API !** 🚀

