const db = require('../config/db');

/**
 * GET /api/listings
 * Obtenir les annonces avec filtres multi-critères
 */
const getListings = async (req, res, next) => {
    try {
        const {
            commune_id,
            property_type,
            min_price,
            max_price,
            bedrooms,
            is_furnished,
            status,
            search,
            sort = 'recent',
            page = 1,
            limit = 12
        } = req.query;

        const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
        const params = [];
        const whereClauses = [];

        // Filtre de statut (par défaut uniquement les annonces validées en ligne)
        if (status) {
            params.push(status);
            whereClauses.push(`l.status = $${params.length}`);
        } else {
            params.push('ACTIVE');
            whereClauses.push(`l.status = $${params.length}`);
        }

        // Filtre par commune
        if (commune_id) {
            params.push(parseInt(commune_id));
            whereClauses.push(`l.commune_id = $${params.length}`);
        }

        // Filtre par type de bien (APARTMENT, VILLA, STUDIO, etc.)
        if (property_type) {
            params.push(property_type);
            whereClauses.push(`l.property_type = $${params.length}`);
        }

        // Filtre par budget minimum en FCFA
        if (min_price) {
            params.push(parseFloat(min_price));
            whereClauses.push(`l.monthly_rent >= $${params.length}`);
        }

        // Filtre par budget maximum en FCFA
        if (max_price) {
            params.push(parseFloat(max_price));
            whereClauses.push(`l.monthly_rent <= $${params.length}`);
        }

        // Filtre par nombre de chambres
        if (bedrooms) {
            params.push(parseInt(bedrooms));
            whereClauses.push(`l.bedrooms >= $${params.length}`);
        }

        // Filtre meublé / non meublé
        if (is_furnished !== undefined && is_furnished !== '') {
            params.push(is_furnished === 'true' || is_furnished === true);
            whereClauses.push(`l.is_furnished = $${params.length}`);
        }

        // Recherche textuelle (titre, description, repères)
        if (search) {
            params.push(`%${search.trim()}%`);
            whereClauses.push(`(l.title ILIKE $${params.length} OR l.description ILIKE $${params.length} OR l.address_details ILIKE $${params.length})`);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Tri
        let orderBySql = 'ORDER BY l.is_featured DESC, l.created_at DESC';
        if (sort === 'price_asc') orderBySql = 'ORDER BY l.monthly_rent ASC';
        if (sort === 'price_desc') orderBySql = 'ORDER BY l.monthly_rent DESC';
        if (sort === 'views') orderBySql = 'ORDER BY l.views_count DESC';

        // Requête de comptage total
        const countQuery = `
            SELECT COUNT(*) AS total
            FROM listings l
            ${whereSql}
        `;
        const countResult = await db.query(countQuery, params);
        const totalItems = parseInt(countResult.rows[0].total);

        // Requête de sélection avec pagination et images
        params.push(parseInt(limit));
        const limitParam = `$${params.length}`;
        params.push(offset);
        const offsetParam = `$${params.length}`;

        const selectQuery = `
            SELECT 
                l.*,
                c.name AS commune_name,
                n.name AS neighborhood_name,
                ci.name AS city_name,
                u.full_name AS author_name,
                u.role AS author_role,
                u.whatsapp_number AS author_whatsapp,
                COALESCE(
                    (
                        SELECT json_agg(json_build_object(
                            'id', img.id,
                            'image_url', img.image_url,
                            'is_primary', img.is_primary
                        ) ORDER BY img.is_primary DESC, img.display_order ASC)
                        FROM listing_images img
                        WHERE img.listing_id = l.id
                    ), '[]'::json
                ) AS images
            FROM listings l
            LEFT JOIN communes c ON l.commune_id = c.id
            LEFT JOIN neighborhoods n ON l.neighborhood_id = n.id
            LEFT JOIN cities ci ON l.city_id = ci.id
            LEFT JOIN users u ON l.user_id = u.id
            ${whereSql}
            ${orderBySql}
            LIMIT ${limitParam} OFFSET ${offsetParam}
        `;

        const result = await db.query(selectQuery, params);

        res.status(200).json({
            success: true,
            data: result.rows,
            pagination: {
                total: totalItems,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalItems / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/listings/:id
 * Obtenir le détail d'une annonce spécifique
 */
const getListingById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const selectQuery = `
            SELECT 
                l.*,
                c.name AS commune_name,
                n.name AS neighborhood_name,
                ci.name AS city_name,
                u.id AS author_id,
                u.full_name AS author_name,
                u.phone AS author_phone,
                u.whatsapp_number AS author_whatsapp,
                u.role AS author_role,
                u.avatar_url AS author_avatar,
                COALESCE(
                    (
                        SELECT json_agg(json_build_object(
                            'id', img.id,
                            'image_url', img.image_url,
                            'is_primary', img.is_primary,
                            'display_order', img.display_order
                        ) ORDER BY img.is_primary DESC, img.display_order ASC)
                        FROM listing_images img
                        WHERE img.listing_id = l.id
                    ), '[]'::json
                ) AS images
            FROM listings l
            LEFT JOIN communes c ON l.commune_id = c.id
            LEFT JOIN neighborhoods n ON l.neighborhood_id = n.id
            LEFT JOIN cities ci ON l.city_id = ci.id
            LEFT JOIN users u ON l.user_id = u.id
            WHERE l.id = $1
        `;

        const result = await db.query(selectQuery, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Annonce introuvable.'
            });
        }

        // Incrémenter le compteur de vues de façon asynchrone
        db.query('UPDATE listings SET views_count = views_count + 1 WHERE id = $1', [id]).catch(err => {
            console.error('Erreur incrément vue:', err.message);
        });

        res.status(200).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/listings
 * Créer une nouvelle annonce (Réservé aux LANDLORD, AGENT, ADMIN)
 */
const createListing = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const {
            title,
            description,
            property_type,
            city_id = 1, // Par défaut Abidjan
            commune_id,
            neighborhood_id,
            address_details,
            latitude,
            longitude,
            monthly_rent,
            charges_included = false,
            charges_amount = 0,
            deposit_months = 2,
            advance_months = 2,
            agency_fee_months = 1,
            bedrooms = 1,
            bathrooms = 1,
            surface_area,
            is_furnished = false,
            has_balcony = false,
            has_parking = false,
            has_pool = false,
            has_security = false,
            has_air_conditioning = false,
            water_meter_type = 'INDIVIDUAL',
            electricity_meter_type = 'INDIVIDUAL',
            whatsapp_contact,
            call_contact,
            images = []
        } = req.body;

        if (!title || !description || !property_type || !commune_id || !monthly_rent) {
            return res.status(400).json({
                success: false,
                message: 'Champs obligatoires manquants (titre, description, type, commune, loyer).'
            });
        }

        // Statut initial : Si admin => ACTIVE immédiatement, sinon PENDING pour validation
        const initialStatus = req.user.role === 'ADMIN' ? 'ACTIVE' : 'PENDING';

        const insertQuery = `
            INSERT INTO listings (
                user_id, title, description, property_type, city_id, commune_id, neighborhood_id,
                address_details, latitude, longitude, monthly_rent, charges_included, charges_amount,
                deposit_months, advance_months, agency_fee_months, bedrooms, bathrooms, surface_area,
                is_furnished, has_balcony, has_parking, has_pool, has_security, has_air_conditioning,
                water_meter_type, electricity_meter_type, whatsapp_contact, call_contact, status
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7,
                $8, $9, $10, $11, $12, $13,
                $14, $15, $16, $17, $18, $19,
                $20, $21, $22, $23, $24, $25,
                $26, $27, $28, $29, $30
            ) RETURNING *
        `;

        const values = [
            userId, title.trim(), description.trim(), property_type, city_id, commune_id, neighborhood_id || null,
            address_details || null, latitude || null, longitude || null, monthly_rent, charges_included, charges_amount,
            deposit_months, advance_months, agency_fee_months, bedrooms, bathrooms, surface_area || null,
            is_furnished, has_balcony, has_parking, has_pool, has_security, has_air_conditioning,
            water_meter_type, electricity_meter_type,
            whatsapp_contact ? whatsapp_contact.trim() : req.user.phone,
            call_contact ? call_contact.trim() : req.user.phone,
            initialStatus
        ];

        const result = await db.query(insertQuery, values);
        const newListing = result.rows[0];

        // Insérer les images si fournies
        if (Array.isArray(images) && images.length > 0) {
            for (let i = 0; i < images.length; i++) {
                const img = images[i];
                const imageUrl = typeof img === 'string' ? img : img.image_url;
                const isPrimary = i === 0;
                if (imageUrl) {
                    await db.query(
                        'INSERT INTO listing_images (listing_id, image_url, is_primary, display_order) VALUES ($1, $2, $3, $4)',
                        [newListing.id, imageUrl, isPrimary, i + 1]
                    );
                }
            }
        }

        res.status(201).json({
            success: true,
            message: initialStatus === 'ACTIVE' 
                ? 'Annonce publiée avec succès !' 
                : 'Annonce créée et transmise à l\'équipe de modération.',
            data: newListing
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/listings/:id
 * Modifier une annonce existante
 */
const updateListing = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Vérifier l'existence et les droits
        const checkResult = await db.query('SELECT user_id FROM listings WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Annonce introuvable.' });
        }

        if (checkResult.rows[0].user_id !== userId && userRole !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'êtes pas autorisé à modifier cette annonce.'
            });
        }

        const {
            title, description, property_type, commune_id, neighborhood_id, address_details,
            monthly_rent, charges_included, charges_amount, deposit_months, advance_months, agency_fee_months,
            bedrooms, bathrooms, surface_area, is_furnished, has_balcony, has_parking, has_security,
            water_meter_type, electricity_meter_type, whatsapp_contact, call_contact, status
        } = req.body;

        const updateQuery = `
            UPDATE listings SET
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                property_type = COALESCE($3, property_type),
                commune_id = COALESCE($4, commune_id),
                neighborhood_id = COALESCE($5, neighborhood_id),
                address_details = COALESCE($6, address_details),
                monthly_rent = COALESCE($7, monthly_rent),
                charges_included = COALESCE($8, charges_included),
                charges_amount = COALESCE($9, charges_amount),
                deposit_months = COALESCE($10, deposit_months),
                advance_months = COALESCE($11, advance_months),
                agency_fee_months = COALESCE($12, agency_fee_months),
                bedrooms = COALESCE($13, bedrooms),
                bathrooms = COALESCE($14, bathrooms),
                surface_area = COALESCE($15, surface_area),
                is_furnished = COALESCE($16, is_furnished),
                has_balcony = COALESCE($17, has_balcony),
                has_parking = COALESCE($18, has_parking),
                has_security = COALESCE($19, has_security),
                water_meter_type = COALESCE($20, water_meter_type),
                electricity_meter_type = COALESCE($21, electricity_meter_type),
                whatsapp_contact = COALESCE($22, whatsapp_contact),
                call_contact = COALESCE($23, call_contact),
                status = COALESCE($24, status)
            WHERE id = $25
            RETURNING *
        `;

        const values = [
            title, description, property_type, commune_id, neighborhood_id, address_details,
            monthly_rent, charges_included, charges_amount, deposit_months, advance_months, agency_fee_months,
            bedrooms, bathrooms, surface_area, is_furnished, has_balcony, has_parking, has_security,
            water_meter_type, electricity_meter_type, whatsapp_contact, call_contact,
            (userRole === 'ADMIN' ? status : undefined),
            id
        ];

        const result = await db.query(updateQuery, values);

        res.status(200).json({
            success: true,
            message: 'Annonce mise à jour avec succès.',
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/listings/:id
 * Supprimer une annonce
 */
const deleteListing = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const checkResult = await db.query('SELECT user_id FROM listings WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Annonce introuvable.' });
        }

        if (checkResult.rows[0].user_id !== userId && userRole !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'êtes pas autorisé à supprimer cette annonce.'
            });
        }

        await db.query('DELETE FROM listings WHERE id = $1', [id]);

        res.status(200).json({
            success: true,
            message: 'Annonce supprimée avec succès.'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/listings/user/my-listings
 * Annonces du propriétaire ou démarcheur connecté
 */
const getMyListings = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const query = `
            SELECT 
                l.*,
                c.name AS commune_name,
                COALESCE(
                    (
                        SELECT json_agg(json_build_object('id', img.id, 'image_url', img.image_url, 'is_primary', img.is_primary))
                        FROM listing_images img
                        WHERE img.listing_id = l.id
                    ), '[]'::json
                ) AS images
            FROM listings l
            LEFT JOIN communes c ON l.commune_id = c.id
            WHERE l.user_id = $1
            ORDER BY l.created_at DESC
        `;
        const result = await db.query(query, [userId]);

        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/listings/:id/favorite
 * Ajouter ou retirer des favoris
 */
const toggleFavorite = async (req, res, next) => {
    try {
        const listingId = req.params.id;
        const userId = req.user.id;

        const checkQuery = 'SELECT id FROM favorites WHERE user_id = $1 AND listing_id = $2';
        const check = await db.query(checkQuery, [userId, listingId]);

        if (check.rows.length > 0) {
            await db.query('DELETE FROM favorites WHERE user_id = $1 AND listing_id = $2', [userId, listingId]);
            return res.status(200).json({ success: true, isFavorite: false, message: 'Retiré des favoris.' });
        } else {
            await db.query('INSERT INTO favorites (user_id, listing_id) VALUES ($1, $2)', [userId, listingId]);
            return res.status(200).json({ success: true, isFavorite: true, message: 'Ajouté aux favoris !' });
        }
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/listings/user/favorites
 * Liste des annonces favorites de l'utilisateur
 */
const getMyFavorites = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const query = `
            SELECT 
                l.*,
                c.name AS commune_name,
                COALESCE(
                    (
                        SELECT json_agg(json_build_object('id', img.id, 'image_url', img.image_url, 'is_primary', img.is_primary))
                        FROM listing_images img
                        WHERE img.listing_id = l.id
                    ), '[]'::json
                ) AS images
            FROM favorites f
            JOIN listings l ON f.listing_id = l.id
            LEFT JOIN communes c ON l.commune_id = c.id
            WHERE f.user_id = $1
            ORDER BY f.created_at DESC
        `;
        const result = await db.query(query, [userId]);

        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getListings,
    getListingById,
    createListing,
    updateListing,
    deleteListing,
    getMyListings,
    toggleFavorite,
    getMyFavorites
};
