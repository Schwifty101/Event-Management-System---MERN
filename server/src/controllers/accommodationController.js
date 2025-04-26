import { Accommodation } from '../models/accommodationModel.js';
import { AccommodationBooking } from '../models/accommodationBookingModel.js';
import { Event } from '../models/eventModel.js';

/**
 * Get all accommodations with filtering
 */
export const getAllAccommodations = async (req, res) => {
    try {
        const { isActive, minPrice, maxPrice, location } = req.query;

        const options = {
            isActive: isActive !== undefined ? isActive === 'true' : undefined,
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
            location
        };

        const accommodations = await Accommodation.findAll(options);
        res.status(200).json({ accommodations });
    } catch (error) {
        console.error('Error in getAllAccommodations:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get accommodation by ID
 */
export const getAccommodationById = async (req, res) => {
    try {
        const { id } = req.params;
        const accommodation = await Accommodation.findById(id);

        if (!accommodation) {
            return res.status(404).json({ message: 'Accommodation not found' });
        }

        res.status(200).json({ accommodation });
    } catch (error) {
        console.error('Error in getAccommodationById:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Create a new accommodation (admin only)
 */
export const createAccommodation = async (req, res) => {
    try {
        const {
            name, description, location, total_rooms,
            price_per_night, amenities, image_url, is_active
        } = req.body;

        // Validate required fields
        if (!name || !location || !total_rooms || !price_per_night) {
            return res.status(400).json({
                message: 'Please provide name, location, total_rooms, and price_per_night'
            });
        }

        // Create accommodation
        const accommodationData = {
            name,
            description,
            location,
            total_rooms: parseInt(total_rooms),
            price_per_night: parseFloat(price_per_night),
            amenities,
            image_url,
            is_active
        };

        const accommodation = await Accommodation.create(accommodationData);

        res.status(201).json({
            message: 'Accommodation created successfully',
            accommodation
        });
    } catch (error) {
        console.error('Error in createAccommodation:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Update accommodation details (admin only)
 */
export const updateAccommodation = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, description, location, total_rooms,
            price_per_night, amenities, image_url, is_active
        } = req.body;

        // Check if accommodation exists
        const accommodation = await Accommodation.findById(id);
        if (!accommodation) {
            return res.status(404).json({ message: 'Accommodation not found' });
        }

        // Prepare data for update
        const accommodationData = {};
        if (name) accommodationData.name = name;
        if (description !== undefined) accommodationData.description = description;
        if (location) accommodationData.location = location;
        if (total_rooms !== undefined) accommodationData.total_rooms = parseInt(total_rooms);
        if (price_per_night !== undefined) accommodationData.price_per_night = parseFloat(price_per_night);
        if (amenities !== undefined) accommodationData.amenities = amenities;
        if (image_url !== undefined) accommodationData.image_url = image_url;
        if (is_active !== undefined) accommodationData.is_active = is_active;

        // Update accommodation
        const updatedAccommodation = await Accommodation.update(id, accommodationData);

        res.status(200).json({
            message: 'Accommodation updated successfully',
            accommodation: updatedAccommodation
        });
    } catch (error) {
        console.error('Error in updateAccommodation:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Delete an accommodation (admin only)
 */
export const deleteAccommodation = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if accommodation exists
        const accommodation = await Accommodation.findById(id);
        if (!accommodation) {
            return res.status(404).json({ message: 'Accommodation not found' });
        }

        // Delete accommodation
        await Accommodation.delete(id);

        res.status(200).json({ message: 'Accommodation deleted successfully' });
    } catch (error) {
        console.error('Error in deleteAccommodation:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Add a room to an accommodation (admin only)
 */
export const addRoom = async (req, res) => {
    try {
        const { accommodationId } = req.params;
        const { room_number, room_type, capacity, is_available } = req.body;

        // Validate required fields
        if (!room_number || !room_type) {
            return res.status(400).json({
                message: 'Please provide room_number and room_type'
            });
        }

        // Check if accommodation exists
        const accommodation = await Accommodation.findById(accommodationId);
        if (!accommodation) {
            return res.status(404).json({ message: 'Accommodation not found' });
        }

        // Create room
        const roomData = {
            accommodation_id: parseInt(accommodationId),
            room_number,
            room_type,
            capacity: capacity ? parseInt(capacity) : 1,
            is_available: is_available !== undefined ? is_available : true
        };

        const room = await Accommodation.addRoom(roomData);

        res.status(201).json({
            message: 'Room added successfully',
            room
        });
    } catch (error) {
        console.error('Error in addRoom:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Update a room (admin only)
 */
export const updateRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { room_number, room_type, capacity, is_available } = req.body;

        // Prepare data for update
        const roomData = {};
        if (room_number) roomData.room_number = room_number;
        if (room_type) roomData.room_type = room_type;
        if (capacity !== undefined) roomData.capacity = parseInt(capacity);
        if (is_available !== undefined) roomData.is_available = is_available;

        // Update room
        const updatedRoom = await Accommodation.updateRoom(roomId, roomData);

        if (!updatedRoom) {
            return res.status(404).json({ message: 'Room not found' });
        }

        res.status(200).json({
            message: 'Room updated successfully',
            room: updatedRoom
        });
    } catch (error) {
        console.error('Error in updateRoom:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Delete a room (admin only)
 */
export const deleteRoom = async (req, res) => {
    try {
        const { roomId } = req.params;

        // Delete room
        const success = await Accommodation.deleteRoom(roomId);

        if (!success) {
            return res.status(404).json({ message: 'Room not found' });
        }

        res.status(200).json({ message: 'Room deleted successfully' });
    } catch (error) {
        console.error('Error in deleteRoom:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Find available rooms for a given date range
 */
export const findAvailableRooms = async (req, res) => {
    try {
        const { accommodationId } = req.params;
        const { check_in_date, check_out_date } = req.query;

        // Validate required fields
        if (!check_in_date || !check_out_date) {
            return res.status(400).json({
                message: 'Please provide check_in_date and check_out_date'
            });
        }

        // Validate date format and logic
        const checkInDate = new Date(check_in_date);
        const checkOutDate = new Date(check_out_date);
        const now = new Date();

        if (isNaN(checkInDate) || isNaN(checkOutDate)) {
            return res.status(400).json({ message: 'Invalid date format' });
        }

        if (checkInDate < now) {
            return res.status(400).json({ message: 'Check-in date cannot be in the past' });
        }

        if (checkOutDate <= checkInDate) {
            return res.status(400).json({ message: 'Check-out date must be after check-in date' });
        }

        // Get available rooms
        const rooms = await Accommodation.findAvailableRooms(
            accommodationId,
            check_in_date,
            check_out_date
        );

        res.status(200).json({ rooms });
    } catch (error) {
        console.error('Error in findAvailableRooms:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get availability summary (works with events)
 */
export const getAvailabilitySummary = async (req, res) => {
    try {
        const { eventId } = req.query;

        const summary = await Accommodation.getAvailabilitySummary(eventId);

        res.status(200).json({ summary });
    } catch (error) {
        console.error('Error in getAvailabilitySummary:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};