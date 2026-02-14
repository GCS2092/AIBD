# Guide des clés OneSignal (système 2024+)

Ce guide décrit comment configurer OneSignal pour AIBD avec le **nouveau système de clés** (2024+). Il remplace l’ancien usage de REST API Key et User Auth Key.

---

## 1. Les clés dont vous avez besoin

OneSignal utilise désormais **deux types de clés** principaux :

| Clé | Obligatoire | Où la trouver | Usage |
|-----|-------------|---------------|--------|
| **App ID** | Oui | Dashboard → Your App → **Settings** → **Keys & IDs** | Identifie votre application. Utilisée côté **frontend** et **backend**. |
| **App API Key** | Oui | Même page → section **App API Keys** | Envoi des notifications depuis le **backend** uniquement. |
| **Organization API Key** | Non | Organizations → Keys & IDs | Gestion multi-apps. **Pas nécessaire** pour AIBD (une seule app). |

### Formats

- **App ID** : UUID, ex. `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **App API Key** : JWT long, ex. `os_v2_app_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## 2. Récupérer l’App ID

1. Connectez-vous à [OneSignal Dashboard](https://dashboard.onesignal.com).
2. Sélectionnez l’app **AIBD Transport**.
3. Allez dans **Settings** → **Keys & IDs**.
4. Copiez la valeur **App ID**.

Conservez-la pour les variables d’environnement (étape 4).

---

## 3. Créer une App API Key

1. Sur la même page (**Settings** → **Keys & IDs**), descendez jusqu’à **App API Keys**.
2. Cliquez sur **Create API Key**.
3. Donnez un nom à la clé, par exemple : `AIBD Backend`.
4. Cochez les permissions nécessaires :
   - **Send Notifications**
   - **View Users**
   - **Edit Users** (pour les tags)
5. Validez avec **Create**.
6. **Important** : copiez la clé tout de suite ; elle ne sera plus affichée ensuite.

---

## 4. Variables d’environnement

Sur **Render** (ou votre hébergeur), définissez :

```env
ONESIGNAL_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ONESIGNAL_APP_API_KEY=os_v2_app_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Remplacez par vos vraies valeurs (App ID et App API Key).

---

## 5. Mise à jour du code backend

### Ancien système (à ne plus utiliser)

```typescript
// ❌ Obsolète
const client = new OneSignal.Client({
  userAuthKey: process.env.ONESIGNAL_USER_AUTH_KEY,
  app: {
    appAuthKey: process.env.ONESIGNAL_REST_API_KEY,
    appId: process.env.ONESIGNAL_APP_ID
  }
});
```

### Nouveau système (2024+)

```typescript
// ✅ À utiliser
import * as OneSignal from '@onesignal/node-onesignal';

const configuration = OneSignal.createConfiguration({
  appKey: process.env.ONESIGNAL_APP_API_KEY,
});

const client = new OneSignal.DefaultApi(configuration);
```

---

## 6. Mise à jour du package npm

Utilisez le SDK Node.js officiel récent :

```bash
# Désinstaller l’ancien
npm uninstall onesignal-node

# Installer le nouveau
npm install @onesignal/node-onesignal
```

À exécuter dans le répertoire **backend** du projet.

---

## 7. Migration depuis les anciennes clés (Legacy)

Si votre dashboard affiche encore **REST API Key** :

1. OneSignal considère cela comme **legacy** ; la migration vers **App API Keys** est recommandée.
2. Les anciennes clés peuvent encore fonctionner mais seront dépréciées.

**Procédure recommandée :**

1. Créer une **App API Key** (voir section 3).
2. Remplacer l’ancienne clé dans le code et dans les variables d’environnement.
3. Tester l’envoi de notifications.
4. Une fois validé, désactiver ou supprimer l’ancienne REST API Key dans le dashboard.

---

## Résumé rapide

| Étape | Action |
|-------|--------|
| 1 | Récupérer **App ID** (Settings → Keys & IDs). |
| 2 | Créer une **App API Key** (même page, section App API Keys). |
| 3 | Définir `ONESIGNAL_APP_ID` et `ONESIGNAL_APP_API_KEY` en variables d’environnement. |
| 4 | Utiliser `@onesignal/node-onesignal` et `createConfiguration({ appKey: ... })` dans le backend. |

Pour AIBD, **App ID** + **App API Key** suffisent ; l’Organization API Key n’est pas nécessaire.
