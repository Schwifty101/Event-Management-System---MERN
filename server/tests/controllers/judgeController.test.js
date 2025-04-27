// filepath: /Users/sobanahmad/Fast-Nuces/Semester 6/DBlab/semesterProject/server/tests/controllers/judgeController.test.js
import { jest } from '@jest/globals';

// Mock the required models for judgeController
jest.mock('../../src/models/judgeAssignmentModel.js', () => {
    return {
        JudgeAssignment: {
            create: jest.fn(),
            findById: jest.fn(),
            findByEventId: jest.fn(),
            findByRoundId: jest.fn(),
            findByJudgeId: jest.fn(),
            updateStatus: jest.fn(),
            delete: jest.fn(),
            submitScores: jest.fn()
        }
    };
});

jest.mock('../../src/models/userModel.js', () => {
    return {
        User: {
            findById: jest.fn()
        }
    };
});

jest.mock('../../src/models/eventModel.js', () => {
    return {
        Event: {
            findById: jest.fn()
        }
    };
});

jest.mock('../../src/models/eventRoundModel.js', () => {
    return {
        EventRound: {
            findById: jest.fn(),
            updateParticipantStatus: jest.fn()
        }
    };
});

// Import controller and mocked models
import * as judgeController from '../../src/controllers/judgeController.js';
import { JudgeAssignment } from '../../src/models/judgeAssignmentModel.js';
import { User } from '../../src/models/userModel.js';
import { Event } from '../../src/models/eventModel.js';
import { EventRound } from '../../src/models/eventRoundModel.js';

