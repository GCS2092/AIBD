-- Script SQL complet pour créer toutes les tables AIBD
-- À exécuter sur Render PostgreSQL

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES DE BASE (schema.sql)
-- ============================================

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    email VARCHAR(500) NOT NULL, -- Augmenté pour stocker le chiffré
    "emailHash" VARCHAR(255), -- Hash pour recherche
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(500) NOT NULL, -- Augmenté pour stocker le chiffré
    "phoneHash" VARCHAR(255), -- Hash pour recherche
    role VARCHAR(20) DEFAULT 'driver' CHECK (role IN ('admin', 'driver')),
    "isActive" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: drivers
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "licenseNumber" VARCHAR(500), -- Augmenté pour stocker le chiffré
    status VARCHAR(20) DEFAULT 'unavailable' CHECK (status IN ('available', 'on_ride', 'unavailable', 'on_break')),
    "consecutiveRides" INTEGER DEFAULT 0,
    "totalRides" INTEGER DEFAULT 0,
    rating DECIMAL(10, 2) DEFAULT 0,
    "ratingCount" INTEGER DEFAULT 0,
    "serviceZone" VARCHAR(255),
    "workSchedule" JSONB,
    "registrationToken" VARCHAR(500),
    "isVerified" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "driverId" UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    "licensePlate" VARCHAR(50) UNIQUE NOT NULL,
    color VARCHAR(50),
    year INTEGER,
    capacity INTEGER,
    "photoUrl" VARCHAR(500),
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: pricing
CREATE TABLE IF NOT EXISTS pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    "rideType" VARCHAR(50) NOT NULL,
    type VARCHAR(20) DEFAULT 'standard' CHECK (type IN ('standard', 'peak_hours', 'night', 'special')),
    price DECIMAL(10, 2) NOT NULL,
    "startTime" VARCHAR(20),
    "endTime" VARCHAR(20),
    "daysOfWeek" JSONB,
    "isActive" BOOLEAN DEFAULT true,
    description TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: rides
CREATE TABLE IF NOT EXISTS rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "clientFirstName" VARCHAR(100) NOT NULL,
    "clientLastName" VARCHAR(100) NOT NULL,
    "clientPhone" VARCHAR(500) NOT NULL, -- Augmenté pour stocker le chiffré
    "clientPhoneHash" VARCHAR(255), -- Hash pour recherche
    "clientEmail" VARCHAR(500), -- Augmenté pour stocker le chiffré
    "clientEmailHash" VARCHAR(255), -- Hash pour recherche
    "pickupAddress" VARCHAR(500) NOT NULL,
    "dropoffAddress" VARCHAR(500) NOT NULL,
    "rideType" VARCHAR(50) NOT NULL CHECK ("rideType" IN ('dakar_to_airport', 'airport_to_dakar')),
    "scheduledAt" TIMESTAMP NOT NULL,
    "flightNumber" VARCHAR(50),
    "driverId" UUID REFERENCES drivers(id) ON DELETE SET NULL,
    "pricingId" UUID REFERENCES pricing(id) ON DELETE SET NULL,
    price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'accepted', 'driver_on_way', 'picked_up', 'in_progress', 'completed', 'cancelled')),
    "assignedAt" TIMESTAMP,
    "acceptedAt" TIMESTAMP,
    "startedAt" TIMESTAMP,
    "completedAt" TIMESTAMP,
    "cancelledAt" TIMESTAMP,
    "cancellationReason" VARCHAR(500),
    "cancelledBy" VARCHAR(50),
    "driverLocation" JSONB,
    "pickupLocation" JSONB,
    "dropoffLocation" JSONB,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    "accessCode" VARCHAR(8) UNIQUE NOT NULL,
    "assignmentAttempts" INTEGER DEFAULT 0,
    "lastAssignmentAttempt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('push', 'whatsapp', 'sms', 'email')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    "rideId" UUID REFERENCES rides(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    "errorMessage" TEXT,
    metadata JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: cancellations
CREATE TABLE IF NOT EXISTS cancellations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "rideId" UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    "cancelledBy" VARCHAR(20) NOT NULL CHECK ("cancelledBy" IN ('client', 'driver', 'admin', 'system')),
    reason TEXT NOT NULL,
    refunded BOOLEAN DEFAULT false,
    "refundAmount" DECIMAL(10, 2),
    "refundedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLES ADDITIONNELLES (migrations)
-- ============================================

