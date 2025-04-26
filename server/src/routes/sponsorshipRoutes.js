import express from 'express';
import {
    createSponsorship,
    getAllSponsorships,
    getSponsorshipById,
    getSponsorshipsByEventId,
    getMySponsorships,
    updateSponsorshipStatus,
    updateSponsorship,
    deleteSponsorship,
    addPayment,
    getPayments,
    addPromotion,
    getPromotions,
    generateReport
} from '../controllers/sponsorshipController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Regular sponsor routes
router.post('/', authenticate, authorize(['sponsor']), createSponsorship);
router.get('/me', authenticate, authorize(['sponsor']), getMySponsorships);

// Routes for sponsors, organizers and admins
router.get('/:id', authenticate, getSponsorshipById);
router.put('/:id', authenticate, updateSponsorship);

// Routes for event-specific sponsorships
router.get('/event/:eventId', authenticate, getSponsorshipsByEventId);

// Admin and organizer routes
router.get('/', authenticate, authorize(['admin', 'organizer']), getAllSponsorships);
router.put('/:id/status', authenticate, authorize(['admin', 'organizer']), updateSponsorshipStatus);
router.delete('/:id', authenticate, deleteSponsorship);

// Payment routes
router.post('/:sponsorshipId/payments', authenticate, addPayment);
router.get('/:sponsorshipId/payments', authenticate, getPayments);

// Promotion routes
router.post('/:sponsorshipId/promotions', authenticate, authorize(['admin', 'organizer']), addPromotion);
router.get('/:sponsorshipId/promotions', authenticate, getPromotions);

// Reports
router.get('/reports/summary', authenticate, authorize(['admin', 'organizer']), generateReport);

export default router;