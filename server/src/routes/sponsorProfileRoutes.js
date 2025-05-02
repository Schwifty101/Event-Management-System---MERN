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
router.get('/profile', authenticate, getMyProfile);
router.post('/profile', authenticate, createOrUpdateProfile);
router.delete('/profile', authenticate, deleteProfile);

// Admin only routes
router.get('/', authenticate, authorize(['admin']), getAllProfiles);
router.get('/:id', authenticate, authorize(['admin']), getProfileById);
router.delete('/:id', authenticate, authorize(['admin']), deleteProfile);

export default router;