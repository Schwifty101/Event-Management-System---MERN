import { JudgeAssignment } from '../models/judgeAssignmentModel.js';
import { User } from '../models/userModel.js';
import { Event } from '../models/eventModel.js';
import { EventRound } from '../models/eventRoundModel.js';

/**
 * Assign a judge to an event or round
 */
export const assignJudge = async (req, res) => {
    try {
        const { event_id, round_id, judge_id } = req.body;

        // Validate input
        if (!event_id || !judge_id) {
            return res.status(400).json({ message: 'Event ID and judge ID are required' });
        }

        // Check if event exists
        const event = await Event.findById(event_id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if round exists if round_id is provided
        if (round_id) {
            const round = await EventRound.findById(round_id);
            if (!round) {
                return res.status(404).json({ message: 'Round not found' });
            }

            // Verify the round belongs to the event
            if (round.event_id !== parseInt(event_id)) {
                return res.status(400).json({ message: 'Round does not belong to the specified event' });
            }
        }

        // Check if user is authorized (event organizer or admin)
        if (event.organizer_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Forbidden: Only the event organizer or admin can assign judges'
            });
        }

        // Check if judge exists and has the correct role
        const judge = await User.findById(judge_id);
        if (!judge) {
            return res.status(404).json({ message: 'Judge not found' });
        }

        if (judge.role !== 'judge') {
            return res.status(400).json({ message: 'User must have a judge role to be assigned' });
        }

        // Create assignment
        try {
            const assignment = await JudgeAssignment.create({ event_id, round_id, judge_id });

            res.status(201).json({
                message: 'Judge assigned successfully',
                assignment
            });
        } catch (error) {
            if (error.message.includes('already assigned')) {
                return res.status(409).json({ message: error.message });
            }
            throw error;
        }
    } catch (error) {
        console.error('Error in assignJudge:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get judge assignments for an event
 */
export const getEventJudges = async (req, res) => {
    try {
        const { eventId } = req.params;

        // Check if event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const assignments = await JudgeAssignment.findByEventId(eventId);

        res.status(200).json({ assignments });
    } catch (error) {
        console.error('Error in getEventJudges:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get judge assignments for a round
 */
export const getRoundJudges = async (req, res) => {
    try {
        const { roundId } = req.params;

        // Check if round exists
        const round = await EventRound.findById(roundId);
        if (!round) {
            return res.status(404).json({ message: 'Round not found' });
        }

        const assignments = await JudgeAssignment.findByRoundId(roundId);

        res.status(200).json({ assignments });
    } catch (error) {
        console.error('Error in getRoundJudges:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get assignments for a specific judge
 */
export const getJudgeAssignments = async (req, res) => {
    try {
        const judgeId = req.user.id;

        // Verify user is a judge
        if (req.user.role !== 'judge') {
            return res.status(403).json({ message: 'Forbidden: User is not a judge' });
        }

        const assignments = await JudgeAssignment.findByJudgeId(judgeId);

        res.status(200).json({ assignments });
    } catch (error) {
        console.error('Error in getJudgeAssignments:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Update judge assignment status
 */
export const updateAssignmentStatus = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { status } = req.body;

        // Validate input
        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }

        // Check if assignment exists
        const assignment = await JudgeAssignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Check if user is authorized (the assigned judge or admin)
        if (assignment.judge_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Forbidden: Only the assigned judge or admin can update the status'
            });
        }

        const updatedAssignment = await JudgeAssignment.updateStatus(assignmentId, { status });

        res.status(200).json({
            message: 'Assignment status updated successfully',
            assignment: updatedAssignment
        });
    } catch (error) {
        console.error('Error in updateAssignmentStatus:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Remove a judge assignment
 */
export const removeJudgeAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.params;

        // Check if assignment exists
        const assignment = await JudgeAssignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Get event details
        const event = await Event.findById(assignment.event_id);

        // Check if user is authorized (event organizer or admin)
        if (event.organizer_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Forbidden: Only the event organizer or admin can remove judge assignments'
            });
        }

        await JudgeAssignment.delete(assignmentId);

        res.status(200).json({ message: 'Judge assignment removed successfully' });
    } catch (error) {
        console.error('Error in removeJudgeAssignment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Submit scores for participants in a round
 */
export const submitScores = async (req, res) => {
    try {
        const { roundId } = req.params;
        const { scores } = req.body;
        const judgeId = req.user.id;

        // Validate input
        if (!scores || !Array.isArray(scores) || scores.length === 0) {
            return res.status(400).json({ message: 'Scores must be provided as a non-empty array' });
        }

        // Check if round exists
        const round = await EventRound.findById(roundId);
        if (!round) {
            return res.status(404).json({ message: 'Round not found' });
        }

        // Check if user is a judge assigned to this round
        if (req.user.role !== 'judge') {
            return res.status(403).json({ message: 'Forbidden: User is not a judge' });
        }

        const [assignment] = await JudgeAssignment.findByRoundId(roundId).filter(
            a => a.judge_id === judgeId
        );

        if (!assignment) {
            return res.status(403).json({ message: 'Forbidden: Judge is not assigned to this round' });
        }

        // Validate each score entry
        for (const score of scores) {
            const { participant_id, team_id } = score;

            if (!participant_id && !team_id) {
                return res.status(400).json({
                    message: 'Each score entry must have either participant_id or team_id'
                });
            }

            if (
                !score.technical_score &&
                !score.presentation_score &&
                !score.creativity_score &&
                !score.implementation_score
            ) {
                return res.status(400).json({
                    message: 'Each score entry must have at least one score component'
                });
            }
        }

        // Submit scores
        try {
            await JudgeAssignment.submitScores(roundId, judgeId, scores);

            res.status(200).json({ message: 'Scores submitted successfully' });
        } catch (error) {
            if (error.message.includes('Judge is not assigned')) {
                return res.status(403).json({ message: error.message });
            }
            throw error;
        }
    } catch (error) {
        console.error('Error in submitScores:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Declare winners for a round and advance them to the next round if applicable
 */
export const declareWinners = async (req, res) => {
    try {
        const { roundId } = req.params;
        const { winnerIds, nextRoundId } = req.body;

        if (!winnerIds || !Array.isArray(winnerIds) || winnerIds.length === 0) {
            return res.status(400).json({ message: 'At least one winner must be specified' });
        }

        // Check if round exists
        const round = await EventRound.findById(roundId);
        if (!round) {
            return res.status(404).json({ message: 'Round not found' });
        }

        // Get event
        const event = await Event.findById(round.event_id);

        // Check if user is authorized (event organizer or admin)
        if (event.organizer_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Forbidden: Only the event organizer or admin can declare winners'
            });
        }

        // Update participant status to 'advanced' for winners
        for (const winnerId of winnerIds) {
            try {
                await EventRound.updateParticipantStatus(roundId, winnerId, { status: 'advanced' });
            } catch (error) {
                console.error(`Failed to update status for participant ${winnerId}:`, error);
            }
        }

        // Mark all non-winners as 'eliminated'
        const allParticipants = await EventRound.getParticipants(roundId);
        for (const participant of allParticipants) {
            const participantId = participant.user_id || participant.team_id;
            const isWinner = winnerIds.includes(participantId);

            if (!isWinner && participant.status !== 'advanced') {
                try {
                    await EventRound.updateParticipantStatus(
                        roundId,
                        participantId,
                        { status: 'eliminated' }
                    );
                } catch (error) {
                    console.error(`Failed to update status for participant ${participantId}:`, error);
                }
            }
        }

        // If nextRoundId is provided, advance winners to the next round
        let advancementResult = null;
        if (nextRoundId) {
            // Check if next round exists and belongs to the same event
            const nextRound = await EventRound.findById(nextRoundId);
            if (!nextRound) {
                return res.status(404).json({ message: 'Next round not found' });
            }

            if (nextRound.event_id !== round.event_id) {
                return res.status(400).json({
                    message: 'Next round must belong to the same event'
                });
            }

            try {
                advancementResult = await EventRound.advanceWinnersToNextRound(
                    roundId,
                    nextRoundId,
                    winnerIds
                );
            } catch (error) {
                console.error('Error advancing winners:', error);
                return res.status(500).json({
                    message: 'Error advancing winners to next round',
                    error: error.message
                });
            }
        }

        res.status(200).json({
            message: 'Winners declared successfully',
            winners: await EventRound.getWinners(roundId),
            advancedToNextRound: advancementResult !== null
        });
    } catch (error) {
        console.error('Error in declareWinners:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get leaderboard for a round
 */
export const getLeaderboard = async (req, res) => {
    try {
        const { roundId } = req.params;

        // Check if round exists
        const round = await EventRound.findById(roundId);
        if (!round) {
            return res.status(404).json({ message: 'Round not found' });
        }

        // Get event details
        const event = await Event.findById(round.event_id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Get all participants with scores for this round
        const participants = await EventRound.getParticipantsWithScores(roundId);

        // Sort participants by score in descending order
        const rankedParticipants = participants.sort((a, b) => b.score - a.score);

        // Add rank to each participant
        let currentRank = 1;
        let currentScore = null;
        let sameRankCount = 0;

        const leaderboard = rankedParticipants.map((participant, index) => {
            // Handle tied scores (same rank)
            if (participant.score !== currentScore) {
                currentRank = index + 1 - sameRankCount;
                currentScore = participant.score;
                sameRankCount = 0;
            } else {
                sameRankCount++;
            }

            return {
                ...participant,
                rank: currentRank
            };
        });

        res.status(200).json({
            eventName: event.title,
            roundName: round.name,
            roundType: round.round_type,
            leaderboard
        });
    } catch (error) {
        console.error('Error in getLeaderboard:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};