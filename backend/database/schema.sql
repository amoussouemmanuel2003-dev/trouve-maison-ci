-- ==========================================================
-- TROUVE MAISON CI - SCHEMA POSTGRESQL (NEON COMPATIBLE)
-- ==========================================================

-- Extension pour la génération automatique de UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================================
-- 1. TYPES ENUM
-- ==========================================================

DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('USER', 'AGENT', 'LANDLORD', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE property_type_enum AS ENUM (
        'HOUSE',        -- Maison
        'APARTMENT',    -- Appartement
        'STUDIO',       -- Studio
        'ROOM',         -- Chambre simple / Chambre de salon
        'VILLA',        -- Villa (Duplex, Triplex, basse)
        'FLATSHARE',    -- Colocation
        'LAND'          -- Terrain
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE meter_type_enum AS ENUM (
        'INDIVIDUAL',   -- Compteur individuel standard / Carte prépayée
        'SUB_METER',    -- Sous-compteur (décompteur)
        'SHARED'        -- Forfait partagé
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE listing_status_enum AS ENUM (
        'PENDING',      -- En attente de validation par l'admin
        'ACTIVE',       -- Validée et visible en ligne
        'REJECTED',     -- Rejetée par l'administrateur
        'RENTED',       -- Déjà loué
        'ARCHIVED'      -- Archivée par l'auteur
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE request_status_enum AS ENUM (
        'OPEN',         -- Recherche en cours
        'SATISFIED',    -- Trouvé
        'CLOSED'        -- Clôturée / Annulée
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==========================================================
-- 2. TABLES PRINCIPALES
-- ==========================================================

-- Utilisateurs (Chercheurs, Propriétaires, Démarcheurs, Admins)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(25) NOT NULL UNIQUE,
    email VARCHAR(180) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'USER',
    whatsapp_number VARCHAR(25),
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sécurité en cas de table users préexistante sans ces colonnes
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(150);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(25);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(180);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role user_role_enum DEFAULT 'USER';
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(25);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Villes (Abidjan, etc.)
CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Communes (Cocody, Yopougon, Marcory, Plateau, etc.)
CREATE TABLE IF NOT EXISTS communes (
    id SERIAL PRIMARY KEY,
    city_id INT NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(city_id, slug)
);

-- Quartiers (Angré, Palmeraie, Riviera, Niangon, Maroc, etc.)
CREATE TABLE IF NOT EXISTS neighborhoods (
    id SERIAL PRIMARY KEY,
    commune_id INT NOT NULL REFERENCES communes(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(commune_id, slug)
);

-- Annonces Immobilières (Listings)
CREATE TABLE IF NOT EXISTS listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    property_type property_type_enum NOT NULL,
    
    -- Localisation
    city_id INT REFERENCES cities(id),
    commune_id INT NOT NULL REFERENCES communes(id),
    neighborhood_id INT REFERENCES neighborhoods(id),
    address_details VARCHAR(255), -- Ex: "Proche Pharmacie du Bonheur, Carrefour Duncan"
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    
    -- Prix & Modalités financières (FCFA)
    monthly_rent NUMERIC(12, 2) NOT NULL, -- Loyer mensuel en FCFA
    charges_included BOOLEAN DEFAULT FALSE,
    charges_amount NUMERIC(12, 2) DEFAULT 0,
    deposit_months INT DEFAULT 2,          -- Cautions (ex: 2 mois)
    advance_months INT DEFAULT 2,          -- Avances (ex: 2 mois)
    agency_fee_months INT DEFAULT 1,       -- Frais de démarcheur / agence (ex: 1 mois)

    -- Caractéristiques du bien
    bedrooms INT DEFAULT 1,
    bathrooms INT DEFAULT 1,
    surface_area INT,                      -- Surface en m²
    is_furnished BOOLEAN DEFAULT FALSE,    -- Meublé ou non
    has_balcony BOOLEAN DEFAULT FALSE,
    has_parking BOOLEAN DEFAULT FALSE,
    has_pool BOOLEAN DEFAULT FALSE,
    has_security BOOLEAN DEFAULT FALSE,    -- Gardiennage / Vigile
    has_air_conditioning BOOLEAN DEFAULT FALSE,
    
    -- Spécificités d'Abidjan : Types de compteurs
    water_meter_type meter_type_enum DEFAULT 'INDIVIDUAL',      -- Compteur SODECI
    electricity_meter_type meter_type_enum DEFAULT 'INDIVIDUAL', -- Compteur CIE (carte ou individuel)

    -- Contacts directs
    whatsapp_contact VARCHAR(25),
    call_contact VARCHAR(25),

    -- Modération & Visibilité
    status listing_status_enum NOT NULL DEFAULT 'PENDING',
    is_featured BOOLEAN DEFAULT FALSE,
    views_count INT DEFAULT 0,
    rejection_reason TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photos des annonces
CREATE TABLE IF NOT EXISTS listing_images (
    id SERIAL PRIMARY KEY,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Demandes des locataires ("Je cherche")
CREATE TABLE IF NOT EXISTS property_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    property_type property_type_enum NOT NULL,
    commune_id INT REFERENCES communes(id),
    neighborhood_name VARCHAR(120),
    min_budget NUMERIC(12, 2),
    max_budget NUMERIC(12, 2) NOT NULL, -- Budget max en FCFA
    bedrooms_min INT DEFAULT 1,
    is_furnished BOOLEAN DEFAULT FALSE,
    urgency_level VARCHAR(30) DEFAULT 'NORMAL', -- 'URGENT', 'NORMAL', 'FLEXIBLE'
    status request_status_enum NOT NULL DEFAULT 'OPEN',
    contact_phone VARCHAR(25) NOT NULL,
    contact_whatsapp VARCHAR(25),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favoris des utilisateurs
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, listing_id)
);

-- Demandes de Boost / Paiement Mobile Money
DO $$ BEGIN
    CREATE TYPE boost_status_enum AS ENUM (
        'PENDING',      -- En attente de vérification par l'admin
        'APPROVED',     -- Paiement vérifié et boost activé
        'REJECTED'      -- Paiement non confirmé / rejeté
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS boost_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 1000, -- Montant en FCFA
    payment_method VARCHAR(30) NOT NULL, -- 'WAVE', 'ORANGE', 'MTN', 'MOOV'
    transaction_reference VARCHAR(100) NOT NULL, -- Numéro expéditeur ou ID transaction
    phone_sender VARCHAR(25), -- Numéro de téléphone de l'expéditeur
    status boost_status_enum NOT NULL DEFAULT 'PENDING',
    admin_note TEXT, -- Note de l'admin (raison du rejet, etc.)
    boost_days INT DEFAULT 7, -- Durée du boost en jours
    boost_expires_at TIMESTAMPTZ, -- Date d'expiration du boost (remplie à l'approbation)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sécurité en cas de table boost_requests préexistante sans ces colonnes
ALTER TABLE boost_requests ADD COLUMN IF NOT EXISTS phone_sender VARCHAR(25);
ALTER TABLE boost_requests ADD COLUMN IF NOT EXISTS admin_note TEXT;
ALTER TABLE boost_requests ADD COLUMN IF NOT EXISTS boost_days INT DEFAULT 7;
ALTER TABLE boost_requests ADD COLUMN IF NOT EXISTS boost_expires_at TIMESTAMPTZ;

-- ==========================================================
-- 3. INDEX DE RECHERCHE ET PERFORMANCE
-- ==========================================================

CREATE INDEX IF NOT EXISTS idx_listings_commune ON listings(commune_id);
CREATE INDEX IF NOT EXISTS idx_listings_property_type ON listings(property_type);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(monthly_rent);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id ON listing_images(listing_id);
CREATE INDEX IF NOT EXISTS idx_property_requests_status ON property_requests(status);
CREATE INDEX IF NOT EXISTS idx_property_requests_commune ON property_requests(commune_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_boost_requests_user_id ON boost_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_boost_requests_listing_id ON boost_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_boost_requests_status ON boost_requests(status);

-- Trigger pour mettre à jour automatiquement `updated_at`
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

DROP TRIGGER IF EXISTS trg_listings_updated_at ON listings;
CREATE TRIGGER trg_listings_updated_at BEFORE UPDATE ON listings FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

DROP TRIGGER IF EXISTS trg_property_requests_updated_at ON property_requests;
CREATE TRIGGER trg_property_requests_updated_at BEFORE UPDATE ON property_requests FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

DROP TRIGGER IF EXISTS trg_boost_requests_updated_at ON boost_requests;
CREATE TRIGGER trg_boost_requests_updated_at BEFORE UPDATE ON boost_requests FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
