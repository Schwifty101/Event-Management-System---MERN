import { Team } from '../models/teamModel.js';
import { Event } from '../models/eventModel.js';

/**
 * Create a new team for an event
 */
export const createTeam = async (req, res) => {
    try {
        const { name, event_id } = req.body;
        const leader_id = req.user.id;

        // Validate input
        if (!name || !event_id) {
            return res.status(400).json({ message: 'Team name and event ID are required' });
        }

        // Check if event exists and is a team event
        const event = await Event.findById(event_id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (!event.team_event) {
            return res.status(400).json({ message: 'This event does not support team participation' });
        }

        // Create team
        const team = await Team.create({ name, event_id, leader_id });

        res.status(201).json({
            message: 'Team created successfully',
            team
        });
    } catch (error) {
        console.error('Error in createTeam:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get team details by ID
 */
export const getTeamById = async (req, res) => {
    try {
        const { id } = req.params;

        const team = await Team.findById(id);
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Get team members
        const members = await Team.getMembers(id);

        res.status(200).json({
            team,
            members
        });
    } catch (error) {
        console.error('Error in getTeamById:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get teams for an event
 */
export const getTeamsByEventId = async (req, res) => {
    try {
        const { eventId } = req.params;

        // Check if event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const teams = await Team.findByEventId(eventId);

        res.status(200).json({ teams });
    } catch (error) {
        console.error('Error in getTeamsByEventId:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get teams that a user is a member of
 */
export const getUserTeams = async (req, res) => {
    try {
        const userId = req.user.id;

        const teams = await Team.findByUserId(userId);

        res.status(200).json({ teams });
    } catch (error) {
        console.error('Error in getUserTeams:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get teams for events organized by the authenticated user
 */
export const getOrganizerTeams = async (req, res) => {
    try {
        const organizerId = req.user.id;

        // First, get all events where this user is an organizer
        const organizedEvents = await Event.findByOrganizerId(organizerId);

        if (!organizedEvents || organizedEvents.length === 0) {
            return res.status(200).json({ teams: [] });
        }

        // Extract the event IDs
        const eventIds = organizedEvents.map(event => event.id);

        // Get teams for all these events
        const teams = [];
        for (const eventId of eventIds) {
            const eventTeams = await Team.findByEventId(eventId);
            if (eventTeams && eventTeams.length > 0) {
                teams.push(...eventTeams);
            }
        }

        res.status(200).json({ teams });
    } catch (error) {
        console.error('Error in getOrganizerTeams:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Update team information
 */
export const updateTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        // Check if team exists
        const team = await Team.findById(id);
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Check if user is authorized (team leader or admin)
        if (team.leader_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Forbidden: Only the team leader or admin can update the team'
            });
        }

        const updatedTeam = await Team.update(id, { name });

        res.status(200).json({
            message: 'Team updated successfully',
            team: updatedTeam
        });
    } catch (error) {
        console.error('Error in updateTeam:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Add a member to a team
 */
export const addTeamMember = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { userId, status } = req.body;

        // Check if team exists
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Check if user is authorized (team leader or admin)
        if (team.leader_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Forbidden: Only the team leader or admin can add members'
            });
        }

        // Check if the event has maximum team size limit
        const event = await Event.findById(team.event_id);
        if (event.max_team_size && team.member_count >= event.max_team_size) {
            return res.status(400).json({
                message: `Team is already at maximum capacity (${event.max_team_size} members)`
            });
        }

        try {
            const newMember = await Team.addMember(teamId, userId, status || 'invited');

            res.status(201).json({
                message: 'Member added successfully',
                member: newMember
            });
        } catch (error) {
            if (error.message.includes('maximum capacity')) {
                return res.status(400).json({ message: error.message });
            }
            throw error;
        }
    } catch (error) {
        console.error('Error in addTeamMember:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Remove a member from a team
 */
export const removeTeamMember = async (req, res) => {
    try {
        const { teamId, userId } = req.params;

        // Check if team exists
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Check if user is authorized (team leader, the member themselves, or admin)
        const isLeader = team.leader_id === req.user.id;
        const isSelf = parseInt(userId) === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isLeader && !isSelf && !isAdmin) {
            return res.status(403).json({
                message: 'Forbidden: Only the team leader, the member themselves, or an admin can remove members'
            });
        }

        // Special case: leaders removing themselves
        if (isLeader && isSelf) {
            return res.status(400).json({
                message: 'Team leaders cannot remove themselves. Transfer leadership first.'
            });
        }

        try {
            const result = await Team.removeMember(teamId, userId);

            if (!result) {
                return res.status(404).json({ message: 'Member not found in team' });
            }

            res.status(200).json({ message: 'Member removed successfully' });
        } catch (error) {
            if (error.message.includes('Team leader cannot be removed')) {
                return res.status(400).json({ message: error.message });
            }
            throw error;
        }
    } catch (error) {
        console.error('Error in removeTeamMember:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Transfer team leadership to another member
 */
export const transferLeadership = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { newLeaderId } = req.body;

        // Check if team exists
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Check if user is authorized (team leader or admin)
        if (team.leader_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Forbidden: Only the team leader or admin can transfer leadership'
            });
        }

        try {
            await Team.transferLeadership(teamId, newLeaderId);

            res.status(200).json({ message: 'Leadership transferred successfully' });
        } catch (error) {
            if (error.message.includes('must be a member')) {
                return res.status(400).json({ message: error.message });
            }
            throw error;
        }
    } catch (error) {
        console.error('Error in transferLeadership:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Delete a team
 */
export const deleteTeam = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if team exists
        const team = await Team.findById(id);
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Check if user is authorized (team leader or admin)
        if (team.leader_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Forbidden: Only the team leader or admin can delete the team'
            });
        }

        await Team.delete(id);

        res.status(200).json({ message: 'Team deleted successfully' });
    } catch (error) {
        console.error('Error in deleteTeam:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};