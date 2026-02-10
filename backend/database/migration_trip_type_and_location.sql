-- Migration: type de course (aller_retour / aller_simple / retour_simple) et pays/ville/quartier
-- Tarifs: Aller retour 25 000 FCFA, Aller simple 20 000 FCFA, Retour simple 20 000 FCFA

-- 1) Colonnes sur rides
ALTER TABLE rides ADD COLUMN IF NOT EXISTS "tripType" VARCHAR(50) NULL;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS "pickupCountry" VARCHAR(100) NULL;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS "pickupCity" VARCHAR(100) NULL;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS "pickupQuartier" VARCHAR(150) NULL;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS "dropoffCountry" VARCHAR(100) NULL;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS "dropoffCity" VARCHAR(100) NULL;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS "dropoffQuartier" VARCHAR(150) NULL;

-- 2) Colonne tripType sur pricing
ALTER TABLE pricing ADD COLUMN IF NOT EXISTS "tripType" VARCHAR(50) NULL;

-- 3) Tarifs par type de course (ne pas dupliquer si déjà présents)
INSERT INTO pricing (id, name, "rideType", "tripType", type, price, "isActive", description, "createdAt", "updatedAt")
SELECT uuid_generate_v4(), 'Aller retour', 'dakar_to_airport', 'aller_retour', 'standard', 25000, true, 'Aller retour', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM pricing WHERE "tripType" = 'aller_retour' AND type = 'standard');

INSERT INTO pricing (id, name, "rideType", "tripType", type, price, "isActive", description, "createdAt", "updatedAt")
SELECT uuid_generate_v4(), 'Aller simple', 'dakar_to_airport', 'aller_simple', 'standard', 20000, true, 'Ville vers Aéroport', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM pricing WHERE "tripType" = 'aller_simple' AND type = 'standard');

INSERT INTO pricing (id, name, "rideType", "tripType", type, price, "isActive", description, "createdAt", "updatedAt")
SELECT uuid_generate_v4(), 'Retour simple', 'airport_to_dakar', 'retour_simple', 'standard', 20000, true, 'Aéroport vers Ville', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM pricing WHERE "tripType" = 'retour_simple' AND type = 'standard');
