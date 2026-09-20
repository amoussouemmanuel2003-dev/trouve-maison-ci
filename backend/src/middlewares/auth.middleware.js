const jwt = require('jsonwebtoken');
const config = require('../config/env');
const db = require('../config/db');

/**
 * Middleware d'authentification par JWT Bearer Token
 */
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Format "Bearer TOKEN"

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Accès non autorisé. Token d\'authentification manquant.'
            });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);

        // Vérifier si l'utilisateur existe toujours et est actif
        const userQuery = 'SELECT id, full_name, phone, email, role, is_active FROM users WHERE id = $1';
        const result = await db.query(userQuery, [decoded.id]);

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Utilisateur introuvable.'
            });
        }

        const user = result.rows[0];

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Votre compte a été suspendu par un administrateur.'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Votre session a expiré. Veuillez vous reconnecter.',
                expired: true
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Token d\'authentification invalide.'
        });
    }
};

/**
 * Middleware optionnel : ajoute l'utilisateur s'il est connecté, sans bloquer s'il ne l'est pas
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            const decoded = jwt.verify(token, config.JWT_SECRET);
            const userQuery = 'SELECT id, full_name, phone, email, role, is_active FROM users WHERE id = $1';
            const result = await db.query(userQuery, [decoded.id]);
            if (result.rows.length > 0 && result.rows[0].is_active) {
                req.user = result.rows[0];
            }
        }
    } catch (err) {
        // Ignorer silencieusement pour le mode optionnel
    }
    next();
};

/**
 * Middleware de contrôle d'accès basé sur les rôles (RBAC)
 * @param  {...string} allowedRoles Ex: 'ADMIN', 'LANDLORD', 'AGENT'
 */
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentification requise pour cette action.'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Accès refusé. Cette ressource est réservée aux rôles : ${allowedRoles.join(', ')}.`
            });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    optionalAuth,
    authorizeRoles
};
