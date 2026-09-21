const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

module.exports = {
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET || 'trouve_maison_ci_default_secret_key',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
    AUTO_SEED: process.env.AUTO_SEED !== 'false',
    DEFAULT_ADMIN_NAME: process.env.DEFAULT_ADMIN_NAME || 'Administrateur Trouve Maison CI',
    DEFAULT_ADMIN_EMAIL: process.env.DEFAULT_ADMIN_EMAIL || 'admin@trouvemaison.ci',
    DEFAULT_ADMIN_PHONE: process.env.DEFAULT_ADMIN_PHONE || '+2250700000001',
    DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD || 'ChangeMeImmediately123!'
};