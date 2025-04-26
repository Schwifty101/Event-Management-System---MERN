import { EventRound } from '../models/eventRoundModel.js';
import { Event } from '../models/eventModel.js';

/**
 * Get all rounds for an event
 */
export const getAllRounds = async (req, res) => {
    try {
        const { eventId } = req.params;
        
        // Verify event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        const rounds = await EventRound.findByEventId(eventId);
        
        res.status(200).json({ 
            eventId: parseInt(eventId),
            eventTitle: event.title,
            rounds 
        });
    } catch (error) {
        console.error('Error in getAllRounds:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get round by ID
 */
export const getRoundById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const round = await EventRound.findById(id);
        
        if (!round) {
            return res.status(404).json({ message: 'Round not found' });
        }
        
        res.status(200).json({ round });
    } catch (error) {
        console.error('Error in getRoundById:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Create a new round for an event
 */
export const createRound = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { 
            name, type, description, start_time, end_time,
            location, judges_required, max_participants 
        } = req.body;
        
        // Validate input
        if (!name || !type || !start_time || !end_time) {
            return res.status(400).json({ 
                message: 'Please provide name, type, start_time, and end_time' 
            });
        }
        
        // Verify event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        // Check if user has permission to create round
        if (event.organizer_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'You do not have permission to create rounds for this event'
            });
        }
        
        // Validate round type
        const validTypes = ['preliminary', 'semifinal', 'final', 'other'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ 
                message: `Invalid round type. Must be one of: ${validTypes.join(', ')}` 
            });
        }
        
        // Check that start_time is before end_time
        if (new Date(start_time) >= new Date(end_time)) {
            return res.status(400).json({ 
                message: 'Start time must be before end time' 
            });
        }
        
        // Check that round is within event dates
        if (new Date(start_time) < new Date(event.start_date) || 
            new Date(end_time) > new Date(event.end_date)) {
            return res.status(400).json({ 
                message: 'Round must be scheduled within the event dates' 
            });
        }
        
        // Check for scheduling conflicts if location is specified
        if (location) {
            const roundData = { start_time, end_time, event_id: eventId };
            const conflicts = await EventRound.checkSchedulingConflicts(roundData);
            
            if (conflicts.length > 0) {
                return res.status(409).json({ 
                    message: 'Scheduling conflict detected',
                    conflicts 
                });
            }
        }
        
        // Create new round
        const roundData = {
            event_id: eventId,
            name,
            type,
            description: description || null,
            start_time,
            end_time,
            location: location || event.location,  // Default to event location
            judges_required: judges_required || 1,
            max_participants: max_participants || null
        };
        
        const newRound = await EventRound.create(roundData);
        
        res.status(201).json({
            message: 'Round created successfully',
            round: newRound
        });
    } catch (error) {
        console.error('Error in createRound:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Update a round
 */
export const updateRound = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            name, type, description, start_time, end_time,
            location, judges_required, max_participants 
        } = req.body;
        
        // Verify round exists
        const round = await EventRound.findById(id);
        if (!round) {
            return res.status(404).json({ message: 'Round not found' });
        }
        
        // Get event to check permissions
        const event = await Event.findById(round.event_id);
        if (!event) {
            return res.status(404).json({ message: 'Associated event not found' });
        }
        
        // Check if user has permission to update this round
        if (event.organizer_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'You do not have permission to update this round'
            });
        }
        
        const updateData = {};
        
        // Add fields to update
        if (name) updateData.name = name;
        if (type) {
            // Validate round type
            const validTypes = ['preliminary', 'semifinal', 'final', 'other'];
            if (!validTypes.includes(type)) {
                return res.status(400).json({ 
                    message: `Invalid round type. Must be one of: ${validTypes.join(', ')}` 
                });
            }
            updateData.type = type;
        }
        if (description !== undefined) updateData.description = description;
        if (location) updateData.location = location;
        if (judges_required) updateData.judges_required = judges_required;
        if (max_participants) updateData.max_participants = max_participants;
        
        // Handle time updates
        let updatedStartTime = round.start_time;
        let updatedEndTime = round.end_time;
        
        if (start_time) updatedStartTime = new Date(start_time);
        if (end_time) updatedEndTime = new Date(end_time);
        
        // Check that start_time is before end_time
        if (updatedStartTime >= updatedEndTime) {
            return res.status(400).json({ 
                message: 'Start time must be before end time' 
            });
        }
        
        updateData.start_time = updatedStartTime;
        updateData.end_time = updatedEndTime;
        
        // Check that round is within event dates
        if (updatedStartTime < new Date(event.start_date) || 
            updatedEndTime > new Date(event.end_date)) {
            return res.status(400).json({ 
                message: 'Round must be scheduled within the event dates' 
            });
        }
        
        // Check for scheduling conflicts
        const roundData = { 
            start_time: updatedStartTime, 
            end_time: updatedEndTime,
            event_id: round.event_id,
            location: location || round.location
        };
        
        const conflicts = await EventRound.checkSchedulingConflicts(roundData, id);
        
        if (conflicts.length > 0) {
            return res.status(409).json({ 
                message: 'Scheduling conflict detected',
                conflicts 
            });
        }
        
        // Update round
        const updatedRound = await EventRound.update(id, updateData);
        
        res.status(200).json({
            message: 'Round updated successfully',
            round: updatedRound
        });
    } catch (error) {
        console.error('Error in updateRound:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Delete a round
 */
export const deleteRound = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verify round exists
        const round = await EventRound.findById(id);
        if (!round) {
            return res.status(404).json({ message: 'Round not found' });
        }
        
        // Get event to check permissions
        const event = await Event.findById(round.event_id);
        if (!event) {
            return res.status(404).json({ message: 'Associated event not found' });
        }
        
        // Check if user has permission to delete this round
        if (event.organizer_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'You do not have permission to delete this round'
            });
        }
        
        // Delete round
        await EventRound.delete(id);
        
        res.status(200).json({ message: 'Round deleted successfully' });
    } catch (error) {
        console.error('Error in deleteRound:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};