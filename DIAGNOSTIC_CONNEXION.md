# 🔍 Guide de Diagnostic - Connexion Téléphone

## ✅ Vérifications à faire

### 1. Vérifier que les serveurs sont lancés

**Backend (port 3001) :**
```powershell
cd C:\AIBD\backend
npm run start:dev
```
Vous devriez voir :
```
🚀 Application is running on: http://localhost:3001
🌐 Accessible depuis le réseau local (téléphone) sur:
   http://192.168.1.118:3001
```

**Frontend (port 5173) :**
```powershell
cd C:\AIBD\frontend
npm run dev
```
Vous devriez voir :
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.118:5173/
```

### 2. Vérifier l'IP de votre PC

```powershell
ipconfig | findstr IPv4
```
Votre IP devrait être : **192.168.1.118**

### 3. Sur votre téléphone

1. **Assurez-vous que le téléphone est sur le même WiFi que votre PC**
2. Ouvrez le navigateur sur votre téléphone
3. Allez à : `http://192.168.1.118:5173`

### 4. Si ça ne fonctionne toujours pas

#### A. Vérifier le firewall Windows

Les règles de firewall ont été créées automatiquement. Vérifiez qu'elles sont actives :

```powershell
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*AIBD*"} | Select-Object DisplayName, Enabled
```

Si elles ne sont pas actives, activez-les :
```powershell
Enable-NetFirewallRule -DisplayName "AIBD Backend Port 3001"
Enable-NetFirewallRule -DisplayName "AIBD Frontend Port 5173"
```

#### B. Tester la connexion depuis le téléphone

Sur votre téléphone, testez d'abord si vous pouvez accéder au frontend :
- Ouvrez : `http://192.168.1.118:5173`

Si le frontend s'affiche mais que les requêtes API échouent :
- Ouvrez la console du navigateur sur le téléphone (si possible)
- Vérifiez l'URL de l'API affichée dans les logs
- Elle devrait être : `http://192.168.1.118:3001`

#### C. Vérifier les logs du backend

Quand vous essayez de vous connecter depuis le téléphone, regardez les logs du backend. Vous devriez voir les requêtes arriver.

#### D. Test manuel depuis le téléphone

Sur votre téléphone, testez directement l'API :
- Ouvrez : `http://192.168.1.118:3001/auth/login`
- Vous devriez voir une erreur (c'est normal, c'est juste pour tester la connexion)

### 5. Problèmes courants

**Problème : "Network Error" ou "Impossible de se connecter"**
- ✅ Vérifiez que le backend est lancé
- ✅ Vérifiez que vous êtes sur le même WiFi
- ✅ Vérifiez que le firewall autorise les connexions
- ✅ Vérifiez que l'IP est correcte (192.168.1.118)

**Problème : Le frontend s'affiche mais les requêtes API échouent**
- ✅ Vérifiez que le backend écoute sur 0.0.0.0 (déjà configuré)
- ✅ Vérifiez les logs du backend pour voir si les requêtes arrivent
- ✅ Ouvrez la console du navigateur sur le téléphone pour voir l'erreur exacte

**Problème : CORS Error**
- ✅ Le CORS est déjà configuré pour accepter toutes les origines en développement
- ✅ Vérifiez que le backend affiche bien les routes mappées au démarrage

### 6. Commandes utiles

**Voir les ports en écoute :**
```powershell
netstat -ano | findstr ":3001"
netstat -ano | findstr ":5173"
```

**Tester la connexion au port :**
```powershell
Test-NetConnection -ComputerName 192.168.1.118 -Port 3001
Test-NetConnection -ComputerName 192.168.1.118 -Port 5173
```

**Voir les règles de firewall :**
```powershell
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*AIBD*"}
```

## 📱 URL à utiliser sur le téléphone

- **Frontend :** `http://192.168.1.118:5173`
- **Backend API :** `http://192.168.1.118:3001` (utilisé automatiquement par le frontend)

## 🔧 Configuration actuelle

- ✅ Backend configuré sur le port **3001**
- ✅ Frontend configuré sur le port **5173**
- ✅ Backend écoute sur **0.0.0.0** (accessible depuis le réseau)
- ✅ Frontend écoute sur **0.0.0.0** (accessible depuis le réseau)
- ✅ CORS configuré pour accepter toutes les origines en dev
- ✅ Détection automatique de l'IP pour l'API
- ✅ Règles de firewall créées

