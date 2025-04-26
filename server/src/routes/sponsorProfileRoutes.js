import express from 'express';
import {
    createOrUpdateProfile,
    getMyProfile,
    getAllProfiles,
    getProfileById,
    deleteProfile
} from '../controllers/sponsorProfileController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes requiring authentication
router.post('/', authenticate, createOrUpdateProfile);
router.get('/me', authenticate, getMyProfile);
router.delete('/me', authenticate, deleteProfile);

// Admin only routes
router.get('/', authenticate, authorize(['admin']), getAllProfiles);
router.get('/:id', authenticate, authorize(['admin']), getProfileById);
router.delete('/:id', authenticate, authorize(['admin']), deleteProfile);

export default router;