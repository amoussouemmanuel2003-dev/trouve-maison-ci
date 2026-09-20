const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/env');
const db = require('./config/db');
const apiRoutes = require('./routes/index');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');

const app = express();

// ==========================================
// 1. MIDDLEWARES GLOBAUX
// ==========================================

// Sécurisation des headers HTTP
app.use(helmet());

// Configuration CORS (autoriser le frontend Vue 3)
app.use(cors({
    origin: (origin, callback) => {
        // Autoriser les requêtes sans origine (ex: curl, Postman) ou venant du CLIENT_URL ou localhost
        if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin === config.CLIENT_URL) {
            callback(null, true);
        } else {
            callback(null, true); // En dev/test, permissive
        }
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
