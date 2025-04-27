import { jest } from '@jest/globals';
import { User } from '../../src/models/userModel.js';

// Mock the database module
jest.mock('../../src/config/db.js', () => {
    return {
        pool: {
            execute: jest.fn()
        }
    };
});

describe('User Model', () => {
    describe('hasRole', () => {
        it('should return true when user has the specified role', async () => {
            // Setup
            const mockUser = { id: 1, name: 'Test User', role: 'admin' };

            // Mock the findById method of the User model
            User.findById = jest.fn().mockResolvedValue(mockUser);

            // Test
            const result = await User.hasRole(1, 'admin');

            // Assertions
            expect(User.findById).toHaveBeenCalledWith(1);
            expect(result).toBe(true);
        });

        it('should return false when user does not have the specified role', async () => {
            // Setup
            const mockUser = { id: 1, name: 'Test User', role: 'organizer' };

            // Mock the findById method
            User.findById = jest.fn().mockResolvedValue(mockUser);

            // Test
            const result = await User.hasRole(1, 'admin');

            // Assertions
            expect(User.findById).toHaveBeenCalledWith(1);
            expect(result).toBe(false);
        });

        it('should handle an array of roles', async () => {
            // Setup
            const mockUser = { id: 1, name: 'Test User', role: 'organizer' };

            // Mock the findById method
            User.findById = jest.fn().mockResolvedValue(mockUser);

            // Test with array containing the user's role
            const result1 = await User.hasRole(1, ['admin', 'organizer', 'judge']);

            // Test with array not containing the user's role
            const result2 = await User.hasRole(1, ['admin', 'judge']);

            // Assertions
            expect(User.findById).toHaveBeenCalledTimes(2);
            expect(result1).toBe(true);
            expect(result2).toBe(false);
        });

        it('should return false if user is not found', async () => {
            // Mock the findById method to return null (user not found)
            User.findById = jest.fn().mockResolvedValue(null);

            // Test
            const result = await User.hasRole(999, 'admin');

            // Assertions
            expect(User.findById).toHaveBeenCalledWith(999);
            expect(result).toBe(false);
        });

        it('should return false on error', async () => {
            // Mock console.error to prevent output during test
            const originalConsoleError = console.error;
            console.error = jest.fn();

            // Mock the findById method to throw an error
            User.findById = jest.fn().mockImplementation(() => {
                throw new Error('Database error');
            });

            // Test
            const result = await User.hasRole(1, 'admin');

            // Assertions
            expect(User.findById).toHaveBeenCalledWith(1);
            expect(result).toBe(false);
            expect(console.error).toHaveBeenCalledWith('Error checking user role:', expect.any(Error));

            // Restore console.error
            console.error = originalConsoleError;
        });
    });
});