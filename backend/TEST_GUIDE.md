# 🧪 Guide de Test - AIBD Backend

## 🚀 Exécution rapide des tests

### 1. Vérifier que la base de données est accessible

**Option A : Via les tests automatisés**
```bash
cd backend
npm test -- database.test
```

**Option B : Via l'endpoint de test**
```bash
# 1. Démarrer l'application
npm run start:dev

# 2. Dans un autre terminal, tester l'endpoint
curl http://localhost:3000/test/database
```

**Option C : Via le navigateur**
1. Démarrer l'application : `npm run start:dev`
2. Ouvrir : `http://localhost:3000/test/database`
3. Vous devriez voir un JSON avec le statut de chaque table

### 2. Exécuter tous les tests

```bash
cd backend
npm test
```

### 3. Exécuter les tests E2E

```bash
npm run test:e2e
```

## 📊 Résultats attendus

### Test de connexion DB (`/test/database`)

**Succès :**
```json
{
  "success": true,
  "database": "connected",
  "tables": {
    "users": { "status": "ok", "count": 0 },
    "drivers": { "status": "ok", "count": 0 },
    "rides": { "status": "ok", "count": 0 },
    "pricing": {
      "status": "ok",
      "count": 2,
      "active": 2,
      "items": [
        {
          "name": "Dakar → Aéroport Standard",
          "price": "5000.00",
          "type": "standard"
        },
        {
          "name": "Aéroport → Dakar Standard",
          "price": "5000.00",
          "type": "standard"
        }
      ]
    },
    "relations": { "status": "ok", "testJoin": "no_data" }
  },
  "errors": []
}
```

**Erreur :**
```json
{
  "success": false,
  "database": "error",
  "error": "Connection error message"
}
```

## ✅ Checklist de validation

Avant de considérer que tout fonctionne :

- [ ] PostgreSQL est démarré
- [ ] La base `AIBD` existe
- [ ] Le script `database/schema.sql` a été exécuté
- [ ] Le fichier `.env` est configuré correctement
- [ ] `npm install` a été exécuté
- [ ] Les tests passent : `npm test`
- [ ] L'endpoint `/test/database` retourne `success: true`
- [ ] L'endpoint `/health` retourne `status: "ok"`

## 🔍 Tests disponibles

### 1. Tests unitaires (database.test.ts)
- Connexion à PostgreSQL
- Accès aux tables
- Structure du schéma
- Relations entre tables

### 2. Tests des entités (entities.test.ts)
- Structure des entités
- Validation des enums
- Création d'instances
- Contraintes de base de données

### 3. Tests E2E (app.e2e-spec.ts)
- Endpoints HTTP
- Health check
- Test de connexion DB via API
- Configuration CORS

## 🐛 Résolution de problèmes

### Erreur : "Cannot connect to database"
**Solution :**
1. Vérifier que PostgreSQL est démarré
2. Vérifier les credentials dans `.env`
3. Tester la connexion manuellement :
   ```bash
   psql -U postgres -d AIBD -c "SELECT 1;"
   ```

### Erreur : "Table does not exist"
**Solution :**
1. Exécuter le script SQL :
   ```bash
   psql -U postgres -d AIBD -f database/schema.sql
   ```

### Erreur : "Module not found"
**Solution :**
```bash
npm install
```

### Tests E2E échouent
**Solution :**
1. Vérifier que l'application est démarrée
2. Vérifier que le port 3000 est libre
3. Vérifier les variables d'environnement

## 📝 Tests manuels avec REST Client

Si vous utilisez VS Code avec l'extension "REST Client" :

1. Ouvrir `test/manual-test.http`
2. Cliquer sur "Send Request" au-dessus de chaque requête
3. Voir les résultats dans l'éditeur

## 🎯 Prochaines étapes après validation

Une fois que tous les tests passent :

1. ✅ Base de données configurée et accessible
2. ✅ Endpoints de test fonctionnels
3. ⏭️ Créer les modules (Auth, Admin, Driver, Ride)
4. ⏭️ Implémenter les endpoints API complets
5. ⏭️ Créer le frontend React

## 📞 Commandes utiles

```bash
# Démarrer l'application
npm run start:dev

# Tests en mode watch
npm run test:watch

# Tests avec couverture
npm run test:cov

# Tests E2E uniquement
npm run test:e2e

# Linter
npm run lint

# Build
npm run build
```

