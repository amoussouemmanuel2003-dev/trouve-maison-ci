const db = require('../config/db');

/**
 * GET /api/locations/cities
 */
const getCities = async (req, res, next) => {
    try {
        const result = await db.query('SELECT * FROM cities ORDER BY name ASC');
        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/locations/communes
 */
const getCommunes = async (req, res, next) => {
    try {
        const { city_id } = req.query;
        let queryText = 'SELECT * FROM communes';
        const params = [];

        if (city_id) {
            queryText += ' WHERE city_id = $1';
            params.push(city_id);
        }

        queryText += ' ORDER BY name ASC';

        const result = await db.query(queryText, params);
        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/locations/neighborhoods/:commune_id
 */
const getNeighborhoodsByCommune = async (req, res, next) => {
    try {
        const { commune_id } = req.params;
        const result = await db.query(
            'SELECT * FROM neighborhoods WHERE commune_id = $1 ORDER BY name ASC',
            [commune_id]
        );
        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCities,
    getCommunes,
    getNeighborhoodsByCommune
};
