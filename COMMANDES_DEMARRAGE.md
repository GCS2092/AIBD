# 🚀 Commandes de Démarrage - Backend et Frontend

## 📋 Commandes pour Démarrer Séparément

### 🔧 BACKEND (Terminal 1)

```bash
# 1. Aller dans le dossier backend
cd backend

# 2. Installer les dépendances (si pas déjà fait)
npm install

# 3. Démarrer le backend en mode développement
npm run start:dev
```

**Ou en mode production :**
```bash
cd backend
npm run build
npm run start:prod
```

**Le backend sera accessible sur :**
- `http://localhost:3001`
- `http://192.168.12.35:3001` (sur le réseau local)

---

### 🎨 FRONTEND (Terminal 2 - Ouvrir un NOUVEAU terminal)

```bash
# 1. Aller dans le dossier frontend
cd frontend

# 2. Installer les dépendances (si pas déjà fait)
npm install

# 3. Démarrer le frontend en mode développement
npm run dev
```

**Le frontend sera accessible sur :**
- `http://localhost:5173`
- `http://192.168.12.35:5173` (sur le réseau local)

---

## 📱 Accès depuis Téléphone

Une fois les deux serveurs démarrés :

1. **Connectez votre téléphone au même WiFi**
2. **Ouvrez le navigateur** sur votre téléphone
3. **Tapez** : `http://192.168.12.35:5173`

L'application devrait fonctionner automatiquement ! 🎉

---

## ⚠️ Ordre de Démarrage

**IMPORTANT** : Démarrez toujours le **BACKEND en premier**, puis le **FRONTEND**.

1. ✅ **Terminal 1** : `cd backend && npm run start:dev`
2. ✅ **Terminal 2** : `cd frontend && npm run dev`

---

## 🔍 Vérification

### Vérifier que le Backend fonctionne :
- Ouvrez `http://localhost:3001` dans votre navigateur
- Vous devriez voir une erreur 404 (normal, pas de route racine)
- Si erreur de connexion → le backend n'est pas démarré

### Vérifier que le Frontend fonctionne :
- Ouvrez `http://localhost:5173` dans votre navigateur
- L'application devrait se charger

### Vérifier la Console du Backend :
Vous devriez voir :
```
============================================================
🚀 BACKEND DÉMARRÉ AVEC SUCCÈS
============================================================
📍 Local: http://localhost:3001

🌐 DÉTECTION AUTOMATIQUE DES IPs LOCALES:
   IP 1: 192.168.12.35

📡 URLs D'ACCÈS SUR LE RÉSEAU LOCAL:
   ✅ Backend API: http://192.168.12.35:3001
   ✅ Frontend:   http://192.168.12.35:5173

📱 POUR ACCÉDER DEPUIS VOTRE TÉLÉPHONE:
   👉 Ouvrez: http://192.168.12.35:5173
============================================================
```

---

## 🛑 Arrêter les Serveurs

Pour arrêter un serveur, appuyez sur **`Ctrl + C`** dans le terminal correspondant.

---

## 📝 Commandes Rapides

### Backend
```bash
cd backend
npm run start:dev
```

### Frontend
```bash
cd frontend
npm run dev
```

---

## 🔄 Redémarrer

Si vous changez de réseau WiFi :

1. **Arrêtez** les deux serveurs (`Ctrl + C`)
2. **Redémarrez** le backend → Il détectera automatiquement la nouvelle IP
3. **Redémarrez** le frontend → Il utilisera automatiquement la nouvelle IP

C'est tout ! Pas besoin de modifier de fichiers. ✨

