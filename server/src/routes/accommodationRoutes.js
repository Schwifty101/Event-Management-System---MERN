import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import * as accommodationController from '../controllers/accommodationController.js';
import * as bookingController from '../controllers/accommodationBookingController.js';

const router = express.Router();

// Accommodation routes
router.get('/', authenticate, accommodationController.getAllAccommodations);
router.get('/:id', authenticate, accommodationController.getAccommodationById);
router.post('/', authenticate, authorize(['admin']), accommodationController.createAccommodation);
router.put('/:id', authenticate, authorize(['admin']), accommodationController.updateAccommodation);
router.delete('/:id', authenticate, authorize(['admin']), accommodationController.deleteAccommodation);

// Room management routes
router.post('/:accommodationId/rooms', authenticate, authorize(['admin']), accommodationController.addRoom);
router.put('/rooms/:roomId', authenticate, authorize(['admin']), accommodationController.updateRoom);
router.delete('/rooms/:roomId', authenticate, authorize(['admin']), accommodationController.deleteRoom);

// Availability routes
router.get('/:accommodationId/available-rooms', authenticate, accommodationController.findAvailableRooms);
router.get('/availability/summary', authenticate, accommodationController.getAvailabilitySummary);

// Booking routes
router.post('/bookings', authenticate, bookingController.createBooking);
router.get('/bookings', authenticate, bookingController.getAllBookings);
router.get('/bookings/my', authenticate, bookingController.getMyBookings);
router.get('/bookings/:id', authenticate, bookingController.getBookingById);
router.put('/bookings/:id/status', authenticate, authorize(['admin', 'organizer']), bookingController.updateBookingStatus);
router.put('/bookings/:id/cancel', authenticate, bookingController.cancelBooking);

// Payment routes
router.post('/bookings/:bookingId/payments', authenticate, bookingController.addPayment);
router.get('/bookings/:bookingId/payments', authenticate, bookingController.getPayments);

// Report routes
router.get('/reports', authenticate, authorize(['admin']), bookingController.generateReports);

export default router;