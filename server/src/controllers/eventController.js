import { Event } from '../models/eventModel.js';
import { EventCategory } from '../models/eventCategoryModel.js';

/**
 * Get all events with pagination, filtering, and scheduling checks
 */
export const getAllEvents = async (req, res) => {
    try {
        const { page, limit, category, search, start_date, end_date, team_event } = req.query;

        // Validate category if provided
        if (category) {
            const validCategory = await EventCategory.findByName(category);
            if (!validCategory) {
                return res.status(400).json({ message: 'Invalid category' });
            }
        }

        const options = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            category,
            search,
            start_date,
            end_date
        };

        // Add team_event filter if provided
        if (team_event !== undefined) {
            // Convert string "true"/"false" to boolean
            options.team_event = team_event === 'true';
        }

        const events = await Event.findAll(options);

        res.status(200).json({ events });
    } catch (error) {
        console.error('Error in getAllEvents:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get event by ID
 */
export const getEventById = async (req, res) => {
    try {
        const { id } = req.params;

        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json({ event });
    } catch (error) {
        console.error('Error in getEventById:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Create a new event with scheduling conflict check
 */
export const createEvent = async (req, res) => {
    try {
        const {
            title, description, location, start_date, end_date,
            capacity, category, image_url, rules,
            team_event, min_team_size, max_team_size,
            registration_fee, max_participants
        } = req.body;

        // Validation
        if (!title || !description || !location || !start_date || !end_date) {
            return res.status(400).json({
                message: 'Please provide title, description, location, start_date, and end_date'
            });
        }

        // Validate date format and logic
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        const now = new Date();

        if (isNaN(startDate) || isNaN(endDate)) {
            return res.status(400).json({ message: 'Invalid date format' });
        }

        if (startDate < now) {
            return res.status(400).json({ message: 'Start date cannot be in the past' });
        }

        if (endDate <= startDate) {
            return res.status(400).json({ message: 'End date must be after start date' });
        }

        // Validate category
        if (category) {
            const validCategory = await EventCategory.findByName(category);
            if (!validCategory) {
                return res.status(400).json({ message: 'Invalid category' });
            }
        }

        // Set organizer ID from authenticated user
        const organizer_id = req.user.id;

        // Check for scheduling conflicts for the organizer
        const conflicts = await Event.checkOrganizerScheduleConflicts(
            organizer_id,
            null, // No event ID for new event
            start_date,
            end_date
        );

        if (conflicts.length > 0) {
            return res.status(409).json({
                message: 'You have a scheduling conflict with another event you are organizing',
                conflicts
            });
        }

        // Create new event
        const eventData = {
            title,
            description,
            rules,
            location,
            start_date,
            end_date,
            capacity: capacity || null,
            max_participants: max_participants || null,
            registration_fee: registration_fee || 0,
            team_event: team_event || false,
            min_team_size: min_team_size || 1,
            max_team_size: max_team_size || 1,
            organizer_id,
            category: category || 'Other',
            image_url: image_url || null
        };

        const newEvent = await Event.create(eventData);

        res.status(201).json({
            message: 'Event created successfully',
            event: newEvent
        });
    } catch (error) {
        console.error('Error in createEvent:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Update an event with scheduling conflict check
 */
export const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title, description, location, start_date, end_date,
            capacity, category, image_url, rules,
            team_event, min_team_size, max_team_size,
            registration_fee, max_participants
        } = req.body;

        // Verify event exists
        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if user is the organizer or an admin
        if (event.organizer_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Only the organizer or admin can update this event' });
        }

        // Validate date format and logic if dates are being updated
        let startDate, endDate;
        if (start_date || end_date) {
            startDate = new Date(start_date || event.start_date);
            endDate = new Date(end_date || event.end_date);

            if (isNaN(startDate) || isNaN(endDate)) {
                return res.status(400).json({ message: 'Invalid date format' });
            }

            if (endDate <= startDate) {
                return res.status(400).json({ message: 'End date must be after start date' });
            }

            // Check for scheduling conflicts for the organizer
            const conflicts = await Event.checkOrganizerScheduleConflicts(
                event.organizer_id,
                parseInt(id),
                startDate,
                endDate
            );

            if (conflicts.length > 0) {
                return res.status(409).json({
                    message: 'This update creates a scheduling conflict with another event you are organizing',
                    conflicts
                });
            }
        }

        // Validate category if being updated
        if (category && category !== event.category) {
            const validCategory = await EventCategory.findByName(category);
            if (!validCategory) {
                return res.status(400).json({ message: 'Invalid category' });
            }
        }

        // Update event
        const eventData = {
            title,
            description,
            rules,
            location,
            start_date,
            end_date,
            capacity,
            max_participants,
            registration_fee,
            team_event,
            min_team_size,
            max_team_size,
            category,
            image_url
        };

        const updatedEvent = await Event.update(id, eventData);

        res.status(200).json({
            message: 'Event updated successfully',
            event: updatedEvent
        });
    } catch (error) {
        console.error('Error in updateEvent:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Delete an event
 */
export const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;

        // Verify event exists
        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if user is the organizer or an admin
        if (event.organizer_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Only the organizer or admin can delete this event' });
        }

        // Delete event
        const success = await Event.delete(id);

        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error in deleteEvent:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get events by category
 */
export const getEventsByCategory = async (req, res) => {
    try {
        const { category } = req.params;

        // Validate category
        const validCategory = await EventCategory.findByName(category);
        if (!validCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const events = await Event.findAll({ category });

        res.status(200).json({
            category: validCategory,
            events
        });
    } catch (error) {
        console.error('Error in getEventsByCategory:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};