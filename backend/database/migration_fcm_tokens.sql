-- Migration: table fcm_tokens pour enregistrer les tokens FCM (notifications push)
-- À exécuter si la table n'existe pas

CREATE TABLE IF NOT EXISTS fcm_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  device_label VARCHAR(100),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON fcm_tokens("userId");
CREATE UNIQUE INDEX IF NOT EXISTS idx_fcm_tokens_user_token ON fcm_tokens("userId", token);

COMMENT ON TABLE fcm_tokens IS 'Tokens Firebase Cloud Messaging pour les notifications push par utilisateur';
