const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const listingRoutes = require('./listing.routes');
const requestRoutes = require('./request.routes');
const locationRoutes = require('./location.routes');
const adminRoutes = require('./admin.routes');

// Enregistrement des sous-routeurs
router.use('/auth', authRoutes);
router.use('/listings', listingRoutes);
router.use('/requests', requestRoutes);
router.use('/locations', locationRoutes);
router.use('/admin', adminRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API Trouve Maison CI opérationnelle',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
