# 🔍 Debug Connexion - Guide de résolution

## Problèmes identifiés

1. **CORS** : Corrigé pour accepter localhost et IP locale
2. **Hash d'email** : Les utilisateurs existants n'avaient pas de hash
3. **Recherche utilisateur** : Améliorée pour gérer les anciens utilisateurs

## ✅ Corrections appliquées

### 1. CORS amélioré
- Accepte `localhost:5173`
- Accepte `192.168.1.118:5173`
- Accepte toutes les origines en développement

### 2. Recherche utilisateur améliorée
- Cherche d'abord par `emailHash`
- Si pas trouvé, cherche dans tous les utilisateurs
- Déchiffre automatiquement les emails pour comparaison

### 3. Script de correction des hashs
- Commande : `npm run fix:hashes`
- Génère les hashs manquants pour tous les utilisateurs

## 🧪 Test de connexion

### Depuis PowerShell
```powershell
$body = @{email='admin1@aibd.sn';password='password123'} | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:3000/auth/login' -Method Post -Body $body -ContentType 'application/json'
```

### Depuis le frontend
1. Ouvrir `http://localhost:5173/login`
2. Entrer : `admin1@aibd.sn` / `password123`
3. Vérifier la console du navigateur (F12) pour les logs

## 🔧 Si ça ne fonctionne toujours pas

1. **Vérifier que le backend est démarré** :
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Vérifier les hashs** :
   ```bash
   npm run fix:hashes
   ```

3. **Vérifier les utilisateurs en base** :
   ```sql
   SELECT email, email_hash, role FROM users;
   ```

4. **Vérifier les logs du backend** pour voir les erreurs

5. **Vérifier la console du navigateur** (F12) pour les erreurs CORS ou API

## 📝 URLs importantes

- **Backend** : `http://localhost:3000`
- **Frontend** : `http://localhost:5173`
- **API Login** : `POST http://localhost:3000/auth/login`

