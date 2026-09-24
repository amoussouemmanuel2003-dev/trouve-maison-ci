const db = require('../config/db');

/**
 * POST /api/boosts
 * Soumettre une demande de boost avec preuve de paiement Mobile Money
 */
const createBoostRequest = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { listing_id, payment_method, transaction_reference, phone_sender, amount = 1000 } = req.body;

        if (!listing_id || !payment_method || !transaction_reference) {
            return res.status(400).json({
                success: false,
                message: 'Champs obligatoires manquants (listing_id, payment_method, transaction_reference).'
            });
        }

        // Vérifier que l'annonce existe et appartient à l'utilisateur
        const listingCheck = await db.query(
            'SELECT id, user_id, title, status FROM listings WHERE id = $1',
            [listing_id]
        );

        if (listingCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Annonce introuvable.' });
        }

        if (listingCheck.rows[0].user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Vous ne pouvez booster que vos propres annonces.'
            });
        }

        // Vérifier qu'il n'y a pas déjà une demande en attente pour cette annonce
        const pendingCheck = await db.query(
            "SELECT id FROM boost_requests WHERE listing_id = $1 AND status = 'PENDING'",
            [listing_id]
        );

        if (pendingCheck.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Une demande de boost est déjà en cours de traitement pour cette annonce.'
            });
        }

        // Créer la demande de boost
        const insertQuery = `
            INSERT INTO boost_requests (user_id, listing_id, amount, payment_method, transaction_reference, phone_sender)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;

        const result = await db.query(insertQuery, [
            userId,
            listing_id,
            amount,
            payment_method,
            transaction_reference.trim(),
            phone_sender ? phone_sender.trim() : req.user.phone
        ]);

        res.status(201).json({
            success: true,
            message: 'Votre demande de boost a été enregistrée ! Notre équipe vérifie le paiement et activera le boost sous peu.',
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/boosts/my-requests
 * Obtenir les demandes de boost de l'utilisateur connecté
 */
const getMyBoostRequests = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const query = `
            SELECT 
                br.*,
                l.title AS listing_title,
                l.monthly_rent,
                l.is_featured
            FROM boost_requests br
            JOIN listings l ON br.listing_id = l.id
            WHERE br.user_id = $1
            ORDER BY br.created_at DESC
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
 * GET /api/admin/boosts
 * [ADMIN] Obtenir toutes les demandes de boost (avec filtre par statut)
 */
const getAllBoostRequests = async (req, res, next) => {
    try {
        const { status } = req.query;
        const params = [];
        let whereSql = '';

        if (status) {
            params.push(status);
            whereSql = `WHERE br.status = $${params.length}`;
        }

        const query = `
            SELECT 
                br.*,
                l.title AS listing_title,
                l.monthly_rent,
                l.is_featured,
                l.status AS listing_status,
                u.full_name AS user_name,
                u.phone AS user_phone,
                u.role AS user_role
            FROM boost_requests br
            JOIN listings l ON br.listing_id = l.id
            JOIN users u ON br.user_id = u.id
            ${whereSql}
            ORDER BY 
                CASE br.status 
                    WHEN 'PENDING' THEN 0 
                    WHEN 'APPROVED' THEN 1 
                    WHEN 'REJECTED' THEN 2 
                END,
                br.created_at DESC
        `;
        const result = await db.query(query, params);

        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/admin/boosts/:id/review
 * [ADMIN] Approuver ou rejeter une demande de boost
 * Approuver => listing.is_featured = true + boost_expires_at
 * Rejeter => admin_note pour la raison
 */
const reviewBoostRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, admin_note } = req.body;

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Statut invalide. Valeurs acceptées : 'APPROVED', 'REJECTED'."
            });
        }

        // Récupérer la demande de boost
        const boostCheck = await db.query(
            'SELECT * FROM boost_requests WHERE id = $1',
            [id]
        );

        if (boostCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Demande de boost introuvable.' });
        }

        const boostRequest = boostCheck.rows[0];

        if (boostRequest.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: 'Cette demande a déjà été traitée.'
            });
        }

        // Si on approuve : activer le boost sur l'annonce
        if (status === 'APPROVED') {
            const boostDays = boostRequest.boost_days || 7;
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + boostDays);

            // Mettre à jour la demande de boost
            await db.query(
                `UPDATE boost_requests 
                 SET status = 'APPROVED', admin_note = $1, boost_expires_at = $2
                 WHERE id = $3`,
                [admin_note || 'Paiement vérifié et boost activé.', expiresAt, id]
            );

            // Activer is_featured sur l'annonce
            await db.query(
                'UPDATE listings SET is_featured = true WHERE id = $1',
                [boostRequest.listing_id]
            );

            return res.status(200).json({
                success: true,
                message: `Boost approuvé ! L'annonce sera mise en avant pendant ${boostDays} jours.`,
                data: { boost_expires_at: expiresAt }
            });
        }

        // Si on rejette
        if (status === 'REJECTED') {
            await db.query(
                `UPDATE boost_requests 
                 SET status = 'REJECTED', admin_note = $1
                 WHERE id = $2`,
                [admin_note || 'Paiement non confirmé.', id]
            );

            return res.status(200).json({
                success: true,
                message: 'Demande de boost rejetée.'
            });
        }
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/admin/boosts/stats
 * [ADMIN] Statistiques des boosts
 */
const getBoostStats = async (req, res, next) => {
    try {
        const statsQuery = `
            SELECT
                (SELECT COUNT(*) FROM boost_requests) AS total_boosts,
                (SELECT COUNT(*) FROM boost_requests WHERE status = 'PENDING') AS pending_boosts,
                (SELECT COUNT(*) FROM boost_requests WHERE status = 'APPROVED') AS approved_boosts,
                (SELECT COUNT(*) FROM boost_requests WHERE status = 'REJECTED') AS rejected_boosts,
                (SELECT COALESCE(SUM(amount), 0) FROM boost_requests WHERE status = 'APPROVED') AS total_revenue
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

module.exports = {
    createBoostRequest,
    getMyBoostRequests,
    getAllBoostRequests,
    reviewBoostRequest,
    getBoostStats
};
