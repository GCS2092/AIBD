# 🚀 Plan de Développement - AIBD

## 📋 Ordre de développement recommandé

### **PHASE 1 : FONDATIONS (Semaine 1-2)**
*Priorité : CRITIQUE - Base nécessaire pour tout le reste*

#### 1.1 Setup initial du projet
- [ ] Créer la structure du projet (monorepo ou séparé)
- [ ] Initialiser le backend NestJS
- [ ] Initialiser le frontend React (Vite ou Create React App)
- [ ] Configuration des outils (ESLint, Prettier, Git)
- [ ] Configuration des variables d'environnement (.env)

#### 1.2 Base de données
- [ ] Créer le schéma de base de données (PostgreSQL/Supabase)
- [ ] Tables essentielles :
  - [ ] `users` (admin, chauffeurs)
  - [ ] `drivers` (chauffeurs avec infos détaillées)
  - [ ] `vehicles` (véhicules)
  - [ ] `rides` (courses)
  - [ ] `pricing` (tarifs)
- [ ] Migrations avec TypeORM ou Prisma
- [ ] Seeders pour données de test (tarifs par défaut, admin)

#### 1.3 Authentification de base
- [ ] Système d'authentification JWT (admin + chauffeurs)
- [ ] Hashage des mots de passe (bcrypt)
- [ ] Middleware d'authentification
- [ ] Guards pour les rôles (admin, chauffeur)

---

### **PHASE 2 : BACKEND CORE (Semaine 3-4)**
*Priorité : HAUTE - API nécessaire pour le frontend*

#### 2.1 Modules essentiels
- [ ] Module Admin (CRUD chauffeurs, génération liens)
- [ ] Module Driver (inscription via lien unique, gestion statut)
- [ ] Module Ride (création, attribution, statuts)
- [ ] Module Pricing (gestion tarifs)

#### 2.2 API REST de base
- [ ] Endpoints Admin :
  - [ ] POST `/admin/auth/login`
  - [ ] POST `/admin/drivers/invite` (générer lien)
  - [ ] GET `/admin/drivers` (liste)
  - [ ] PUT `/admin/drivers/:id` (modifier)
  - [ ] GET `/admin/rides` (liste courses)
- [ ] Endpoints Driver :
  - [ ] POST `/drivers/register/:token` (inscription via lien)
  - [ ] POST `/drivers/auth/login`
  - [ ] GET `/drivers/rides` (mes courses)
  - [ ] PUT `/drivers/rides/:id/accept`
  - [ ] PUT `/drivers/rides/:id/refuse`
  - [ ] PUT `/drivers/status` (changer statut)
- [ ] Endpoints Public (Client) :
  - [ ] GET `/pricing` (tarifs)
  - [ ] POST `/rides` (créer réservation)
  - [ ] GET `/rides/:id/status` (suivre course)

#### 2.3 Logique d'attribution
- [ ] Service d'attribution automatique
- [ ] File d'attente des chauffeurs disponibles
- [ ] Timeout de 2 minutes (configurable)
- [ ] Gestion des refus (passage au suivant)

#### 2.4 Validation
- [ ] Validators pour téléphone Sénégal (+221)
- [ ] Validators email
- [ ] Validators adresses
- [ ] DTOs avec class-validator

---

### **PHASE 3 : FRONTEND CORE (Semaine 5-6)**
*Priorité : HAUTE - Interface utilisateur de base*

#### 3.1 Structure frontend
- [ ] Configuration React Router
- [ ] Configuration TanStack Query
- [ ] Configuration Axios
- [ ] Structure des composants
- [ ] Thème et styles (CSS Modules ou Tailwind)

#### 3.2 Pages publiques (Client)
- [ ] Page d'accueil
- [ ] Page de réservation (formulaire)
  - [ ] Sélection trajet (Dakar ↔ Aéroport)
  - [ ] Affichage tarifs
  - [ ] Formulaire avec validation
