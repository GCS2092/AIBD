-- Table pour suivre les tentatives d'assignation de courses
CREATE TABLE IF NOT EXISTS ride_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "rideId" UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  "driverId" UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL, -- 'offered', 'accepted', 'refused', 'timeout'
  "offeredAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "respondedAt" TIMESTAMP,
  "refusalReason" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_ride_assignments_ride_id ON ride_assignments("rideId");
CREATE INDEX IF NOT EXISTS idx_ride_assignments_driver_id ON ride_assignments("driverId");
CREATE INDEX IF NOT EXISTS idx_ride_assignments_status ON ride_assignments(status);
CREATE INDEX IF NOT EXISTS idx_ride_assignments_offered_at ON ride_assignments("offeredAt");

-- Index composite pour éviter les doublons
CREATE UNIQUE INDEX IF NOT EXISTS idx_ride_assignments_unique ON ride_assignments("rideId", "driverId", status) 
WHERE status = 'offered';

-- Ajouter colonne pour suivre le nombre de tentatives sur une course
ALTER TABLE rides ADD COLUMN IF NOT EXISTS "assignmentAttempts" INTEGER DEFAULT 0;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS "lastAssignmentAttempt" TIMESTAMP;

