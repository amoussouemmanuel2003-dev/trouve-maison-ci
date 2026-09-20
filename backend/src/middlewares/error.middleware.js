const config = require('../config/env');

/**
 * Middleware pour gérer les routes non trouvées (404)
 */
const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route introuvable : ${req.method} ${req.originalUrl}`
    });
};

/**
 * Middleware global de traitement des erreurs (500)
 */
const errorHandler = (err, req, res, next) => {
    console.error('💥 Erreur serveur inattendue :', err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Une erreur interne est survenue sur le serveur.';

    res.status(statusCode).json({
        success: false,
        message,
        ...(config.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = {
    notFoundHandler,
    errorHandler
};
