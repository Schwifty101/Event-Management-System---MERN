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
router.post('/profile', authenticate, createOrUpdateProfile);
router.get('/profile', authenticate, getMyProfile);
router.delete('/profile', authenticate, deleteProfile);

// Admin only routes
router.get('/profiles', authenticate, authorize(['admin']), getAllProfiles);
router.get('/profiles/:id', authenticate, authorize(['admin']), getProfileById);
router.delete('/profiles/:id', authenticate, authorize(['admin']), deleteProfile);

export default router;