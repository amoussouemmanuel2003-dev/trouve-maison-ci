const { Pool } = require('pg');
const config = require('./env');

let connectionString = config.DATABASE_URL;
if (connectionString && connectionString.includes('sslmode=verify-full')) {
    connectionString = connectionString.replace('sslmode=verify-full', 'sslmode=require');
}

const pool = new Pool({
    connectionString,
    ssl: config.NODE_ENV === 'production' || (connectionString && connectionString.includes('neon.tech'))
        ? { rejectUnauthorized: false }
        : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});

pool.on('error', (err) => {
    console.error('❌ Erreur inattendue du pool PostgreSQL:', err);
});

// Helper pour exécuter une requête SQL
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        if (config.NODE_ENV === 'development') {
            // Log rapide des requêtes en dev si besoin
            // console.log('Executed query', { text: text.substring(0, 60), duration, rows: res.rowCount });
        }
        return res;
    } catch (error) {
        console.error('❌ Erreur SQL :', { query: text, error: error.message });
        throw error;
    }
};

module.exports = {
    pool,
    query
};
