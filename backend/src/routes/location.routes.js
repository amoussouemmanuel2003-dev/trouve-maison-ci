const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');

// Référentiels géographiques ouverts
router.get('/cities', locationController.getCities);
router.get('/communes', locationController.getCommunes);
router.get('/neighborhoods/:commune_id', locationController.getNeighborhoodsByCommune);

module.exports = router;
