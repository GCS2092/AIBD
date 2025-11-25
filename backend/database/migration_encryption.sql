-- Migration pour ajouter les colonnes de hash pour la recherche
-- Exécuter ce script après avoir configuré ENCRYPTION_KEY dans .env

-- Ajouter les colonnes de hash pour la table users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone_hash VARCHAR(255);

-- Ajouter les colonnes de hash pour la table rides
ALTER TABLE rides 
ADD COLUMN IF NOT EXISTS client_email_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS client_phone_hash VARCHAR(255);

-- Créer des index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_users_email_hash ON users(email_hash);
CREATE INDEX IF NOT EXISTS idx_users_phone_hash ON users(phone_hash);
CREATE INDEX IF NOT EXISTS idx_rides_client_email_hash ON rides(client_email_hash);
CREATE INDEX IF NOT EXISTS idx_rides_client_phone_hash ON rides(client_phone_hash);

-- Augmenter la taille des colonnes pour stocker les données chiffrées
ALTER TABLE users 
ALTER COLUMN email TYPE VARCHAR(500),
ALTER COLUMN phone TYPE VARCHAR(500);

ALTER TABLE rides 
ALTER COLUMN "clientFirstName" TYPE VARCHAR(200),
ALTER COLUMN "clientLastName" TYPE VARCHAR(200),
ALTER COLUMN "clientPhone" TYPE VARCHAR(500),
ALTER COLUMN "clientEmail" TYPE VARCHAR(500),
ALTER COLUMN "pickupAddress" TYPE VARCHAR(1000),
ALTER COLUMN "dropoffAddress" TYPE VARCHAR(1000),
ALTER COLUMN "flightNumber" TYPE VARCHAR(200),
ALTER COLUMN "cancellationReason" TYPE VARCHAR(1000);

ALTER TABLE drivers 
ALTER COLUMN "licenseNumber" TYPE VARCHAR(500);

-- Note: Les données existantes ne seront pas automatiquement chiffrées
-- Il faudra créer un script de migration des données si nécessaire

