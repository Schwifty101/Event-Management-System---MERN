/**
 * Mock database pool for testing
 */

const mockResults = {};
const mockQueryFn = jest.fn().mockImplementation((query, params) => {
    // Return default empty array for most queries
    return Promise.resolve([[]])
});

const mockPool = {
    execute: mockQueryFn,
    query: mockQueryFn,
    getConnection: jest.fn().mockImplementation(() => {
        return Promise.resolve({
            execute: mockQueryFn,
            query: mockQueryFn,
            release: jest.fn(),
            on: jest.fn()
        });
    }),
    // For testing purposes
    __setMockResults: (key, results) => {
        mockResults[key] = results;
    },
    __getMockQueryFn: () => mockQueryFn
};

export { mockPool as pool, mockQueryFn };
export const testConnection = jest.fn().mockImplementation(() => Promise.resolve(true));