const express = require('express');
const router = express.Router();
const requestController = require('../controllers/request.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// Flux public des demandes locataires
router.get('/', requestController.getRequests);

// Mes demandes personnelles
router.get('/user/my-requests', authenticateToken, requestController.getMyRequests);

// Détail d'une demande
router.get('/:id', requestController.getRequestById);

// Publier une recherche (accessible à tout utilisateur connecté)
router.post('/', authenticateToken, requestController.createRequest);

// Supprimer une demande
router.delete('/:id', authenticateToken, requestController.deleteRequest);

module.exports = router;
