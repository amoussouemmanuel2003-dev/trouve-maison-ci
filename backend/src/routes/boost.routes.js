const express = require('express');
const router = express.Router();
const boostController = require('../controllers/boost.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// Routes utilisateur (authentification requise)
router.post('/', authenticateToken, boostController.createBoostRequest);
router.get('/my-requests', authenticateToken, boostController.getMyBoostRequests);

module.exports = router;
