# 🔐 Configuration du Chiffrement - AIBD

## ✅ Système de Chiffrement Implémenté

Toutes les **données d'identification personnelle** sont maintenant automatiquement chiffrées en base de données avec **AES-256-GCM**.

## 📋 Données Chiffrées

### Table `users`
- ✅ **email** - Chiffré
- ✅ **phone** - Chiffré
- ✅ **email_hash** - Hash SHA-256 pour recherche (non chiffré)
- ✅ **phone_hash** - Hash SHA-256 pour recherche (non chiffré)

### Table `rides`
- ✅ **clientFirstName** - Chiffré
- ✅ **clientLastName** - Chiffré
- ✅ **clientPhone** - Chiffré
- ✅ **clientEmail** - Chiffré
- ✅ **pickupAddress** - Chiffré
- ✅ **dropoffAddress** - Chiffré
- ✅ **flightNumber** - Chiffré
- ✅ **cancellationReason** - Chiffré
- ✅ **client_email_hash** - Hash pour recherche
- ✅ **client_phone_hash** - Hash pour recherche

### Table `drivers`
- ✅ **licenseNumber** - Chiffré

## 🚀 Configuration

### 1. Ajouter la clé de chiffrement dans `.env`

```env
# Générer une clé sécurisée: openssl rand -base64 32
ENCRYPTION_KEY=votre_cle_de_chiffrement_minimum_32_caracteres_long
```

**⚠️ IMPORTANT :**
- La clé doit faire **minimum 32 caractères**
- **Changez cette clé en production**
- **Ne commitez JAMAIS cette clé** dans Git
- **Gardez une copie sécurisée** (si perdue, les données ne pourront plus être déchiffrées)

### 2. Générer une clé sécurisée

**Linux/Mac :**
```bash
openssl rand -base64 32
```

**Windows PowerShell :**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### 3. Exécuter la migration SQL

```bash
psql -U postgres -d AIBD -f database/migration_encryption.sql
```

Cette migration ajoute :
- Les colonnes de hash pour la recherche
- Les index pour améliorer les performances
- Augmente la taille des colonnes pour stocker les données chiffrées

## 🔄 Fonctionnement

### Chiffrement automatique

Le système utilise des **hooks TypeORM** (`@BeforeInsert`, `@BeforeUpdate`, `@AfterLoad`) pour :

1. **Avant insertion/mise à jour** :
   - Chiffre automatiquement les données sensibles avec AES-256-GCM
   - Génère les hash SHA-256 pour la recherche

2. **Après chargement** :
   - Déchiffre automatiquement les données pour l'application
   - Les données sont toujours en clair dans l'application

### Recherche avec hash

Pour permettre la recherche sans déchiffrer toutes les données :
- Les emails et téléphones sont hashés (SHA-256) dans des colonnes séparées
- La recherche se fait sur les hashs (rapide et sécurisé)
- Le déchiffrement se fait uniquement pour les résultats trouvés

## 📊 Exemple

### En mémoire (application)
```typescript
{
  email: "user@example.com",
  phone: "+221771234567"
}
```

### En base de données (chiffré)
```sql
email: "a1b2c3d4e5f6...:tag123:encrypted_data..."
email_hash: "sha256_hash_for_search"
phone: "f6e5d4c3b2a1...:tag456:encrypted_data..."
phone_hash: "sha256_hash_for_search"
```

### Retourné à l'application (déchiffré)
```typescript
{
  email: "user@example.com",  // Déchiffré automatiquement
  phone: "+221771234567"       // Déchiffré automatiquement
}
```

## 🔍 Recherche

Les services utilisent maintenant les hashs pour la recherche :

```typescript
// Dans AuthService
const emailHash = this.hashForSearch('user@example.com');
const user = await this.userRepository.findOne({ where: { emailHash } });
```

## ⚠️ Migration des données existantes

Si vous avez déjà des données non chiffrées :

1. **Backup complet** de la base de données
2. Exécuter `migration_encryption.sql`
3. Créer un script de migration pour chiffrer les données existantes
4. Tester le déchiffrement avant de supprimer les backups

## 🛡️ Sécurité

### Algorithme : AES-256-GCM
- ✅ **Chiffrement authentifié** : Détecte toute modification
- ✅ **IV unique** : Chaque valeur a un IV aléatoire
- ✅ **Tag d'authentification** : Intégrité garantie
- ✅ **256 bits** : Niveau de sécurité élevé

### Bonnes pratiques
1. ✅ Clé stockée dans variables d'environnement
2. ✅ Hash pour recherche (pas de déchiffrement massif)
3. ✅ Chiffrement transparent pour l'application
4. ✅ Mots de passe toujours hashés avec bcrypt (normal)

## 📝 Notes importantes

- ⚠️ **Les données existantes** ne seront pas automatiquement chiffrées
- ⚠️ **Si la clé est perdue**, les données ne pourront plus être déchiffrées
- ⚠️ **Les recherches exactes** nécessitent le hash (pas de recherche partielle)
- ✅ **Le chiffrement est transparent** pour l'application
- ✅ **Les données sont toujours déchiffrées** quand elles sont lues

## ✅ Vérification

Pour vérifier que le chiffrement fonctionne :

1. Créer un utilisateur via l'API
2. Vérifier en base que `email` et `phone` sont chiffrés
3. Vérifier que `email_hash` et `phone_hash` sont présents
4. Récupérer l'utilisateur via l'API
5. Vérifier que les données sont déchiffrées correctement

---

**🔒 Toutes les données sensibles sont maintenant protégées !**

