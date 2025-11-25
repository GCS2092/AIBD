-- Script de création de la base de données AIBD
-- Exécuter ce script dans PostgreSQL pour créer toutes les tables

-- Extension pour UUID (si nécessaire)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(20) DEFAULT 'driver' CHECK (role IN ('admin', 'driver')),
    "isActive" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: drivers
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "licenseNumber" VARCHAR(255),
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
    "clientPhone" VARCHAR(20) NOT NULL,
    "clientEmail" VARCHAR(255),
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

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers("userId");
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_registration_token ON drivers("registrationToken");
CREATE INDEX IF NOT EXISTS idx_vehicles_driver_id ON vehicles("driverId");
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles("licensePlate");
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON rides("driverId");
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_scheduled_at ON rides("scheduledAt");
CREATE INDEX IF NOT EXISTS idx_rides_client_phone ON rides("clientPhone");
CREATE INDEX IF NOT EXISTS idx_pricing_ride_type ON pricing("rideType");
CREATE INDEX IF NOT EXISTS idx_pricing_is_active ON pricing("isActive");
CREATE INDEX IF NOT EXISTS idx_notifications_ride_id ON notifications("rideId");
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_cancellations_ride_id ON cancellations("rideId");

-- Insertion des tarifs par défaut
INSERT INTO pricing (id, name, "rideType", type, price, "isActive", description) VALUES
    (uuid_generate_v4(), 'Dakar → Aéroport Standard', 'dakar_to_airport', 'standard', 5000.00, true, 'Tarif standard pour trajet Dakar vers Aéroport'),
    (uuid_generate_v4(), 'Aéroport → Dakar Standard', 'airport_to_dakar', 'standard', 5000.00, true, 'Tarif standard pour trajet Aéroport vers Dakar')
ON CONFLICT DO NOTHING;

-- Fonction pour mettre à jour automatiquement updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updatedAt
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON rides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pricing_updated_at BEFORE UPDATE ON pricing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cancellations_updated_at BEFORE UPDATE ON cancellations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

