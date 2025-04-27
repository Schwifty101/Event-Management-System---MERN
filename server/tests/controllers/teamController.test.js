// filepath: /Users/sobanahmad/Fast-Nuces/Semester 6/DBlab/semesterProject/server/tests/controllers/teamController.test.js
import { jest } from '@jest/globals';

// Mock the Team and Event models
jest.mock('../../src/models/teamModel.js', () => {
    return {
        Team: {
            create: jest.fn(),
            findById: jest.fn(),
            findByEventId: jest.fn(),
            findByUserId: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            addMember: jest.fn(),
            removeMember: jest.fn(),
            transferLeadership: jest.fn(),
            getMembers: jest.fn()
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

// Import the controller and mocked models
import * as teamController from '../../src/controllers/teamController.js';
import { Team } from '../../src/models/teamModel.js';
import { Event } from '../../src/models/eventModel.js';

describe('TeamController', () => {
    // Setup mock request and response
    let mockRequest;
    let mockResponse;
    let mockTeam;
    let mockEvent;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Setup mock request and response objects
        mockRequest = {
            body: {},
            params: {},
            user: { id: 1, role: 'participant' }
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        mockTeam = {
            id: 1,
            name: 'Test Team',
            event_id: 1,
            leader_id: 1,
            member_count: 3
        };

        mockEvent = {
            id: 1,
            title: 'Hackathon',
            team_event: true,
            max_team_size: 5
        };
    });

    describe('createTeam', () => {
        it('should create a team successfully', async () => {
            // Setup
            mockRequest.body = {
                name: 'New Team',
                event_id: 1
            };
            mockRequest.user = { id: 1 };

            Event.findById.mockResolvedValue(mockEvent);
            Team.create.mockResolvedValue({
                id: 2,
                name: 'New Team',
                event_id: 1,
                leader_id: 1
            });

            // Test
            await teamController.createTeam(mockRequest, mockResponse);

            // Assertions
            expect(Event.findById).toHaveBeenCalledWith(1);
            expect(Team.create).toHaveBeenCalledWith({
                name: 'New Team',
                event_id: 1,
                leader_id: 1
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Team created successfully'
                })
            );
        });

        it('should return 400 if required fields are missing', async () => {
            // Setup
            mockRequest.body = { name: 'Incomplete Team' };

            // Test
            await teamController.createTeam(mockRequest, mockResponse);

            // Assertions
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Team name and event ID are required'
            });
        });

        it('should return 404 if event not found', async () => {
            // Setup
            mockRequest.body = {
                name: 'New Team',
                event_id: 999
            };

            Event.findById.mockResolvedValue(null);

            // Test
            await teamController.createTeam(mockRequest, mockResponse);

            // Assertions
            expect(Event.findById).toHaveBeenCalledWith(999);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Event not found'
            });
        });

        it('should return 400 if event does not support teams', async () => {
            // Setup
            mockRequest.body = {
                name: 'New Team',
                event_id: 2
            };

            const nonTeamEvent = { ...mockEvent, team_event: false };
            Event.findById.mockResolvedValue(nonTeamEvent);

            // Test
            await teamController.createTeam(mockRequest, mockResponse);

            // Assertions
            expect(Event.findById).toHaveBeenCalledWith(2);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'This event does not support team participation'
            });
        });
    });

    describe('getTeamById', () => {
        it('should return team and members when found', async () => {
            // Setup
            mockRequest.params = { id: '1' };

            const mockMembers = [
                { id: 1, name: 'Member 1', role: 'leader' },
                { id: 2, name: 'Member 2', role: 'member' }
            ];

            Team.findById.mockResolvedValue(mockTeam);
            Team.getMembers.mockResolvedValue(mockMembers);

            // Test
            await teamController.getTeamById(mockRequest, mockResponse);

            // Assertions
            expect(Team.findById).toHaveBeenCalledWith('1');
            expect(Team.getMembers).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                team: mockTeam,
                members: mockMembers
            });
        });

        it('should return 404 when team not found', async () => {
            // Setup
            mockRequest.params = { id: '999' };
            Team.findById.mockResolvedValue(null);

            // Test
            await teamController.getTeamById(mockRequest, mockResponse);

            // Assertions
            expect(Team.findById).toHaveBeenCalledWith('999');
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Team not found'
            });
        });
    });

    describe('getTeamsByEventId', () => {
        it('should return teams for an event when found', async () => {
            // Setup
            mockRequest.params = { eventId: '1' };

            const mockTeams = [mockTeam, {
                id: 2,
                name: 'Another Team',
                event_id: 1,
                leader_id: 2
            }];

            Event.findById.mockResolvedValue(mockEvent);
            Team.findByEventId.mockResolvedValue(mockTeams);

            // Test
            await teamController.getTeamsByEventId(mockRequest, mockResponse);

            // Assertions
            expect(Event.findById).toHaveBeenCalledWith('1');
            expect(Team.findByEventId).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                teams: mockTeams
            });
        });

        it('should return 404 when event not found', async () => {
            // Setup
            mockRequest.params = { eventId: '999' };
            Event.findById.mockResolvedValue(null);

            // Test
            await teamController.getTeamsByEventId(mockRequest, mockResponse);

            // Assertions
            expect(Event.findById).toHaveBeenCalledWith('999');
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Event not found'
            });
        });
    });

    describe('getUserTeams', () => {
        it('should return teams for the current user', async () => {
            // Setup
            mockRequest.user = { id: 1 };

            const mockTeams = [mockTeam];
            Team.findByUserId.mockResolvedValue(mockTeams);

            // Test
            await teamController.getUserTeams(mockRequest, mockResponse);

            // Assertions
            expect(Team.findByUserId).toHaveBeenCalledWith(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                teams: mockTeams
            });
        });
    });

    describe('updateTeam', () => {
        it('should update team successfully when user is team leader', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            mockRequest.body = { name: 'Updated Team Name' };
            mockRequest.user = { id: 1, role: 'participant' };

            Team.findById.mockResolvedValue({
                id: 1,
                name: 'Old Team Name',
                leader_id: 1
            });

            Team.update.mockResolvedValue({
                id: 1,
                name: 'Updated Team Name',
                leader_id: 1
            });

            // Test
            await teamController.updateTeam(mockRequest, mockResponse);

            // Assertions
            expect(Team.findById).toHaveBeenCalledWith('1');
            expect(Team.update).toHaveBeenCalledWith('1', { name: 'Updated Team Name' });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Team updated successfully'
                })
            );
        });

        it('should update team successfully when user is admin', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            mockRequest.body = { name: 'Admin Updated Name' };
            mockRequest.user = { id: 2, role: 'admin' };

            Team.findById.mockResolvedValue({
                id: 1,
                name: 'Old Team Name',
                leader_id: 1
            });

            Team.update.mockResolvedValue({
                id: 1,
                name: 'Admin Updated Name',
                leader_id: 1
            });

            // Test
            await teamController.updateTeam(mockRequest, mockResponse);

            // Assertions
            expect(Team.update).toHaveBeenCalledWith('1', { name: 'Admin Updated Name' });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });

        it('should return 403 when user is not authorized', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            mockRequest.body = { name: 'Unauthorized Update' };
            mockRequest.user = { id: 2, role: 'participant' };

            Team.findById.mockResolvedValue({
                id: 1,
                name: 'Team Name',
                leader_id: 1
            });

            // Test
            await teamController.updateTeam(mockRequest, mockResponse);

            // Assertions
            expect(Team.findById).toHaveBeenCalledWith('1');
            expect(Team.update).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Forbidden: Only the team leader or admin can update the team'
            });
        });

        it('should return 404 when team not found', async () => {
            // Setup
            mockRequest.params = { id: '999' };
            mockRequest.body = { name: 'Update Nonexistent' };

            Team.findById.mockResolvedValue(null);

            // Test
            await teamController.updateTeam(mockRequest, mockResponse);

            // Assertions
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Team not found'
            });
        });
    });

    describe('addTeamMember', () => {
        it('should add a member successfully', async () => {
            // Setup
            mockRequest.params = { teamId: '1' };
            mockRequest.body = { userId: 3, status: 'invited' };
            mockRequest.user = { id: 1, role: 'participant' };

            Team.findById.mockResolvedValue({
                id: 1,
                name: 'Team Name',
                leader_id: 1,
                event_id: 1,
                member_count: 3
            });

            Event.findById.mockResolvedValue({
                id: 1,
                max_team_size: 5
            });

            Team.addMember.mockResolvedValue({
                team_id: 1,
                user_id: 3,
                status: 'invited'
            });

            // Test
            await teamController.addTeamMember(mockRequest, mockResponse);

            // Assertions
            expect(Team.findById).toHaveBeenCalledWith('1');
            expect(Event.findById).toHaveBeenCalledWith(1);
            expect(Team.addMember).toHaveBeenCalledWith('1', 3, 'invited');
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Member added successfully'
                })
            );
        });

        it('should return 400 if team is at max capacity', async () => {
            // Setup
            mockRequest.params = { teamId: '1' };
            mockRequest.body = { userId: 3 };
            mockRequest.user = { id: 1, role: 'participant' };

            Team.findById.mockResolvedValue({
                id: 1,
                name: 'Team Name',
                leader_id: 1,
                event_id: 1,
                member_count: 5
            });

            Event.findById.mockResolvedValue({
                id: 1,
                max_team_size: 5
            });

            // Test
            await teamController.addTeamMember(mockRequest, mockResponse);

            // Assertions
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Team is already at maximum capacity (5 members)'
            });
        });

        it('should return 403 if user is not authorized', async () => {
            // Setup
            mockRequest.params = { teamId: '1' };
            mockRequest.body = { userId: 3 };
            mockRequest.user = { id: 2, role: 'participant' };

            Team.findById.mockResolvedValue({
                id: 1,
                name: 'Team Name',
                leader_id: 1
            });

            // Test
            await teamController.addTeamMember(mockRequest, mockResponse);

            // Assertions
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Forbidden: Only the team leader or admin can add members'
            });
        });
    });

    describe('removeTeamMember', () => {
        it('should remove a member successfully when leader removes member', async () => {
            // Setup
            mockRequest.params = { teamId: '1', userId: '2' };
            mockRequest.user = { id: 1, role: 'participant' };

            Team.findById.mockResolvedValue({
                id: 1,
                name: 'Team Name',
                leader_id: 1
            });

            Team.removeMember.mockResolvedValue(true);

            // Test
            await teamController.removeTeamMember(mockRequest, mockResponse);

            // Assertions
            expect(Team.findById).toHaveBeenCalledWith('1');
            expect(Team.removeMember).toHaveBeenCalledWith('1', '2');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Member removed successfully'
            });
        });

        it('should allow a member to remove themselves', async () => {
            // Setup
            mockRequest.params = { teamId: '1', userId: '3' };
            mockRequest.user = { id: 3, role: 'participant' };

            Team.findById.mockResolvedValue({
                id: 1,
                name: 'Team Name',
                leader_id: 1
            });

            Team.removeMember.mockResolvedValue(true);

            // Test
            await teamController.removeTeamMember(mockRequest, mockResponse);

            // Assertions
            expect(Team.removeMember).toHaveBeenCalledWith('1', '3');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });

        it('should prevent leader from removing themselves', async () => {
            // Setup
            mockRequest.params = { teamId: '1', userId: '1' };
            mockRequest.user = { id: 1, role: 'participant' };

            Team.findById.mockResolvedValue({
                id: 1,
                name: 'Team Name',
                leader_id: 1
            });

            // Test
            await teamController.removeTeamMember(mockRequest, mockResponse);

            // Assertions
            expect(Team.removeMember).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Team leaders cannot remove themselves. Transfer leadership first.'
            });
        });

        it('should return 403 if user is not authorized', async () => {
            // Setup
            mockRequest.params = { teamId: '1', userId: '2' };
            mockRequest.user = { id: 3, role: 'participant' };

            Team.findById.mockResolvedValue({
                id: 1,
                name: 'Team Name',
                leader_id: 1
            });

            // Test
            await teamController.removeTeamMember(mockRequest, mockResponse);

            // Assertions
            expect(Team.removeMember).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
        });
    });

    describe('transferLeadership', () => {
        it('should transfer leadership successfully', async () => {
            // Setup
            mockRequest.params = { teamId: '1' };
            mockRequest.body = { newLeaderId: 2 };
            mockRequest.user = { id: 1, role: 'participant' };

            Team.findById.mockResolvedValue({
                id: 1,
                name: 'Team Name',
                leader_id: 1
            });

            Team.transferLeadership.mockResolvedValue(true);

            // Test
            await teamController.transferLeadership(mockRequest, mockResponse);

            // Assertions
            expect(Team.transferLeadership).toHaveBeenCalledWith('1', 2);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Leadership transferred successfully'
            });
        });

        it('should return 403 if user is not authorized', async () => {
            // Setup
            mockRequest.params = { teamId: '1' };
            mockRequest.body = { newLeaderId: 3 };
            mockRequest.user = { id: 2, role: 'participant' };

            Team.findById.mockResolvedValue({
                id: 1,
                name: 'Team Name',
                leader_id: 1
            });

            // Test
            await teamController.transferLeadership(mockRequest, mockResponse);

            // Assertions
            expect(Team.transferLeadership).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Forbidden: Only the team leader or admin can transfer leadership'
            });
        });

        it('should catch and handle validation errors', async () => {
            // Setup
            mockRequest.params = { teamId: '1' };
            mockRequest.body = { newLeaderId: 3 };
            mockRequest.user = { id: 1, role: 'participant' };

            Team.findById.mockResolvedValue({
                id: 1,
                name: 'Team Name',
                leader_id: 1
            });

            const error = new Error('New leader must be a member of the team');
            Team.transferLeadership.mockRejectedValue(error);

            // Test
            await teamController.transferLeadership(mockRequest, mockResponse);

            // Assertions
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: error.message
            });
        });
    });

    describe('deleteTeam', () => {
        it('should delete team successfully', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            mockRequest.user = { id: 1, role: 'participant' };

            Team.findById.mockResolvedValue({
                id: 1,
                name: 'Team Name',
                leader_id: 1
            });

            Team.delete.mockResolvedValue(true);

            // Test
            await teamController.deleteTeam(mockRequest, mockResponse);

            // Assertions
            expect(Team.findById).toHaveBeenCalledWith('1');
            expect(Team.delete).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Team deleted successfully'
            });
        });

        it('should return 403 if user is not authorized', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            mockRequest.user = { id: 2, role: 'participant' };

            Team.findById.mockResolvedValue({
                id: 1,
                name: 'Team Name',
                leader_id: 1
            });

            // Test
            await teamController.deleteTeam(mockRequest, mockResponse);

            // Assertions
            expect(Team.delete).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Forbidden: Only the team leader or admin can delete the team'
            });
        });

        it('should return 404 when team not found', async () => {
            // Setup
            mockRequest.params = { id: '999' };
            Team.findById.mockResolvedValue(null);

            // Test
            await teamController.deleteTeam(mockRequest, mockResponse);

            // Assertions
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Team not found'
            });
        });
    });
});