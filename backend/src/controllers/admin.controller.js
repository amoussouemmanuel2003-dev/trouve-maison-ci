const db = require('../config/db');

/**
 * GET /api/admin/stats
 * Statistiques globales pour le tableau de bord Super Admin
 */
const getDashboardStats = async (req, res, next) => {
    try {
        const statsQuery = `
            SELECT
                (SELECT COUNT(*) FROM listings) AS total_listings,
                (SELECT COUNT(*) FROM listings WHERE status = 'ACTIVE') AS active_listings,
                (SELECT COUNT(*) FROM listings WHERE status = 'PENDING') AS pending_listings,
                (SELECT COUNT(*) FROM listings WHERE status = 'REJECTED') AS rejected_listings,
                (SELECT COUNT(*) FROM users) AS total_users,
                (SELECT COUNT(*) FROM users WHERE role = 'LANDLORD') AS total_landlords,
                (SELECT COUNT(*) FROM users WHERE role = 'AGENT') AS total_agents,
                (SELECT COUNT(*) FROM property_requests WHERE status = 'OPEN') AS open_requests,
                (SELECT COUNT(*) FROM boost_requests WHERE status = 'PENDING') AS pending_boosts,
                (SELECT COALESCE(SUM(amount), 0) FROM boost_requests WHERE status = 'APPROVED') AS boost_revenue
        `;
        const result = await db.query(statsQuery);

        res.status(200).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/admin/listings/pending
 * Obtenir toutes les annonces en attente de modération
 */
const getPendingListings = async (req, res, next) => {
    try {
        const query = `
            SELECT 
                l.*,
                c.name AS commune_name,
                u.full_name AS author_name,
                u.phone AS author_phone,
                u.role AS author_role,
                COALESCE(
                    (
                        SELECT json_agg(json_build_object('id', img.id, 'image_url', img.image_url, 'is_primary', img.is_primary))
                        FROM listing_images img
                        WHERE img.listing_id = l.id
                    ), '[]'::json
                ) AS images
            FROM listings l
            LEFT JOIN communes c ON l.commune_id = c.id
            LEFT JOIN users u ON l.user_id = u.id
            WHERE l.status = 'PENDING'
            ORDER BY l.created_at ASC
        `;
        const result = await db.query(query);

        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/admin/listings/:id/moderate
 * Valider ou rejeter une annonce
 */
const moderateListing = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, rejection_reason, is_featured } = req.body;

        if (!['ACTIVE', 'REJECTED', 'PENDING'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Statut de modération invalide. Valeurs acceptées : ACTIVE, REJECTED, PENDING.'
            });
        }

        const updateQuery = `
            UPDATE listings
            SET status = $1,
                rejection_reason = $2,
                is_featured = COALESCE($3, is_featured)
            WHERE id = $4
            RETURNING id, title, status, rejection_reason, is_featured
        `;

        const result = await db.query(updateQuery, [
            status,
            rejection_reason || null,
            is_featured !== undefined ? is_featured : null,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Annonce introuvable.' });
        }

        res.status(200).json({
            success: true,
            message: status === 'ACTIVE' ? 'Annonce approuvée et publiée en ligne.' : 'Annonce rejetée.',
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/admin/users
 * Lister tous les utilisateurs avec pagination et recherche
 */
const getAllUsers = async (req, res, next) => {
    try {
        const { role, search, page = 1, limit = 20 } = req.query;
        const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
        const params = [];
        const whereClauses = [];

        if (role) {
            params.push(role);
            whereClauses.push(`role = $${params.length}`);
        }

        if (search) {
            params.push(`%${search.trim()}%`);
            whereClauses.push(`(full_name ILIKE $${params.length} OR phone ILIKE $${params.length} OR email ILIKE $${params.length})`);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const countResult = await db.query(`SELECT COUNT(*) FROM users ${whereSql}`, params);
        const total = parseInt(countResult.rows[0].count);

        params.push(parseInt(limit));
        const limitParam = `$${params.length}`;
        params.push(offset);
        const offsetParam = `$${params.length}`;

        const query = `
            SELECT id, full_name, phone, email, role, whatsapp_number, is_verified, is_active, created_at
            FROM users
            ${whereSql}
            ORDER BY created_at DESC
            LIMIT ${limitParam} OFFSET ${offsetParam}
        `;
        const result = await db.query(query, params);

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
 * PUT /api/admin/users/:id/role
 * Modifier le rôle d'un utilisateur
 */
const updateUserRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['USER', 'AGENT', 'LANDLORD', 'ADMIN'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Rôle invalide.' });
        }

        const result = await db.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, full_name, phone, role',
            [role, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
        }

        res.status(200).json({
            success: true,
            message: `Rôle mis à jour en ${role} avec succès.`,
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/admin/users/:id/status
 * Activer ou suspendre un compte utilisateur
 */
const toggleUserStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        const result = await db.query(
            'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, full_name, is_active',
            [is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
        }

        res.status(200).json({
            success: true,
            message: is_active ? 'Compte réactivé.' : 'Compte suspendu.',
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboardStats,
    getPendingListings,
    moderateListing,
    getAllUsers,
    updateUserRole,
    toggleUserStatus
};
