import { jest } from '@jest/globals';
import { EventCategory } from '../../src/models/eventCategoryModel.js';

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

describe('EventCategory Model', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findAll', () => {
        it('should return all categories', async () => {
            // Setup
            const mockCategories = [
                { id: 1, name: 'Technology', description: 'Tech events' },
                { id: 2, name: 'Business', description: 'Business events' },
                { id: 3, name: 'Arts', description: 'Arts and culture' }
            ];

            // Mock the database call
            pool.execute.mockResolvedValue([mockCategories]);

            // Test
            const result = await EventCategory.findAll();

            // Assertions
            expect(pool.execute).toHaveBeenCalledWith(
                'SELECT * FROM event_categories ORDER BY name'
            );
            expect(result).toEqual(mockCategories);
        });

        it('should propagate database errors', async () => {
            // Setup - mock a database error
            const dbError = new Error('Database connection failed');
            pool.execute.mockRejectedValue(dbError);

            // Test & Assertion
            await expect(EventCategory.findAll()).rejects.toThrow(dbError);
        });
    });

    describe('findByName', () => {
        it('should return a category when found', async () => {
            // Setup
            const mockCategory = { id: 1, name: 'Technology', description: 'Tech events' };

            // Mock the database call
            pool.execute.mockResolvedValue([[mockCategory]]);

            // Test
            const result = await EventCategory.findByName('Technology');

            // Assertions
            expect(pool.execute).toHaveBeenCalledWith(
                'SELECT * FROM event_categories WHERE name = ?',
                ['Technology']
            );
            expect(result).toEqual(mockCategory);
        });

        it('should return null when category not found', async () => {
            // Setup - mock empty result
            pool.execute.mockResolvedValue([[]]);

            // Test
            const result = await EventCategory.findByName('NonExistentCategory');

            // Assertions
            expect(pool.execute).toHaveBeenCalledWith(
                'SELECT * FROM event_categories WHERE name = ?',
                ['NonExistentCategory']
            );
            expect(result).toBeNull();
        });

        it('should propagate database errors', async () => {
            // Setup - mock a database error
            const dbError = new Error('Database error');
            pool.execute.mockRejectedValue(dbError);

            // Test & Assertion
            await expect(EventCategory.findByName('Technology')).rejects.toThrow(dbError);
        });
    });
});