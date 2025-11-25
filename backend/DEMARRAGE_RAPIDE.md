# 🚀 Guide de Démarrage Rapide

## Étape 1 : Configuration de la base de données

1. **Créer la base de données** (si pas déjà fait) :
```sql
CREATE DATABASE AIBD;
```

2. **Exécuter le script SQL** pour créer toutes les tables :
```bash
# Option 1 : Via psql
psql -U postgres -d AIBD -f database/schema.sql

# Option 2 : Depuis psql
psql -U postgres -d AIBD
\i database/schema.sql
```

## Étape 2 : Configuration de l'environnement

1. **Créer le fichier `.env`** à la racine du dossier `backend` :
```bash
cd backend
copy env.example .env
```

2. **Modifier le fichier `.env`** avec vos informations :
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=VOTRE_MOT_DE_PASSE
DB_DATABASE=AIBD

JWT_SECRET=changez_moi_en_production_avec_une_cle_secrete_longue
JWT_EXPIRES_IN=24h

PORT=3000
NODE_ENV=development
```

## Étape 3 : Installer et lancer

```bash
# Installer les dépendances (si pas déjà fait)
npm install

# Lancer en mode développement
npm run start:dev
```

L'application devrait démarrer sur `http://localhost:3000`

## ✅ Vérification

Pour vérifier que tout fonctionne :

1. **Vérifier la connexion à la base de données** :
   - Si pas d'erreur au démarrage, la connexion fonctionne ✅
   - Les tables devraient être créées automatiquement (en mode dev)

2. **Tester l'API** :
   - Ouvrir `http://localhost:3000` dans le navigateur
   - Vous devriez voir un message de bienvenue

## 📋 Prochaines étapes

1. ✅ Base de données créée
2. ✅ Entités créées
3. ⏳ Créer les modules (Auth, Admin, Driver, Ride)
4. ⏳ Implémenter les endpoints API
5. ⏳ Créer le frontend React

## 🐛 Problèmes courants

### Erreur de connexion à PostgreSQL
- Vérifier que PostgreSQL est démarré
- Vérifier les credentials dans `.env`
- Vérifier que la base `AIBD` existe

### Erreur "Cannot find module"
- Exécuter `npm install` à nouveau
- Vérifier que vous êtes dans le dossier `backend`

### Tables non créées
- Exécuter manuellement le script `database/schema.sql`
- Ou vérifier que `synchronize: true` est dans la config (mode dev uniquement)

