# 🚨 Checklist Production - Problèmes Critiques

## ⚠️ PROBLÈMES CRITIQUES À CORRIGER AVANT LA PRODUCTION

### 1. 🔒 SÉCURITÉ CORS (CRITIQUE)

**Problème** : Le backend accepte toutes les origines en développement (ligne 25 de `main.ts`)

**Fichier** : `backend/src/main.ts`

**Solution** :
```typescript
// AVANT (DANGEREUX EN PRODUCTION)
callback(null, true); // Accepter toutes les origines en dev

// APRÈS (SÉCURISÉ)
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  if (allowedOrigins.includes(origin)) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'), false);
  }
} else {
  callback(null, true); // Dev seulement
}
```

### 2. 🔑 SECRETS PAR DÉFAUT (CRITIQUE)

**Problème** : Les secrets par défaut dans `env.example` sont utilisables

**Fichiers** : `backend/env.example`, `.env`

**Actions** :
- ✅ Générer un nouveau `JWT_SECRET` : `openssl rand -base64 32`
- ✅ Générer un nouveau `ENCRYPTION_KEY` : `openssl rand -base64 32`
- ✅ Changer tous les mots de passe par défaut
- ✅ Ne JAMAIS commiter le fichier `.env` (déjà dans `.gitignore`)

### 3. 🌐 VARIABLES D'ENVIRONNEMENT MANQUANTES

**Problème** : URLs hardcodées et variables manquantes

**Variables à configurer** :
```env
NODE_ENV=production
FRONTEND_URL=https://votre-domaine.com
PORT=3001
DB_HOST=votre-host-production
DB_PASSWORD=mot-de-passe-securise
JWT_SECRET=cle-secrete-longue-et-aleatoire
ENCRYPTION_KEY=cle-encryption-32-caracteres-minimum
```

### 4. 🗄️ BASE DE DONNÉES (CRITIQUE)

**Problème** : `synchronize: true` en développement peut modifier le schéma

**Fichier** : `backend/src/config/database.config.ts`

**Vérification** : ✅ Déjà corrigé (ligne 14)
```typescript
synchronize: configService.get<string>('NODE_ENV') === 'development'
```

**Actions** :
- ✅ S'assurer que `NODE_ENV=production` en production
- ✅ Utiliser des migrations SQL en production
- ✅ Configurer SSL pour la connexion PostgreSQL si nécessaire

### 5. 🔐 HTTPS/SSL (CRITIQUE)

**Problème** : L'application fonctionne en HTTP (non sécurisé)

