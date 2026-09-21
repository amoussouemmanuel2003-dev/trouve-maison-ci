const bcrypt = require('bcryptjs');
const db = require('../src/config/db');
const config = require('../src/config/env');

const communes = [
    ['Cocody', 'cocody'], ['Yopougon', 'yopougon'], ['Marcory', 'marcory'],
    ['Plateau', 'plateau'], ['Koumassi', 'koumassi'], ['Port-Bouët', 'port-bouet'],
    ['Treichville', 'treichville'], ['Adjamé', 'adjame'], ['Abobo', 'abobo'],
    ['Attécoubé', 'attecoube'], ['Bingerville', 'bingerville'], ['Songon', 'songon']
];

async function seedDatabase() {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const city = await client.query(`
            INSERT INTO cities (name, slug) VALUES ('Abidjan', 'abidjan')
            ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
        `);
        const cityId = city.rows[0].id;

        for (const [name, slug] of communes) {
            await client.query(
                'INSERT INTO communes (city_id, name, slug) VALUES ($1, $2, $3) ON CONFLICT (city_id, slug) DO NOTHING',
                [cityId, name, slug]
            );
        }

        const existingAdmin = await client.query(
            'SELECT id, full_name FROM users WHERE email = $1 OR phone = $2 LIMIT 1',
            [config.DEFAULT_ADMIN_EMAIL, config.DEFAULT_ADMIN_PHONE]
        );
        const passwordHash = await bcrypt.hash(config.DEFAULT_ADMIN_PASSWORD, 12);
        if (existingAdmin.rowCount === 0) {
            await client.query(`
                INSERT INTO users (full_name, phone, email, password_hash, role, whatsapp_number, is_verified, is_active)
                VALUES ($1, $2, $3, $4, 'ADMIN', $2, TRUE, TRUE)
            `, [config.DEFAULT_ADMIN_NAME, config.DEFAULT_ADMIN_PHONE, config.DEFAULT_ADMIN_EMAIL, passwordHash]);
        } else if (existingAdmin.rows[0].full_name === 'Kouamé Jean-Marc (Admin)') {
            // Convertit l'ancien compte de démonstration en compte admin correctement haché.
            await client.query(`
                UPDATE users SET full_name = $1, password_hash = $2, role = 'ADMIN', is_verified = TRUE, is_active = TRUE
                WHERE id = $3
            `, [config.DEFAULT_ADMIN_NAME, passwordHash, existingAdmin.rows[0].id]);
        }
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

if (require.main === module) {
    seedDatabase()
        .then(() => console.log('✅ Seed terminé : admin et communes prêts.'))
        .catch((error) => {
            console.error("❌ Seed impossible. Exécutez d'abord npm run db:init :", error.message);
            process.exitCode = 1;
        })
        .finally(() => db.pool.end());
}

module.exports = { seedDatabase };