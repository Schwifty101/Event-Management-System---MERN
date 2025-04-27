import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cors from 'cors';

// Mock the entire authentication middleware
jest.mock('../../src/middleware/authMiddleware.js', () => {
    return {
        authenticateToken: jest.fn((req, res, next) => {
            // Mock authenticated user for testing
            req.user = {
                id: 1,
                name: 'Test User',
                email: 'test@example.com',
                role: 'admin'
            };
            next();
        })
    };
});

// Mock the models used by the routes
jest.mock('../../src/models/eventCategoryModel.js', () => {
    return {
        EventCategory: {
            findAll: jest.fn().mockResolvedValue([
                { id: 1, name: 'Technology', description: 'Tech events' },
                { id: 2, name: 'Business', description: 'Business events' }
            ]),
            findByName: jest.fn().mockImplementation((name) => {
                if (name === 'Technology') {
                    return Promise.resolve({ id: 1, name: 'Technology', description: 'Tech events' });
                }
                return Promise.resolve(null);
            })
        }
    };
});

jest.mock('../../src/models/eventModel.js', () => {
    return {
        Event: {
            findAll: jest.fn().mockResolvedValue([
                { id: 1, title: 'Tech Conference', description: 'Annual tech conference', category: 'Technology' },
                { id: 2, title: 'Business Summit', description: 'Business leaders summit', category: 'Business' }
            ]),
            findById: jest.fn().mockImplementation((id) => {
                if (id === '1') {
                    return Promise.resolve({ id: 1, title: 'Tech Conference', description: 'Annual tech conference' });
                }
                return Promise.resolve(null);
            })
        }
    };
});

// Import the API routes after mocks are set up
import apiRoutes from '../../src/routes/api.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);

describe('API Routes', () => {
    describe('GET /api/categories', () => {
        it('should return all categories', async () => {
            const response = await request(app).get('/api/categories');

            expect(response.status).toBe(200);
            expect(response.body.categories).toHaveLength(2);
            expect(response.body.categories[0].name).toBe('Technology');
        });
    });

    describe('GET /api/categories/:name', () => {
        it('should return a specific category when it exists', async () => {
            const response = await request(app).get('/api/categories/Technology');

            expect(response.status).toBe(200);
            expect(response.body.category.name).toBe('Technology');
        });

        it('should return 404 when category does not exist', async () => {
            const response = await request(app).get('/api/categories/NonExistent');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Category not found');
        });
    });

    describe('GET /api/events', () => {
        it('should return all events', async () => {
            const response = await request(app).get('/api/events');

            expect(response.status).toBe(200);
            expect(response.body.events).toHaveLength(2);
            expect(response.body.events[0].title).toBe('Tech Conference');
        });
    });

    describe('GET /api/events/:id', () => {
        it('should return a specific event when it exists', async () => {
            const response = await request(app).get('/api/events/1');

            expect(response.status).toBe(200);
            expect(response.body.event.title).toBe('Tech Conference');
        });

        it('should return 404 when event does not exist', async () => {
            const response = await request(app).get('/api/events/999');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Event not found');
        });
    });
});