**Actions** :
- ✅ Configurer un reverse proxy (Nginx, Apache) avec SSL
- ✅ Obtenir un certificat SSL (Let's Encrypt gratuit)
- ✅ Rediriger HTTP vers HTTPS
- ✅ Configurer HSTS (HTTP Strict Transport Security)

### 6. 📝 LOGS ET ERREURS (IMPORTANT)

**Problème** : 155 `console.log` dans le code backend peuvent exposer des informations sensibles

**Actions** :
- ✅ Utiliser un logger professionnel (Winston, Pino)
- ✅ Masquer les informations sensibles dans les logs
- ✅ Ne pas logger les mots de passe, tokens, données chiffrées
- ✅ Configurer les niveaux de log (ERROR, WARN, INFO, DEBUG)

**Exemple** :
```typescript
// AVANT
console.log('Email:', user.email);

// APRÈS
logger.info('User login attempt', { userId: user.id }); // Sans email
```

### 7. 🌍 URL API FRONTEND (IMPORTANT)

**Problème** : Détection automatique de l'URL peut échouer en production

**Fichier** : `frontend/src/config/api.ts`

**Solution** :
```typescript
// Utiliser VITE_API_URL en production
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

**Configuration** :
```env
# .env.production
VITE_API_URL=https://api.votre-domaine.com
```

### 8. 🔄 WEBSOCKET CORS (IMPORTANT)

**Problème** : CORS WebSocket doit être configuré pour la production

**Fichier** : `backend/src/websocket/websocket.gateway.ts`

**Vérification** : ✅ Déjà configuré mais doit être restreint en production

### 9. ⚡ RATE LIMITING (IMPORTANT)

**Statut** : ✅ Déjà configuré
- Global : 30 requêtes/minute
- Création de course : 5 requêtes/minute

**Vérification** : ✅ Suffisant pour la plupart des cas

### 10. 🗃️ BACKUP BASE DE DONNÉES (CRITIQUE)

**Actions** :
- ✅ Configurer des backups automatiques quotidiens
- ✅ Tester la restauration des backups
- ✅ Stocker les backups hors site (cloud)
- ✅ Chiffrer les backups contenant des données sensibles

### 11. 🔍 MONITORING ET ALERTES (IMPORTANT)

**Actions** :
- ✅ Configurer un monitoring (Sentry, LogRocket, etc.)
- ✅ Alertes pour les erreurs critiques
- ✅ Monitoring de la performance (temps de réponse)
- ✅ Alertes pour les pannes de service

### 12. 📊 GESTION DES ERREURS (IMPORTANT)

**Problème** : Les erreurs peuvent exposer des informations sensibles

**Fichier** : `backend/src/app.controller.ts` (ligne 121)

**Solution** :
```typescript
// Ne pas exposer la stack trace en production
stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
```

✅ Déjà implémenté

### 13. 🔐 AUTHENTIFICATION (VÉRIFICATION)

**Statut** : ✅ JWT configuré avec expiration
- Expiration : 24h (configurable)

**Recommandation** : 
- Réduire à 1-2h pour plus de sécurité
- Implémenter refresh tokens

### 14. 🌐 GÉOCODAGE (VÉRIFICATION)

**Statut** : ✅ Rate limiting implémenté (1 requête/seconde)
- Respecte les limites de Nominatim

**Recommandation** :
- Considérer un service de géocodage payant pour la production
- Mettre en cache les résultats de géocodage

### 15. 📱 LOCALSTORAGE (DÉJÀ GÉRÉ)

**Statut** : ✅ Try-catch ajoutés
- L'application fonctionne même si localStorage est indisponible

## ✅ CHECKLIST AVANT MISE EN PRODUCTION

### Configuration
- [ ] `NODE_ENV=production` dans `.env`
- [ ] `FRONTEND_URL` configuré avec le domaine de production
- [ ] `JWT_SECRET` changé (généré aléatoirement)
- [ ] `ENCRYPTION_KEY` changé (généré aléatoirement)
- [ ] `DB_PASSWORD` sécurisé
- [ ] `VITE_API_URL` configuré dans le frontend

### Sécurité
- [ ] CORS restreint aux domaines autorisés uniquement
- [ ] HTTPS/SSL configuré
- [ ] Firewall configuré
- [ ] Secrets non committés dans Git
- [ ] Rate limiting testé

### Base de données
- [ ] `synchronize: false` en production (vérifié)
- [ ] Migrations SQL testées
- [ ] Backups automatiques configurés
- [ ] Connexion SSL si nécessaire

### Monitoring
- [ ] Logs configurés (sans informations sensibles)
- [ ] Monitoring d'erreurs configuré
- [ ] Alertes configurées

### Tests
- [ ] Tests de charge effectués
- [ ] Tests de sécurité effectués
- [ ] Tests de restauration de backup effectués

## 🚀 COMMANDES DE DÉPLOIEMENT

### Backend
```bash
cd backend
npm run build
NODE_ENV=production npm run start:prod
```

### Frontend
```bash
cd frontend
npm run build
# Déployer le dossier dist/ sur votre serveur web
```

## 📋 FICHIERS À MODIFIER POUR PRODUCTION

1. **backend/src/main.ts** - CORS (ligne 25)
2. **backend/.env** - Toutes les variables d'environnement
3. **frontend/.env.production** - VITE_API_URL
4. **backend/src/config/database.config.ts** - SSL si nécessaire

## ⚠️ RISQUES PRIORITAIRES

1. **CRITIQUE** : CORS ouvert à tous
2. **CRITIQUE** : Secrets par défaut
3. **CRITIQUE** : Pas de HTTPS
4. **IMPORTANT** : Logs avec informations sensibles
5. **IMPORTANT** : Pas de monitoring

