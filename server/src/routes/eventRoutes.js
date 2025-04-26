import express from 'express';
import { getAllEvents, getEventById, createEvent, updateEvent, deleteEvent, getEventsByCategory } from '../controllers/eventController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.get('/category/:category', getEventsByCategory);

// Protected routes with role-based access control
router.post('/', authenticate, authorize(['admin', 'organizer']), createEvent);
router.put('/:id', authenticate, authorize(['admin', 'organizer']), updateEvent);
router.delete('/:id', authenticate, authorize(['admin', 'organizer']), deleteEvent);

export default router;