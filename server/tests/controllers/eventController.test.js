// filepath: /Users/sobanahmad/Fast-Nuces/Semester 6/DBlab/semesterProject/server/tests/controllers/eventController.test.js
import { jest } from '@jest/globals';

// Mock the Event and EventCategory models
jest.mock('../../src/models/eventModel.js', () => {
    return {
        Event: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            checkOrganizerScheduleConflicts: jest.fn()
        }
    };
});

jest.mock('../../src/models/eventCategoryModel.js', () => {
    return {
        EventCategory: {
            findByName: jest.fn()
        }
    };
});

// Import the controller and mocked models
import * as eventController from '../../src/controllers/eventController.js';
import { Event } from '../../src/models/eventModel.js';
import { EventCategory } from '../../src/models/eventCategoryModel.js';

describe('EventController', () => {
    let mockRequest;
    let mockResponse;
    let mockEvent;
    let mockCategory;

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Setup mock request and response objects
        mockRequest = {
            body: {},
            params: {},
            query: {},
            user: { id: 1, role: 'organizer' }
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        mockEvent = {
            id: 1,
            title: 'Tech Conference',
            description: 'Annual tech conference',
            location: 'Convention Center',
            start_date: '2025-05-01',
            end_date: '2025-05-03',
            organizer_id: 1,
            category: 'Technology'
        };

        mockCategory = {
            name: 'Technology',
            description: 'Tech events and conferences'
        };
    });

    describe('getAllEvents', () => {
        it('should return all events with default pagination', async () => {
            // Setup
            const mockEvents = [mockEvent];
            Event.findAll.mockResolvedValue(mockEvents);

            // Test
            await eventController.getAllEvents(mockRequest, mockResponse);

            // Assertions
            expect(Event.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    page: 1,
                    limit: 10
                })
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ events: mockEvents });
        });

        it('should apply pagination and filters when provided', async () => {
            // Setup
            mockRequest.query = {
                page: '2',
                limit: '5',
                category: 'Technology',
                search: 'tech',
                start_date: '2025-05-01',
                end_date: '2025-05-31'
            };

            const mockEvents = [mockEvent];
            EventCategory.findByName.mockResolvedValue(mockCategory);
            Event.findAll.mockResolvedValue(mockEvents);

            // Test
            await eventController.getAllEvents(mockRequest, mockResponse);

            // Assertions
            expect(EventCategory.findByName).toHaveBeenCalledWith('Technology');
            expect(Event.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    page: 2,
                    limit: 5,
                    category: 'Technology',
                    search: 'tech',
                    start_date: '2025-05-01',
                    end_date: '2025-05-31'
                })
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ events: mockEvents });
        });

        it('should return 400 when invalid category provided', async () => {
            // Setup
            mockRequest.query = { category: 'InvalidCategory' };
            EventCategory.findByName.mockResolvedValue(null);

            // Test
            await eventController.getAllEvents(mockRequest, mockResponse);

            // Assertions
            expect(EventCategory.findByName).toHaveBeenCalledWith('InvalidCategory');
            expect(Event.findAll).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid category' });
        });
    });

    describe('getEventById', () => {
        it('should return event when found', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            Event.findById.mockResolvedValue(mockEvent);

            // Test
            await eventController.getEventById(mockRequest, mockResponse);

            // Assertions
            expect(Event.findById).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ event: mockEvent });
        });

        it('should return 404 when event not found', async () => {
            // Setup
            mockRequest.params = { id: '999' };
            Event.findById.mockResolvedValue(null);

            // Test
            await eventController.getEventById(mockRequest, mockResponse);

            // Assertions
            expect(Event.findById).toHaveBeenCalledWith('999');
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Event not found' });
        });
    });

    describe('createEvent', () => {
        it('should create event successfully', async () => {
            // Setup
            mockRequest.body = {
                title: 'New Conference',
                description: 'A brand new tech conference',
                location: 'Conference Hall',
                start_date: '2025-06-15',
                end_date: '2025-06-17',
                capacity: 500,
                category: 'Technology',
                image_url: 'https://example.com/image.jpg'
            };
            mockRequest.user = { id: 1, role: 'organizer' };

            EventCategory.findByName.mockResolvedValue(mockCategory);
            Event.checkOrganizerScheduleConflicts.mockResolvedValue([]);

            const newEvent = {
                id: 2,
                ...mockRequest.body,
                organizer_id: 1
            };
            Event.create.mockResolvedValue(newEvent);

            // Mock the current date for validation
            const originalDate = global.Date;
            global.Date = class extends Date {
                constructor() {
                    return new originalDate('2025-04-27');
                }
            };

            // Test
            await eventController.createEvent(mockRequest, mockResponse);

            // Restore Date
            global.Date = originalDate;

            // Assertions
            expect(EventCategory.findByName).toHaveBeenCalledWith('Technology');
            expect(Event.checkOrganizerScheduleConflicts).toHaveBeenCalledWith(
                1,
                null,
                '2025-06-15',
                '2025-06-17'
            );
            expect(Event.create).toHaveBeenCalledWith(expect.objectContaining({
                title: 'New Conference',
                organizer_id: 1
            }));
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Event created successfully',
                    event: newEvent
                })
            );
        });

        it('should return 400 when required fields are missing', async () => {
            // Setup
            mockRequest.body = {
                title: 'Incomplete Event'
                // Missing other required fields
            };

            // Test
            await eventController.createEvent(mockRequest, mockResponse);

            // Assertions
            expect(Event.create).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Please provide title, description, location, start_date, and end_date'
            });
        });

        it('should return 400 when dates are invalid', async () => {
            // Setup
            mockRequest.body = {
                title: 'Invalid Date Event',
                description: 'Event with invalid dates',
                location: 'Venue',
                start_date: '2025-06-20',
                end_date: '2025-06-15' // End date before start date
            };

            // Test
            await eventController.createEvent(mockRequest, mockResponse);

            // Assertions
            expect(Event.create).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'End date must be after start date'
            });
        });

        it('should return 409 when scheduling conflict exists', async () => {
            // Setup
            mockRequest.body = {
                title: 'Conflict Event',
                description: 'Event with scheduling conflict',
                location: 'Venue',
                start_date: '2025-06-15',
                end_date: '2025-06-17',
                category: 'Technology'
            };

            const conflicts = [
                {
                    id: 3,
                    title: 'Existing Event',
                    start_date: '2025-06-14',
                    end_date: '2025-06-16'
                }
            ];

            EventCategory.findByName.mockResolvedValue(mockCategory);
            Event.checkOrganizerScheduleConflicts.mockResolvedValue(conflicts);

            // Test
            await eventController.createEvent(mockRequest, mockResponse);

            // Assertions
            expect(Event.create).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(409);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'You have a scheduling conflict with another event you are organizing',
                    conflicts
                })
            );
        });
    });

    describe('updateEvent', () => {
        it('should update event successfully', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            mockRequest.body = {
                title: 'Updated Conference',
                description: 'Updated description'
            };
            mockRequest.user = { id: 1, role: 'organizer' };

            Event.findById.mockResolvedValue({
                ...mockEvent,
                organizer_id: 1
            });

            const updatedEvent = {
                ...mockEvent,
                title: 'Updated Conference',
                description: 'Updated description'
            };

            Event.update.mockResolvedValue(updatedEvent);

            // Test
            await eventController.updateEvent(mockRequest, mockResponse);

            // Assertions
            expect(Event.findById).toHaveBeenCalledWith('1');
            expect(Event.update).toHaveBeenCalledWith('1', expect.objectContaining({
                title: 'Updated Conference',
                description: 'Updated description'
            }));
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Event updated successfully',
                    event: updatedEvent
                })
            );
        });

        it('should allow admin to update any event', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            mockRequest.body = { title: 'Admin Updated' };
            mockRequest.user = { id: 2, role: 'admin' };

            Event.findById.mockResolvedValue({
                ...mockEvent,
                organizer_id: 1 // Different from the requesting user
            });

            const updatedEvent = {
                ...mockEvent,
                title: 'Admin Updated'
            };

            Event.update.mockResolvedValue(updatedEvent);

            // Test
            await eventController.updateEvent(mockRequest, mockResponse);

            // Assertions
            expect(Event.update).toHaveBeenCalledWith('1', expect.objectContaining({
                title: 'Admin Updated'
            }));
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 when event not found', async () => {
            // Setup
            mockRequest.params = { id: '999' };
            mockRequest.body = { title: 'Update Nonexistent' };
            Event.findById.mockResolvedValue(null);

            // Test
            await eventController.updateEvent(mockRequest, mockResponse);

            // Assertions
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Event not found'
            });
        });

        it('should return 403 when user is not authorized', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            mockRequest.body = { title: 'Unauthorized Update' };
            mockRequest.user = { id: 2, role: 'organizer' }; // Different from event organizer

            Event.findById.mockResolvedValue({
                ...mockEvent,
                organizer_id: 1
            });

            // Test
            await eventController.updateEvent(mockRequest, mockResponse);

            // Assertions
            expect(Event.update).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Forbidden: Only the organizer or admin can update this event'
            });
        });
    });

    describe('deleteEvent', () => {
        it('should delete event successfully', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            mockRequest.user = { id: 1, role: 'organizer' };

            Event.findById.mockResolvedValue({
                ...mockEvent,
                organizer_id: 1
            });

            Event.delete.mockResolvedValue(true);

            // Test
            await eventController.deleteEvent(mockRequest, mockResponse);

            // Assertions
            expect(Event.findById).toHaveBeenCalledWith('1');
            expect(Event.delete).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Event deleted successfully'
            });
        });

        it('should return 404 when event not found', async () => {
            // Setup
            mockRequest.params = { id: '999' };
            Event.findById.mockResolvedValue(null);

            // Test
            await eventController.deleteEvent(mockRequest, mockResponse);

            // Assertions
            expect(Event.delete).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Event not found'
            });
        });

        it('should return 403 when user is not authorized', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            mockRequest.user = { id: 2, role: 'organizer' }; // Different from event organizer

            Event.findById.mockResolvedValue({
                ...mockEvent,
                organizer_id: 1
            });

            // Test
            await eventController.deleteEvent(mockRequest, mockResponse);

            // Assertions
            expect(Event.delete).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Forbidden: Only the organizer or admin can delete this event'
            });
        });
    });

    describe('getEventsByCategory', () => {
        it('should return events for valid category', async () => {
            // Setup
            mockRequest.params = { category: 'Technology' };

            const mockEvents = [mockEvent];
            EventCategory.findByName.mockResolvedValue(mockCategory);
            Event.findAll.mockResolvedValue(mockEvents);

            // Test
            await eventController.getEventsByCategory(mockRequest, mockResponse);

            // Assertions
            expect(EventCategory.findByName).toHaveBeenCalledWith('Technology');
            expect(Event.findAll).toHaveBeenCalledWith({ category: 'Technology' });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                category: mockCategory,
                events: mockEvents
            });
        });

        it('should return 404 when category not found', async () => {
            // Setup
            mockRequest.params = { category: 'NonExistent' };
            EventCategory.findByName.mockResolvedValue(null);

            // Test
            await eventController.getEventsByCategory(mockRequest, mockResponse);

            // Assertions
            expect(Event.findAll).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Category not found'
            });
        });
    });
});