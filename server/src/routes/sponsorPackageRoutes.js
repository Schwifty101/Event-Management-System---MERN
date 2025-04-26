import express from 'express';
import {
    getAllPackages,
    getPackageById,
    createPackage,
    updatePackage,
    deletePackage
} from '../controllers/sponsorshipPackageController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllPackages);
router.get('/:id', getPackageById);

// Admin only routes
router.post('/', authenticate, authorize(['admin']), createPackage);
router.put('/:id', authenticate, authorize(['admin']), updatePackage);
router.delete('/:id', authenticate, authorize(['admin']), deletePackage);

export default router;