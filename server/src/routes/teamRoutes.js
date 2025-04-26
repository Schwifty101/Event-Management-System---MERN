import express from 'express';
import {
    createTeam,
    getTeamById,
    getTeamsByEventId,
    getUserTeams,
    updateTeam,
    addTeamMember,
    removeTeamMember,
    transferLeadership,
    deleteTeam
} from '../controllers/teamController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes for authenticated users
router.get('/my-teams', authenticate, getUserTeams);
router.get('/:id', authenticate, getTeamById);
router.get('/event/:eventId', authenticate, getTeamsByEventId);

// Team management routes
router.post('/', authenticate, createTeam);
router.put('/:id', authenticate, updateTeam);
router.delete('/:id', authenticate, deleteTeam);

// Team members management
router.post('/:teamId/members', authenticate, addTeamMember);
router.delete('/:teamId/members/:userId', authenticate, removeTeamMember);
router.post('/:teamId/transfer-leadership', authenticate, transferLeadership);

export default router;