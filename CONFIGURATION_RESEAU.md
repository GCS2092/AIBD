# 🌐 Configuration Réseau - Guide d'Utilisation

## ✅ Configuration Automatique

Votre projet est maintenant configuré pour **détecter automatiquement votre IP locale** et fonctionner sur votre réseau.

### IP Détectée
**Votre IP actuelle : `192.168.12.35`**

## 🚀 Comment Utiliser

### 1. Démarrer le Backend
```bash
cd backend
npm run start:dev
```

Le backend va :
- ✅ Détecter automatiquement votre IP locale
- ✅ Configurer CORS pour accepter les requêtes depuis cette IP
- ✅ Afficher les URLs d'accès dans la console

**Exemple de sortie :**
```
🚀 Application is running on: http://localhost:3001
🌐 Accessible depuis le réseau local sur:
   Backend API: http://192.168.12.35:3001
   Frontend: http://192.168.12.35:5173

📱 Pour accéder depuis votre téléphone:
   Ouvrez: http://192.168.12.35:5173
```

### 2. Démarrer le Frontend
```bash
cd frontend
npm run dev
```

Le frontend va :
- ✅ Détecter automatiquement si vous accédez via IP locale ou localhost
- ✅ Utiliser la bonne URL pour l'API automatiquement
- ✅ Fonctionner sur `http://0.0.0.0:5173` (accessible depuis le réseau)

### 3. Accéder depuis votre Téléphone

1. **Connectez votre téléphone au même WiFi** que votre PC
2. **Ouvrez le navigateur** sur votre téléphone
3. **Tapez l'URL** : `http://192.168.12.35:5173`

L'application devrait fonctionner automatiquement ! 🎉

## 🔧 Configuration Automatique

### Backend (`backend/src/main.ts`)
- ✅ Détecte automatiquement toutes les IPs locales
- ✅ Ajoute toutes les IPs détectées à la liste CORS
- ✅ Affiche les URLs d'accès au démarrage

### Frontend (`frontend/src/config/api.ts`)
- ✅ Détecte automatiquement si vous êtes sur IP locale ou localhost
- ✅ Utilise l'IP locale pour l'API si vous accédez via IP
- ✅ Utilise localhost si vous accédez via localhost

### WebSocket (`backend/src/websocket/websocket.gateway.ts`)
- ✅ Détecte automatiquement toutes les IPs locales
- ✅ Configure CORS pour accepter les connexions WebSocket depuis ces IPs

## 📱 Test depuis Téléphone

1. **Vérifiez que le backend est démarré** :
   - Ouvrez `http://192.168.12.35:3001` sur votre téléphone
   - Vous devriez voir une erreur 404 (normal, pas de route racine)
   - Si erreur de connexion → vérifiez le firewall

2. **Vérifiez que le frontend est démarré** :
   - Ouvrez `http://192.168.12.35:5173` sur votre téléphone
   - L'application devrait se charger

3. **Vérifiez la console du navigateur** (F12 sur téléphone) :
   - Devrait afficher : `🔗 API URL configurée: http://192.168.12.35:3001`

## ⚠️ Si ça ne fonctionne pas

### Problème : Erreur de connexion
**Solution** :
1. Vérifiez que le firewall Windows autorise les connexions sur les ports 3001 et 5173
2. Vérifiez que vous êtes sur le même réseau WiFi
3. Vérifiez que les deux serveurs sont démarrés

### Problème : Erreur CORS
**Solution** :
- Le backend détecte automatiquement votre IP
- Redémarrez le backend si vous avez changé de réseau

### Problème : IP a changé
**Solution** :
- Redémarrez le backend (il détectera automatiquement la nouvelle IP)
- L'application fonctionnera automatiquement avec la nouvelle IP

## 🔄 Changement de Réseau

Si vous changez de réseau WiFi :
1. **Redémarrez le backend** → Il détectera automatiquement la nouvelle IP
2. **Redémarrez le frontend** → Il utilisera automatiquement la nouvelle IP
3. **C'est tout !** Pas besoin de modifier de fichiers

## 📋 Ports Utilisés

- **Backend** : `3001` (configurable via `PORT` dans `.env`)
- **Frontend** : `5173` (port par défaut Vite)

## ✅ Avantages de cette Configuration

1. **Automatique** : Détection automatique de l'IP
2. **Flexible** : Fonctionne sur localhost ET sur le réseau local
3. **Sans configuration** : Pas besoin de modifier de fichiers
4. **Multi-réseau** : Fonctionne même si vous changez de réseau

