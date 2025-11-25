# 🔐 Guide de Chiffrement des Données Sensibles

## ✅ Données Chiffrées

Toutes les données d'identification personnelle sont automatiquement chiffrées en base de données :

### Données chiffrées dans `User`
- ✅ **Email** - Chiffré avec AES-256-GCM
- ✅ **Téléphone** - Chiffré avec AES-256-GCM
- ✅ **Email Hash** - Hash SHA-256 pour recherche (non chiffré, pour indexation)
- ✅ **Phone Hash** - Hash SHA-256 pour recherche (non chiffré, pour indexation)

### Données chiffrées dans `Ride`
- ✅ **clientFirstName** - Prénom du client
- ✅ **clientLastName** - Nom du client
- ✅ **clientPhone** - Téléphone du client
- ✅ **clientEmail** - Email du client
- ✅ **pickupAddress** - Adresse de départ
- ✅ **dropoffAddress** - Adresse d'arrivée
- ✅ **flightNumber** - Numéro de vol
- ✅ **cancellationReason** - Raison d'annulation
- ✅ **Hashes** - Pour recherche (email_hash, phone_hash)

### Données chiffrées dans `Driver`
- ✅ **licenseNumber** - Numéro de permis de conduire

## 🔑 Configuration

### Variable d'environnement requise

Ajoutez dans votre fichier `.env` :

```env
# Générer une clé sécurisée: openssl rand -base64 32
ENCRYPTION_KEY=votre_cle_de_chiffrement_minimum_32_caracteres
```

**⚠️ IMPORTANT :**
- La clé doit faire au minimum 32 caractères
- Changez cette clé en production
- Ne commitez JAMAIS cette clé dans Git
- Gardez une copie sécurisée de la clé (si perdue, les données ne pourront plus être déchiffrées)

### Générer une clé sécurisée

```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

## 🔄 Fonctionnement

### Chiffrement automatique

Le système utilise des **hooks TypeORM** (`@BeforeInsert`, `@BeforeUpdate`, `@AfterLoad`) pour :

1. **Avant insertion/mise à jour** : Chiffrer automatiquement les données sensibles
2. **Après chargement** : Déchiffrer automatiquement les données pour l'application

### Recherche avec hash

Pour permettre la recherche sans déchiffrer toutes les données :
- Les emails et téléphones sont hashés (SHA-256) dans des colonnes séparées
- La recherche se fait sur les hashs (rapide et sécurisé)
- Le déchiffrement se fait uniquement pour les résultats trouvés

## 📊 Exemple

### Avant chiffrement (en mémoire)
```typescript
{
  email: "user@example.com",
  phone: "+221771234567"
}
```

### Après chiffrement (en base de données)
```sql
email: "a1b2c3d4e5f6...:tag123:encrypted_data..."
email_hash: "sha256_hash_for_search"
phone: "f6e5d4c3b2a1...:tag456:encrypted_data..."
phone_hash: "sha256_hash_for_search"
```

### Après déchiffrement (retourné à l'application)
```typescript
{
  email: "user@example.com",  // Déchiffré automatiquement
  phone: "+221771234567"       // Déchiffré automatiquement
}
```

## 🔍 Recherche

### Recherche par email
```typescript
const emailHash = encryptionService.hashForSearch('user@example.com');
const user = await userRepository.findOne({ where: { emailHash } });
```

### Recherche par téléphone
```typescript
const phoneHash = encryptionService.hashForSearch('+221771234567');
const user = await userRepository.findOne({ where: { phoneHash } });
```

## ⚠️ Migrations de base de données

Si vous avez déjà des données non chiffrées :

1. **Backup complet** de la base de données
2. Ajouter les colonnes de hash :
   ```sql
   ALTER TABLE users ADD COLUMN email_hash VARCHAR(255);
   ALTER TABLE users ADD COLUMN phone_hash VARCHAR(255);
   ALTER TABLE rides ADD COLUMN client_email_hash VARCHAR(255);
   ALTER TABLE rides ADD COLUMN client_phone_hash VARCHAR(255);
   ```
3. Créer un script de migration pour chiffrer les données existantes
4. Tester le déchiffrement avant de supprimer les backups

## 🛡️ Sécurité

### Bonnes pratiques

1. ✅ **Clé de chiffrement** : Stockée dans les variables d'environnement
2. ✅ **Algorithme** : AES-256-GCM (authentifié, résistant aux attaques)
3. ✅ **IV unique** : Chaque valeur chiffrée a un IV aléatoire
4. ✅ **Tag d'authentification** : Détecte toute modification des données
5. ✅ **Hash pour recherche** : Permet recherche sans déchiffrer tout

### Limitations

- ⚠️ Les données existantes non chiffrées ne seront pas automatiquement chiffrées
- ⚠️ Si la clé est perdue, les données ne pourront plus être déchiffrées
- ⚠️ Les recherches exactes nécessitent le hash (pas de recherche partielle)

## 📝 Notes

- Le chiffrement est **transparent** pour l'application
- Les données sont **toujours déchiffrées** quand elles sont lues
- Les données sont **toujours chiffrées** avant d'être sauvegardées
- Les **mots de passe** restent hashés avec bcrypt (non chiffrés, c'est normal)

## 🧪 Test

Pour tester le chiffrement :

```typescript
const encryptionService = new EncryptionService(configService);
const encrypted = encryptionService.encrypt('test@example.com');
const decrypted = encryptionService.decrypt(encrypted);
console.log(decrypted); // 'test@example.com'
```

---

**🔒 Toutes les données sensibles sont maintenant protégées !**

