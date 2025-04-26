import express from 'express';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser, loginUser, getCurrentUser, changePassword } from '../controllers/userController.js';
import { authenticate, authorize, verifyOwnerOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/login', loginUser);
router.post('/register', createUser);

// Protected routes - require authentication
router.get('/me', authenticate, getCurrentUser);
router.post('/change-password', authenticate, changePassword);

// Admin only routes
router.get('/', authenticate, authorize(['admin', 'organizer']), getAllUsers);
router.post('/', authenticate, authorize(['admin']), createUser);

// Owner or admin routes - users can only manage their own account unless they are admin
router.get('/:id', authenticate, verifyOwnerOrAdmin, getUserById);
router.put('/:id', authenticate, verifyOwnerOrAdmin, updateUser);
router.delete('/:id', authenticate, verifyOwnerOrAdmin, deleteUser);

export default router;