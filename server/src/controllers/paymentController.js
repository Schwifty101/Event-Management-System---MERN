import { Payment } from '../models/paymentModel.js';
import { Event } from '../models/eventModel.js';
import { Sponsorship } from '../models/sponsorshipModel.js';
import { pool } from '../config/db.js';

/**
 * Add payment for event registration
 */
export const addRegistrationPayment = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const {
            amount, payment_date, payment_method,
            reference_number, notes, receipt_url
        } = req.body;

        // Validate required fields
        if (!amount || !payment_date || !payment_method) {
            return res.status(400).json({
                message: 'Please provide amount, payment date, and payment method'
            });
        }

        // Verify registration exists and belongs to user
        const [registration] = await pool.execute(
            'SELECT * FROM event_registrations WHERE id = ?',
            [registrationId]
        );

        if (registration.length === 0) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        // Authorization check
        const isAdmin = req.user.role === 'admin';
        const isOrganizer = req.user.role === 'organizer';
        const isOwner = req.user.id === registration[0].user_id;

        if (!isAdmin && !isOrganizer && !isOwner) {
            return res.status(403).json({
                message: 'You do not have permission to add payment to this registration'
            });
        }

        // Add payment
        const paymentData = {
            registration_id: parseInt(registrationId),
            amount: parseFloat(amount),
            payment_date,
            payment_method,
            reference_number,
            notes,
            receipt_url
        };

        const payment = await Payment.addEventRegistrationPayment(paymentData);

        res.status(201).json({
            message: 'Payment added successfully',
            payment
        });
    } catch (error) {
        console.error('Error in addRegistrationPayment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get payments for a registration
 */
export const getRegistrationPayments = async (req, res) => {
    try {
        const { registrationId } = req.params;

        // Verify registration exists
        const [registration] = await pool.execute(
            'SELECT * FROM event_registrations WHERE id = ?',
            [registrationId]
        );

        if (registration.length === 0) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        // Authorization check
        const isAdmin = req.user.role === 'admin';
        const isOrganizer = req.user.role === 'organizer';
        const isOwner = req.user.id === registration[0].user_id;

        if (!isAdmin && !isOrganizer && !isOwner) {
            return res.status(403).json({
                message: 'You do not have permission to view payments for this registration'
            });
        }

        // Get payments
        const payments = await Payment.getRegistrationPayments(registrationId);

        res.status(200).json({ payments });
    } catch (error) {
        console.error('Error in getRegistrationPayments:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Generate financial report
 */
export const generateFinancialReport = async (req, res) => {
    try {
        // Only admins and organizers can generate reports
        if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
            return res.status(403).json({
                message: 'Only admins and organizers can generate financial reports'
            });
        }

        // Parse filter options from query params
        const options = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            eventId: req.query.eventId ? parseInt(req.query.eventId) : undefined
        };

        // Generate report
        const report = await Payment.generateFinancialReport(options, req.user.id);

        res.status(200).json({ report });
    } catch (error) {
        console.error('Error in generateFinancialReport:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get saved financial reports
 */
export const getSavedReports = async (req, res) => {
    try {
        // Only admins and organizers can view saved reports
        if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
            return res.status(403).json({
                message: 'Only admins and organizers can view financial reports'
            });
        }

        // Parse filter options from query params
        const options = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            limit: req.query.limit ? parseInt(req.query.limit) : 10
        };

        // Get reports
        const reports = await Payment.getSavedReports(options);

        res.status(200).json({ reports });
    } catch (error) {
        console.error('Error in getSavedReports:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get detailed report by ID
 */
export const getReportById = async (req, res) => {
    try {
        const { id } = req.params;

        // Only admins and organizers can view reports
        if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
            return res.status(403).json({
                message: 'Only admins and organizers can view financial reports'
            });
        }

        // Get report
        const report = await Payment.getReportById(id);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        res.status(200).json({ report });
    } catch (error) {
        console.error('Error in getReportById:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get payment dashboard summary (for admin dashboard)
 */
export const getPaymentDashboardSummary = async (req, res) => {
    try {
        // Only admins and organizers can view dashboard summary
        if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
            return res.status(403).json({
                message: 'Only admins and organizers can view payment summary'
            });
        }

        // Get current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        // Generate report for current month
        const report = await Payment.generateFinancialReport({
            startDate: startOfMonth,
            endDate: endOfMonth
        }, req.user.id);

        // Get pending payments
        const [pendingRegistrations] = await pool.execute(`
            SELECT COUNT(*) as count FROM event_registrations 
            WHERE payment_status = 'pending' OR payment_status = 'partial'
        `);

        const [pendingSponsors] = await pool.execute(`
            SELECT COUNT(*) as count FROM sponsorships 
            WHERE status = 'approved'
        `);

        const [pendingBookings] = await pool.execute(`
            SELECT COUNT(*) as count FROM accommodation_bookings 
            WHERE payment_status = 'pending' OR payment_status = 'partial'
        `);

        // Combine all pending payments
        const pendingPayments = {
            registrations: pendingRegistrations[0].count,
            sponsorships: pendingSponsors[0].count,
            bookings: pendingBookings[0].count,
            total: pendingRegistrations[0].count + pendingSponsors[0].count + pendingBookings[0].count
        };

        // Add pending payments to report
        report.pending_payments = pendingPayments;

        res.status(200).json({ summary: report });
    } catch (error) {
        console.error('Error in getPaymentDashboardSummary:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};