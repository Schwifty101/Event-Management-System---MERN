import { jest } from '@jest/globals';
import { Team } from '../../src/models/teamModel.js';

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

describe('Team Model', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findByEventId', () => {
        it('should return teams for a specific event', async () => {
            // Setup
            const mockTeams = [
                { id: 1, name: 'Team A', leader_id: 101, leader_name: 'John Doe', member_count: 3 },
                { id: 2, name: 'Team B', leader_id: 102, leader_name: 'Jane Smith', member_count: 4 }
            ];

            // Mock the database call
            pool.execute.mockResolvedValue([mockTeams]);

            // Test
            const result = await Team.findByEventId(123);

            // Assertions
            expect(pool.execute).toHaveBeenCalledWith(
                expect.stringContaining('SELECT t.*, u.name as leader_name'),
                [123]
            );
            expect(result).toEqual(mockTeams);
        });

        it('should propagate database errors', async () => {
            // Setup - mock a database error
            const dbError = new Error('Database connection failed');
            pool.execute.mockRejectedValue(dbError);

            // Test & Assertion
            await expect(Team.findByEventId(123)).rejects.toThrow(dbError);
        });

        it('should return empty array when no teams found', async () => {
            // Setup - mock empty result
            pool.execute.mockResolvedValue([[]]);

            // Test
            const result = await Team.findByEventId(999);

            // Assertions
            expect(pool.execute).toHaveBeenCalledWith(expect.any(String), [999]);
            expect(result).toEqual([]);
        });
    });
});