-- Table: config (migration_config.sql)
CREATE TABLE IF NOT EXISTS config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description VARCHAR(500),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: internal_notifications (migration_internal_notifications.sql)
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

-- Table: ride_assignments (migration_ride_assignments.sql)
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

-- ============================================
-- INDEX
-- ============================================

-- Index pour users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_email_hash ON users("emailHash");
CREATE INDEX IF NOT EXISTS idx_users_phone_hash ON users("phoneHash");
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Index pour drivers
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers("userId");
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_registration_token ON drivers("registrationToken");

-- Index pour vehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_driver_id ON vehicles("driverId");
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles("licensePlate");

-- Index pour rides
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON rides("driverId");
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_scheduled_at ON rides("scheduledAt");
CREATE INDEX IF NOT EXISTS idx_rides_client_phone_hash ON rides("clientPhoneHash");
CREATE INDEX IF NOT EXISTS idx_rides_client_email_hash ON rides("clientEmailHash");
CREATE INDEX IF NOT EXISTS idx_rides_access_code ON rides("accessCode");

-- Index pour pricing
CREATE INDEX IF NOT EXISTS idx_pricing_ride_type ON pricing("rideType");
CREATE INDEX IF NOT EXISTS idx_pricing_is_active ON pricing("isActive");

-- Index pour notifications
CREATE INDEX IF NOT EXISTS idx_notifications_ride_id ON notifications("rideId");
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);

-- Index pour cancellations
CREATE INDEX IF NOT EXISTS idx_cancellations_ride_id ON cancellations("rideId");

-- Index pour config
CREATE INDEX IF NOT EXISTS idx_config_key ON config(key);

-- Index pour internal_notifications
CREATE INDEX IF NOT EXISTS idx_internal_notifications_user_id ON internal_notifications("userId");
CREATE INDEX IF NOT EXISTS idx_internal_notifications_read ON internal_notifications("userId", read);
CREATE INDEX IF NOT EXISTS idx_internal_notifications_ride_id ON internal_notifications("rideId");

-- Index pour ride_assignments
CREATE INDEX IF NOT EXISTS idx_ride_assignments_ride_id ON ride_assignments("rideId");
CREATE INDEX IF NOT EXISTS idx_ride_assignments_driver_id ON ride_assignments("driverId");
CREATE INDEX IF NOT EXISTS idx_ride_assignments_status ON ride_assignments(status);
CREATE INDEX IF NOT EXISTS idx_ride_assignments_offered_at ON ride_assignments("offeredAt");
CREATE UNIQUE INDEX IF NOT EXISTS idx_ride_assignments_unique ON ride_assignments("rideId", "driverId", status) 
WHERE status = 'offered';

-- ============================================
-- DONNÉES PAR DÉFAUT
-- ============================================

-- Tarifs par défaut
INSERT INTO pricing (id, name, "rideType", type, price, "isActive", description) VALUES
    (uuid_generate_v4(), 'Dakar → Aéroport Standard', 'dakar_to_airport', 'standard', 5000.00, true, 'Tarif standard pour trajet Dakar vers Aéroport'),
    (uuid_generate_v4(), 'Aéroport → Dakar Standard', 'airport_to_dakar', 'standard', 5000.00, true, 'Tarif standard pour trajet Aéroport vers Dakar')
ON CONFLICT DO NOTHING;

-- Configurations par défaut
INSERT INTO config (key, value, description) VALUES
    ('driver_response_timeout', '120', 'Timeout de réponse chauffeur en secondes (2 minutes)'),
    ('auto_break_after_rides', '5', 'Nombre de courses avant pause automatique'),
    ('cancellation_refund_hours_24', '24', 'Heures avant course pour remboursement 100%'),
    ('cancellation_refund_hours_2', '2', 'Heures avant course pour remboursement 50%'),
    ('max_consecutive_refusals', '3', 'Nombre maximum de refus consécutifs avant alerte')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- TRIGGERS
-- ============================================

-- Fonction pour mettre à jour automatiquement updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updatedAt
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_drivers_updated_at ON drivers;
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rides_updated_at ON rides;
CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON rides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pricing_updated_at ON pricing;
CREATE TRIGGER update_pricing_updated_at BEFORE UPDATE ON pricing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cancellations_updated_at ON cancellations;
CREATE TRIGGER update_cancellations_updated_at BEFORE UPDATE ON cancellations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_config_updated_at ON config;
CREATE TRIGGER update_config_updated_at BEFORE UPDATE ON config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

