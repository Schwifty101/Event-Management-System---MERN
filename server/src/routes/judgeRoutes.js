import express from 'express';
import {
    assignJudge,
    getEventJudges,
    getRoundJudges,
    getJudgeAssignments,
    updateAssignmentStatus,
    removeJudgeAssignment,
    submitScores,
    declareWinners,
    getLeaderboard
} from '../controllers/judgeController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Event organizer and admin routes
router.post('/assign', authenticate, authorize(['admin', 'organizer']), assignJudge);
router.delete('/assignments/:assignmentId', authenticate, authorize(['admin', 'organizer']), removeJudgeAssignment);
router.post('/rounds/:roundId/declare-winners', authenticate, authorize(['admin', 'organizer']), declareWinners);

// Judge routes
router.get('/my-assignments', authenticate, authorize(['judge']), getJudgeAssignments);
router.put('/assignments/:assignmentId/status', authenticate, authorize(['judge']), updateAssignmentStatus);
router.post('/rounds/:roundId/scores', authenticate, authorize(['judge']), submitScores);

// Routes for event stakeholders
router.get('/events/:eventId', authenticate, getEventJudges);
router.get('/rounds/:roundId', authenticate, getRoundJudges);
router.get('/rounds/:roundId/leaderboard', authenticate, getLeaderboard);

export default router;