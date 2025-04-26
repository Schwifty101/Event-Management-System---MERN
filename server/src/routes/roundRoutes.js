import express from 'express';
import {
    createRound,
    getRoundsByEventId,
    getRoundById,
    updateRound,
    deleteRound,
    getUpcomingRounds,
    registerParticipant,
    updateParticipantStatus,
    getRoundParticipants
} from '../controllers/eventRoundController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/upcoming', getUpcomingRounds);
router.get('/event/:eventId', getRoundsByEventId);
router.get('/:id', getRoundById);

// Protected routes - require authentication
router.post('/register/:roundId', authenticate, registerParticipant);

// Routes for event organizers and admins only
router.post('/', authenticate, authorize(['admin', 'organizer']), createRound);
router.put('/:id', authenticate, authorize(['admin', 'organizer']), updateRound);
router.delete('/:id', authenticate, authorize(['admin', 'organizer']), deleteRound);

// Routes for judges, organizers and admins
router.get('/:roundId/participants', authenticate, authorize(['admin', 'organizer', 'judge']), getRoundParticipants);
router.put('/:roundId/participant/:userId', authenticate, authorize(['admin', 'organizer', 'judge']), updateParticipantStatus);

export default router;