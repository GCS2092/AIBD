# 📱 Correction Problème Réseau sur Téléphone

## ✅ Corrections appliquées

### 1. **Détection automatique de l'URL API** (`frontend/src/config/api.ts`)
- Détecte automatiquement si on accède depuis une IP locale (téléphone) ou localhost (PC)
- Si hostname est une IP locale (192.168.x.x, 10.x.x.x, etc.), utilise cette IP pour l'API
- Sinon, utilise localhost

### 2. **Gestion des erreurs réseau** (`frontend/src/services/api.ts`)
- Détecte les erreurs réseau (ERR_NETWORK)
- Affiche un message d'erreur plus clair avec instructions

### 3. **Redirection après connexion** (`frontend/src/pages/LoginPage.tsx`)
- Redirige vers `/admin/dashboard` pour les admins
- Redirige vers `/driver/dashboard` pour les chauffeurs
- Messages d'erreur améliorés pour les erreurs réseau

## 🚀 Comment tester

### Sur PC
1. Ouvrir `http://localhost:5173/login`
2. L'API utilisera automatiquement `http://localhost:3000`

### Sur Téléphone
1. Connecter le téléphone au même WiFi que le PC
2. Ouvrir `http://192.168.1.118:5173/login` (remplacer par votre IP)
3. L'API utilisera automatiquement `http://192.168.1.118:3000`

## ⚠️ Vérifications

1. **Backend doit être démarré** :
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Backend doit écouter sur 0.0.0.0** (déjà configuré dans `main.ts`)

3. **CORS doit accepter toutes les origines** (déjà configuré)

4. **Firewall Windows** : Vérifier que le port 3000 n'est pas bloqué

## 🔍 Debug

Si ça ne fonctionne toujours pas :

1. **Vérifier l'IP du PC** :
   ```powershell
   ipconfig
   ```
   Chercher l'adresse IPv4 (ex: 192.168.1.118)

2. **Tester depuis le téléphone** :
   - Ouvrir `http://[VOTRE_IP]:3000` dans le navigateur
   - Devrait afficher une erreur 404 (normal, pas de route racine)
   - Si erreur de connexion, vérifier le firewall

3. **Vérifier les logs du backend** pour voir les requêtes

4. **Vérifier la console du navigateur** (F12) sur le téléphone pour les erreurs

