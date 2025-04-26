import express from 'express';
import { getAllCategories, getCategoryByName, createCategory, updateCategory, getEventCountByCategory } from '../controllers/eventCategoryController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllCategories);
router.get('/stats', getEventCountByCategory);
router.get('/:name', getCategoryByName);

// Admin only routes
router.post('/', authenticate, authorize(['admin']), createCategory);
router.put('/:id', authenticate, authorize(['admin']), updateCategory);

export default router;