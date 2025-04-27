import { jest } from '@jest/globals';
import * as controller from '../../src/controllers/accommodationBookingController.js';
import { AccommodationBooking } from '../../src/models/accommodationBookingModel.js';
import { Event } from '../../src/models/eventModel.js';

// Mock the models and dependencies
jest.mock('../../src/models/accommodationBookingModel.js');
jest.mock('../../src/models/accommodationModel.js');
jest.mock('../../src/models/eventModel.js');

// Import the pool before mocking it
import { pool } from '../../src/config/db.js';

// Now mock the db module
jest.mock('../../src/config/db.js', () => {
    const originalModule = jest.requireActual('../../src/config/db.js');
    return {
        ...originalModule,
        pool: {
            execute: jest.fn()
        }
    };
});

describe('Accommodation Booking Controller', () => {
    let req;
    let res;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Setup the pool.execute mock for each test
        pool.execute = jest.fn();

        // Mock request object
        req = {
            body: {},
            params: {},
            query: {},
            user: {
                id: 1,
                role: 'user'
            }
        };

        // Mock response object
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    describe('createBooking', () => {
        beforeEach(() => {
            req.body = {
                event_id: 1,
                room_id: 2,
                check_in_date: '2025-05-01',
                check_out_date: '2025-05-05',
                payment_method: 'credit_card',
                special_requests: 'Early check-in if possible'
            };

            Event.findById = jest.fn().mockResolvedValue({ id: 1, title: 'Test Event' });

            // Setup the mock implementation for this specific test group
            pool.execute.mockImplementation((query, params) => {
                if (query.includes('SELECT r.*, a.price_per_night')) {
                    return Promise.resolve([[{
                        id: 2,
                        accommodation_id: 1,
                        room_number: '101',
                        room_type: 'Standard',
                        price_per_night: 100
                    }]]);
                }
                return Promise.resolve([[]]);
            });

            AccommodationBooking.create = jest.fn().mockResolvedValue({
                id: 1,
                user_id: 1,
                event_id: 1,
                room_id: 2,
                check_in_date: '2025-05-01',
                check_out_date: '2025-05-05',
                status: 'pending',
                total_price: 400
            });
        });

        test('should create a booking successfully', async () => {
            await controller.createBooking(req, res);

            expect(AccommodationBooking.create).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Booking created successfully',
                    booking: expect.any(Object)
                })
            );
        });

        test('should return 400 if required fields are missing', async () => {
            req.body = { event_id: 1 }; // Missing required fields

            await controller.createBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('Please provide')
                })
            );
        });

        test('should validate check-in date is not in the past', async () => {
            req.body.check_in_date = '2020-01-01'; // Past date

            await controller.createBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('past')
                })
            );
        });

        test('should validate check-out date is after check-in date', async () => {
            req.body.check_in_date = '2025-05-05';
            req.body.check_out_date = '2025-05-01'; // Before check-in date

            await controller.createBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('Check-out date must be after check-in date')
                })
            );
        });

        test('should return 404 if event does not exist', async () => {
            Event.findById = jest.fn().mockResolvedValue(null);

            await controller.createBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Event not found'
                })
            );
        });

        test('should handle room not found', async () => {
            pool.execute.mockImplementation(() => Promise.resolve([[]])); // Empty room result

            await controller.createBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Room not found'
                })
            );
        });

        test('should handle room availability conflict', async () => {
            AccommodationBooking.create = jest.fn().mockRejectedValue(new Error('not available'));

            await controller.createBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('not available')
                })
            );
        });

        test('should handle server errors', async () => {
            AccommodationBooking.create = jest.fn().mockRejectedValue(new Error('Database error'));

            await controller.createBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Server error'
                })
            );
        });
    });

    describe('getAllBookings', () => {
        beforeEach(() => {
            req.query = {
                status: 'confirmed',
                eventId: '1',
                limit: '10',
                offset: '0'
            };

            AccommodationBooking.findAll = jest.fn().mockResolvedValue([
                { id: 1, status: 'confirmed', event_id: 1 },
                { id: 2, status: 'confirmed', event_id: 1 }
            ]);
        });

        test('should return all bookings with filters', async () => {
            await controller.getAllBookings(req, res);

            expect(AccommodationBooking.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'confirmed',
                    eventId: 1,
                    limit: 10,
                    offset: 0
                })
            );

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                bookings: expect.any(Array)
            });
        });

        test('should restrict regular users to see only their bookings', async () => {
            req.user.role = 'user';

            await controller.getAllBookings(req, res);

            expect(AccommodationBooking.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 1
                })
            );
        });

        test('should allow admins to see all bookings', async () => {
            req.user.role = 'admin';

            await controller.getAllBookings(req, res);

            expect(AccommodationBooking.findAll).toHaveBeenCalledWith(
                expect.not.objectContaining({
                    userId: expect.any(Number)
                })
            );
        });

        test('should allow organizers to see all bookings', async () => {
            req.user.role = 'organizer';

            await controller.getAllBookings(req, res);

            expect(AccommodationBooking.findAll).toHaveBeenCalledWith(
                expect.not.objectContaining({
                    userId: expect.any(Number)
                })
            );
        });

        test('should handle errors', async () => {
            AccommodationBooking.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

            await controller.getAllBookings(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getBookingById', () => {
        beforeEach(() => {
            req.params = { id: '1' };

            AccommodationBooking.findById = jest.fn().mockResolvedValue({
                id: 1,
                user_id: 1,
                status: 'confirmed'
            });
        });

        test('should return booking details for admin', async () => {
            req.user.role = 'admin';

            await controller.getBookingById(req, res);

            expect(AccommodationBooking.findById).toHaveBeenCalledWith('1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                booking: expect.any(Object)
            });
        });

        test('should return booking details for booking owner', async () => {
            req.user.id = 1; // Same as booking.user_id
            req.user.role = 'user';

            await controller.getBookingById(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('should deny access to non-owners who are not admins/organizers', async () => {
            req.user.id = 2; // Different from booking.user_id
            req.user.role = 'user';

            await controller.getBookingById(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
        });

        test('should return 404 if booking not found', async () => {
            AccommodationBooking.findById = jest.fn().mockResolvedValue(null);

            await controller.getBookingById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        test('should handle errors', async () => {
            AccommodationBooking.findById = jest.fn().mockRejectedValue(new Error('Database error'));

            await controller.getBookingById(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getMyBookings', () => {
        beforeEach(() => {
            AccommodationBooking.findAll = jest.fn().mockResolvedValue([
                { id: 1, user_id: 1 },
                { id: 2, user_id: 1 }
            ]);
        });

        test('should return current user bookings', async () => {
            await controller.getMyBookings(req, res);

            expect(AccommodationBooking.findAll).toHaveBeenCalledWith({ userId: 1 });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                bookings: expect.any(Array)
            });
        });

        test('should handle errors', async () => {
            AccommodationBooking.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

            await controller.getMyBookings(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('updateBookingStatus', () => {
        beforeEach(() => {
            req.params = { id: '1' };
            req.body = { status: 'confirmed' };
            req.user.role = 'admin';

            AccommodationBooking.findById = jest.fn().mockResolvedValue({
                id: 1,
                status: 'pending'
            });

            AccommodationBooking.update = jest.fn().mockResolvedValue({
                id: 1,
                status: 'confirmed'
            });
        });

        test('should update booking status as admin', async () => {
            await controller.updateBookingStatus(req, res);

            expect(AccommodationBooking.update).toHaveBeenCalledWith('1', { status: 'confirmed' });
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('should update booking status as organizer', async () => {
            req.user.role = 'organizer';

            await controller.updateBookingStatus(req, res);

            expect(AccommodationBooking.update).toHaveBeenCalledWith('1', { status: 'confirmed' });
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('should deny access to regular users', async () => {
            req.user.role = 'user';

            await controller.updateBookingStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(AccommodationBooking.update).not.toHaveBeenCalled();
        });

        test('should validate status value', async () => {
            req.body.status = 'invalid_status';

            await controller.updateBookingStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(AccommodationBooking.update).not.toHaveBeenCalled();
        });

        test('should return 404 if booking not found', async () => {
            AccommodationBooking.findById = jest.fn().mockResolvedValue(null);

            await controller.updateBookingStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        test('should handle errors', async () => {
            AccommodationBooking.update = jest.fn().mockRejectedValue(new Error('Database error'));

            await controller.updateBookingStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('cancelBooking', () => {
        beforeEach(() => {
            req.params = { id: '1' };

            AccommodationBooking.findById = jest.fn().mockResolvedValue({
                id: 1,
                user_id: 1,
                status: 'pending'
            });

            AccommodationBooking.cancel = jest.fn().mockResolvedValue({
                id: 1,
                status: 'cancelled'
            });
        });

        test('should allow user to cancel their own booking', async () => {
            req.user.id = 1; // Same as booking.user_id

            await controller.cancelBooking(req, res);

            expect(AccommodationBooking.cancel).toHaveBeenCalledWith('1');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('should allow admin to cancel any booking', async () => {
            req.user.id = 2; // Different from booking.user_id
            req.user.role = 'admin';

            await controller.cancelBooking(req, res);

            expect(AccommodationBooking.cancel).toHaveBeenCalledWith('1');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('should deny non-owner regular user', async () => {
            req.user.id = 2; // Different from booking.user_id
            req.user.role = 'user';

            await controller.cancelBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(AccommodationBooking.cancel).not.toHaveBeenCalled();
        });

        test('should prevent cancelling checked-in booking', async () => {
            AccommodationBooking.findById = jest.fn().mockResolvedValue({
                id: 1,
                user_id: 1,
                status: 'checked_in'
            });

            await controller.cancelBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(AccommodationBooking.cancel).not.toHaveBeenCalled();
        });

        test('should return 404 if booking not found', async () => {
            AccommodationBooking.findById = jest.fn().mockResolvedValue(null);

            await controller.cancelBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        test('should handle errors', async () => {
            AccommodationBooking.cancel = jest.fn().mockRejectedValue(new Error('Database error'));

            await controller.cancelBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('addPayment', () => {
        beforeEach(() => {
            req.params = { bookingId: '1' };
            req.body = {
                amount: 100,
                payment_date: '2025-04-30',
                payment_method: 'credit_card',
                reference_number: 'REF123',
                notes: 'Partial payment'
            };

            AccommodationBooking.findById = jest.fn().mockResolvedValue({
                id: 1,
                user_id: 1,
                total_price: 500
            });

            AccommodationBooking.addPayment = jest.fn().mockResolvedValue({
                id: 1,
                booking_id: 1,
                amount: 100,
                payment_method: 'credit_card'
            });
        });

        test('should add payment successfully', async () => {
            await controller.addPayment(req, res);

            expect(AccommodationBooking.addPayment).toHaveBeenCalledWith(
                expect.objectContaining({
                    booking_id: 1,
                    amount: 100,
                    payment_method: 'credit_card'
                })
            );
            expect(res.status).toHaveBeenCalledWith(201);
        });

        test('should validate required fields', async () => {
            req.body = { amount: 100 }; // Missing required fields

            await controller.addPayment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(AccommodationBooking.addPayment).not.toHaveBeenCalled();
        });

        test('should return 404 if booking not found', async () => {
            AccommodationBooking.findById = jest.fn().mockResolvedValue(null);

            await controller.addPayment(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        test('should deny access to non-owners who are not admins/organizers', async () => {
            req.user.id = 2; // Different from booking.user_id
            req.user.role = 'user';

            await controller.addPayment(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(AccommodationBooking.addPayment).not.toHaveBeenCalled();
        });

        test('should handle errors', async () => {
            AccommodationBooking.addPayment = jest.fn().mockRejectedValue(new Error('Database error'));

            await controller.addPayment(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getPayments', () => {
        beforeEach(() => {
            req.params = { bookingId: '1' };

            AccommodationBooking.findById = jest.fn().mockResolvedValue({
                id: 1,
                user_id: 1
            });

            AccommodationBooking.getPayments = jest.fn().mockResolvedValue([
                { id: 1, booking_id: 1, amount: 100 },
                { id: 2, booking_id: 1, amount: 200 }
            ]);
        });

        test('should get payments for admin', async () => {
            req.user.role = 'admin';

            await controller.getPayments(req, res);

            expect(AccommodationBooking.getPayments).toHaveBeenCalledWith('1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                payments: expect.any(Array)
            });
        });

        test('should get payments for booking owner', async () => {
            req.user.id = 1; // Same as booking.user_id

            await controller.getPayments(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('should deny access to non-owners', async () => {
            req.user.id = 2; // Different from booking.user_id
            req.user.role = 'user';

            await controller.getPayments(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(AccommodationBooking.getPayments).not.toHaveBeenCalled();
        });

        test('should return 404 if booking not found', async () => {
            AccommodationBooking.findById = jest.fn().mockResolvedValue(null);

            await controller.getPayments(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        test('should handle errors', async () => {
            AccommodationBooking.getPayments = jest.fn().mockRejectedValue(new Error('Database error'));

            await controller.getPayments(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('generateReports', () => {
        beforeEach(() => {
            req.query = {
                startDate: '2025-01-01',
                endDate: '2025-12-31',
                eventId: '1'
            };

            AccommodationBooking.generateReports = jest.fn().mockResolvedValue({
                summary: { total_bookings: 10, total_revenue: 5000 },
                statusBreakdown: [],
                eventBreakdown: [],
                recentBookings: []
            });
        });

        test('should generate reports for admin', async () => {
            req.user.role = 'admin';

            await controller.generateReports(req, res);

            expect(AccommodationBooking.generateReports).toHaveBeenCalledWith(
                expect.objectContaining({
                    startDate: '2025-01-01',
                    endDate: '2025-12-31',
                    eventId: '1'
                })
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('should deny access to non-admin users', async () => {
            req.user.role = 'organizer';

            await controller.generateReports(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(AccommodationBooking.generateReports).not.toHaveBeenCalled();
        });

        test('should handle errors', async () => {
            req.user.role = 'admin';
            AccommodationBooking.generateReports = jest.fn().mockRejectedValue(new Error('Database error'));

            await controller.generateReports(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});