- [ ] Page de suivi de course
  - [ ] Affichage statut
  - [ ] Carte basique (sans GPS pour l'instant)

#### 3.3 Pages Admin
- [ ] Page de connexion
- [ ] Dashboard basique (liste courses, chauffeurs)
- [ ] Gestion chauffeurs (liste, modifier)
- [ ] Génération liens d'inscription

#### 3.4 Pages Chauffeur
- [ ] Page d'inscription (via lien unique)
- [ ] Page de connexion
- [ ] Dashboard chauffeur (mes courses)
- [ ] Acceptation/refus de course

---

### **PHASE 4 : NOTIFICATIONS (Semaine 7)**
*Priorité : MOYENNE - Améliore l'expérience utilisateur*

#### 4.1 Notifications Push (Firebase)
- [ ] Configuration Firebase Cloud Messaging
- [ ] Service Worker pour notifications
- [ ] Envoi notifications backend
- [ ] Réception notifications frontend

#### 4.2 WhatsApp Business API
- [ ] Configuration WhatsApp Business API
- [ ] Service d'envoi WhatsApp
- [ ] Templates de messages (attribution, confirmation, etc.)
- [ ] Intégration dans le workflow

#### 4.3 SMS (Fallback)
- [ ] Configuration Twilio ou API locale
- [ ] Service SMS
- [ ] Logique de fallback (si push/WhatsApp échouent)

---

### **PHASE 5 : GÉOLOCALISATION (Semaine 8)**
*Priorité : MOYENNE - Fonctionnalité importante mais pas critique*

#### 5.1 Cartes
- [ ] Intégration Leaflet ou Mapbox
- [ ] Affichage trajet sur carte
- [ ] Marqueurs départ/arrivée

#### 5.2 Suivi GPS
- [ ] Service de géolocalisation backend
- [ ] Mise à jour position chauffeur
- [ ] Affichage position en temps réel sur carte
- [ ] Estimation temps d'arrivée

#### 5.3 Zones de service
- [ ] Définition zones (PostGIS)
- [ ] Vérification zone chauffeur
- [ ] Filtrage chauffeurs par zone

---

### **PHASE 6 : FONCTIONNALITÉS AVANCÉES (Semaine 9-10)**
*Priorité : BASSE - Améliorations et polish*

#### 6.1 Annulations
- [ ] Système d'annulation (client, chauffeur, admin)
- [ ] Gestion remboursements
- [ ] Réattribution automatique

#### 6.2 Dashboard Analytics
- [ ] Métriques (courses/jour, revenus, etc.)
- [ ] Graphiques (Chart.js ou Recharts)
- [ ] Export rapports (PDF/Excel)

#### 6.3 Historique et évaluations
- [ ] Historique des courses
- [ ] Système d'évaluation (1-5 étoiles)
- [ ] Affichage notes moyennes

#### 6.4 Pause automatique
- [ ] Compteur courses consécutives
- [ ] Pause automatique après X courses
- [ ] Configuration admin

---

### **PHASE 7 : OPTIMISATIONS (Semaine 11)**
*Priorité : BASSE - Performance et qualité*

#### 7.1 Performance
- [ ] Cache Redis (optionnel)
- [ ] Pagination toutes les listes
- [ ] Lazy loading images
- [ ] Compression assets

#### 7.2 Mode Offline
- [ ] Service Worker
- [ ] Cache des réservations
- [ ] Synchronisation quand online

#### 7.3 Multilingue
- [ ] i18n (react-i18next)
- [ ] Traductions (Français, Wolof, Anglais)
- [ ] Localisation dates/monnaie

---

### **PHASE 8 : SÉCURITÉ ET TESTS (Semaine 12)**
*Priorité : HAUTE - Avant mise en production*

#### 8.1 Sécurité
- [ ] Rate limiting
- [ ] Protection CSRF/XSS
- [ ] Validation renforcée
- [ ] Logs d'audit
- [ ] Chiffrement données sensibles

#### 8.2 Tests
- [ ] Tests unitaires (fonctions critiques)
- [ ] Tests d'intégration (workflows)
- [ ] Tests E2E (scénarios principaux)

#### 8.3 Monitoring
- [ ] Configuration Sentry
- [ ] Logs structurés
- [ ] Métriques de performance

---

### **PHASE 9 : DÉPLOIEMENT (Semaine 13)**
*Priorité : CRITIQUE - Mise en production*

#### 9.1 Préparation
- [ ] Configuration production (variables env)
- [ ] Optimisation build
- [ ] Tests de charge

#### 9.2 Déploiement
- [ ] Frontend : Vercel/Netlify
- [ ] Backend : Render/Supabase Functions
- [ ] Base de données : Supabase
- [ ] Configuration HTTPS

#### 9.3 Post-déploiement
- [ ] Monitoring en production
- [ ] Documentation utilisateur
- [ ] Formation admin/chauffeurs

---

## 🎯 Recommandation : Par où commencer ?

### **Option 1 : Approche séquentielle (recommandée)**
**Commencer par la PHASE 1** - Fondations
1. Setup projet (backend + frontend)
2. Base de données (schéma complet)
3. Authentification de base

**Puis PHASE 2** - Backend Core
- API REST fonctionnelle
- Logique d'attribution
- Tests manuels avec Postman/Insomnia

**Ensuite PHASE 3** - Frontend Core
- Interface de base fonctionnelle
- Connexion backend-frontend
- Test du workflow complet (sans notifications)

### **Option 2 : Approche MVP rapide**
**MVP minimal (2-3 semaines)** :
1. Setup + Base de données
2. Backend : Admin + Driver + Ride (sans notifications)
3. Frontend : Réservation + Suivi basique
4. **Déployer et tester avec vrais utilisateurs**
5. Ajouter notifications et fonctionnalités avancées ensuite

---

## 📝 Notes importantes

### **Dépendances entre phases**
- Phase 1 → Nécessaire pour tout
- Phase 2 → Nécessaire pour Phase 3
- Phase 3 → Peut être développée en parallèle avec Phase 2 (backend mock)
- Phase 4 → Dépend de Phase 2 et 3
- Phase 5 → Dépend de Phase 2 et 3
- Phase 6-8 → Peuvent être faites en parallèle

### **Priorités ajustables**
- Si besoin de démo rapide : Focus sur Phase 1-3
- Si besoin de fonctionnalités complètes : Suivre l'ordre complet
- Notifications peuvent attendre si budget WhatsApp limité

### **Outils recommandés**
- **Backend** : NestJS CLI, TypeORM/Prisma, Postman
- **Frontend** : Vite, React Router, TanStack Query DevTools
- **Base de données** : Supabase (gratuit pour commencer)
- **Versioning** : Git avec branches (main, develop, feature/*)

---

## ✅ Checklist de démarrage immédiat

Pour commencer **MAINTENANT**, voici les 3 premières actions :

1. **Créer la structure du projet**
   ```bash
   # Backend
   nest new aibd-backend
   
   # Frontend
   npm create vite@latest aibd-frontend -- --template react
   ```

2. **Configurer Supabase**
   - Créer compte Supabase
   - Créer projet
   - Noter les credentials (URL, anon key, service key)

3. **Créer le schéma de base de données**
   - Tables essentielles (users, drivers, vehicles, rides, pricing)
   - Relations et contraintes
   - Index pour performance

**Une fois ces 3 étapes faites, tu auras une base solide pour continuer !** 🚀

