const db = require('../config/db');

/**
 * GET /api/requests
 * Lister les demandes "Je cherche" avec filtres
 */
const getRequests = async (req, res, next) => {
    try {
        const {
            commune_id,
            property_type,
            max_budget,
            status = 'OPEN',
            page = 1,
            limit = 15
        } = req.query;

        const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
        const params = [];
        const whereClauses = [];

        if (status) {
            params.push(status);
            whereClauses.push(`r.status = $${params.length}`);
        }

        if (commune_id) {
            params.push(parseInt(commune_id));
            whereClauses.push(`r.commune_id = $${params.length}`);
        }

        if (property_type) {
            params.push(property_type);
            whereClauses.push(`r.property_type = $${params.length}`);
        }

        if (max_budget) {
            params.push(parseFloat(max_budget));
            whereClauses.push(`r.max_budget <= $${params.length}`);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Comptage
        const countQuery = `SELECT COUNT(*) as total FROM property_requests r ${whereSql}`;
        const countResult = await db.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total);

        // Données avec pagination
        params.push(parseInt(limit));
        const limitParam = `$${params.length}`;
        params.push(offset);
        const offsetParam = `$${params.length}`;

        const selectQuery = `
            SELECT 
                r.*,
                c.name AS commune_name,
                u.full_name AS user_name,
                u.phone AS user_phone,
                u.whatsapp_number AS user_whatsapp
            FROM property_requests r
            LEFT JOIN communes c ON r.commune_id = c.id
            LEFT JOIN users u ON r.user_id = u.id
            ${whereSql}
            ORDER BY 
                CASE WHEN r.urgency_level = 'URGENT' THEN 1 ELSE 2 END,
                r.created_at DESC
            LIMIT ${limitParam} OFFSET ${offsetParam}
        `;

        const result = await db.query(selectQuery, params);

        res.status(200).json({
            success: true,
            data: result.rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/requests/:id
 */
const getRequestById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT 
                r.*,
                c.name AS commune_name,
                u.full_name AS user_name,
                u.phone AS user_phone,
                u.whatsapp_number AS user_whatsapp
            FROM property_requests r
            LEFT JOIN communes c ON r.commune_id = c.id
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.id = $1
        `;
        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Demande introuvable.' });
        }

        res.status(200).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/requests
 * Créer une demande "Je cherche" (accessible à tout utilisateur connecté)
 */
const createRequest = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const {
            title,
            description,
            property_type,
            commune_id,
            neighborhood_name,
            min_budget,
            max_budget,
            bedrooms_min = 1,
            is_furnished = false,
            urgency_level = 'NORMAL',
            contact_phone,
            contact_whatsapp
        } = req.body;

        if (!title || !property_type || !max_budget) {
            return res.status(400).json({
                success: false,
                message: 'Veuillez renseigner le titre de votre recherche, le type de bien et votre budget maximum.'
            });
        }

        const insertQuery = `
            INSERT INTO property_requests (
                user_id, title, description, property_type, commune_id, neighborhood_name,
                min_budget, max_budget, bedrooms_min, is_furnished, urgency_level,
                contact_phone, contact_whatsapp
            ) VALUES (
                $1, $2, $3, $4, $5, $6,
                $7, $8, $9, $10, $11,
                $12, $13
            ) RETURNING *
        `;

        const values = [
            userId,
            title.trim(),
            description ? description.trim() : null,
            property_type,
            commune_id || null,
            neighborhood_name ? neighborhood_name.trim() : null,
            min_budget || null,
            max_budget,
            bedrooms_min,
            is_furnished,
            urgency_level,
            contact_phone ? contact_phone.trim() : req.user.phone,
            contact_whatsapp ? contact_whatsapp.trim() : (req.user.whatsapp_number || req.user.phone)
        ];

        const result = await db.query(insertQuery, values);

        res.status(201).json({
            success: true,
            message: 'Votre demande a été publiée avec succès !',
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/requests/:id
 */
const deleteRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const check = await db.query('SELECT user_id FROM property_requests WHERE id = $1', [id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Demande introuvable.' });
        }

        if (check.rows[0].user_id !== userId && userRole !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'avez pas les droits pour supprimer cette demande.'
            });
        }

        await db.query('DELETE FROM property_requests WHERE id = $1', [id]);

        res.status(200).json({
            success: true,
            message: 'Demande supprimée avec succès.'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/requests/user/my-requests
 */
const getMyRequests = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const query = `
            SELECT r.*, c.name AS commune_name
            FROM property_requests r
            LEFT JOIN communes c ON r.commune_id = c.id
            WHERE r.user_id = $1
            ORDER BY r.created_at DESC
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
    getRequests,
    getRequestById,
    createRequest,
    deleteRequest,
    getMyRequests
};
