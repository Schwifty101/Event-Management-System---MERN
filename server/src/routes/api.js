import express from 'express';
import userRoutes from './userRoutes.js';
import eventRoutes from './eventRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import roundRoutes from './roundRoutes.js';
import teamRoutes from './teamRoutes.js';
import judgeRoutes from './judgeRoutes.js';
import sponsorPackageRoutes from './sponsorPackageRoutes.js';
import sponsorProfileRoutes from './sponsorProfileRoutes.js';
import sponsorshipRoutes from './sponsorshipRoutes.js';
import accommodationRoutes from './accommodationRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import adminRoutes from './adminRoutes.js'; // Import new admin routes

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'API is running' });
});

// Mount routes
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/categories', categoryRoutes);
router.use('/rounds', roundRoutes);
router.use('/teams', teamRoutes);
router.use('/judges', judgeRoutes);

// Sponsorship management routes
router.use('/sponsor-packages', sponsorPackageRoutes);
router.use('/sponsors', sponsorProfileRoutes); // Changed from sponsor-profiles to sponsors
router.use('/sponsorships', sponsorshipRoutes);

// Accommodation management routes
router.use('/accommodations', accommodationRoutes);

// Payment management routes
router.use('/payments', paymentRoutes);

// Analytics and reporting routes
router.use('/analytics', analyticsRoutes);

// Admin management routes
router.use('/admin', adminRoutes);

export default router;