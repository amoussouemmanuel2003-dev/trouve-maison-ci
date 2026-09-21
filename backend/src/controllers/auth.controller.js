const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const config = require('../config/env');

/**
 * Générer un JWT pour un utilisateur
 */
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            role: user.role,
            phone: user.phone
        },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRES_IN }
    );
};

/**
 * POST /api/auth/register
 * Inscription avec téléphone / email et mot de passe
 */
const register = async (req, res, next) => {
    try {
        const { full_name, phone, email, password, role, whatsapp_number } = req.body;

        if (!full_name || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Veuillez renseigner votre nom complet, numéro de téléphone et mot de passe.'
            });
        }

        // Sécuriser les rôles autorisés à l'inscription publique (pas ADMIN direct)
        const allowedRoles = ['USER', 'LANDLORD', 'AGENT'];
        const userRole = allowedRoles.includes(role) ? role : 'USER';

        // Nettoyer les numéros (supprimer les espaces superflus)
        const cleanedPhone = phone.trim().replace(/\s+/g, '');
        const cleanedEmail = email ? email.trim().toLowerCase() : null;

        // Vérifier si le téléphone existe déjà
        const existingPhone = await db.query('SELECT id FROM users WHERE phone = $1', [cleanedPhone]);
        if (existingPhone.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Ce numéro de téléphone est déjà associé à un compte.'
            });
        }

        // Vérifier si l'email existe déjà (si renseigné)
        if (cleanedEmail) {
            const existingEmail = await db.query('SELECT id FROM users WHERE email = $1', [cleanedEmail]);
            if (existingEmail.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'Cette adresse email est déjà associée à un compte.'
                });
            }
        }

        // Hachage du mot de passe
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insertion dans PostgreSQL
        const insertQuery = `
            INSERT INTO users (full_name, phone, email, password_hash, role, whatsapp_number)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, full_name, phone, email, role, whatsapp_number, is_verified, is_active, created_at
        `;
        const result = await db.query(insertQuery, [
            full_name.trim(),
            cleanedPhone,
            cleanedEmail,
            passwordHash,
            userRole,
            whatsapp_number ? whatsapp_number.trim() : cleanedPhone
        ]);

        const newUser = result.rows[0];
        const token = generateToken(newUser);

        res.status(201).json({
            success: true,
            message: 'Inscription réussie avec succès !',
            token,
            user: newUser
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/login
 * Connexion par téléphone ou email
 */
const login = async (req, res, next) => {
    try {
        const { identifier, password } = req.body; // identifier = phone OU email

        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: 'Veuillez saisir votre numéro de téléphone (ou email) et votre mot de passe.'
            });
        }

        const cleanIdentifier = identifier.trim();

        // Recherche par téléphone ou email
        const userQuery = `
            SELECT id, full_name, phone, email, password_hash, role, whatsapp_number, is_verified, is_active, created_at
            FROM users 
            WHERE phone = $1 OR LOWER(email) = LOWER($1)
        `;
        const result = await db.query(userQuery, [cleanIdentifier]);

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Identifiants invalides (numéro ou mot de passe incorrect).'
            });
        }

        const user = result.rows[0];

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Ce compte a été désactivé. Veuillez contacter le support.'
            });
        }

        // Vérification du mot de passe
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Identifiants invalides (numéro ou mot de passe incorrect).'
            });
        }

        // Retirer le hash du payload renvoyé
        delete user.password_hash;

        const token = generateToken(user);

        res.status(200).json({
            success: true,
            message: 'Connexion réussie !',
            token,
            user
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/auth/me
 * Obtenir les données de l'utilisateur connecté
 */
const getProfile = async (req, res, next) => {
    try {
        const userQuery = `
            SELECT id, full_name, phone, email, role, whatsapp_number, avatar_url, is_verified, is_active, created_at
            FROM users 
            WHERE id = $1
        `;
        const result = await db.query(userQuery, [req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur introuvable.'
            });
        }

        res.status(200).json({
            success: true,
            user: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/auth/me
 * Mettre à jour son profil
 */
const updateProfile = async (req, res, next) => {
    try {
        const { full_name, whatsapp_number, avatar_url, email } = req.body;
        const userId = req.user.id;

        const updateQuery = `
            UPDATE users
            SET full_name = COALESCE($1, full_name),
                whatsapp_number = COALESCE($2, whatsapp_number),
                avatar_url = COALESCE($3, avatar_url),
                email = COALESCE($4, email)
            WHERE id = $5
            RETURNING id, full_name, phone, email, role, whatsapp_number, avatar_url, is_verified, is_active
        `;
        const result = await db.query(updateQuery, [
            full_name ? full_name.trim() : null,
            whatsapp_number ? whatsapp_number.trim() : null,
            avatar_url || null,
            email ? email.trim().toLowerCase() : null,
            userId
        ]);

        res.status(200).json({
            success: true,
            message: 'Profil mis à jour avec succès.',
            user: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile
};
