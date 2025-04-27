import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
    getParticipationStats,
    getVenueUtilization,
    getFinancialMetrics,
    getAccommodationMetrics,
    getDemographicMetrics,
    exportData,
    getDashboardMetrics
} from '../controllers/analyticsController.js';

const router = express.Router();

// Protect all analytics routes with authentication
router.use(authenticate);

// Dashboard metrics endpoint - for main dashboard overview
router.get('/dashboard', authorize(['admin', 'organizer']), getDashboardMetrics);

// Event participation statistics endpoints
router.get('/participation', authorize(['admin', 'organizer']), getParticipationStats);

// Venue utilization report endpoints
router.get('/venues', authorize(['admin', 'organizer']), getVenueUtilization);

// Revenue and sponsorship report endpoints
router.get('/financials', authorize(['admin', 'organizer']), getFinancialMetrics);

// Accommodation occupancy report endpoints
router.get('/accommodations', authorize(['admin', 'organizer']), getAccommodationMetrics);

// Participant demographics report endpoints
router.get('/demographics', authorize(['admin', 'organizer']), getDemographicMetrics);

// Data export functionality endpoint
router.get('/export', authorize(['admin', 'organizer']), exportData);

export default router;