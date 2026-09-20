const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ ERREUR: DATABASE_URL n\'est pas définie dans backend/.env');
    console.log('👉 Exemple pour Neon: DATABASE_URL=postgresql://user:password@ep-sample.eu-central-1.aws.neon.tech/trouve_maison_ci?sslmode=require');
    process.exit(1);
}

// Remplacer sslmode=verify-full par sslmode=require pour compatibilité node-postgres
if (connectionString.includes('sslmode=verify-full')) {
    connectionString = connectionString.replace('sslmode=verify-full', 'sslmode=require');
}

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

const isReset = process.argv.includes('--reset') || process.argv.includes('-r');

async function runMigration() {
    console.log('🚀 Connexion à la base de données PostgreSQL (Neon)...');
    const client = await pool.connect();

    try {
        if (isReset) {
            console.log('⚠️ Réinitialisation complète demandée (--reset)...');
            console.log('🗑️ Suppression des anciennes tables en conflit...');
            await client.query(`
                DROP TABLE IF EXISTS favorites CASCADE;
                DROP TABLE IF EXISTS property_requests CASCADE;
                DROP TABLE IF EXISTS listing_images CASCADE;
                DROP TABLE IF EXISTS listings CASCADE;
                DROP TABLE IF EXISTS neighborhoods CASCADE;
                DROP TABLE IF EXISTS communes CASCADE;
                DROP TABLE IF EXISTS cities CASCADE;
                DROP TABLE IF EXISTS users CASCADE;
            `);
            console.log('✅ Anciennes tables supprimées.');
        }

        console.log('📦 1/2 Exécution de schema.sql...');
        const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await client.query(schemaSql);
        console.log('✅ Schéma créé avec succès (avec colonnes utilisateurs & Abidjan) !');

        console.log('🌱 2/2 Exécution de seed.sql (Communes Abidjan & Données initiales)...');
        const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
        await client.query(seedSql);
        console.log('✅ Données initiales insérées avec succès !');

        console.log('\n✨ Base de données Trouve Maison CI prête à l\'emploi !');
    } catch (err) {
        console.error('\n❌ Erreur lors de l\'initialisation de la base de données :');
        console.error(err.message);

        if (err.message && (err.message.includes('column') || err.message.includes('foreign key') || err.message.includes('already exists'))) {
            console.log('\n💡 CONSEIL : Une ancienne table est en conflit dans votre base Neon.');
            console.log('👉 Exécutez la réinitialisation propre avec :');
            console.log('   npm run db:reset\n');
        }
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
