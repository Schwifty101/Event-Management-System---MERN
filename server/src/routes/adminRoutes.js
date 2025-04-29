import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { getPermissions, updatePermissions, getDashboardMetrics } from '../controllers/adminController.js';

const router = express.Router();

// Protect all admin routes with authentication and admin role
router.use(authenticate);
router.use(authorize(['admin']));

// Permissions management routes
router.get('/permissions', getPermissions);
router.put('/permissions', updatePermissions);

// Dashboard metrics
router.get('/dashboard', getDashboardMetrics);

export default router;