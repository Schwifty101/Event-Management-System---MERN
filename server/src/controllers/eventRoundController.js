import { EventRound } from '../models/eventRoundModel.js';
import { Event } from '../models/eventModel.js';

/**
 * Create a new event round
 */
export const createRound = async (req, res) => {
    try {
        const {
            event_id, name, description, start_time, end_time,
            location, capacity, round_type, status
        } = req.body;

        // Validate required fields
        if (!event_id || !name || !start_time || !end_time) {
            return res.status(400).json({
                message: 'Please provide event_id, name, start_time, and end_time'
            });
        }

        // Check if event exists
        const event = await Event.findById(event_id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if user is authorized to manage this event (organizer or admin)
        if (event.organizer_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Forbidden: Only the event organizer or admin can add rounds'
            });
        }

        // Check if the round time is within event time frame
        const eventStartDate = new Date(event.start_date);
        const eventEndDate = new Date(event.end_date);
        const roundStartTime = new Date(start_time);
        const roundEndTime = new Date(end_time);

        if (roundStartTime < eventStartDate || roundEndTime > eventEndDate) {
            return res.status(400).json({
                message: 'Round time must be within the event time frame'
            });
        }

        // Create round
        const roundData = {
            event_id, name, description, start_time, end_time,
            location, capacity, round_type, status
        };

        try {
            const newRound = await EventRound.create(roundData);

            res.status(201).json({
                message: 'Round created successfully',
                round: newRound
            });
        } catch (error) {
            // Handle time conflict error
            if (error.message.includes('Time conflict')) {
                return res.status(409).json({ message: error.message });
            }
            throw error;
        }
    } catch (error) {
        console.error('Error in createRound:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get all rounds for an event
 */
export const getRoundsByEventId = async (req, res) => {
    try {
        const { eventId } = req.params;

        // Check if event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const rounds = await EventRound.findByEventId(eventId);

        res.status(200).json({ rounds });
    } catch (error) {
        console.error('Error in getRoundsByEventId:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get a specific round by ID
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
 * Update a round
 */
export const updateRound = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, description, start_time, end_time,
            location, capacity, round_type, status
        } = req.body;

        // Check if round exists
        const round = await EventRound.findById(id);
        if (!round) {
            return res.status(404).json({ message: 'Round not found' });
        }

        // Check if user is authorized to manage this round (event organizer or admin)
        const event = await Event.findById(round.event_id);
        if (event.organizer_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Forbidden: Only the event organizer or admin can update rounds'
            });
        }

        // If times are being changed, validate they're within the event timeframe
        if (start_time || end_time) {
            const eventStartDate = new Date(event.start_date);
            const eventEndDate = new Date(event.end_date);
            const roundStartTime = new Date(start_time || round.start_time);
            const roundEndTime = new Date(end_time || round.end_time);

            if (roundStartTime < eventStartDate || roundEndTime > eventEndDate) {
                return res.status(400).json({
                    message: 'Round time must be within the event time frame'
                });
            }
        }

        // Update round
        const roundData = {
            name, description, start_time, end_time,
            location, capacity, round_type, status
        };

        try {
            const updatedRound = await EventRound.update(id, roundData);

            res.status(200).json({
                message: 'Round updated successfully',
                round: updatedRound
            });
        } catch (error) {
            // Handle time conflict error
            if (error.message.includes('Time conflict')) {
                return res.status(409).json({ message: error.message });
            }
            throw error;
        }
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

        // Check if round exists
        const round = await EventRound.findById(id);
        if (!round) {
            return res.status(404).json({ message: 'Round not found' });
        }

        // Check if user is authorized to manage this round (event organizer or admin)
        const event = await Event.findById(round.event_id);
        if (event.organizer_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Forbidden: Only the event organizer or admin can delete rounds'
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

/**
 * Get upcoming rounds with filters
 */
export const getUpcomingRounds = async (req, res) => {
    try {
        const { category, startDate, endDate, limit, offset } = req.query;

        const options = {
            category,
            startDate,
            endDate,
            limit: limit ? parseInt(limit) : 10,
            offset: offset ? parseInt(offset) : 0
        };

        const rounds = await EventRound.getUpcomingRounds(options);

        res.status(200).json({ rounds });
    } catch (error) {
        console.error('Error in getUpcomingRounds:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Register a participant for a round
 */
export const registerParticipant = async (req, res) => {
    try {
        const { roundId } = req.params;
        const userId = req.user.id;

        const result = await EventRound.registerParticipant(roundId, userId);

        if (!result.success) {
            return res.status(400).json({ message: result.message });
        }

        res.status(201).json({ message: result.message });
    } catch (error) {
        console.error('Error in registerParticipant:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Update participant status in a round (for judges and organizers)
 */
export const updateParticipantStatus = async (req, res) => {
    try {
        const { roundId, userId } = req.params;
        const { status, score } = req.body;

        // Check if round exists
        const round = await EventRound.findById(roundId);
        if (!round) {
            return res.status(404).json({ message: 'Round not found' });
        }

        // Check if user is authorized (judge, event organizer or admin)
        const event = await Event.findById(round.event_id);
        if (req.user.role !== 'judge' && event.organizer_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Forbidden: Only judges, event organizers or admins can update participant status'
            });
        }

        // Update participant status
        const success = await EventRound.updateParticipantStatus(roundId, userId, { status, score });

        if (!success) {
            return res.status(404).json({ message: 'Participant not found for this round' });
        }

        res.status(200).json({ message: 'Participant status updated successfully' });
    } catch (error) {
        console.error('Error in updateParticipantStatus:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get participants for a round
 */
export const getRoundParticipants = async (req, res) => {
    try {
        const { roundId } = req.params;

        // Check if round exists
        const round = await EventRound.findById(roundId);
        if (!round) {
            return res.status(404).json({ message: 'Round not found' });
        }

        const participants = await EventRound.getParticipants(roundId);

        res.status(200).json({ participants });
    } catch (error) {
        console.error('Error in getRoundParticipants:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};