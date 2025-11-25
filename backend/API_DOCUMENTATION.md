# 📚 Documentation API - AIBD Backend

## 🔐 Authentification

Tous les endpoints protégés nécessitent un token JWT dans le header :
```
Authorization: Bearer <token>
```

## 📋 Endpoints

### 🔓 Public (sans authentification)

#### Health & Test
- `GET /` - Message de bienvenue
- `GET /health` - Health check
- `GET /test/database` - Test connexion base de données

#### Authentification
- `POST /auth/login` - Connexion (admin ou chauffeur)
- `POST /auth/register/driver/:token` - Inscription chauffeur via lien unique

#### Réservations (Client)
- `POST /rides` - Créer une réservation
- `GET /rides/:id/status` - Suivre une course
- `POST /rides/:id/cancel` - Annuler une réservation

#### Tarifs
- `GET /pricing` - Liste des tarifs (public)
- `GET /pricing?rideType=dakar_to_airport` - Tarifs par type de trajet

---

### 👤 Admin (nécessite rôle ADMIN)

#### Gestion des chauffeurs
- `POST /admin/drivers/invite` - Générer un lien d'inscription
- `GET /admin/drivers` - Liste de tous les chauffeurs
- `GET /admin/drivers/:id` - Détails d'un chauffeur
- `PUT /admin/drivers/:id` - Modifier un chauffeur

#### Gestion des courses
- `GET /admin/rides` - Liste de toutes les courses
- `GET /admin/rides?status=pending` - Filtrer par statut
- `GET /admin/rides?driverId=xxx` - Filtrer par chauffeur

#### Dashboard
- `GET /admin/dashboard/stats` - Statistiques (courses, revenus, chauffeurs)

#### Gestion des tarifs
- `POST /pricing` - Créer un tarif
- `PUT /pricing/:id` - Modifier un tarif
- `DELETE /pricing/:id` - Désactiver un tarif

---

### 🚗 Chauffeur (nécessite rôle DRIVER)

#### Profil
- `GET /driver/profile` - Mon profil
- `PUT /driver/status` - Changer mon statut (available/unavailable/on_break)

#### Courses
- `GET /driver/rides` - Mes courses
- `GET /driver/rides?status=assigned` - Filtrer par statut
- `POST /driver/rides/:id/accept` - Accepter une course
- `POST /driver/rides/:id/refuse` - Refuser une course
- `POST /driver/rides/:id/start` - Démarrer une course
- `POST /driver/rides/:id/complete` - Terminer une course

---

## 📝 Détails des Endpoints

### POST /auth/login
**Body:**
```json
{
  "email": "admin@aibd.sn",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@aibd.sn",
    "firstName": "Admin",
    "lastName": "AIBD",
    "role": "admin"
  }
}
```

### POST /rides
**Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+221771234567",
  "email": "john@example.com",
  "pickupAddress": "Dakar, Sénégal",
  "dropoffAddress": "Aéroport International Blaise Diagne",
  "rideType": "dakar_to_airport",
  "scheduledAt": "2024-12-01T10:00:00Z",
  "flightNumber": "AF123"
}
```

**Response:**
```json
{
  "id": "uuid",
  "clientFirstName": "John",
  "clientLastName": "Doe",
  "status": "pending",
  "price": 5000,
  "scheduledAt": "2024-12-01T10:00:00Z",
  "driverId": null
}
```

### POST /admin/drivers/invite
**Body:**
```json
{
  "email": "driver@example.com",
  "firstName": "Chauffeur",
  "lastName": "Test"
}
```

**Response:**
```json
{
  "message": "Lien d'inscription généré avec succès",
  "token": "uuid-token",
  "registrationLink": "http://localhost:5173/register/driver/uuid-token",
  "driverId": "uuid"
}
```

### GET /admin/dashboard/stats
**Response:**
```json
{
  "rides": {
    "total": 150,
    "completed": 120,
    "pending": 5,
    "byDay": [
      { "date": "2024-11-24", "count": "25" },
      { "date": "2024-11-25", "count": "30" }
    ]
  },
  "drivers": {
    "total": 20,
    "active": 15
  },
  "revenue": {
    "total": 600000
  }
}
```

---

## 🔒 Sécurité

- **Rate Limiting** : 10 requêtes par minute par IP
- **JWT** : Token expire après 24h
- **Validation** : Tous les inputs sont validés avec class-validator
- **CORS** : Configuré pour le frontend (http://localhost:5173)

## 📊 Statuts

### Statuts des courses (RideStatus)
- `pending` - En attente d'attribution
- `assigned` - Chauffeur assigné (en attente d'acceptation)
- `accepted` - Chauffeur a accepté
- `driver_on_way` - Chauffeur en route
- `picked_up` - Client pris en charge
- `in_progress` - Course en cours
- `completed` - Terminée
- `cancelled` - Annulée

### Statuts des chauffeurs (DriverStatus)
- `available` - Disponible
- `on_ride` - En course
- `unavailable` - Indisponible
- `on_break` - En pause

---

## 🚀 Démarrage rapide

1. **Créer un admin** :
```bash
npm run create:admin
```

2. **Se connecter** :
```bash
POST /auth/login
{
  "email": "admin@aibd.sn",
  "password": "admin123"
}
```

3. **Générer un lien d'inscription pour un chauffeur** :
```bash
POST /admin/drivers/invite
Authorization: Bearer <token>
{
  "email": "driver@example.com"
}
```

4. **Créer une réservation** :
```bash
POST /rides
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+221771234567",
  "pickupAddress": "Dakar",
  "dropoffAddress": "Aéroport",
  "rideType": "dakar_to_airport",
  "scheduledAt": "2024-12-01T10:00:00Z"
}
```

---

## 📞 Support

Pour toute question, consultez :
- `README.md` - Guide d'installation
- `TEST_GUIDE.md` - Guide des tests
- `PLAN_DEVELOPPEMENT.md` - Plan de développement

