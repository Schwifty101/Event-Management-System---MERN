import { jest } from '@jest/globals';
import * as controller from '../../src/controllers/accommodationController.js';
import { Accommodation } from '../../src/models/accommodationModel.js';
import { AccommodationBooking } from '../../src/models/accommodationBookingModel.js';
import { Event } from '../../src/models/eventModel.js';

// Mock the models and dependencies
jest.mock('../../src/models/accommodationModel.js');
jest.mock('../../src/models/accommodationBookingModel.js');
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

describe('Accommodation Controller', () => {
    let req;
    let res;
    let consoleErrorSpy;

    beforeEach(() => {
        // Mock console.error to prevent noisy test output
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

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
                role: 'admin'
            }
        };

        // Mock response object
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    afterEach(() => {
        // Restore console.error after each test
        consoleErrorSpy.mockRestore();
    });

    describe('getAllAccommodations', () => {
        beforeEach(() => {
            req.query = {
                isActive: 'true',
                minPrice: '50',
                maxPrice: '200',
                location: 'City Center'
            };

            Accommodation.findAll = jest.fn().mockResolvedValue([
                { id: 1, name: 'Hotel A', price_per_night: 100, location: 'City Center' },
                { id: 2, name: 'Hotel B', price_per_night: 150, location: 'City Center' }
            ]);
        });

        test('should return all accommodations with filters', async () => {
            await controller.getAllAccommodations(req, res);

            expect(Accommodation.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    isActive: true,
                    minPrice: 50,
                    maxPrice: 200,
                    location: 'City Center'
                })
            );

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                accommodations: expect.any(Array)
            });
        });

        test('should handle server errors', async () => {
            Accommodation.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

            await controller.getAllAccommodations(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Server error'
                })
            );
        });
    });

    describe('getAccommodationById', () => {
        beforeEach(() => {
            req.params = { id: '1' };

            Accommodation.findById = jest.fn().mockResolvedValue({
                id: 1,
                name: 'Hotel A',
                price_per_night: 100,
                rooms: [
                    { id: 1, room_number: '101' },
                    { id: 2, room_number: '102' }
                ]
            });
        });

        test('should return accommodation details', async () => {
            await controller.getAccommodationById(req, res);

            expect(Accommodation.findById).toHaveBeenCalledWith('1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                accommodation: expect.objectContaining({
                    id: 1,
                    rooms: expect.any(Array)
                })
            });
        });

        test('should return 404 if accommodation not found', async () => {
            Accommodation.findById = jest.fn().mockResolvedValue(null);

            await controller.getAccommodationById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Accommodation not found'
            });
        });

        test('should handle server errors', async () => {
            Accommodation.findById = jest.fn().mockRejectedValue(new Error('Database error'));

            await controller.getAccommodationById(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Server error'
                })
            );
        });
    });

    describe('createAccommodation', () => {
        beforeEach(() => {
            req.body = {
                name: 'New Hotel',
                description: 'A luxury hotel',
                location: 'Downtown',
                total_rooms: '50',
                price_per_night: '120.50',
                amenities: 'WiFi, Pool, Spa',
                image_url: 'https://example.com/hotel.jpg',
                is_active: true
            };

            Accommodation.create = jest.fn().mockResolvedValue({
                id: 3,
                ...req.body,
                total_rooms: 50,
                price_per_night: 120.50
            });
        });

        test('should create accommodation successfully', async () => {
            await controller.createAccommodation(req, res);

            expect(Accommodation.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'New Hotel',
                    location: 'Downtown',
                    total_rooms: 50,
                    price_per_night: 120.50
                })
            );

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Accommodation created successfully',
                    accommodation: expect.any(Object)
                })
            );
        });

        test('should return 400 if required fields are missing', async () => {
            req.body = { name: 'New Hotel' }; // Missing required fields

            await controller.createAccommodation(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('Please provide')
                })
            );
            expect(Accommodation.create).not.toHaveBeenCalled();
        });

        test('should handle server errors', async () => {
            Accommodation.create = jest.fn().mockRejectedValue(new Error('Database error'));

            await controller.createAccommodation(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Server error'
                })
            );
        });
    });

    describe('updateAccommodation', () => {
        beforeEach(() => {
            req.params = { id: '1' };
            req.body = {
                name: 'Updated Hotel Name',
                price_per_night: '150.75'
            };

            Accommodation.findById = jest.fn().mockResolvedValue({
                id: 1,
                name: 'Hotel A',
                price_per_night: 100
            });

            Accommodation.update = jest.fn().mockResolvedValue({
                id: 1,
                name: 'Updated Hotel Name',
                price_per_night: 150.75
            });
        });

        test('should update accommodation successfully', async () => {
            await controller.updateAccommodation(req, res);

            expect(Accommodation.update).toHaveBeenCalledWith('1',
                expect.objectContaining({
                    name: 'Updated Hotel Name',
                    price_per_night: 150.75
                })
            );

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Accommodation updated successfully',
                    accommodation: expect.any(Object)
                })
            );
        });

        test('should return 404 if accommodation not found', async () => {
            Accommodation.findById = jest.fn().mockResolvedValue(null);

            await controller.updateAccommodation(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Accommodation not found'
            });
            expect(Accommodation.update).not.toHaveBeenCalled();
        });

        test('should handle server errors', async () => {
            Accommodation.update = jest.fn().mockRejectedValue(new Error('Database error'));

            await controller.updateAccommodation(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Server error'
                })
            );
        });
    });

    describe('deleteAccommodation', () => {
        beforeEach(() => {
            req.params = { id: '1' };

            Accommodation.findById = jest.fn().mockResolvedValue({
                id: 1,
                name: 'Hotel A'
            });

            Accommodation.delete = jest.fn().mockResolvedValue(true);
        });

        test('should delete accommodation successfully', async () => {
            await controller.deleteAccommodation(req, res);

            expect(Accommodation.delete).toHaveBeenCalledWith('1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Accommodation deleted successfully'
            });
        });

        test('should return 404 if accommodation not found', async () => {
            Accommodation.findById = jest.fn().mockResolvedValue(null);

            await controller.deleteAccommodation(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Accommodation not found'
            });
            expect(Accommodation.delete).not.toHaveBeenCalled();
        });

        test('should handle server errors', async () => {
            Accommodation.delete = jest.fn().mockRejectedValue(new Error('Database error'));

            await controller.deleteAccommodation(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Server error'
                })
            );
        });
    });

    describe('addRoom', () => {
        beforeEach(() => {
            req.params = { accommodationId: '1' };
            req.body = {
                room_number: '201',
                room_type: 'Deluxe',
                capacity: '2',
                is_available: true
            };

            Accommodation.findById = jest.fn().mockResolvedValue({
                id: 1,
                name: 'Hotel A'
            });

            Accommodation.addRoom = jest.fn().mockResolvedValue({
                id: 3,
                accommodation_id: 1,
                room_number: '201',
                room_type: 'Deluxe',
                capacity: 2,
                is_available: true
            });
        });

        test('should add room successfully', async () => {
            await controller.addRoom(req, res);

            expect(Accommodation.addRoom).toHaveBeenCalledWith(
                expect.objectContaining({
                    accommodation_id: 1,
                    room_number: '201',
                    room_type: 'Deluxe'
                })
            );

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Room added successfully',
                    room: expect.any(Object)
                })
            );
        });

        test('should return 400 if required fields are missing', async () => {
            req.body = { room_number: '201' }; // Missing room_type

            await controller.addRoom(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('Please provide')
                })
            );
            expect(Accommodation.addRoom).not.toHaveBeenCalled();
        });

        test('should return 404 if accommodation not found', async () => {
            Accommodation.findById = jest.fn().mockResolvedValue(null);

            await controller.addRoom(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Accommodation not found'
            });
            expect(Accommodation.addRoom).not.toHaveBeenCalled();
        });

        test('should handle server errors', async () => {
            Accommodation.addRoom = jest.fn().mockRejectedValue(new Error('Database error'));

            await controller.addRoom(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Server error'
                })
            );
        });
    });

    describe('updateRoom', () => {
        beforeEach(() => {
            req.params = { roomId: '1' };
            req.body = {
                room_type: 'Superior',
                is_available: false
            };

            Accommodation.updateRoom = jest.fn().mockResolvedValue({
                id: 1,
                room_number: '101',
                room_type: 'Superior',
                is_available: false
            });
        });

        test('should update room successfully', async () => {
            await controller.updateRoom(req, res);

            expect(Accommodation.updateRoom).toHaveBeenCalledWith('1',
                expect.objectContaining({
                    room_type: 'Superior',
                    is_available: false
                })
            );

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Room updated successfully',
                    room: expect.any(Object)
                })
            );
        });

        test('should return 404 if room not found', async () => {
            Accommodation.updateRoom = jest.fn().mockResolvedValue(null);

            await controller.updateRoom(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Room not found'
            });
        });

        test('should handle server errors', async () => {
            Accommodation.updateRoom = jest.fn().mockRejectedValue(new Error('Database error'));

            await controller.updateRoom(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Server error'
                })
            );
        });
    });

    describe('deleteRoom', () => {
        beforeEach(() => {
            req.params = { roomId: '1' };
            Accommodation.deleteRoom = jest.fn().mockResolvedValue(true);
        });

        test('should delete room successfully', async () => {
            await controller.deleteRoom(req, res);

            expect(Accommodation.deleteRoom).toHaveBeenCalledWith('1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Room deleted successfully'
            });
        });

        test('should return 404 if room not found', async () => {
            Accommodation.deleteRoom = jest.fn().mockResolvedValue(false);

            await controller.deleteRoom(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Room not found'
            });
        });

        test('should handle server errors', async () => {
            Accommodation.deleteRoom = jest.fn().mockRejectedValue(new Error('Database error'));

            await controller.deleteRoom(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Server error'
                })
            );
        });
    });

    describe('findAvailableRooms', () => {
        beforeEach(() => {
            req.params = { accommodationId: '1' };
            req.query = {
                check_in_date: '2025-05-10',
                check_out_date: '2025-05-15'
            };

            Accommodation.findAvailableRooms = jest.fn().mockResolvedValue([
                { id: 1, room_number: '101', room_type: 'Standard' },
                { id: 2, room_number: '102', room_type: 'Standard' }
            ]);
        });

        test('should return available rooms', async () => {
            await controller.findAvailableRooms(req, res);

            expect(Accommodation.findAvailableRooms).toHaveBeenCalledWith(
                '1',
                '2025-05-10',
                '2025-05-15'
            );

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                rooms: expect.any(Array)
            });
        });

        test('should return 400 if required query params are missing', async () => {
            req.query = { check_in_date: '2025-05-10' }; // Missing check_out_date

            await controller.findAvailableRooms(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('Please provide')
                })
            );
            expect(Accommodation.findAvailableRooms).not.toHaveBeenCalled();
        });

        test('should validate check-in date is not in the past', async () => {
            req.query.check_in_date = '2020-01-01'; // Past date

            await controller.findAvailableRooms(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('past')
                })
            );
            expect(Accommodation.findAvailableRooms).not.toHaveBeenCalled();
        });

        test('should validate check-out date is after check-in date', async () => {
            req.query.check_in_date = '2025-05-15';
            req.query.check_out_date = '2025-05-10'; // Before check-in date

            await controller.findAvailableRooms(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('Check-out date must be after check-in date')
                })
            );
            expect(Accommodation.findAvailableRooms).not.toHaveBeenCalled();
        });

        test('should handle server errors', async () => {
            Accommodation.findAvailableRooms = jest.fn().mockRejectedValue(new Error('Database error'));

            await controller.findAvailableRooms(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Server error'
                })
            );
        });
    });

    describe('getAvailabilitySummary', () => {
        beforeEach(() => {
            req.query = { eventId: '1' };

            Accommodation.getAvailabilitySummary = jest.fn().mockResolvedValue([
                { id: 1, name: 'Hotel A', total_rooms: 50, available_rooms: 20 },
                { id: 2, name: 'Hotel B', total_rooms: 30, available_rooms: 10 }
            ]);
        });

        test('should return availability summary with event filter', async () => {
            await controller.getAvailabilitySummary(req, res);

            expect(Accommodation.getAvailabilitySummary).toHaveBeenCalledWith('1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                summary: expect.any(Array)
            });
        });

        test('should return availability summary without event filter', async () => {
            req.query = {}; // No event ID

            await controller.getAvailabilitySummary(req, res);

            expect(Accommodation.getAvailabilitySummary).toHaveBeenCalledWith(undefined);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('should handle server errors', async () => {
            Accommodation.getAvailabilitySummary = jest.fn().mockRejectedValue(new Error('Database error'));

            await controller.getAvailabilitySummary(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Server error'
                })
            );
        });
    });
});