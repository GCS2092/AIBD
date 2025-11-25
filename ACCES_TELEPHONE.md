# 📱 Accès depuis le téléphone

## ✅ Configuration effectuée

### Frontend (Vite)
- ✅ Configuré pour accepter les connexions depuis le réseau local
- ✅ Accessible sur `http://192.168.1.118:5173`

### Backend (NestJS)
- ✅ Configuré pour accepter les connexions depuis le réseau local
- ✅ Accessible sur `http://192.168.1.118:3000`

## 📲 Comment accéder depuis votre téléphone

1. **Assurez-vous que votre téléphone est sur le même WiFi** que votre PC

2. **Ouvrez le navigateur** sur votre téléphone

3. **Accédez à l'application** :
   ```
   http://192.168.1.118:5173
   ```

4. **Si ça ne fonctionne pas**, vérifiez :
   - Le pare-feu Windows (autoriser les ports 3000 et 5173)
   - Que les deux appareils sont sur le même réseau WiFi
   - L'adresse IP de votre PC (peut changer) : `ipconfig` dans PowerShell

## 🔧 Démarrer les serveurs

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

## 📝 Note importante

L'adresse IP peut changer. Si l'accès ne fonctionne plus, vérifiez votre IP avec :
```powershell
ipconfig | findstr /i "IPv4"
```

Et mettez à jour l'URL dans votre navigateur mobile.

