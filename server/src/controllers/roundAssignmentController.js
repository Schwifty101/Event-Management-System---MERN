import { RoundAssignment } from '../models/roundAssignmentModel.js';
import { EventRound } from '../models/eventRoundModel.js';
import { User } from '../models/userModel.js';
import { Event } from '../models/eventModel.js';
import { pool } from '../config/db.js';

/**
 * Get all assignments for a round
 */
export const getAllAssignments = async (req, res) => {
    try {
        const { roundId } = req.params;
        const { role } = req.query;
        
        // Verify round exists
        const round = await EventRound.findById(roundId);
        if (!round) {
            return res.status(404).json({ message: 'Round not found' });
        }
        
        // Get event to check permissions
        const event = await Event.findById(round.event_id);
        
        // Check if user has permission to view assignments
        // Only organizer, admins, and judges assigned to this round can view
        const isOrganizer = event.organizer_id === req.user.id;
        const isAdmin = req.user.role === 'admin';
        const isAssignedJudge = req.user.role === 'judge' && await isUserAssignedToRound(req.user.id, roundId, 'judge');
        
        if (!isOrganizer && !isAdmin && !isAssignedJudge) {
            return res.status(403).json({ 
                message: 'You do not have permission to view assignments for this round'
            });
        }
        
        // Get assignments
        const assignments = await RoundAssignment.findByRoundId(roundId, role);
        
        res.status(200).json({ 
            roundId: parseInt(roundId),
            roundName: round.name,
            role: role || 'all',
            assignments 
        });
    } catch (error) {
        console.error('Error in getAllAssignments:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get assignment by ID
 */
export const getAssignmentById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const assignment = await RoundAssignment.findById(id);
        
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        
        // Get event to check permissions
        const round = await EventRound.findById(assignment.round_id);
        const event = await Event.findById(round.event_id);
        
        // Check if user has permission to view this assignment
        const isOrganizer = event.organizer_id === req.user.id;
        const isAdmin = req.user.role === 'admin';
        const isAssignedUser = req.user.id === assignment.user_id;
        const isAssignedJudge = req.user.role === 'judge' && 
                                await isUserAssignedToRound(req.user.id, assignment.round_id, 'judge');
        
        if (!isOrganizer && !isAdmin && !isAssignedUser && !isAssignedJudge) {
            return res.status(403).json({ 
                message: 'You do not have permission to view this assignment'
            });
        }
        
        res.status(200).json({ assignment });
    } catch (error) {
        console.error('Error in getAssignmentById:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Create a new assignment for a round
 */
export const createAssignment = async (req, res) => {
    try {
        const { roundId } = req.params;
        const { user_id, role, status } = req.body;
        
        // Validate input
        if (!user_id || !role) {
            return res.status(400).json({ 
                message: 'Please provide user_id and role' 
            });
        }
        
        // Verify round exists
        const round = await EventRound.findById(roundId);
        if (!round) {
            return res.status(404).json({ message: 'Round not found' });
        }
        
        // Get event to check permissions
        const event = await Event.findById(round.event_id);
        if (!event) {
            return res.status(404).json({ message: 'Associated event not found' });
        }
        
        // Check if user has permission to create assignment
        if (event.organizer_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'You do not have permission to create assignments for this round'
            });
        }
        
        // Validate role
        const validRoles = ['participant', 'judge'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ 
                message: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
            });
        }
        
        // Check if user exists
        const user = await User.findById(user_id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if user has appropriate role in the system
        if (role === 'judge' && user.role !== 'judge') {
            return res.status(400).json({ 
                message: 'Can only assign users with judge role as judges' 
            });
        }
        
        // Check if assignment already exists
        const [existingAssignments] = await pool.execute(
            'SELECT * FROM round_assignments WHERE round_id = ? AND user_id = ? AND role = ?',
            [roundId, user_id, role]
        );
        
        if (existingAssignments.length > 0) {
            return res.status(409).json({ 
                message: 'User is already assigned to this round with the same role'
            });
        }
        
        // Check capacity limits
        if (role === 'participant' && round.max_participants) {
            const participantCount = await RoundAssignment.countByRound(roundId, 'participant');
            if (participantCount >= round.max_participants) {
                return res.status(400).json({ 
                    message: 'Round has reached maximum participant capacity' 
                });
            }
        }
        
        if (role === 'judge' && round.judges_required) {
            const judgeCount = await RoundAssignment.countByRound(roundId, 'judge');
            if (judgeCount >= round.judges_required) {
                return res.status(409).json({ 
                    message: 'Round has reached required number of judges',
                    canProceed: true // Allow overriding this limit
                });
            }
        }
        
        // Check user availability (scheduling conflicts)
        const roundData = { 
            start_time: round.start_time,
            end_time: round.end_time
        };
        
        const conflicts = await RoundAssignment.checkUserAvailability(user_id, roundData);
        
        if (conflicts.length > 0) {
            return res.status(409).json({ 
                message: 'User has scheduling conflicts',
                conflicts,
                canProceed: true // Allow overriding conflicts
            });
        }
        
        // Create new assignment
        const assignmentData = {
            round_id: roundId,
            user_id,
            role,
            status: status || 'assigned'
        };
        
        const newAssignment = await RoundAssignment.create(assignmentData);
        
        res.status(201).json({
            message: 'Assignment created successfully',
            assignment: newAssignment
        });
    } catch (error) {
        console.error('Error in createAssignment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Update an assignment
 */
export const updateAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, score, feedback } = req.body;
        
        // Verify assignment exists
        const assignment = await RoundAssignment.findById(id);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        
        // Get round and event info
        const round = await EventRound.findById(assignment.round_id);
        const event = await Event.findById(round.event_id);
        
        // Determine what updates are allowed based on user role
        const isOrganizer = event.organizer_id === req.user.id;
        const isAdmin = req.user.role === 'admin';
        const isAssignedJudge = req.user.role === 'judge' && 
                               await isUserAssignedToRound(req.user.id, assignment.round_id, 'judge');
        const isAssignedUser = req.user.id === assignment.user_id;
        
        const updateData = {};
        
        // Status updates
        if (status) {
            // Only organizers, admins, or the assigned user can update status
            if (!isOrganizer && !isAdmin && !isAssignedUser) {
                return res.status(403).json({ 
                    message: 'You do not have permission to update the status of this assignment'
                });
            }
            updateData.status = status;
        }
        
        // Score and feedback updates
        if ((score !== undefined || feedback !== undefined) && assignment.role === 'participant') {
            // Only judges, organizers, or admins can update scores and feedback
            if (!isOrganizer && !isAdmin && !isAssignedJudge) {
                return res.status(403).json({ 
                    message: 'You do not have permission to update scores or feedback'
                });
            }
            
            if (score !== undefined) {
                // Validate score is between 0 and 100
                if (score < 0 || score > 100) {
                    return res.status(400).json({ 
                        message: 'Score must be between 0 and 100' 
                    });
                }
                updateData.score = score;
            }
            
            if (feedback !== undefined) {
                updateData.feedback = feedback;
            }
        }
        
        // Ensure there's something to update
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ 
                message: 'No valid fields to update' 
            });
        }
        
        // Update assignment
        const updatedAssignment = await RoundAssignment.update(id, updateData);
        
        res.status(200).json({
            message: 'Assignment updated successfully',
            assignment: {
                id: parseInt(id),
                ...updateData
            }
        });
    } catch (error) {
        console.error('Error in updateAssignment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Delete an assignment
 */
export const deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verify assignment exists
        const assignment = await RoundAssignment.findById(id);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        
        // Get round and event info
        const round = await EventRound.findById(assignment.round_id);
        const event = await Event.findById(round.event_id);
        
        // Check if user has permission to delete this assignment
        if (event.organizer_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'You do not have permission to delete this assignment'
            });
        }
        
        // Delete assignment
        await RoundAssignment.delete(id);
        
        res.status(200).json({ message: 'Assignment deleted successfully' });
    } catch (error) {
        console.error('Error in deleteAssignment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Helper function to check if a user is assigned to a round
 */
async function isUserAssignedToRound(userId, roundId, role) {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM round_assignments WHERE round_id = ? AND user_id = ? AND role = ?',
            [roundId, userId, role]
        );
        return rows.length > 0;
    } catch (error) {
        console.error('Error in isUserAssignedToRound:', error);
        return false;
    }
}