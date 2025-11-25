CREATE TABLE IF NOT EXISTS internal_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  "rideId" UUID REFERENCES rides(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT false,
  "readAt" TIMESTAMP,
  metadata JSONB,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_internal_notifications_user_id ON internal_notifications("userId");
CREATE INDEX IF NOT EXISTS idx_internal_notifications_read ON internal_notifications("userId", read);
CREATE INDEX IF NOT EXISTS idx_internal_notifications_ride_id ON internal_notifications("rideId");
