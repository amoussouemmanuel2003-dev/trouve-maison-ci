const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listing.controller');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth.middleware');

// Routes publiques
router.get('/', listingController.getListings);

// Routes spécifiques utilisateur (placées avant /:id pour éviter les collisions de routes)
router.get('/user/my-listings', authenticateToken, listingController.getMyListings);
router.get('/user/favorites', authenticateToken, listingController.getMyFavorites);

// Détail d'une annonce
router.get('/:id', listingController.getListingById);

// Création d'une annonce : réservée aux propriétaires, démarcheurs et administrateurs.
router.post('/', authenticateToken, authorizeRoles('LANDLORD', 'AGENT', 'ADMIN'), listingController.createListing);

// Modification & Suppression
router.put('/:id', authenticateToken, listingController.updateListing);
router.delete('/:id', authenticateToken, listingController.deleteListing);

// Gestion des favoris
router.post('/:id/favorite', authenticateToken, listingController.toggleFavorite);

module.exports = router;
