import { Event } from '../models/eventModel.js';

/**
 * Get all events with pagination and filtering
 */
export const getAllEvents = async (req, res) => {
    try {
        const { page, limit, category, search, start_date, end_date } = req.query;

        const options = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            category,
            search,
            start_date,
            end_date
        };

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
 * Create a new event
 */
export const createEvent = async (req, res) => {
    try {
        const {
            title, description, location, start_date, end_date,
            capacity, category, image_url
        } = req.body;

        // Validation
        if (!title || !description || !location || !start_date || !end_date) {
            return res.status(400).json({
                message: 'Please provide title, description, location, start_date, and end_date'
            });
        }

        // Set organizer ID from authenticated user
        const organizer_id = req.user.id;

        // Create new event
        const eventData = {
            title,
            description,
            location,
            start_date,
            end_date,
            capacity: capacity || null,
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
 * Update an event
 */
export const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title, description, location, start_date, end_date,
            capacity, category, image_url
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

        // Update event
        const eventData = {
            title,
            description,
            location,
            start_date,
            end_date,
            capacity,
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