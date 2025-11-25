# AIBD Backend

Backend NestJS pour l'application de transport Dakar ↔ Aéroport.

## 🚀 Installation

1. Installer les dépendances :
```bash
npm install
```

2. Configurer les variables d'environnement :
```bash
cp env.example .env
```

3. Modifier le fichier `.env` avec vos credentials PostgreSQL :
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=votre_mot_de_passe
DB_DATABASE=AIBD
JWT_SECRET=votre_secret_jwt
```

4. Créer la base de données dans PostgreSQL :
```sql
CREATE DATABASE AIBD;
```

5. Exécuter le script SQL pour créer les tables :
```bash
psql -U postgres -d AIBD -f database/schema.sql
```

Ou depuis psql :
```sql
\i database/schema.sql
```

## 🏃 Lancer l'application

```bash
# Mode développement
npm run start:dev

# Mode production
npm run build
npm run start:prod
```

L'application sera accessible sur `http://localhost:3000`

## 📁 Structure du projet

```
backend/
├── src/
│   ├── entities/          # Entités TypeORM
│   ├── config/            # Configuration
│   ├── modules/           # Modules NestJS (à créer)
│   └── main.ts           # Point d'entrée
├── database/
│   └── schema.sql        # Script SQL de création des tables
└── .env                  # Variables d'environnement
```

## 🗄️ Base de données

La base de données PostgreSQL contient les tables suivantes :
- `users` - Utilisateurs (admin et chauffeurs)
- `drivers` - Informations des chauffeurs
- `vehicles` - Véhicules
- `rides` - Courses
- `pricing` - Tarifs
- `notifications` - Logs des notifications
- `cancellations` - Annulations

## 🔐 Authentification

L'authentification utilise JWT. Les rôles disponibles :
- `admin` - Administrateur
- `driver` - Chauffeur

## 📝 Prochaines étapes

1. Créer les modules (Auth, Admin, Driver, Ride)
2. Implémenter les endpoints API
3. Ajouter la logique d'attribution automatique
4. Intégrer les notifications (Firebase, WhatsApp)
