// filepath: /Users/sobanahmad/Fast-Nuces/Semester 6/DBlab/semesterProject/server/tests/controllers/accommodationBookingController.test.js
import { jest } from '@jest/globals';

// Mock the models used by the controller
jest.mock('../../src/models/accommodationBookingModel.js', () => {
    return {
        AccommodationBooking: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            cancel: jest.fn(),
            addPayment: jest.fn(),
            getPayments: jest.fn(),
            generateReports: jest.fn()
        }
    };
});

jest.mock('../../src/models/accommodationModel.js', () => {
    return {
        Accommodation: {
            findById: jest.fn()
        }
    };
});

jest.mock('../../src/models/eventModel.js', () => {
    return {
        Event: {
            findById: jest.fn()
        }
    };
});

jest.mock('../../src/config/db.js', () => {
    return {
        pool: {
            execute: jest.fn()
        }
    };
});

// Import controller and mocked modules
import * as bookingController from '../../src/controllers/accommodationBookingController.js';
import { AccommodationBooking } from '../../src/models/accommodationBookingModel.js';
import { Accommodation } from '../../src/models/accommodationModel.js';
import { Event } from '../../src/models/eventModel.js';
import { pool } from '../../src/config/db.js';

describe('AccommodationBookingController', () => {
    let mockRequest;
    let mockResponse;
    let mockBooking;
    let mockPayment;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Setup mock request and response objects
        mockRequest = {
            body: {},
            params: {},
            query: {},
            user: { id: 1, role: 'participant' }
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        mockBooking = {
            id: 1,
            user_id: 1,
            event_id: 1,
            room_id: 1,
            check_in_date: '2025-05-15',
            check_out_date: '2025-05-20',
            total_price: 750.00,
            status: 'pending',
            payment_status: 'pending',
            payment_method: 'credit_card',
            special_requests: 'Early check-in if possible'
        };

        mockPayment = {
            id: 1,
            booking_id: 1,
            amount: 750.00,
            payment_date: '2025-04-30',
            payment_method: 'credit_card',
            reference_number: 'PAY123456',
            receipt_url: 'http://example.com/receipt.pdf'
        };

        // Setup mock pool.execute for room details query
        pool.execute.mockResolvedValue([
            [{
                id: 1,
                accommodation_id: 1,
                room_number: '101',
                room_type: 'Deluxe',
                capacity: 2,
                is_available: true,
                price_per_night: 150.00
            }]
        ]);
    });

    describe('createBooking', () => {
        it('should create booking successfully', async () => {
            // Setup
            mockRequest.body = {
                event_id: 1,
                room_id: 1,
                check_in_date: '2025-05-15',
                check_out_date: '2025-05-20',
                payment_method: 'credit_card',
                special_requests: 'Early check-in if possible'
            };

            Event.findById.mockResolvedValue({ id: 1, title: 'Tech Conference' });
            AccommodationBooking.create.mockResolvedValue(mockBooking);

            // Mock the current date for validation
            const originalDate = global.Date;
            global.Date = class extends Date {
                constructor() {
                    return new originalDate('2025-04-27');
                }
            };

            // Test
            await bookingController.createBooking(mockRequest, mockResponse);

            // Restore Date
            global.Date = originalDate;

            // Assertions
            expect(Event.findById).toHaveBeenCalledWith(1);
            expect(pool.execute).toHaveBeenCalled();
            expect(AccommodationBooking.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    user_id: 1,
                    event_id: 1,
                    room_id: 1,
                    check_in_date: '2025-05-15',
                    check_out_date: '2025-05-20',
                    payment_method: 'credit_card',
                    total_price: expect.any(Number)
                })
            );
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Booking created successfully',
                    booking: mockBooking
                })
            );
        });

        it('should return 400 when required fields are missing', async () => {
            // Setup
            mockRequest.body = {
                event_id: 1
                // Missing room_id, check_in_date, and check_out_date
            };

            // Test
            await bookingController.createBooking(mockRequest, mockResponse);

            // Assertions
            expect(AccommodationBooking.create).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Please provide event_id, room_id, check_in_date, and check_out_date'
            });
        });

        it('should return 400 when check-out date is before check-in date', async () => {
            // Setup
            mockRequest.body = {
                event_id: 1,
                room_id: 1,
                check_in_date: '2025-05-20',
                check_out_date: '2025-05-15'
            };

            // Mock the current date for validation
            const originalDate = global.Date;
            global.Date = class extends Date {
                constructor() {
                    return new originalDate('2025-04-27');
                }
            };

            // Test
            await bookingController.createBooking(mockRequest, mockResponse);

            // Restore Date
            global.Date = originalDate;

            // Assertions
            expect(AccommodationBooking.create).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Check-out date must be after check-in date'
            });
        });

        it('should return 404 when event not found', async () => {
            // Setup
            mockRequest.body = {
                event_id: 999,
                room_id: 1,
                check_in_date: '2025-05-15',
                check_out_date: '2025-05-20'
            };

            Event.findById.mockResolvedValue(null);

            // Mock the current date for validation
            const originalDate = global.Date;
            global.Date = class extends Date {
                constructor() {
                    return new originalDate('2025-04-27');
                }
            };

            // Test
            await bookingController.createBooking(mockRequest, mockResponse);

            // Restore Date
            global.Date = originalDate;

            // Assertions
            expect(AccommodationBooking.create).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Event not found'
            });
        });

        it('should handle room availability conflicts', async () => {
            // Setup
            mockRequest.body = {
                event_id: 1,
                room_id: 1,
                check_in_date: '2025-05-15',
                check_out_date: '2025-05-20'
            };

            Event.findById.mockResolvedValue({ id: 1, title: 'Tech Conference' });
            const error = new Error('Room is not available for the selected dates');
            AccommodationBooking.create.mockRejectedValue(error);

            // Mock the current date for validation
            const originalDate = global.Date;
            global.Date = class extends Date {
                constructor() {
                    return new originalDate('2025-04-27');
                }
            };

            // Test
            await bookingController.createBooking(mockRequest, mockResponse);

            // Restore Date
            global.Date = originalDate;

            // Assertions
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Server error',
                error: error.message
            });
        });
    });

    describe('getAllBookings', () => {
        it('should return all bookings for admin', async () => {
            // Setup
            mockRequest.user = { id: 1, role: 'admin' };
            mockRequest.query = {
                status: 'confirmed',
                eventId: '1',
                limit: '20',
                offset: '0'
            };

            const mockBookings = [mockBooking];
            AccommodationBooking.findAll.mockResolvedValue(mockBookings);

            // Test
            await bookingController.getAllBookings(mockRequest, mockResponse);

            // Assertions
            expect(AccommodationBooking.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'confirmed',
                    eventId: 1,
                    limit: 20,
                    offset: 0
                })
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ bookings: mockBookings });
        });

        it('should limit normal users to see only their own bookings', async () => {
            // Setup
            mockRequest.user = { id: 1, role: 'participant' };
            mockRequest.query = { status: 'pending' };

            const mockBookings = [mockBooking];
            AccommodationBooking.findAll.mockResolvedValue(mockBookings);

            // Test
            await bookingController.getAllBookings(mockRequest, mockResponse);

            // Assertions
            expect(AccommodationBooking.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 1,
                    status: 'pending',
                    limit: 10,
                    offset: 0
                })
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ bookings: mockBookings });
        });
    });

    describe('getBookingById', () => {
        it('should return booking when found and user is authorized', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            mockRequest.user = { id: 1, role: 'participant' }; // Owner of the booking

            AccommodationBooking.findById.mockResolvedValue(mockBooking);

            // Test
            await bookingController.getBookingById(mockRequest, mockResponse);

            // Assertions
            expect(AccommodationBooking.findById).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ booking: mockBooking });
        });

        it('should return 404 when booking not found', async () => {
            // Setup
            mockRequest.params = { id: '999' };
            AccommodationBooking.findById.mockResolvedValue(null);

            // Test
            await bookingController.getBookingById(mockRequest, mockResponse);

            // Assertions
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Booking not found' });
        });

        it('should return 403 when user is not authorized', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            mockRequest.user = { id: 2, role: 'participant' }; // Different user

            // Booking owned by user with ID 1
            AccommodationBooking.findById.mockResolvedValue({
                ...mockBooking,
                user_id: 1
            });

            // Test
            await bookingController.getBookingById(mockRequest, mockResponse);

            // Assertions
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'You do not have permission to view this booking'
            });
        });

        it('should allow admin to view any booking', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            mockRequest.user = { id: 2, role: 'admin' }; // Admin user

            // Booking owned by user with ID 1
            AccommodationBooking.findById.mockResolvedValue({
                ...mockBooking,
                user_id: 1
            });

            // Test
            await bookingController.getBookingById(mockRequest, mockResponse);

            // Assertions
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                booking: expect.objectContaining({ id: 1, user_id: 1 })
            });
        });
    });

    describe('getMyBookings', () => {
        it('should return user\'s bookings', async () => {
            // Setup
            mockRequest.user = { id: 1, role: 'participant' };

            const mockBookings = [mockBooking];
            AccommodationBooking.findAll.mockResolvedValue(mockBookings);

            // Test
            await bookingController.getMyBookings(mockRequest, mockResponse);

            // Assertions
            expect(AccommodationBooking.findAll).toHaveBeenCalledWith(
                expect.objectContaining({ userId: 1 })
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ bookings: mockBookings });
        });
    });

    describe('updateBookingStatus', () => {
        it('should update booking status for admin', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            mockRequest.user = { id: 2, role: 'admin' };
            mockRequest.body = { status: 'confirmed' };

            AccommodationBooking.findById.mockResolvedValue(mockBooking);

            const updatedBooking = {
                ...mockBooking,
                status: 'confirmed'
            };

            AccommodationBooking.update.mockResolvedValue(updatedBooking);

            // Test
            await bookingController.updateBookingStatus(mockRequest, mockResponse);

            // Assertions
            expect(AccommodationBooking.findById).toHaveBeenCalledWith('1');
            expect(AccommodationBooking.update).toHaveBeenCalledWith('1', { status: 'confirmed' });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Booking confirmed successfully',
                    booking: updatedBooking
                })
            );
        });

        it('should return 403 for non-admin users', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            mockRequest.user = { id: 1, role: 'participant' };
            mockRequest.body = { status: 'confirmed' };

            AccommodationBooking.findById.mockResolvedValue(mockBooking);

            // Test
            await bookingController.updateBookingStatus(mockRequest, mockResponse);

            // Assertions
            expect(AccommodationBooking.update).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'You do not have permission to update this booking'
            });
        });

        it('should return 400 for invalid status', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            mockRequest.user = { id: 2, role: 'admin' };
            mockRequest.body = { status: 'invalid_status' };

            // Test
            await bookingController.updateBookingStatus(mockRequest, mockResponse);

            // Assertions
            expect(AccommodationBooking.update).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Invalid status. Must be one of: pending, confirmed, checked_in, checked_out, cancelled'
            });
        });
    });

    describe('cancelBooking', () => {
        it('should allow user to cancel their own booking', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            mockRequest.user = { id: 1, role: 'participant' };

            AccommodationBooking.findById.mockResolvedValue(mockBooking);

            const cancelledBooking = {
                ...mockBooking,
                status: 'cancelled'
            };

            AccommodationBooking.cancel.mockResolvedValue(cancelledBooking);

            // Test
            await bookingController.cancelBooking(mockRequest, mockResponse);

            // Assertions
            expect(AccommodationBooking.findById).toHaveBeenCalledWith('1');
            expect(AccommodationBooking.cancel).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Booking cancelled successfully',
                    booking: cancelledBooking
                })
            );
        });

        it('should return 403 when user is not authorized', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            mockRequest.user = { id: 2, role: 'participant' };

            AccommodationBooking.findById.mockResolvedValue({
                ...mockBooking,
                user_id: 1
            });

            // Test
            await bookingController.cancelBooking(mockRequest, mockResponse);

            // Assertions
            expect(AccommodationBooking.cancel).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'You do not have permission to cancel this booking'
            });
        });

        it('should allow admin to cancel any booking', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            mockRequest.user = { id: 2, role: 'admin' };

            AccommodationBooking.findById.mockResolvedValue({
                ...mockBooking,
                user_id: 1
            });

            const cancelledBooking = {
                ...mockBooking,
                user_id: 1,
                status: 'cancelled'
            };

            AccommodationBooking.cancel.mockResolvedValue(cancelledBooking);

            // Test
            await bookingController.cancelBooking(mockRequest, mockResponse);

            // Assertions
            expect(AccommodationBooking.cancel).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Booking cancelled successfully'
                })
            );
        });

        it('should return 400 when trying to cancel checked-in booking', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            mockRequest.user = { id: 1, role: 'participant' };

            AccommodationBooking.findById.mockResolvedValue({
                ...mockBooking,
                status: 'checked_in'
            });

            // Test
            await bookingController.cancelBooking(mockRequest, mockResponse);

            // Assertions
            expect(AccommodationBooking.cancel).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Cannot cancel booking in 'checked_in' status"
            });
        });
    });

    describe('addPayment', () => {
        it('should add payment to booking', async () => {
            // Setup
            mockRequest.params = { bookingId: '1' };
            mockRequest.user = { id: 1, role: 'participant' };
            mockRequest.body = {
                amount: 750.00,
                payment_date: '2025-04-30',
                payment_method: 'credit_card',
                reference_number: 'PAY123456',
                receipt_url: 'http://example.com/receipt.pdf'
            };

            AccommodationBooking.findById.mockResolvedValue(mockBooking);
            AccommodationBooking.addPayment.mockResolvedValue(mockPayment);

            // Test
            await bookingController.addPayment(mockRequest, mockResponse);

            // Assertions
            expect(AccommodationBooking.findById).toHaveBeenCalledWith('1');
            expect(AccommodationBooking.addPayment).toHaveBeenCalledWith(
                expect.objectContaining({
                    booking_id: 1,
                    amount: 750.00,
                    payment_date: '2025-04-30',
                    payment_method: 'credit_card',
                    reference_number: 'PAY123456',
                    receipt_url: 'http://example.com/receipt.pdf'
                })
            );
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Payment added successfully',
                    payment: mockPayment
                })
            );
        });

        it('should return 400 when required fields are missing', async () => {
            // Setup
            mockRequest.params = { bookingId: '1' };
            mockRequest.user = { id: 1, role: 'participant' };
            mockRequest.body = {
                amount: 750.00,
                // Missing payment_date and payment_method
            };

            // Test
            await bookingController.addPayment(mockRequest, mockResponse);

            // Assertions
            expect(AccommodationBooking.addPayment).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Please provide amount, payment_date, and payment_method'
            });
        });

        it('should return 404 when booking not found', async () => {
            // Setup
            mockRequest.params = { bookingId: '999' };
            mockRequest.user = { id: 1, role: 'participant' };
            mockRequest.body = {
                amount: 750.00,
                payment_date: '2025-04-30',
                payment_method: 'credit_card'
            };

            AccommodationBooking.findById.mockResolvedValue(null);

            // Test
            await bookingController.addPayment(mockRequest, mockResponse);

            // Assertions
            expect(AccommodationBooking.addPayment).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Booking not found' });
        });
    });

    describe('getPayments', () => {
        it('should return payments for a booking', async () => {
            // Setup
            mockRequest.params = { bookingId: '1' };
            mockRequest.user = { id: 1, role: 'participant' };

            AccommodationBooking.findById.mockResolvedValue(mockBooking);

            const mockPayments = [mockPayment];
            AccommodationBooking.getPayments.mockResolvedValue(mockPayments);

            // Test
            await bookingController.getPayments(mockRequest, mockResponse);

            // Assertions
            expect(AccommodationBooking.findById).toHaveBeenCalledWith('1');
            expect(AccommodationBooking.getPayments).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ payments: mockPayments });
        });

        it('should return 403 when user is not authorized', async () => {
            // Setup
            mockRequest.params = { bookingId: '1' };
            mockRequest.user = { id: 2, role: 'participant' };

            AccommodationBooking.findById.mockResolvedValue({
                ...mockBooking,
                user_id: 1
            });

            // Test
            await bookingController.getPayments(mockRequest, mockResponse);

            // Assertions
            expect(AccommodationBooking.getPayments).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'You do not have permission to view payments for this booking'
            });
        });
    });

    describe('generateReports', () => {
        it('should generate reports for admin', async () => {
            // Setup
            mockRequest.user = { id: 1, role: 'admin' };
            mockRequest.query = {
                startDate: '2025-01-01',
                endDate: '2025-12-31',
                eventId: '1'
            };

            const mockReport = {
                summary: {
                    total_bookings: 50,
                    total_revenue: 37500,
                    average_stay_length: 5
                },
                statusBreakdown: {
                    confirmed: 30,
                    pending: 15,
                    cancelled: 5
                }
            };

            AccommodationBooking.generateReports.mockResolvedValue(mockReport);

            // Test
            await bookingController.generateReports(mockRequest, mockResponse);

            // Assertions
            expect(AccommodationBooking.generateReports).toHaveBeenCalledWith({
                startDate: '2025-01-01',
                endDate: '2025-12-31',
                eventId: '1'
            });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ report: mockReport });
        });

        it('should return 403 for non-admin users', async () => {
            // Setup
            mockRequest.user = { id: 1, role: 'participant' };

            // Test
            await bookingController.generateReports(mockRequest, mockResponse);

            // Assertions
            expect(AccommodationBooking.generateReports).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Access denied: Only admins can generate reports'
            });
        });
    });
});