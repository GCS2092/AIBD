# 📋 Commandes SQL Utiles - AIBD

## 👤 Vérifier les utilisateurs

### 1. Voir tous les utilisateurs (simple)
```sql
SELECT id, "firstName", "lastName", email, phone, role, "isActive" FROM users;
```

### 2. Compter par rôle (CORRIGÉ)
```sql
SELECT role, COUNT(*) as nombre, 
       COUNT(CASE WHEN "isActive" = true THEN 1 END) as actifs
FROM users 
GROUP BY role;
```

### 3. Voir tous les détails
```sql
SELECT * FROM users ORDER BY "createdAt" DESC;
```

### 4. Voir utilisateurs avec chauffeurs
```sql
SELECT u.id, u."firstName", u."lastName", u.email, u.role, 
       d.status as statut_chauffeur, d."isVerified" as verifie
FROM users u
LEFT JOIN drivers d ON d."userId" = u.id
ORDER BY u."createdAt" DESC;
```

### 5. Vérifier le chiffrement des données
```sql
-- Vérifier si les emails sont chiffrés (longueur > 50 = probablement chiffré)
SELECT id, "firstName", 
       LENGTH(email) as email_length,
       CASE WHEN LENGTH(email) > 50 THEN 'Chiffré' ELSE 'Non chiffré' END as statut,
       CASE WHEN email_hash IS NOT NULL THEN 'Hash OK' ELSE 'Pas de hash' END as hash_status
FROM users;
```

### 6. Vérifier les colonnes de hash
```sql
SELECT id, "firstName", 
       email_hash IS NOT NULL as has_email_hash,
       phone_hash IS NOT NULL as has_phone_hash
FROM users;
```

## 🚗 Vérifier les chauffeurs

```sql
SELECT d.id, u."firstName", u."lastName", d.status, d."isVerified", d."totalRides"
FROM drivers d
JOIN users u ON u.id = d."userId";
```

## 📊 Statistiques

```sql
-- Nombre total d'utilisateurs
SELECT COUNT(*) as total_users FROM users;

-- Nombre de chauffeurs actifs
SELECT COUNT(*) as chauffeurs_actifs 
FROM drivers 
WHERE status = 'available' AND "isVerified" = true;

-- Nombre de courses
SELECT COUNT(*) as total_courses FROM rides;
```

