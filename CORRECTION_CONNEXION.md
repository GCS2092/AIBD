# 🔧 Correction Problème de Connexion

## ✅ Corrections appliquées

### 1. **CORS amélioré** (`backend/src/main.ts`)
- Accepte maintenant `localhost:5173` et `192.168.1.118:5173`
- Accepte toutes les origines en développement

### 2. **Hash d'email corrigé** (`backend/src/entities/user.entity.ts`)
- **PROBLÈME** : Le hash était calculé sur l'email **CHIFFRÉ** au lieu de l'email en clair
- **SOLUTION** : Le hash est maintenant calculé **AVANT** le chiffrement, sur l'email en clair
- Cela permet de rechercher les utilisateurs par email sans avoir à déchiffrer tous les emails

### 3. **Recherche utilisateur améliorée** (`backend/src/auth/auth.service.ts`)
- Cherche d'abord par `emailHash` (rapide)
- Si pas trouvé, cherche dans tous les utilisateurs (fallback pour compatibilité)

### 4. **Logs améliorés** (`frontend/src/pages/LoginPage.tsx`)
- Ajout de logs console pour debug
- Messages d'erreur plus détaillés

## 🚀 Actions à faire

### 1. Redémarrer le backend
```bash
cd backend
npm run start:dev
```

### 2. Recalculer les hashs (si nécessaire)
```bash
cd backend
npm run fix:hashes
```

### 3. Tester la connexion
- Ouvrir `http://localhost:5173/login`
- Utiliser : `admin1@aibd.sn` / `password123`

## 🔍 Vérifications

### Vérifier que le backend est démarré
- Ouvrir `http://localhost:3000` dans le navigateur
- Devrait afficher un message ou une erreur 404 (normal, pas de route racine)

### Vérifier CORS
- Ouvrir la console du navigateur (F12)
- Faire une requête depuis le frontend
- Vérifier qu'il n'y a pas d'erreur CORS

### Vérifier les hashs en base
```sql
SELECT email_hash, LENGTH(email_hash) as hash_len FROM users LIMIT 5;
```
Les hashs doivent faire 64 caractères (SHA-256 hex).

## 📝 Comptes de test

- **Admin 1** : `admin1@aibd.sn` / `password123`
- **Admin 2** : `admin2@aibd.sn` / `password123`
- **Admin 3** : `admin3@aibd.sn` / `password123`
- **Driver 1** : `driver1@aibd.sn` / `password123`
- **Driver 2** : `driver2@aibd.sn` / `password123`
- **Driver 3** : `driver3@aibd.sn` / `password123`

## ⚠️ Si ça ne fonctionne toujours pas

1. **Vérifier les logs du backend** pour voir les erreurs exactes
2. **Vérifier la console du navigateur** (F12) pour les erreurs CORS/API
3. **Vérifier que l'ENCRYPTION_KEY est définie** dans `.env`
4. **Vérifier que les utilisateurs existent** en base de données

