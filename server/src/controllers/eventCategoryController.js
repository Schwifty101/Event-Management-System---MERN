import { EventCategory } from '../models/eventCategoryModel.js';

/**
 * Get all event categories
 */
export const getAllCategories = async (req, res) => {
    try {
        const categories = await EventCategory.findAll();
        res.status(200).json({ categories });
    } catch (error) {
        console.error('Error in getAllCategories:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get event category by name
 */
export const getCategoryByName = async (req, res) => {
    try {
        const { name } = req.params;

        const category = await EventCategory.findByName(name);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.status(200).json({ category });
    } catch (error) {
        console.error('Error in getCategoryByName:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Create a new event category (admin only)
 */
export const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        // Validate input
        if (!name) {
            return res.status(400).json({ message: 'Category name is required' });
        }

        // Check if category already exists
        const existingCategory = await EventCategory.findByName(name);
        if (existingCategory) {
            return res.status(409).json({ message: 'Category with this name already exists' });
        }

        // Create category
        const newCategory = await EventCategory.create({ name, description });

        res.status(201).json({
            message: 'Category created successfully',
            category: newCategory
        });
    } catch (error) {
        console.error('Error in createCategory:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Update an event category (admin only)
 */
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        // Check if category exists
        const category = await EventCategory.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // If name is being changed, check if new name already exists
        if (name && name !== category.name) {
            const existingCategory = await EventCategory.findByName(name);
            if (existingCategory) {
                return res.status(409).json({ message: 'Category with this name already exists' });
            }
        }

        // Update category
        const updatedCategory = await EventCategory.update(id, { name, description });

        res.status(200).json({
            message: 'Category updated successfully',
            category: updatedCategory
        });
    } catch (error) {
        console.error('Error in updateCategory:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get event count by category
 */
export const getEventCountByCategory = async (req, res) => {
    try {
        const categoryCounts = await EventCategory.getEventCountByCategory();
        res.status(200).json({ categories: categoryCounts });
    } catch (error) {
        console.error('Error in getEventCountByCategory:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};