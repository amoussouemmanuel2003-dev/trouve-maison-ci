const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// Inscription
router.post('/register', authController.register);

// Connexion
router.post('/login', authController.login);

// Profil de l'utilisateur connecté
router.get('/me', authenticateToken, authController.getProfile);
router.put('/me', authenticateToken, authController.updateProfile);

module.exports = router;
