// filepath: /Users/sobanahmad/Fast-Nuces/Semester 6/DBlab/semesterProject/server/tests/controllers/accommodationController.test.js
import { jest } from '@jest/globals';

// Mock the Accommodation and AccommodationBooking models
jest.mock('../../src/models/accommodationModel.js', () => {
    return {
        Accommodation: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            addRoom: jest.fn(),
            updateRoom: jest.fn(),
            deleteRoom: jest.fn(),
            findAvailableRooms: jest.fn(),
            getAvailabilitySummary: jest.fn()
        }
    };
});

jest.mock('../../src/models/accommodationBookingModel.js', () => {
    return {
        AccommodationBooking: {
            findAll: jest.fn(),
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

// Import the controller and mocked models
import * as accommodationController from '../../src/controllers/accommodationController.js';
import { Accommodation } from '../../src/models/accommodationModel.js';
import { AccommodationBooking } from '../../src/models/accommodationBookingModel.js';
import { Event } from '../../src/models/eventModel.js';

describe('AccommodationController', () => {
    let mockRequest;
    let mockResponse;
    let mockAccommodation;
    let mockRoom;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Setup mock request and response objects
        mockRequest = {
            body: {},
            params: {},
            query: {},
            user: { id: 1, role: 'admin' }
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        mockAccommodation = {
            id: 1,
            name: 'Grand Hotel',
            description: 'Luxury hotel near the venue',
            location: 'Downtown',
            total_rooms: 50,
            price_per_night: 150.00,
            amenities: ['WiFi', 'Pool', 'Breakfast'],
            image_url: 'http://example.com/hotel.jpg',
            is_active: true
        };

        mockRoom = {
            id: 1,
            accommodation_id: 1,
            room_number: '101',
            room_type: 'Deluxe',
            capacity: 2,
            is_available: true
        };
    });

    describe('getAllAccommodations', () => {
        it('should return all accommodations with no filters', async () => {
            // Setup
            const mockAccommodations = [mockAccommodation];
            Accommodation.findAll.mockResolvedValue(mockAccommodations);

            // Test
            await accommodationController.getAllAccommodations(mockRequest, mockResponse);

            // Assertions
            expect(Accommodation.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    isActive: undefined,
                    minPrice: undefined,
                    maxPrice: undefined,
                    location: undefined
                })
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ accommodations: mockAccommodations });
        });

        it('should apply filters when provided', async () => {
            // Setup
            mockRequest.query = {
                isActive: 'true',
                minPrice: '100',
                maxPrice: '200',
                location: 'Downtown'
            };

            const mockAccommodations = [mockAccommodation];
            Accommodation.findAll.mockResolvedValue(mockAccommodations);

            // Test
            await accommodationController.getAllAccommodations(mockRequest, mockResponse);

            // Assertions
            expect(Accommodation.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    isActive: true,
                    minPrice: 100,
                    maxPrice: 200,
                    location: 'Downtown'
                })
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ accommodations: mockAccommodations });
        });

        it('should handle errors', async () => {
            // Setup
            const error = new Error('Database error');
            Accommodation.findAll.mockRejectedValue(error);

            // Test
            await accommodationController.getAllAccommodations(mockRequest, mockResponse);

            // Assertions
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Server error',
                error: error.message
            });
        });
    });

    describe('getAccommodationById', () => {
        it('should return accommodation when found', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            Accommodation.findById.mockResolvedValue(mockAccommodation);

            // Test
            await accommodationController.getAccommodationById(mockRequest, mockResponse);

            // Assertions
            expect(Accommodation.findById).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ accommodation: mockAccommodation });
        });

        it('should return 404 when accommodation not found', async () => {
            // Setup
            mockRequest.params = { id: '999' };
            Accommodation.findById.mockResolvedValue(null);

            // Test
            await accommodationController.getAccommodationById(mockRequest, mockResponse);

            // Assertions
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Accommodation not found' });
        });
    });

    describe('createAccommodation', () => {
        it('should create accommodation successfully', async () => {
            // Setup
            mockRequest.body = {
                name: 'New Hotel',
                description: 'Brand new luxury hotel',
                location: 'City Center',
                total_rooms: 100,
                price_per_night: 200.00,
                amenities: ['WiFi', 'Gym', 'Restaurant'],
                image_url: 'http://example.com/new-hotel.jpg',
                is_active: true
            };

            Accommodation.create.mockResolvedValue({
                id: 2,
                ...mockRequest.body
            });

            // Test
            await accommodationController.createAccommodation(mockRequest, mockResponse);

            // Assertions
            expect(Accommodation.create).toHaveBeenCalledWith(expect.objectContaining({
                name: 'New Hotel',
                description: 'Brand new luxury hotel',
                total_rooms: 100,
                price_per_night: 200.00
            }));
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Accommodation created successfully'
                })
            );
        });

        it('should return 400 when required fields are missing', async () => {
            // Setup
            mockRequest.body = {
                name: 'Incomplete Hotel'
                // Missing other required fields
            };

            // Test
            await accommodationController.createAccommodation(mockRequest, mockResponse);

            // Assertions
            expect(Accommodation.create).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Please provide name, location, total_rooms, and price_per_night'
            });
        });
    });

    describe('updateAccommodation', () => {
        it('should update accommodation successfully', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            mockRequest.body = {
                name: 'Updated Hotel',
                description: 'Updated description',
                price_per_night: 175.00
            };

            Accommodation.findById.mockResolvedValue(mockAccommodation);

            const updatedAccommodation = {
                ...mockAccommodation,
                name: 'Updated Hotel',
                description: 'Updated description',
                price_per_night: 175.00
            };

            Accommodation.update.mockResolvedValue(updatedAccommodation);

            // Test
            await accommodationController.updateAccommodation(mockRequest, mockResponse);

            // Assertions
            expect(Accommodation.findById).toHaveBeenCalledWith('1');
            expect(Accommodation.update).toHaveBeenCalledWith('1', expect.objectContaining({
                name: 'Updated Hotel',
                description: 'Updated description',
                price_per_night: 175.00
            }));
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Accommodation updated successfully',
                    accommodation: updatedAccommodation
                })
            );
        });

        it('should return 404 when accommodation not found', async () => {
            // Setup
            mockRequest.params = { id: '999' };
            mockRequest.body = { name: 'Update Nonexistent' };

            Accommodation.findById.mockResolvedValue(null);

            // Test
            await accommodationController.updateAccommodation(mockRequest, mockResponse);

            // Assertions
            expect(Accommodation.update).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Accommodation not found'
            });
        });
    });

    describe('deleteAccommodation', () => {
        it('should delete accommodation successfully', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            Accommodation.findById.mockResolvedValue(mockAccommodation);
            Accommodation.delete.mockResolvedValue(true);

            // Test
            await accommodationController.deleteAccommodation(mockRequest, mockResponse);

            // Assertions
            expect(Accommodation.findById).toHaveBeenCalledWith('1');
            expect(Accommodation.delete).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Accommodation deleted successfully'
            });
        });

        it('should return 404 when accommodation not found', async () => {
            // Setup
            mockRequest.params = { id: '999' };
            Accommodation.findById.mockResolvedValue(null);

            // Test
            await accommodationController.deleteAccommodation(mockRequest, mockResponse);

            // Assertions
            expect(Accommodation.delete).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Accommodation not found'
            });
        });
    });

    describe('addRoom', () => {
        it('should add room successfully', async () => {
            // Setup
            mockRequest.params = { accommodationId: '1' };
            mockRequest.body = {
                room_number: '201',
                room_type: 'Suite',
                capacity: 4,
                is_available: true
            };

            Accommodation.findById.mockResolvedValue(mockAccommodation);
            Accommodation.addRoom.mockResolvedValue({
                id: 2,
                accommodation_id: 1,
                ...mockRequest.body
            });

            // Test
            await accommodationController.addRoom(mockRequest, mockResponse);

            // Assertions
            expect(Accommodation.findById).toHaveBeenCalledWith('1');
            expect(Accommodation.addRoom).toHaveBeenCalledWith(expect.objectContaining({
                accommodation_id: 1,
                room_number: '201',
                room_type: 'Suite',
                capacity: 4,
                is_available: true
            }));
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Room added successfully'
                })
            );
        });

        it('should return 400 when required fields are missing', async () => {
            // Setup
            mockRequest.params = { accommodationId: '1' };
            mockRequest.body = {
                // Missing room_number and room_type
                capacity: 2
            };

            // Test
            await accommodationController.addRoom(mockRequest, mockResponse);

            // Assertions
            expect(Accommodation.addRoom).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Please provide room_number and room_type'
            });
        });

        it('should return 404 when accommodation not found', async () => {
            // Setup
            mockRequest.params = { accommodationId: '999' };
            mockRequest.body = {
                room_number: '201',
                room_type: 'Suite'
            };

            Accommodation.findById.mockResolvedValue(null);

            // Test
            await accommodationController.addRoom(mockRequest, mockResponse);

            // Assertions
            expect(Accommodation.addRoom).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Accommodation not found'
            });
        });
    });

    describe('updateRoom', () => {
        it('should update room successfully', async () => {
            // Setup
            mockRequest.params = { roomId: '1' };
            mockRequest.body = {
                room_number: '101-A',
                room_type: 'Deluxe Plus',
                capacity: 3,
                is_available: false
            };

            const updatedRoom = {
                ...mockRoom,
                room_number: '101-A',
                room_type: 'Deluxe Plus',
                capacity: 3,
                is_available: false
            };

            Accommodation.updateRoom.mockResolvedValue(updatedRoom);

            // Test
            await accommodationController.updateRoom(mockRequest, mockResponse);

            // Assertions
            expect(Accommodation.updateRoom).toHaveBeenCalledWith('1', expect.objectContaining({
                room_number: '101-A',
                room_type: 'Deluxe Plus',
                capacity: 3,
                is_available: false
            }));
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Room updated successfully',
                    room: updatedRoom
                })
            );
        });

        it('should return 404 when room not found', async () => {
            // Setup
            mockRequest.params = { roomId: '999' };
            mockRequest.body = { room_type: 'Update Nonexistent' };

            Accommodation.updateRoom.mockResolvedValue(null);

            // Test
            await accommodationController.updateRoom(mockRequest, mockResponse);

            // Assertions
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Room not found'
            });
        });
    });

    describe('deleteRoom', () => {
        it('should delete room successfully', async () => {
            // Setup
            mockRequest.params = { roomId: '1' };
            Accommodation.deleteRoom.mockResolvedValue(true);

            // Test
            await accommodationController.deleteRoom(mockRequest, mockResponse);

            // Assertions
            expect(Accommodation.deleteRoom).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Room deleted successfully'
            });
        });

        it('should return 404 when room not found', async () => {
            // Setup
            mockRequest.params = { roomId: '999' };
            Accommodation.deleteRoom.mockResolvedValue(false);

            // Test
            await accommodationController.deleteRoom(mockRequest, mockResponse);

            // Assertions
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Room not found'
            });
        });
    });

    describe('findAvailableRooms', () => {
        it('should find available rooms for valid dates', async () => {
            // Setup
            mockRequest.params = { accommodationId: '1' };
            mockRequest.query = {
                check_in_date: '2025-05-15',
                check_out_date: '2025-05-20'
            };

            const availableRooms = [mockRoom];
            Accommodation.findAvailableRooms.mockResolvedValue(availableRooms);

            // Mock the current date for validation
            const originalDate = global.Date;
            global.Date = class extends Date {
                constructor() {
                    return new originalDate('2025-04-27');
                }
            };

            // Test
            await accommodationController.findAvailableRooms(mockRequest, mockResponse);

            // Restore Date
            global.Date = originalDate;

            // Assertions
            expect(Accommodation.findAvailableRooms).toHaveBeenCalledWith(
                '1',
                '2025-05-15',
                '2025-05-20'
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ rooms: availableRooms });
        });

        it('should return 400 when date fields are missing', async () => {
            // Setup
            mockRequest.params = { accommodationId: '1' };
            mockRequest.query = {
                check_in_date: '2025-05-15'
                // Missing check_out_date
            };

            // Test
            await accommodationController.findAvailableRooms(mockRequest, mockResponse);

            // Assertions
            expect(Accommodation.findAvailableRooms).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Please provide check_in_date and check_out_date'
            });
        });

        it('should return 400 for invalid date format', async () => {
            // Setup
            mockRequest.params = { accommodationId: '1' };
            mockRequest.query = {
                check_in_date: 'invalid-date',
                check_out_date: '2025-05-20'
            };

            // Test
            await accommodationController.findAvailableRooms(mockRequest, mockResponse);

            // Assertions
            expect(Accommodation.findAvailableRooms).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Invalid date format'
            });
        });

        it('should return 400 when check-out date is before check-in date', async () => {
            // Setup
            mockRequest.params = { accommodationId: '1' };
            mockRequest.query = {
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
            await accommodationController.findAvailableRooms(mockRequest, mockResponse);

            // Restore Date
            global.Date = originalDate;

            // Assertions
            expect(Accommodation.findAvailableRooms).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Check-out date must be after check-in date'
            });
        });
    });

    describe('getAvailabilitySummary', () => {
        it('should return availability summary', async () => {
            // Setup
            mockRequest.query = { eventId: '1' };

            const mockSummary = {
                total_rooms: 50,
                available_rooms: 30,
                occupancy_rate: 40,
                event_specific: {
                    event_id: 1,
                    event_name: 'Tech Conference',
                    bookings: 20
                }
            };

            Accommodation.getAvailabilitySummary.mockResolvedValue(mockSummary);

            // Test
            await accommodationController.getAvailabilitySummary(mockRequest, mockResponse);

            // Assertions
            expect(Accommodation.getAvailabilitySummary).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ summary: mockSummary });
        });

        it('should handle errors', async () => {
            // Setup
            mockRequest.query = { eventId: '1' };
            const error = new Error('Database error');
            Accommodation.getAvailabilitySummary.mockRejectedValue(error);

            // Test
            await accommodationController.getAvailabilitySummary(mockRequest, mockResponse);

            // Assertions
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Server error',
                error: error.message
            });
        });
    });
});