# Tests AIBD Backend

Ce dossier contient tous les tests du projet AIBD.

## 📁 Structure des tests

```
test/
├── database.test.ts      # Tests de connexion et structure DB
├── entities.test.ts      # Tests des entités TypeORM
├── app.e2e-spec.ts       # Tests end-to-end des endpoints
└── README.md             # Ce fichier
```

## 🧪 Types de tests

### 1. Tests de base de données (`database.test.ts`)
- Vérification de la connexion PostgreSQL
- Tests de requêtes sur chaque table
- Vérification du schéma
- Tests des relations entre tables

### 2. Tests des entités (`entities.test.ts`)
- Validation de la structure des entités
- Tests des enums
- Tests de création d'instances
- Validation des contraintes

### 3. Tests E2E (`app.e2e-spec.ts`)
- Tests des endpoints HTTP
- Tests de santé de l'API
- Tests de connexion DB via endpoint
- Tests CORS

## 🚀 Exécution des tests

### Tous les tests
```bash
npm test
```

### Tests en mode watch
```bash
npm run test:watch
```

### Tests avec couverture
```bash
npm run test:cov
```

### Tests E2E uniquement
```bash
npm run test:e2e
```

### Tests spécifiques
```bash
# Test de la base de données
npm test -- database.test

# Test des entités
npm test -- entities.test

# Test E2E
npm test -- app.e2e-spec
```

## 📋 Prérequis

Avant d'exécuter les tests :

1. **Base de données configurée** :
   - PostgreSQL doit être démarré
   - La base `AIBD` doit exister
   - Les tables doivent être créées (via `database/schema.sql`)

2. **Variables d'environnement** :
   - Fichier `.env` configuré avec les bonnes credentials

3. **Dépendances installées** :
   ```bash
   npm install
   ```

## ✅ Checklist de validation

Après avoir exécuté les tests, vous devriez voir :

- ✅ Connexion à la base de données réussie
- ✅ Toutes les tables accessibles
- ✅ Relations entre tables fonctionnelles
- ✅ Endpoints HTTP répondent correctement
- ✅ CORS configuré
- ✅ Entités créables avec les bonnes valeurs

## 🐛 Résolution de problèmes

### Erreur de connexion DB
- Vérifier que PostgreSQL est démarré
- Vérifier les credentials dans `.env`
- Vérifier que la base `AIBD` existe

### Tables non trouvées
- Exécuter `database/schema.sql` dans PostgreSQL
- Vérifier que `synchronize: true` est activé en dev

### Tests E2E échouent
- Vérifier que l'application démarre (`npm run start:dev`)
- Vérifier que le port 3000 est libre

## 📝 Ajout de nouveaux tests

Pour ajouter un nouveau test :

1. Créer un fichier `*.test.ts` ou `*.spec.ts`
2. Importer les modules nécessaires
3. Suivre la structure des tests existants
4. Exécuter `npm test` pour vérifier

## 🔄 Tests à venir

- [ ] Tests d'authentification
- [ ] Tests des modules (Admin, Driver, Ride)
- [ ] Tests d'intégration complets
- [ ] Tests de performance
- [ ] Tests de sécurité

