import { AccommodationBooking } from '../models/accommodationBookingModel.js';
import { Accommodation } from '../models/accommodationModel.js';
import { Event } from '../models/eventModel.js';
import { pool } from '../config/db.js';

/**
 * Create a new accommodation booking
 */
export const createBooking = async (req, res) => {
    try {
        const {
            event_id, room_id, check_in_date, check_out_date,
            payment_method, special_requests
        } = req.body;

        // Get user ID from authenticated user
        const user_id = req.user.id;

        // Validate required fields
        if (!event_id || !room_id || !check_in_date || !check_out_date) {
            return res.status(400).json({
                message: 'Please provide event_id, room_id, check_in_date, and check_out_date'
            });
        }

        // Validate date format and logic
        const checkInDate = new Date(check_in_date);
        const checkOutDate = new Date(check_out_date);
        const now = new Date();

        if (isNaN(checkInDate) || isNaN(checkOutDate)) {
            return res.status(400).json({ message: 'Invalid date format' });
        }

        if (checkInDate < now) {
            return res.status(400).json({ message: 'Check-in date cannot be in the past' });
        }

        if (checkOutDate <= checkInDate) {
            return res.status(400).json({ message: 'Check-out date must be after check-in date' });
        }

        // Check if event exists
        const event = await Event.findById(event_id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Get room details to calculate price
        const [roomDetails] = await pool.execute(`
            SELECT r.*, a.price_per_night 
            FROM accommodation_rooms r
            JOIN accommodations a ON r.accommodation_id = a.id
            WHERE r.id = ?
        `, [room_id]);

        if (roomDetails.length === 0) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Calculate total price and number of nights
        const pricePerNight = roomDetails[0].price_per_night;
        const nightsCount = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        const total_price = pricePerNight * nightsCount;

        // Create booking
        const bookingData = {
            user_id,
            event_id,
            room_id,
            check_in_date,
            check_out_date,
            total_price,
            status: 'pending',
            payment_status: 'pending',
            payment_method,
            special_requests
        };

        try {
            const booking = await AccommodationBooking.create(bookingData);

            res.status(201).json({
                message: 'Booking created successfully',
                booking
            });
        } catch (error) {
            if (error.message.includes('not available')) {
                return res.status(409).json({
                    message: error.message
                });
            }
            throw error;
        }
    } catch (error) {
        console.error('Error in createBooking:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get all bookings with filtering
 */
export const getAllBookings = async (req, res) => {
    try {
        const {
            status, eventId, accommodationId, startDate,
            endDate, paymentStatus, limit, offset
        } = req.query;

        // Parse query parameters for filtering
        const options = {
            status,
            eventId: eventId ? parseInt(eventId) : undefined,
            accommodationId: accommodationId ? parseInt(accommodationId) : undefined,
            startDate,
            endDate,
            paymentStatus,
            limit: limit ? parseInt(limit) : 10,
            offset: offset ? parseInt(offset) : 0
        };

        // Admins and organizers can see all bookings
        // Regular users can only see their own bookings
        if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
            options.userId = req.user.id;
        }

        const bookings = await AccommodationBooking.findAll(options);

        res.status(200).json({ bookings });
    } catch (error) {
        console.error('Error in getAllBookings:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get booking by ID
 */
export const getBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await AccommodationBooking.findById(id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Check authorization: only admin, organizer or booking owner can see details
        const isAdmin = req.user.role === 'admin';
        const isOrganizer = req.user.role === 'organizer';
        const isOwner = req.user.id === booking.user_id;

        if (!isAdmin && !isOrganizer && !isOwner) {
            return res.status(403).json({
                message: 'You do not have permission to view this booking'
            });
        }

        res.status(200).json({ booking });
    } catch (error) {
        console.error('Error in getBookingById:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get bookings for the current user (user-specific bookings)
 */
export const getMyBookings = async (req, res) => {
    try {
        const userId = req.user.id;
        const options = { userId };

        const bookings = await AccommodationBooking.findAll(options);

        res.status(200).json({ bookings });
    } catch (error) {
        console.error('Error in getMyBookings:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Update booking status (admin/organizer only)
 */
export const updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
            });
        }

        // Check if booking exists
        const booking = await AccommodationBooking.findById(id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Authorization check: Only admins and organizers can update status
        const isAdmin = req.user.role === 'admin';
        const isOrganizer = req.user.role === 'organizer';

        if (!isAdmin && !isOrganizer) {
            return res.status(403).json({
                message: 'You do not have permission to update this booking'
            });
        }

        // Update status
        const updatedBooking = await AccommodationBooking.update(id, { status });

        res.status(200).json({
            message: `Booking ${status} successfully`,
            booking: updatedBooking
        });
    } catch (error) {
        console.error('Error in updateBookingStatus:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Cancel a booking (can be done by user who made the booking or admin/organizer)
 */
export const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if booking exists
        const booking = await AccommodationBooking.findById(id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Check authorization: user can cancel their own booking, or admin/organizer can cancel any booking
        const isAdmin = req.user.role === 'admin';
        const isOrganizer = req.user.role === 'organizer';
        const isOwner = req.user.id === booking.user_id;

        if (!isAdmin && !isOrganizer && !isOwner) {
            return res.status(403).json({
                message: 'You do not have permission to cancel this booking'
            });
        }

        // Cannot cancel if already checked in or checked out
        if (booking.status === 'checked_in' || booking.status === 'checked_out') {
            return res.status(400).json({
                message: `Cannot cancel booking in '${booking.status}' status`
            });
        }

        // Cancel booking
        const updatedBooking = await AccommodationBooking.cancel(id);

        res.status(200).json({
            message: 'Booking cancelled successfully',
            booking: updatedBooking
        });
    } catch (error) {
        console.error('Error in cancelBooking:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Add payment for a booking
 */
export const addPayment = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const {
            amount, payment_date, payment_method,
            reference_number, receipt_url, notes
        } = req.body;

        // Validate required fields
        if (!amount || !payment_date || !payment_method) {
            return res.status(400).json({
                message: 'Please provide amount, payment_date, and payment_method'
            });
        }

        // Check if booking exists
        const booking = await AccommodationBooking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Authorization check
        const isAdmin = req.user.role === 'admin';
        const isOrganizer = req.user.role === 'organizer';
        const isOwner = req.user.id === booking.user_id;

        if (!isAdmin && !isOrganizer && !isOwner) {
            return res.status(403).json({
                message: 'You do not have permission to add payment to this booking'
            });
        }

        // Add payment
        const paymentData = {
            booking_id: parseInt(bookingId),
            amount: parseFloat(amount),
            payment_date,
            payment_method,
            reference_number,
            receipt_url,
            notes
        };

        const payment = await AccommodationBooking.addPayment(paymentData);

        res.status(201).json({
            message: 'Payment added successfully',
            payment
        });
    } catch (error) {
        console.error('Error in addPayment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get payments for a booking
 */
export const getPayments = async (req, res) => {
    try {
        const { bookingId } = req.params;

        // Check if booking exists
        const booking = await AccommodationBooking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Authorization check
        const isAdmin = req.user.role === 'admin';
        const isOrganizer = req.user.role === 'organizer';
        const isOwner = req.user.id === booking.user_id;

        if (!isAdmin && !isOrganizer && !isOwner) {
            return res.status(403).json({
                message: 'You do not have permission to view payments for this booking'
            });
        }

        const payments = await AccommodationBooking.getPayments(bookingId);

        res.status(200).json({ payments });
    } catch (error) {
        console.error('Error in getPayments:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Generate booking reports (admin only)
 */
export const generateReports = async (req, res) => {
    try {
        // Only admins can generate reports
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied: Only admins can generate reports'
            });
        }

        const { startDate, endDate, eventId } = req.query;

        // Generate report with filters
        const options = { startDate, endDate, eventId };
        const report = await AccommodationBooking.generateReports(options);

        res.status(200).json({ report });
    } catch (error) {
        console.error('Error in generateReports:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};