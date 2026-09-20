-- ==========================================================
-- TROUVE MAISON CI - SEED DATA (ABIDJAN INITIALISATION)
-- ==========================================================

-- 1. VILLES
INSERT INTO cities (id, name, slug) VALUES 
(1, 'Abidjan', 'abidjan'),
(2, 'Yamoussoukro', 'yamoussoukro')
ON CONFLICT (id) DO NOTHING;

-- 2. COMMUNES D'ABIDJAN
INSERT INTO communes (id, city_id, name, slug) VALUES
(1, 1, 'Cocody', 'cocody'),
(2, 1, 'Yopougon', 'yopougon'),
(3, 1, 'Marcory', 'marcory'),
(4, 1, 'Plateau', 'plateau'),
(5, 1, 'Koumassi', 'koumassi'),
(6, 1, 'Port-Bouët', 'port-bouet'),
(7, 1, 'Treichville', 'treichville'),
(8, 1, 'Adjamé', 'adjame'),
(9, 1, 'Abobo', 'abobo'),
(10, 1, 'Attécoubé', 'attecoube'),
(11, 1, 'Bingerville', 'bingerville'),
(12, 1, 'Songon', 'songon')
ON CONFLICT (id) DO NOTHING;

-- Réinitialiser la séquence d'ID pour communes
SELECT setval('communes_id_seq', (SELECT MAX(id) FROM communes));

-- 3. QUARTIERS POPULAIRES D'ABIDJAN
INSERT INTO neighborhoods (commune_id, name, slug) VALUES
-- Cocody
(1, 'Angré 7e Tranche', 'angre-7e-tranche'),
(1, 'Angré 8e Tranche', 'angre-8e-tranche'),
(1, 'Riviera Palmeraie', 'riviera-palmeraie'),
(1, 'Riviera Bonoumin', 'riviera-bonoumin'),
(1, 'Riviera Golf', 'riviera-golf'),
(1, 'Riviera 2', 'riviera-2'),
(1, 'Deux Plateaux Vallons', 'deux-plateaux-vallons'),
(1, 'Deux Plateaux Aghien', 'deux-plateaux-aghien'),
(1, 'Danga', 'danga'),
-- Yopougon
(2, 'Maroc', 'yop-maroc'),
(2, 'Niangon Sud', 'niangon-sud'),
(2, 'Niangon Nord', 'niangon-nord'),
(2, 'Siporex', 'siporex'),
(2, 'Selmer', 'selmer'),
(2, 'Toits Rouges', 'toits-rouges'),
(2, 'Nouveau Quartier', 'nouveau-quartier'),
-- Marcory
(3, 'Zone 4C', 'zone-4c'),
(3, 'Biétry', 'bietry'),
(3, 'Marcory Résidentiel', 'marcory-residentiel'),
(3, 'Anoumabo', 'anoumabo'),
-- Koumassi
(5, 'Remblais', 'remblais'),
(5, 'Sopim', 'sopim'),
(5, 'Campement', 'campement'),
-- Port-Bouët
(6, 'Vridi', 'vridi'),
(6, 'Gonzagueville', 'gonzagueville'),
(6, 'Derrière Wharf', 'derriere-wharf'),
-- Bingerville
(11, 'Feh Kessé', 'feh-kesse'),
(11, 'Blanchon', 'blanchon')
ON CONFLICT DO NOTHING;

