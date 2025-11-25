-- Migration pour créer la table de configuration système

CREATE TABLE IF NOT EXISTS config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description VARCHAR(500),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Créer un index sur la clé pour des recherches rapides
CREATE INDEX IF NOT EXISTS idx_config_key ON config(key);

-- Insérer les configurations par défaut
INSERT INTO config (key, value, description) VALUES
    ('driver_response_timeout', '120', 'Timeout de réponse chauffeur en secondes (2 minutes)'),
    ('auto_break_after_rides', '5', 'Nombre de courses avant pause automatique'),
    ('cancellation_refund_hours_24', '24', 'Heures avant course pour remboursement 100%'),
    ('cancellation_refund_hours_2', '2', 'Heures avant course pour remboursement 50%'),
    ('max_consecutive_refusals', '3', 'Nombre maximum de refus consécutifs avant alerte')
ON CONFLICT (key) DO NOTHING;

