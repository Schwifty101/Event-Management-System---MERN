import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
    addRegistrationPayment,
    getRegistrationPayments,
    generateFinancialReport,
    getSavedReports,
    getReportById,
    getPaymentDashboardSummary
} from '../controllers/paymentController.js';

const router = express.Router();

// Registration payment routes
router.post('/registrations/:registrationId/payments', authenticate, addRegistrationPayment);
router.get('/registrations/:registrationId/payments', authenticate, getRegistrationPayments);

// Financial reports
router.get('/reports/generate', authenticate, authorize(['admin', 'organizer']), generateFinancialReport);
router.get('/reports', authenticate, authorize(['admin', 'organizer']), getSavedReports);
router.get('/reports/:id', authenticate, authorize(['admin', 'organizer']), getReportById);

// Dashboard summary
router.get('/dashboard/summary', authenticate, authorize(['admin', 'organizer']), getPaymentDashboardSummary);

export default router;