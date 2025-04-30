import { pool } from '../config/db.js';
import bcrypt from 'bcrypt';

export class User {
    /**
     * Create a new user
     * @param {Object} userData - User data to create
     * @returns {Object} Created user
     */
    static async create(userData) {
        try {
            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            // Validate role
            const validRoles = ['admin', 'organizer', 'participant', 'sponsor', 'judge'];
            const role = validRoles.includes(userData.role) ? userData.role : 'participant';

            // SQL query to insert user
            const query = `
        INSERT INTO users (name, email, password, role)
        VALUES (?, ?, ?, ?)
      `;

            const [result] = await pool.execute(query, [
                userData.name,
                userData.email,
                hashedPassword,
                role
            ]);

            return { id: result.insertId, ...userData, password: undefined };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find a user by email
     * @param {string} email - Email to search for
     * @returns {Object|null} User object or null if not found
     */
    static async findByEmail(email) {
        try {
            const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
            return rows.length ? rows[0] : null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find a user by ID
     * @param {number} id - User ID to search for
     * @returns {Object|null} User object or null if not found
     */
    static async findById(id) {
        try {
            const [rows] = await pool.execute('SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?', [id]);
            return rows.length ? rows[0] : null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all users (with pagination)
     * @param {number} page - Page number
     * @param {number} limit - Results per page
     * @param {Object} filters - Optional filters
     * @returns {Array} Array of users
     */
    static async findAll(page = 1, limit = 10, filters = {}) {
        try {
            // Ensure page and limit are integers
            const pageNum = Number(page) || 1;
            const limitNum = Number(limit) || 10;
            const offset = (pageNum - 1) * limitNum;

            let query = 'SELECT id, name, email, role, created_at, updated_at FROM users';
            const params = [];

            // Apply role filter if provided
            if (filters.role) {
                query += ' WHERE role = ?';
                params.push(String(filters.role));
            }

            // Add pagination using numeric literals for LIMIT and OFFSET
            // MySQL expects these to be integers, so we'll construct the query differently
            const finalQuery = `${query} LIMIT ${limitNum} OFFSET ${offset}`;

            const [rows] = await pool.execute(finalQuery, params);
            return rows;
        } catch (error) {
            console.error('Error in findAll:', error);
            throw error;
        }
    }

    /**
     * Count users by role
     * @returns {Object} Object with role counts
     */
    static async countByRole() {
        try {
            const [rows] = await pool.execute(
                'SELECT role, COUNT(*) as count FROM users GROUP BY role'
            );

            const roleCounts = {
                admin: 0,
                organizer: 0,
                participant: 0,
                sponsor: 0,
                judge: 0
            };

            rows.forEach(row => {
                roleCounts[row.role] = row.count;
            });

            return roleCounts;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update a user
     * @param {number} id - User ID to update
     * @param {Object} userData - Updated user data
     * @returns {Object} Updated user
     */
    static async update(id, userData) {
        try {
            let query = 'UPDATE users SET ';
            const params = [];

            // Add fields to update
            if (userData.name) {
                query += 'name = ?, ';
                params.push(userData.name);
            }

            if (userData.email) {
                query += 'email = ?, ';
                params.push(userData.email);
            }

            if (userData.password) {
                query += 'password = ?, ';
                const hashedPassword = await bcrypt.hash(userData.password, 10);
                params.push(hashedPassword);
            }

            if (userData.role) {
                // Validate role
                const validRoles = ['admin', 'organizer', 'participant', 'sponsor', 'judge'];
                if (validRoles.includes(userData.role)) {
                    query += 'role = ?, ';
                    params.push(userData.role);
                }
            }

            // Add updated_at and remove trailing comma
            query += 'updated_at = NOW() WHERE id = ?';
            params.push(id);

            await pool.execute(query, params);
            return { id, ...userData, password: undefined };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete a user
     * @param {number} id - User ID to delete
     * @returns {boolean} Success status
     */
    static async delete(id) {
        try {
            const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Check if user has a specific role
     * @param {number} id - User ID
     * @param {string|string[]} roles - Role(s) to check
     * @returns {Promise<boolean>} True if user has any of the roles
     */
    static async hasRole(id, roles) {
        try {
            const user = await this.findById(id);
            if (!user) return false;

            const rolesToCheck = Array.isArray(roles) ? roles : [roles];
            return rolesToCheck.includes(user.role);
        } catch (error) {
            console.error('Error checking user role:', error);
            return false;
        }
    }
}