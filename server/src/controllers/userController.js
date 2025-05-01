import { User } from '../models/userModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

/**
 * Register a new user
 */
export const createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide name, email, and password' });
        }

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }

        // Validate role - allow specific roles for public registration but prevent admin registration
        let userRole = 'participant'; // Default role
        if (role) {
            // If a specific role is requested, check if the request comes from an admin
            if (req.user && req.user.role === 'admin') {
                // Admin can assign any role
                userRole = role;
            } else if (req.path.includes('/register')) {
                // For public registration, allow specific roles but not admin
                const allowedPublicRoles = ['participant', 'organizer', 'sponsor', 'judge'];
                if (allowedPublicRoles.includes(role)) {
                    userRole = role;
                }
                // If role is admin or invalid, default to participant
                if (role === 'admin' || !allowedPublicRoles.includes(role)) {
                    userRole = 'participant';
                }
            } else {
                return res.status(403).json({ message: 'Only admins can assign roles' });
            }
        }

        // Create new user
        const newUser = await User.create({
            name,
            email,
            password,
            role: userRole
        });

        // Generate token for auto-login after registration
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, role: newUser.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token, // Provide token for auto-login
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('Error in createUser:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * User login
 */
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Find user by email
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error in loginUser:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get all users - role filtered by query parameter
 */
export const getAllUsers = async (req, res) => {
    try {
        // Only admin can see all users
        // Organizers can see participants for their events (implemented in event controller)
        if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const filters = {};

        // Apply role filter if provided
        if (req.query.role) {
            // Validate role
            const validRoles = ['admin', 'organizer', 'participant', 'sponsor', 'judge'];
            if (validRoles.includes(req.query.role)) {
                filters.role = req.query.role;
            }
        }

        const users = await User.findAll(page, limit, filters);

        // Get total counts by role
        const roleCounts = await User.countByRole();

        res.status(200).json({
            users,
            meta: {
                page,
                limit,
                roleCounts
            }
        });
    } catch (error) {
        console.error('Error in getAllUsers:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get user by ID
 */
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error('Error in getUserById:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Update user
 */
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, role } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const updateData = { name, email, password };

        // Only admin can update role
        if (role && req.user.role === 'admin') {
            updateData.role = role;
        }

        // Update user
        const updatedUser = await User.update(id, updateData);

        res.status(200).json({
            message: 'User updated successfully',
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role || user.role
            }
        });
    } catch (error) {
        console.error('Error in updateUser:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Delete user
 */
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const success = await User.delete(id);

        if (!success) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error in deleteUser:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get current authenticated user profile
 */
export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error('Error in getCurrentUser:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Change user password
 */
export const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }

        // Get user with password
        const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
        if (!rows.length) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = rows[0];

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Update password
        await User.update(userId, { password: newPassword });

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error in changePassword:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};