describe('JudgeController', () => {
    let mockRequest;
    let mockResponse;
    let mockJudge;
    let mockEvent;
    let mockRound;
    let mockAssignment;

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

        mockJudge = {
            id: 2,
            name: 'Judge Name',
            email: 'judge@example.com',
            role: 'judge'
        };

        mockEvent = {
            id: 1,
            title: 'Hackathon',
            organizer_id: 1
        };

        mockRound = {
            id: 1,
            name: 'Round 1',
            event_id: 1
        };

        mockAssignment = {
            id: 1,
            event_id: 1,
            round_id: 1,
            judge_id: 2,
            status: 'pending'
        };
    });

    describe('assignJudge', () => {
        it('should assign a judge successfully', async () => {
            // Setup
            mockRequest.body = {
                event_id: 1,
                round_id: 1,
                judge_id: 2
            };
            mockRequest.user = { id: 1, role: 'organizer' };

            Event.findById.mockResolvedValue(mockEvent);
            EventRound.findById.mockResolvedValue(mockRound);
            User.findById.mockResolvedValue(mockJudge);
            JudgeAssignment.create.mockResolvedValue(mockAssignment);

            // Test
            await judgeController.assignJudge(mockRequest, mockResponse);

            // Assertions
            expect(Event.findById).toHaveBeenCalledWith(1);
            expect(EventRound.findById).toHaveBeenCalledWith(1);
            expect(User.findById).toHaveBeenCalledWith(2);
            expect(JudgeAssignment.create).toHaveBeenCalledWith({
                event_id: 1,
                round_id: 1,
                judge_id: 2
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Judge assigned successfully',
                assignment: mockAssignment
            });
        });

        it('should return 400 when required fields are missing', async () => {
            // Setup
            mockRequest.body = {
                judge_id: 2
                // Missing event_id
            };

            // Test
            await judgeController.assignJudge(mockRequest, mockResponse);

            // Assertions
            expect(JudgeAssignment.create).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Event ID and judge ID are required'
            });
        });

        it('should return 404 when event is not found', async () => {
            // Setup
            mockRequest.body = {
                event_id: 999,
                judge_id: 2
            };

            Event.findById.mockResolvedValue(null);

            // Test
            await judgeController.assignJudge(mockRequest, mockResponse);

            // Assertions
            expect(JudgeAssignment.create).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Event not found'
            });
        });

        it('should return 404 when round is not found', async () => {
            // Setup
            mockRequest.body = {
                event_id: 1,
                round_id: 999,
                judge_id: 2
            };

            Event.findById.mockResolvedValue(mockEvent);
            EventRound.findById.mockResolvedValue(null);

            // Test
            await judgeController.assignJudge(mockRequest, mockResponse);

            // Assertions
            expect(JudgeAssignment.create).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Round not found'
            });
        });

        it('should return 403 when user is not authorized', async () => {
            // Setup
            mockRequest.body = {
                event_id: 1,
                judge_id: 2
            };
            mockRequest.user = { id: 3, role: 'participant' }; // Not organizer or admin

            Event.findById.mockResolvedValue({
                ...mockEvent,
                organizer_id: 1
            });

            // Test
            await judgeController.assignJudge(mockRequest, mockResponse);

            // Assertions
            expect(JudgeAssignment.create).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Forbidden: Only the event organizer or admin can assign judges'
            });
        });

        it('should return 404 when judge not found', async () => {
            // Setup
            mockRequest.body = {
                event_id: 1,
                judge_id: 999
            };
            mockRequest.user = { id: 1, role: 'organizer' };

            Event.findById.mockResolvedValue(mockEvent);
            User.findById.mockResolvedValue(null);

            // Test
            await judgeController.assignJudge(mockRequest, mockResponse);

            // Assertions
            expect(JudgeAssignment.create).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Judge not found'
            });
        });

        it('should return 400 when user is not a judge', async () => {
            // Setup
            mockRequest.body = {
                event_id: 1,
                judge_id: 3
            };
            mockRequest.user = { id: 1, role: 'organizer' };

            const nonJudgeUser = {
                id: 3,
                name: 'Regular User',
                role: 'participant'
            };

            Event.findById.mockResolvedValue(mockEvent);
            User.findById.mockResolvedValue(nonJudgeUser);

            // Test
            await judgeController.assignJudge(mockRequest, mockResponse);

            // Assertions
            expect(JudgeAssignment.create).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'User must have a judge role to be assigned'
            });
        });

        it('should handle duplicate assignment error', async () => {
            // Setup
            mockRequest.body = {
                event_id: 1,
                round_id: 1,
                judge_id: 2
            };
            mockRequest.user = { id: 1, role: 'organizer' };

            Event.findById.mockResolvedValue(mockEvent);
            EventRound.findById.mockResolvedValue(mockRound);
            User.findById.mockResolvedValue(mockJudge);

            const duplicateError = new Error('Judge already assigned to this round');
            JudgeAssignment.create.mockRejectedValue(duplicateError);

            // Test
            await judgeController.assignJudge(mockRequest, mockResponse);

            // Assertions
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Server error',
                error: duplicateError.message
            });
        });
    });

    describe('getEventJudges', () => {
        it('should return judges for an event', async () => {
            // Setup
            mockRequest.params = { eventId: '1' };

            const mockAssignments = [
                { ...mockAssignment, judge_id: 2 },
                { ...mockAssignment, id: 2, judge_id: 3 }
            ];

            Event.findById.mockResolvedValue(mockEvent);
            JudgeAssignment.findByEventId.mockResolvedValue(mockAssignments);

            // Test
            await judgeController.getEventJudges(mockRequest, mockResponse);

            // Assertions
            expect(Event.findById).toHaveBeenCalledWith('1');
            expect(JudgeAssignment.findByEventId).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                assignments: mockAssignments
            });
        });

        it('should return 404 when event not found', async () => {
            // Setup
            mockRequest.params = { eventId: '999' };
            Event.findById.mockResolvedValue(null);

            // Test
            await judgeController.getEventJudges(mockRequest, mockResponse);

            // Assertions
            expect(JudgeAssignment.findByEventId).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Event not found'
            });
        });
    });

    describe('getRoundJudges', () => {
        it('should return judges for a round', async () => {
            // Setup
            mockRequest.params = { roundId: '1' };

            const mockAssignments = [
                { ...mockAssignment, judge_id: 2 },
                { ...mockAssignment, id: 2, judge_id: 3 }
            ];

            EventRound.findById.mockResolvedValue(mockRound);
            JudgeAssignment.findByRoundId.mockResolvedValue(mockAssignments);

            // Test
            await judgeController.getRoundJudges(mockRequest, mockResponse);

            // Assertions
            expect(EventRound.findById).toHaveBeenCalledWith('1');
            expect(JudgeAssignment.findByRoundId).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                assignments: mockAssignments
            });
        });

        it('should return 404 when round not found', async () => {
            // Setup
            mockRequest.params = { roundId: '999' };
            EventRound.findById.mockResolvedValue(null);

            // Test
            await judgeController.getRoundJudges(mockRequest, mockResponse);

            // Assertions
            expect(JudgeAssignment.findByRoundId).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Round not found'
            });
        });
    });

    describe('getJudgeAssignments', () => {
        it('should return assignments for a judge', async () => {
            // Setup
            mockRequest.user = { id: 2, role: 'judge' };

            const mockAssignments = [
                { ...mockAssignment, event_id: 1 },
                { ...mockAssignment, id: 2, event_id: 2 }
            ];

            JudgeAssignment.findByJudgeId.mockResolvedValue(mockAssignments);

            // Test
            await judgeController.getJudgeAssignments(mockRequest, mockResponse);

            // Assertions
            expect(JudgeAssignment.findByJudgeId).toHaveBeenCalledWith(2);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                assignments: mockAssignments
            });
        });

        it('should return 403 when user is not a judge', async () => {
            // Setup
            mockRequest.user = { id: 1, role: 'participant' };

            // Test
            await judgeController.getJudgeAssignments(mockRequest, mockResponse);

            // Assertions
            expect(JudgeAssignment.findByJudgeId).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Forbidden: User is not a judge'
            });
        });
    });

    describe('updateAssignmentStatus', () => {
        it('should update assignment status successfully', async () => {
            // Setup
            mockRequest.params = { assignmentId: '1' };
            mockRequest.body = { status: 'accepted' };
            mockRequest.user = { id: 2, role: 'judge' };

            const updatedAssignment = {
                ...mockAssignment,
                status: 'accepted'
            };

            JudgeAssignment.findById.mockResolvedValue({
                ...mockAssignment,
                judge_id: 2
            });
            JudgeAssignment.updateStatus.mockResolvedValue(updatedAssignment);

            // Test
            await judgeController.updateAssignmentStatus(mockRequest, mockResponse);

            // Assertions
            expect(JudgeAssignment.findById).toHaveBeenCalledWith('1');
            expect(JudgeAssignment.updateStatus).toHaveBeenCalledWith('1', { status: 'accepted' });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Assignment status updated successfully',
                assignment: updatedAssignment
            });
        });

        it('should return 400 when status is missing', async () => {
            // Setup
            mockRequest.params = { assignmentId: '1' };
            mockRequest.body = {};
            mockRequest.user = { id: 2, role: 'judge' };

            // Test
            await judgeController.updateAssignmentStatus(mockRequest, mockResponse);

            // Assertions
            expect(JudgeAssignment.updateStatus).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Status is required'
            });
        });

        it('should return 404 when assignment not found', async () => {
            // Setup
            mockRequest.params = { assignmentId: '999' };
            mockRequest.body = { status: 'accepted' };

            JudgeAssignment.findById.mockResolvedValue(null);

            // Test
            await judgeController.updateAssignmentStatus(mockRequest, mockResponse);

            // Assertions
            expect(JudgeAssignment.updateStatus).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Assignment not found'
            });
        });

        it('should return 403 when user is not authorized', async () => {
            // Setup
            mockRequest.params = { assignmentId: '1' };
            mockRequest.body = { status: 'accepted' };
            mockRequest.user = { id: 3, role: 'judge' }; // Different judge

            JudgeAssignment.findById.mockResolvedValue({
                ...mockAssignment,
                judge_id: 2 // Original judge
            });

            // Test
            await judgeController.updateAssignmentStatus(mockRequest, mockResponse);

            // Assertions
            expect(JudgeAssignment.updateStatus).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Forbidden: Only the assigned judge or admin can update the status'
            });
        });

        it('should allow admin to update any assignment status', async () => {
            // Setup
            mockRequest.params = { assignmentId: '1' };
            mockRequest.body = { status: 'cancelled' };
            mockRequest.user = { id: 1, role: 'admin' };

            const updatedAssignment = {
                ...mockAssignment,
                status: 'cancelled'
            };

            JudgeAssignment.findById.mockResolvedValue({
                ...mockAssignment,
                judge_id: 2
            });
            JudgeAssignment.updateStatus.mockResolvedValue(updatedAssignment);

            // Test
            await judgeController.updateAssignmentStatus(mockRequest, mockResponse);

            // Assertions
            expect(JudgeAssignment.updateStatus).toHaveBeenCalledWith('1', { status: 'cancelled' });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });
    });

    describe('removeJudgeAssignment', () => {
        it('should remove assignment successfully', async () => {
            // Setup
            mockRequest.params = { assignmentId: '1' };
            mockRequest.user = { id: 1, role: 'organizer' };

            JudgeAssignment.findById.mockResolvedValue(mockAssignment);
            Event.findById.mockResolvedValue({ ...mockEvent, organizer_id: 1 });
            JudgeAssignment.delete.mockResolvedValue(true);

            // Test
            await judgeController.removeJudgeAssignment(mockRequest, mockResponse);

            // Assertions
            expect(JudgeAssignment.findById).toHaveBeenCalledWith('1');
            expect(Event.findById).toHaveBeenCalledWith(1);
            expect(JudgeAssignment.delete).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Judge assignment removed successfully'
            });
        });

        it('should return 404 when assignment not found', async () => {
            // Setup
            mockRequest.params = { assignmentId: '999' };
            JudgeAssignment.findById.mockResolvedValue(null);

            // Test
            await judgeController.removeJudgeAssignment(mockRequest, mockResponse);

            // Assertions
            expect(JudgeAssignment.delete).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Assignment not found'
            });
        });

        it('should return 403 when user is not authorized', async () => {
            // Setup
            mockRequest.params = { assignmentId: '1' };
            mockRequest.user = { id: 3, role: 'organizer' }; // Different organizer

            JudgeAssignment.findById.mockResolvedValue(mockAssignment);
            Event.findById.mockResolvedValue({ ...mockEvent, organizer_id: 1 });

            // Test
            await judgeController.removeJudgeAssignment(mockRequest, mockResponse);

            // Assertions
            expect(JudgeAssignment.delete).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Forbidden: Only the event organizer or admin can remove judge assignments'
            });
        });
    });

    describe('submitScores', () => {
        it('should submit scores successfully', async () => {
            // Setup
            mockRequest.params = { roundId: '1' };
            mockRequest.user = { id: 2, role: 'judge' };
            mockRequest.body = {
                scores: [
                    {
                        participant_id: 5,
                        technical_score: 90,
                        presentation_score: 85
                    },
                    {
                        team_id: 3,
                        technical_score: 92,
                        creativity_score: 88
                    }
                ]
            };

            EventRound.findById.mockResolvedValue(mockRound);
            JudgeAssignment.findByRoundId.mockImplementation(() => {
                return [{ judge_id: 2, round_id: 1 }].filter(a => a.judge_id === 2);
            });
            JudgeAssignment.submitScores.mockResolvedValue(true);

            // Test
            await judgeController.submitScores(mockRequest, mockResponse);

            // Assertions
            expect(EventRound.findById).toHaveBeenCalledWith('1');
            expect(JudgeAssignment.submitScores).toHaveBeenCalledWith(
                '1',
                2,
                mockRequest.body.scores
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Scores submitted successfully'
            });
        });

        it('should return 400 when scores are missing or empty', async () => {
            // Setup
            mockRequest.params = { roundId: '1' };
            mockRequest.user = { id: 2, role: 'judge' };
            mockRequest.body = { scores: [] };

            // Test
            await judgeController.submitScores(mockRequest, mockResponse);

            // Assertions
            expect(JudgeAssignment.submitScores).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Scores must be provided as a non-empty array'
            });
        });

        it('should return 404 when round not found', async () => {
            // Setup
            mockRequest.params = { roundId: '999' };
            mockRequest.user = { id: 2, role: 'judge' };
            mockRequest.body = {
                scores: [{ participant_id: 5, technical_score: 90 }]
            };

            EventRound.findById.mockResolvedValue(null);

            // Test
            await judgeController.submitScores(mockRequest, mockResponse);

            // Assertions
            expect(JudgeAssignment.submitScores).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Round not found'
            });
        });

        it('should return 403 when user is not a judge', async () => {
            // Setup
            mockRequest.params = { roundId: '1' };
            mockRequest.user = { id: 1, role: 'organizer' };
            mockRequest.body = {
                scores: [{ participant_id: 5, technical_score: 90 }]
            };

            EventRound.findById.mockResolvedValue(mockRound);

            // Test
            await judgeController.submitScores(mockRequest, mockResponse);

            // Assertions
            expect(JudgeAssignment.submitScores).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Forbidden: User is not a judge'
            });
        });

        it('should return 400 when score entries are invalid', async () => {
            // Setup
            mockRequest.params = { roundId: '1' };
            mockRequest.user = { id: 2, role: 'judge' };
            mockRequest.body = {
                scores: [
                    {
                        // Missing participant_id or team_id
                        technical_score: 90
                    }
                ]
            };

            EventRound.findById.mockResolvedValue(mockRound);
            JudgeAssignment.findByRoundId.mockImplementation(() => {
                return [{ judge_id: 2, round_id: 1 }].filter(a => a.judge_id === 2);
            });

            // Test
            await judgeController.submitScores(mockRequest, mockResponse);

            // Assertions
            expect(JudgeAssignment.submitScores).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Each score entry must have either participant_id or team_id'
            });
        });
    });

    describe('declareWinners', () => {
        it('should declare winners successfully', async () => {
            // Setup
            mockRequest.params = { roundId: '1' };
            mockRequest.body = {
                winnerIds: [1, 2, 3],
                nextRoundId: 2
            };
            mockRequest.user = { id: 1, role: 'organizer' };

            EventRound.findById.mockResolvedValue(mockRound);
            Event.findById.mockResolvedValue({ ...mockEvent, organizer_id: 1 });
            EventRound.updateParticipantStatus.mockResolvedValue(true);

            // Test
            await judgeController.declareWinners(mockRequest, mockResponse);

            // Assertions
            expect(EventRound.findById).toHaveBeenCalledWith('1');
            expect(Event.findById).toHaveBeenCalled();
            expect(EventRound.updateParticipantStatus).toHaveBeenCalledTimes(3);
            expect(EventRound.updateParticipantStatus).toHaveBeenCalledWith(
                '1',
                expect.anything(),
                { status: 'advanced' }
            );
        });

        it('should return 400 when winnerIds are missing or empty', async () => {
            // Setup
            mockRequest.params = { roundId: '1' };
            mockRequest.body = { winnerIds: [] };

            // Test
            await judgeController.declareWinners(mockRequest, mockResponse);

            // Assertions
            expect(EventRound.updateParticipantStatus).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'At least one winner must be specified'
            });
        });

        it('should return 404 when round not found', async () => {
            // Setup
            mockRequest.params = { roundId: '999' };
            mockRequest.body = { winnerIds: [1, 2] };

            EventRound.findById.mockResolvedValue(null);

            // Test
            await judgeController.declareWinners(mockRequest, mockResponse);

            // Assertions
            expect(EventRound.updateParticipantStatus).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Round not found'
            });
        });

        it('should return 403 when user is not authorized', async () => {
            // Setup
            mockRequest.params = { roundId: '1' };
            mockRequest.body = { winnerIds: [1, 2] };
            mockRequest.user = { id: 3, role: 'organizer' }; // Different organizer

            EventRound.findById.mockResolvedValue(mockRound);
            Event.findById.mockResolvedValue({ ...mockEvent, organizer_id: 1 });

            // Test
            await judgeController.declareWinners(mockRequest, mockResponse);

            // Assertions
            expect(EventRound.updateParticipantStatus).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Forbidden: Only the event organizer or admin can declare winners'
            });
        });
    });

    describe('getLeaderboard', () => {
        it('should return leaderboard with ranked participants', async () => {
            // Setup
            mockRequest.params = { roundId: '1' };

            EventRound.findById.mockResolvedValue(mockRound);
            Event.findById.mockResolvedValue(mockEvent);

            const mockParticipants = [
                { id: 1, name: 'Team A', score: 95, team_id: 1 },
                { id: 2, name: 'Team B', score: 88, team_id: 2 },
                { id: 3, name: 'Team C', score: 95, team_id: 3 }, // Tied with Team A
                { id: 4, name: 'Team D', score: 75, team_id: 4 }
            ];

            // Mock the getParticipantsWithScores method
            EventRound.getParticipantsWithScores = jest.fn().mockResolvedValue(mockParticipants);

            // Test
            await judgeController.getLeaderboard(mockRequest, mockResponse);

            // Assertions
            expect(EventRound.findById).toHaveBeenCalledWith('1');
            expect(Event.findById).toHaveBeenCalledWith(1); // mockRound.event_id
            expect(EventRound.getParticipantsWithScores).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    eventName: mockEvent.title,
                    roundName: mockRound.name,
                    leaderboard: expect.arrayContaining([
                        expect.objectContaining({ score: 95, rank: 1 }), // Two teams with rank 1
                        expect.objectContaining({ score: 88, rank: 3 }), // Next rank after two ties is 3
                        expect.objectContaining({ score: 75, rank: 4 })
                    ])
                })
            );
        });

        it('should return 404 when round not found', async () => {
            // Setup
            mockRequest.params = { roundId: '999' };
            EventRound.findById.mockResolvedValue(null);

            // Test
            await judgeController.getLeaderboard(mockRequest, mockResponse);

            // Assertions
            expect(EventRound.getParticipantsWithScores).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Round not found'
            });
        });

        it('should return 404 when event not found', async () => {
            // Setup
            mockRequest.params = { roundId: '1' };
            EventRound.findById.mockResolvedValue(mockRound);
            Event.findById.mockResolvedValue(null);

            // Test
            await judgeController.getLeaderboard(mockRequest, mockResponse);

            // Assertions
            expect(EventRound.getParticipantsWithScores).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Event not found'
            });
        });

        it('should handle errors properly', async () => {
            // Setup
            mockRequest.params = { roundId: '1' };

            const error = new Error('Database error');
            EventRound.findById.mockRejectedValue(error);

            // Test
            await judgeController.getLeaderboard(mockRequest, mockResponse);

            // Assertions
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Server error',
                error: error.message
            });
        });
    });
});