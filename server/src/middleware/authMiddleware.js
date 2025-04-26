import jwt from 'jsonwebtoken';
import { User } from '../models/userModel.js';

/**
 * Middleware to authenticate user tokens
 */
export const authenticate = (req, res, next) => {
    try {
        // Get token from the authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided. Authentication required.' });
        }

        // Extract token from Bearer token
        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Add user info to the request
        req.user = decoded;

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        return res.status(401).json({ message: 'Invalid token' });
    }
};

/**
 * Middleware to authorize specific roles
 * @param {string|string[]} roles - Role(s) allowed to access the route
 */
export const authorize = (roles) => {
    return async (req, res, next) => {
        try {
            // Check if user exists and has valid role
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ message: 'Authentication required' });
            }

            const hasRequiredRole = await User.hasRole(userId, roles);

            if (!hasRequiredRole) {
                return res.status(403).json({
                    message: 'Access denied. You do not have the required role to perform this action'
                });
            }

            next();
        } catch (error) {
            console.error('Authorization error:', error);
            return res.status(500).json({ message: 'Authorization failed', error: error.message });
        }
    };
};

/**
 * Middleware to verify the user is accessing their own resource or is an admin
 */
export const verifyOwnerOrAdmin = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const resourceId = parseInt(req.params.id);

        if (!userId || !resourceId) {
            return res.status(400).json({ message: 'Invalid request parameters' });
        }

        // Check if user is admin
        const isAdmin = await User.hasRole(userId, 'admin');

        // Check if user is the owner of the resource
        const isOwner = userId === resourceId;

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                message: 'Access denied. You can only manage your own account unless you are an admin'
            });
        }

        next();
    } catch (error) {
        console.error('Owner verification error:', error);
        return res.status(500).json({ message: 'Authorization failed', error: error.message });
    }
};