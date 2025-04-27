import { jest } from '@jest/globals';
import { Accommodation } from '../../src/models/accommodationModel.js';

// Mock the database module
jest.mock('../../src/config/db.js', () => {
    const mockExecute = jest.fn();
    return {
        pool: {
            execute: mockExecute
        }
    };
});

// Import the mocked database module
import { pool } from '../../src/config/db.js';

describe('Accommodation Model', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('delete', () => {
        it('should delete an accommodation successfully', async () => {
            // Setup - mock successful deletion
            pool.execute.mockResolvedValue([{ affectedRows: 1 }]);

            // Test
            const result = await Accommodation.delete(1);

            // Assertions
            expect(pool.execute).toHaveBeenCalledWith(
                'DELETE FROM accommodations WHERE id = ?',
                [1]
            );
            expect(result).toBe(true);
        });

        it('should return false when no rows affected', async () => {
            // Setup - mock no rows affected
            pool.execute.mockResolvedValue([{ affectedRows: 0 }]);

            // Test
            const result = await Accommodation.delete(999);

            // Assertions
            expect(pool.execute).toHaveBeenCalledWith(
                'DELETE FROM accommodations WHERE id = ?',
                [999]
            );
            expect(result).toBe(false);
        });

        it('should propagate database errors', async () => {
            // Setup - mock database error
            const dbError = new Error('Database error');
            pool.execute.mockRejectedValue(dbError);

            // Test & Assertion
            await expect(Accommodation.delete(1)).rejects.toThrow(dbError);
        });
    });

    describe('addRoom', () => {
        it('should add a room successfully', async () => {
            // Setup
            const roomData = {
                accommodation_id: 1,
                room_number: '101',
                room_type: 'Standard',
                capacity: 2,
                is_available: true
            };

            // Mock the database call
            pool.execute.mockResolvedValue([{ insertId: 5 }]);

            // Test
            const result = await Accommodation.addRoom(roomData);

            // Assertions
            expect(pool.execute).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO accommodation_rooms'),
                [1, '101', 'Standard', 2, true]
            );
            expect(result).toEqual({ id: 5, ...roomData });
        });

        it('should use default values when not provided', async () => {
            // Setup - with minimal data
            const minimalRoomData = {
                accommodation_id: 1,
                room_number: '102',
                room_type: 'Deluxe'
            };

            // Mock the database call
            pool.execute.mockResolvedValue([{ insertId: 6 }]);

            // Test
            const result = await Accommodation.addRoom(minimalRoomData);

            // Assertions
            expect(pool.execute).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO accommodation_rooms'),
                [1, '102', 'Deluxe', 1, true]  // Default capacity = 1, is_available = true
            );
            expect(result).toEqual({ id: 6, ...minimalRoomData });
        });

        it('should propagate database errors', async () => {
            // Setup
            const roomData = {
                accommodation_id: 1,
                room_number: '103',
                room_type: 'Suite'
            };

            // Mock database error
            const dbError = new Error('Database error');
            pool.execute.mockRejectedValue(dbError);

            // Test & Assertion
            await expect(Accommodation.addRoom(roomData)).rejects.toThrow(dbError);
        });
    });

    describe('updateRoom', () => {
        it('should update a room with all fields', async () => {
            // Setup
            const roomId = 1;
            const roomData = {
                room_number: '201',
                room_type: 'Premium',
                capacity: 3,
                is_available: false
            };

            // Mock database calls
            pool.execute.mockImplementation((query, params) => {
                // For the UPDATE query
                if (query.startsWith('UPDATE')) {
                    return Promise.resolve([{ affectedRows: 1 }]);
                }
                // For the SELECT query to return updated room
                return Promise.resolve([[{ id: roomId, ...roomData }]]);
            });

            // Test
            const result = await Accommodation.updateRoom(roomId, roomData);

            // Assertions
            expect(pool.execute).toHaveBeenCalledTimes(2);
            expect(result).toEqual({ id: roomId, ...roomData });
        });

        it('should update only specified fields', async () => {
            // Setup
            const roomId = 2;
            const roomData = {
                room_type: 'VIP'
            };

            const expectedUpdatedRoom = {
                id: roomId,
                room_number: '202',
                room_type: 'VIP',
                capacity: 2,
                is_available: true
            };

            // Mock database calls
            pool.execute.mockImplementation((query, params) => {
                // For the UPDATE query
                if (query.startsWith('UPDATE')) {
                    return Promise.resolve([{ affectedRows: 1 }]);
                }
                // For the SELECT query to return updated room
                return Promise.resolve([[expectedUpdatedRoom]]);
            });

            // Test
            const result = await Accommodation.updateRoom(roomId, roomData);

            // Assertions
            expect(pool.execute).toHaveBeenCalledTimes(2);
            expect(result).toEqual(expectedUpdatedRoom);
        });
    });

    describe('deleteRoom', () => {
        it('should delete a room successfully', async () => {
            // Setup
            pool.execute.mockResolvedValue([{ affectedRows: 1 }]);

            // Test
            const result = await Accommodation.deleteRoom(1);

            // Assertions
            expect(pool.execute).toHaveBeenCalledWith(
                'DELETE FROM accommodation_rooms WHERE id = ?',
                [1]
            );
            expect(result).toBe(true);
        });

        it('should return false when room not found', async () => {
            // Setup
            pool.execute.mockResolvedValue([{ affectedRows: 0 }]);

            // Test
            const result = await Accommodation.deleteRoom(999);

            // Assertions
            expect(result).toBe(false);
        });
    });
});