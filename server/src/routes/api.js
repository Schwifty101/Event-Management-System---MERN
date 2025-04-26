import express from 'express';
import userRoutes from './userRoutes.js';
import eventRoutes from './eventRoutes.js';

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'API is running' });
});

// Mount routes
router.use('/users', userRoutes);
router.use('/events', eventRoutes);

export default router;