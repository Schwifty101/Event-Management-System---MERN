import { jest } from '@jest/globals';

// Mock the EventCategory model
jest.mock('../../src/models/eventCategoryModel.js', () => {
    return {
        EventCategory: {
            findAll: jest.fn(),
            findByName: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            getEventCountByCategory: jest.fn()
        }
    };
});

// Import the controller and mocked models
import * as eventCategoryController from '../../src/controllers/eventCategoryController.js';
import { EventCategory } from '../../src/models/eventCategoryModel.js';

describe('EventCategoryController', () => {
    let mockRequest;
    let mockResponse;
    let mockCategory;

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

        mockCategory = {
            id: 1,
            name: 'Technology',
            description: 'Tech events and conferences'
        };
    });

    describe('getAllCategories', () => {
        it('should return all categories', async () => {
            // Setup
            const mockCategories = [mockCategory, { id: 2, name: 'Business', description: 'Business events' }];
            EventCategory.findAll.mockResolvedValue(mockCategories);

            // Test
            await eventCategoryController.getAllCategories(mockRequest, mockResponse);

            // Assertions
            expect(EventCategory.findAll).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ categories: mockCategories });
        });

        it('should handle errors', async () => {
            // Setup
            const error = new Error('Database error');
            EventCategory.findAll.mockRejectedValue(error);

            // Test
            await eventCategoryController.getAllCategories(mockRequest, mockResponse);

            // Assertions
            expect(EventCategory.findAll).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Server error',
                error: error.message
            });
        });
    });

    describe('getCategoryByName', () => {
        it('should return category when found', async () => {
            // Setup
            mockRequest.params = { name: 'Technology' };
            EventCategory.findByName.mockResolvedValue(mockCategory);

            // Test
            await eventCategoryController.getCategoryByName(mockRequest, mockResponse);

            // Assertions
            expect(EventCategory.findByName).toHaveBeenCalledWith('Technology');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ category: mockCategory });
        });

        it('should return 404 when category not found', async () => {
            // Setup
            mockRequest.params = { name: 'NonExistent' };
            EventCategory.findByName.mockResolvedValue(null);

            // Test
            await eventCategoryController.getCategoryByName(mockRequest, mockResponse);

            // Assertions
            expect(EventCategory.findByName).toHaveBeenCalledWith('NonExistent');
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Category not found' });
        });
    });

    describe('createCategory', () => {
        it('should create category successfully', async () => {
            // Setup
            mockRequest.body = {
                name: 'Arts',
                description: 'Art events and exhibitions'
            };

            const newCategory = {
                id: 3,
                name: 'Arts',
                description: 'Art events and exhibitions'
            };

            EventCategory.findByName.mockResolvedValue(null); // Category doesn't exist
            EventCategory.create.mockResolvedValue(newCategory);

            // Test
            await eventCategoryController.createCategory(mockRequest, mockResponse);

            // Assertions
            expect(EventCategory.findByName).toHaveBeenCalledWith('Arts');
            expect(EventCategory.create).toHaveBeenCalledWith({
                name: 'Arts',
                description: 'Art events and exhibitions'
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Category created successfully',
                category: newCategory
            });
        });

        it('should return 400 when name is missing', async () => {
            // Setup
            mockRequest.body = {
                description: 'Incomplete category'
            };

            // Test
            await eventCategoryController.createCategory(mockRequest, mockResponse);

            // Assertions
            expect(EventCategory.create).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Category name is required'
            });
        });

        it('should return 409 when category already exists', async () => {
            // Setup
            mockRequest.body = {
                name: 'Technology',
                description: 'Duplicate category'
            };

            EventCategory.findByName.mockResolvedValue(mockCategory);

            // Test
            await eventCategoryController.createCategory(mockRequest, mockResponse);

            // Assertions
            expect(EventCategory.create).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(409);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Category with this name already exists'
            });
        });
    });

    describe('updateCategory', () => {
        it('should update category successfully', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            mockRequest.body = {
                name: 'Updated Technology',
                description: 'Updated description'
            };

            EventCategory.findById.mockResolvedValue(mockCategory);
            EventCategory.findByName.mockResolvedValue(null); // No duplicate name

            const updatedCategory = {
                id: 1,
                name: 'Updated Technology',
                description: 'Updated description'
            };
            EventCategory.update.mockResolvedValue(updatedCategory);

            // Test
            await eventCategoryController.updateCategory(mockRequest, mockResponse);

            // Assertions
            expect(EventCategory.findById).toHaveBeenCalledWith('1');
            expect(EventCategory.findByName).toHaveBeenCalledWith('Updated Technology');
            expect(EventCategory.update).toHaveBeenCalledWith('1', {
                name: 'Updated Technology',
                description: 'Updated description'
            });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Category updated successfully',
                category: updatedCategory
            });
        });

        it('should return 404 when category not found', async () => {
            // Setup
            mockRequest.params = { id: '999' };
            mockRequest.body = { name: 'Update Nonexistent' };

            EventCategory.findById.mockResolvedValue(null);

            // Test
            await eventCategoryController.updateCategory(mockRequest, mockResponse);

            // Assertions
            expect(EventCategory.update).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Category not found'
            });
        });

        it('should return 409 when name already exists', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            mockRequest.body = {
                name: 'Business'
            };

            const existingCategory = {
                id: 2,
                name: 'Business',
                description: 'Business events'
            };

            EventCategory.findById.mockResolvedValue(mockCategory);
            EventCategory.findByName.mockResolvedValue(existingCategory);

            // Test
            await eventCategoryController.updateCategory(mockRequest, mockResponse);

            // Assertions
            expect(EventCategory.update).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(409);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Category with this name already exists'
            });
        });
    });

    describe('getEventCountByCategory', () => {
        it('should return event counts by category', async () => {
            // Setup
            const mockCategoryCounts = [
                { name: 'Technology', event_count: 10 },
                { name: 'Business', event_count: 5 }
            ];

            EventCategory.getEventCountByCategory.mockResolvedValue(mockCategoryCounts);

            // Test
            await eventCategoryController.getEventCountByCategory(mockRequest, mockResponse);

            // Assertions
            expect(EventCategory.getEventCountByCategory).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                categories: mockCategoryCounts
            });
        });

        it('should handle errors', async () => {
            // Setup
            const error = new Error('Database error');
            EventCategory.getEventCountByCategory.mockRejectedValue(error);

            // Test
            await eventCategoryController.getEventCountByCategory(mockRequest, mockResponse);

            // Assertions
            expect(EventCategory.getEventCountByCategory).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Server error',
                error: error.message
            });
        });
    });
});