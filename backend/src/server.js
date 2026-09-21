const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const config = require('./config/env');
const db = require('./config/db');
const { seedDatabase } = require('../database/seed');
const apiRoutes = require('./routes/index');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');

const app = express();

// ==========================================
// 1. MIDDLEWARES GLOBAUX
// ==========================================

// Sécurisation des headers HTTP
app.use(helmet());

// Render est derrière un proxy : nécessaire pour les URLs et IP réelles.
app.set('trust proxy', 1);

const allowedOrigins = new Set(
    config.CLIENT_URL.split(',').map((url) => url.trim()).filter(Boolean)
);

const isAllowedOrigin = (origin) => {
    if (!origin) return true; // curl, Postman, health checks
    if (allowedOrigins.has(origin)) return true;

    try {
        const url = new URL(origin);
        return (url.protocol === 'https:' && url.hostname.endsWith('.vercel.app')) ||
            ((url.hostname === 'localhost' || url.hostname === '127.0.0.1') && config.NODE_ENV !== 'production');
    } catch {
        return false;
    }
};

// CLIENT_URL accepte plusieurs URLs séparées par des virgules, avec les previews Vercel.
app.use(cors({
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) return callback(null, true);
        return callback(new Error(`Origine CORS non autorisée : ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logger des requêtes HTTP
if (config.NODE_ENV !== 'test') {
    app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Parsers JSON et URL-encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Les URLs /uploads/... stockées en base restent exploitables en ligne.
// Pour un stockage durable, préférez Cloudinary/S3 : Render efface son disque au redéploiement.
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), { maxAge: '1d' }));

// ==========================================
// 2. MONTAGE DES ROUTES
// ==========================================

// Page d'accueil basique de l'API
app.get('/', (req, res) => {
    res.json({
        name: 'Trouve Maison CI - API REST',
        version: '1.0.0',
        documentation: '/api/health',
        author: 'Équipe Trouve Maison CI (Abidjan)'
    });
});

// Toutes les routes API sous /api
app.use('/api', apiRoutes);

// ==========================================
// 3. GESTION DES ERREURS
// ==========================================
app.use(notFoundHandler);
app.use(errorHandler);

// ==========================================
// 4. DÉMARRAGE DU SERVEUR
// ==========================================
const PORT = config.PORT;

const server = app.listen(PORT, async () => {
    console.log(`\n======================================================`);
    console.log(`🇨🇮 SERVEUR TROUVE MAISON CI DÉMARRÉ SUR LE PORT ${PORT}`);
    console.log(`👉 Mode : ${config.NODE_ENV}`);
    console.log(`👉 API Base URL : http://localhost:${PORT}/api`);
    console.log(`👉 Health Check : http://localhost:${PORT}/api/health`);
    console.log(`======================================================\n`);

    // Test de connexion à la base PostgreSQL si DATABASE_URL est renseignée
    if (config.DATABASE_URL) {
        try {
            const res = await db.query('SELECT NOW() as now, current_database() as db_name');
            console.log(`✅ Connecté à PostgreSQL Neon [BDD: ${res.rows[0].db_name}] à ${res.rows[0].now}`);
            if (config.AUTO_SEED) {
                await seedDatabase();
                console.log('🌱 Données de base vérifiées (admin et communes).');
            }
        } catch (err) {
            console.warn(`⚠️ Attention: Impossible de joindre PostgreSQL Neon (${err.message}).`);
            console.warn(`👉 Vérifiez votre DATABASE_URL dans backend/.env ou lancez 'npm run db:init'`);
        }
    } else {
        console.warn(`ℹ️ Aucune DATABASE_URL définie. Pensez à configurer backend/.env`);
    }
});

// Arrêt propre en cas de signal système
process.on('SIGTERM', () => {
    console.log('Arrêt du serveur (SIGTERM)...');
    server.close(() => {
        db.pool.end();
        process.exit(0);
    });
});

module.exports = app;
