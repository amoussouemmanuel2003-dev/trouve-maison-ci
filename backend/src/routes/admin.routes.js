const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const boostController = require('../controllers/boost.controller');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth.middleware');

// Toutes les routes d'administration sont strictement protégées par le rôle 'ADMIN'
router.use(authenticateToken, authorizeRoles('ADMIN'));

// Statistiques générales
router.get('/stats', adminController.getDashboardStats);

// Modération des annonces
router.get('/listings/pending', adminController.getPendingListings);
router.put('/listings/:id/moderate', adminController.moderateListing);

// Gestion des comptes utilisateurs
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/status', adminController.toggleUserStatus);

// Gestion des demandes de boost / paiements Mobile Money
router.get('/boosts', boostController.getAllBoostRequests);
router.get('/boosts/stats', boostController.getBoostStats);
router.put('/boosts/:id/review', boostController.reviewBoostRequest);

module.exports = router;