-- 4. UTILISATEURS DE DÉMONSTRATION
-- Mot de passe commun pour les tests : Password123!
-- Hash bcrypt de "Password123!" : $2a$10$7R0ZcI9zXvTjX7qA7b6J0.w8sK8q7E2l7.Z7lD9f0V2k5F8n0P2qy
INSERT INTO users (id, full_name, phone, email, password_hash, role, whatsapp_number, is_verified, is_active) VALUES
('a0000000-0000-0000-0000-000000000001', 'Kouamé Jean-Marc (Admin)', '+2250700000001', 'admin@trouvemaison.ci', '$2a$10$p0JkI9fV9L0tH1sZ7V4Oauu9kF7iK8L3jZ9F8m2K0q1F5j9X7p0Jy', 'ADMIN', '+2250700000001', TRUE, TRUE),
('a0000000-0000-0000-0000-000000000002', 'Mamadou Touré (Propriétaire)', '+2250700000002', 'bailleur@trouvemaison.ci', '$2a$10$p0JkI9fV9L0tH1sZ7V4Oauu9kF7iK8L3jZ9F8m2K0q1F5j9X7p0Jy', 'LANDLORD', '+2250700000002', TRUE, TRUE),
('a0000000-0000-0000-0000-000000000003', 'Aya Démarcheur Pro (Agent)', '+2250500000003', 'agent@trouvemaison.ci', '$2a$10$p0JkI9fV9L0tH1sZ7V4Oauu9kF7iK8L3jZ9F8m2K0q1F5j9X7p0Jy', 'AGENT', '+2250500000003', TRUE, TRUE),
('a0000000-0000-0000-0000-000000000004', 'Koffi Serge (Chercheur)', '+2250100000004', 'chercheur@trouvemaison.ci', '$2a$10$p0JkI9fV9L0tH1sZ7V4Oauu9kF7iK8L3jZ9F8m2K0q1F5j9X7p0Jy', 'USER', '+2250100000004', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 5. ANNONCES IMMOBILIERES DE TEST (LISTINGS)
INSERT INTO listings (
    id, user_id, title, description, property_type, city_id, commune_id, address_details,
    monthly_rent, charges_included, charges_amount, deposit_months, advance_months, agency_fee_months,
    bedrooms, bathrooms, surface_area, is_furnished, has_balcony, has_parking, has_security, has_air_conditioning,
    water_meter_type, electricity_meter_type, whatsapp_contact, call_contact, status, is_featured
) VALUES
(
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    'Magnifique Appartement 3 Pièces haut standing à Angré 8e Tranche',
    'Spacieux 3 pièces situé dans un immeuble sécurisé avec vigile H24. Grand salon lumineux, deux chambres autonomes avec placards, cuisine moderne équipée, balcon spacieux. Compteur CIE prépayé à carte, SODECI individuel. Facilement accessible par voie bitumée.',
    'APARTMENT', 1, 1, 'Angré 8e tranche, terminus 81-82, à 200m de la pharmacie',
    350000, FALSE, 25000, 2, 2, 1,
    2, 2, 95, FALSE, TRUE, TRUE, TRUE, TRUE,
    'INDIVIDUAL', 'INDIVIDUAL', '+2250700000002', '+2250700000002', 'ACTIVE', TRUE
),
(
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000003',
    'Studio moderne tout confort - Yopougon Maroc',
    'Joli studio staffé, bien aéré, avec placard et salle de bain privative. Immeuble calme, accès goudronné. Eau courante constante, décompteur CIE individuel, SODECI forfaitaire partagé.',
    'STUDIO', 1, 2, 'Yopougon Maroc, carrefour Oasis',
    90000, TRUE, 0, 2, 2, 1,
    1, 1, 35, FALSE, TRUE, FALSE, FALSE, FALSE,
    'SHARED', 'SUB_METER', '+2250500000003', '+2250500000003', 'ACTIVE', TRUE
),
(
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000002',
    'Villa Duplex 5 Pièces avec piscine et jardin - Marcory Biétry',
    'Superbe villa meublée avec goût, 4 chambres spacieuses climatisées avec dressings, salon de réception, cuisine américaine, garage 2 véhicules, piscine privée et groupe électrogène. Sécurité assurée.',
    'VILLA', 1, 3, 'Biétry, Boulevard de Marseille, Rue des Majorettes',
    1800000, FALSE, 100000, 2, 2, 1,
    4, 4, 350, TRUE, TRUE, TRUE, TRUE, TRUE,
    'INDIVIDUAL', 'INDIVIDUAL', '+2250700000002', '+2250700000002', 'ACTIVE', TRUE
),
(
    'b0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000003',
    'Appartement 2 Pièces neuf - Bingerville Feh Kessé',
    'Nouvelle construction prête à habiter. Belle finition, carrelage blanc brillant, cuisine avec rangements, balcon. Eau et électricité disponibles.',
    'APARTMENT', 1, 11, 'Feh Kessé, nouveau goudron',
    130000, FALSE, 10000, 2, 2, 1,
    1, 1, 50, FALSE, TRUE, TRUE, TRUE, FALSE,
    'INDIVIDUAL', 'INDIVIDUAL', '+2250500000003', '+2250500000003', 'PENDING', FALSE
)
ON CONFLICT (id) DO NOTHING;

-- 6. PHOTOS DES ANNONCES
INSERT INTO listing_images (listing_id, image_url, is_primary, display_order) VALUES
('b0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80', TRUE, 1),
('b0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80', FALSE, 2),
('b0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', TRUE, 1),
('b0000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80', TRUE, 1),
('b0000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80', TRUE, 1)
ON CONFLICT DO NOTHING;

-- 7. DEMANDES LOCATAIRES ("JE CHERCHE")
INSERT INTO property_requests (
    id, user_id, title, description, property_type, commune_id, neighborhood_name,
    min_budget, max_budget, bedrooms_min, is_furnished, urgency_level, status,
    contact_phone, contact_whatsapp
) VALUES
(
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000004',
    'Urgent : Cherche Studio ou 2 Pièces propre à Cocody Angré',
    'Bonjour, jeune cadre célibataire cherche studio ou 2 pièces staffé, sécurisé, avec compteur individuel. Proximité voie principale souhaitée.',
    'APARTMENT', 1, 'Angré ou Palmeraie',
    100000, 180000, 1, FALSE, 'URGENT', 'OPEN',
    '+2250100000004', '+2250100000004'
),
(
    'c0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000004',
    'Cherche Villa basse 4 pièces à louer - Yopougon Maroc',
    'Famille avec 2 enfants cherche villa basse avec cour avant/arrière, garage 1 voiture, quartier calme et accessible.',
    'HOUSE', 2, 'Yopougon Maroc / Niangon',
    200000, 300000, 3, FALSE, 'NORMAL', 'OPEN',
    '+2250100000004', '+2250100000004'
)
ON CONFLICT (id) DO NOTHING;
