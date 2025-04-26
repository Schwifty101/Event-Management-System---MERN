import express from 'express';
import userRoutes from './userRoutes.js';
import eventRoutes from './eventRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import roundRoutes from './roundRoutes.js';
import teamRoutes from './teamRoutes.js';
import judgeRoutes from './judgeRoutes.js';

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

export default router;