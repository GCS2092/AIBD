-- Migration: Ajout du champ accessCode à la table rides
-- Date: 2024-12-28
-- Description: Ajoute un champ unique accessCode pour sécuriser l'accès aux trajets

-- Vérifier si la colonne existe déjà
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'rides' 
        AND column_name = 'accessCode'
    ) THEN
        -- Ajouter la colonne accessCode
        ALTER TABLE rides 
        ADD COLUMN "accessCode" VARCHAR(8) UNIQUE;
        
        -- Générer des codes d'accès pour les courses existantes
        -- Format: 8 caractères alphanumériques (0-9, A-Z)
        UPDATE rides 
        SET "accessCode" = UPPER(
            SUBSTRING(
                MD5(id::text || "createdAt"::text || random()::text),
                1, 8
            )
        )
        WHERE "accessCode" IS NULL;
        
        -- Rendre la colonne NOT NULL après avoir rempli les valeurs
        ALTER TABLE rides 
        ALTER COLUMN "accessCode" SET NOT NULL;
        
        RAISE NOTICE 'Colonne accessCode ajoutée avec succès';
    ELSE
        RAISE NOTICE 'La colonne accessCode existe déjà';
    END IF;
END $$;

-- Créer un index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_rides_access_code ON rides("accessCode");

