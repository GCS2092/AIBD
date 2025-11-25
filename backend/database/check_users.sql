-- Commandes SQL pour vérifier les utilisateurs

-- 1. Voir tous les utilisateurs avec leurs informations de base
SELECT 
    id,
    "firstName",
    "lastName",
    email,
    phone,
    role,
    "isActive",
    "createdAt"
FROM users
ORDER BY "createdAt" DESC;

-- 2. Compter le nombre d'utilisateurs par rôle
SELECT 
    role,
    COUNT(*) as count,
    COUNT(CASE WHEN "isActive" = true THEN 1 END) as active_count
FROM users
GROUP BY role;

-- 3. Voir les utilisateurs avec leurs chauffeurs associés
SELECT 
    u.id,
    u."firstName",
    u."lastName",
    u.email,
    u.phone,
    u.role,
    u."isActive",
    d.status as driver_status,
    d."isVerified" as driver_verified
FROM users u
LEFT JOIN drivers d ON d."userId" = u.id
ORDER BY u."createdAt" DESC;

-- 4. Voir uniquement les admins
SELECT 
    id,
    "firstName",
    "lastName",
    email,
    phone,
    "isActive",
    "createdAt"
FROM users
WHERE role = 'admin';

-- 5. Voir uniquement les chauffeurs
SELECT 
    u.id,
    u."firstName",
    u."lastName",
    u.email,
    u.phone,
    u."isActive",
    d.status,
    d."isVerified",
    d."totalRides"
FROM users u
INNER JOIN drivers d ON d."userId" = u.id
ORDER BY u."createdAt" DESC;

