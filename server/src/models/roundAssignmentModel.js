import { pool } from '../config/db.js';

export class RoundAssignment {
    /**
     * Create a new round assignment
     * @param {Object} assignmentData - Assignment data
     * @returns {Object} Created assignment
     */
    static async create(assignmentData) {
        try {
            const query = `
                INSERT INTO round_assignments (
                    round_id, user_id, role, status
                )
                VALUES (?, ?, ?, ?)
            `;

            const [result] = await pool.execute(query, [
                assignmentData.round_id,
                assignmentData.user_id,
                assignmentData.role,
                assignmentData.status || 'assigned'
            ]);

            return { id: result.insertId, ...assignmentData };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find assignment by ID
     * @param {number} id - Assignment ID
     * @returns {Object|null} Assignment object or null if not found
     */
    static async findById(id) {
        try {
            const query = `
                SELECT a.*, u.name as user_name, u.email as user_email,
                       r.name as round_name, r.type as round_type,
                       e.title as event_title, e.id as event_id
                FROM round_assignments a
                JOIN users u ON a.user_id = u.id
                JOIN event_rounds r ON a.round_id = r.id
                JOIN events e ON r.event_id = e.id
                WHERE a.id = ?
            `;

            const [rows] = await pool.execute(query, [id]);
            return rows.length ? rows[0] : null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all assignments for a round
     * @param {number} roundId - Round ID
     * @param {string} role - Optional role filter (participant or judge)
     * @returns {Array} Array of assignments
     */
    static async findByRoundId(roundId, role = null) {
        try {
            let query = `
                SELECT a.*, u.name as user_name, u.email as user_email
                FROM round_assignments a
                JOIN users u ON a.user_id = u.id
                WHERE a.round_id = ?
            `;

            const params = [roundId];

            // Filter by role if specified
            if (role) {
                query += ' AND a.role = ?';
                params.push(role);
            }

            query += ' ORDER BY a.role, u.name';

            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all assignments for a user in an event
     * @param {number} userId - User ID
     * @param {number} eventId - Event ID
     * @returns {Array} Array of assignments
     */
    static async findByUserAndEvent(userId, eventId) {
        try {
            const query = `
                SELECT a.*, r.name as round_name, r.type as round_type,
                       r.start_time, r.end_time
                FROM round_assignments a
                JOIN event_rounds r ON a.round_id = r.id
                WHERE a.user_id = ? AND r.event_id = ?
                ORDER BY r.start_time
            `;

            const [rows] = await pool.execute(query, [userId, eventId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update an assignment
     * @param {number} id - Assignment ID
     * @param {Object} assignmentData - Updated assignment data
     * @returns {Object} Updated assignment
     */
    static async update(id, assignmentData) {
        try {
            let query = 'UPDATE round_assignments SET ';
            const params = [];

            // Add fields to update
            if (assignmentData.status) {
                query += 'status = ?, ';
                params.push(assignmentData.status);
            }

            if (assignmentData.score !== undefined) {
                query += 'score = ?, ';
                params.push(assignmentData.score);
            }

            if (assignmentData.feedback) {
                query += 'feedback = ?, ';
                params.push(assignmentData.feedback);
            }

            // Add updated_at and remove trailing comma
            query += 'updated_at = NOW() WHERE id = ?';
            params.push(id);

            await pool.execute(query, params);
            return { id, ...assignmentData };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete an assignment
     * @param {number} id - Assignment ID
     * @returns {boolean} Success status
     */
    static async delete(id) {
        try {
            const [result] = await pool.execute('DELETE FROM round_assignments WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Check if a user is available for a round
     * @param {number} userId - User ID
     * @param {Object} roundData - Round data with start_time and end_time
     * @param {number} excludeRoundId - Round ID to exclude from check (for updates)
     * @returns {Array} Array of conflicts
     */
    static async checkUserAvailability(userId, roundData, excludeRoundId = null) {
        try {
            let query = `
                SELECT a.id, r.name as round_name, r.start_time, r.end_time, 
                       e.title as event_title
                FROM round_assignments a
                JOIN event_rounds r ON a.round_id = r.id
                JOIN events e ON r.event_id = e.id
                WHERE a.user_id = ? AND (
                    (r.start_time < ? AND r.end_time > ?) OR
                    (r.start_time < ? AND r.end_time > ?) OR
                    (r.start_time >= ? AND r.end_time <= ?)
                )
            `;

            const params = [
                userId,
                roundData.end_time,
                roundData.start_time,
                roundData.end_time,
                roundData.start_time,
                roundData.start_time,
                roundData.end_time
            ];

            // Exclude the current round in case of update
            if (excludeRoundId) {
                query += ' AND r.id != ?';
                params.push(excludeRoundId);
            }

            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Count number of assignments for a round
     * @param {number} roundId - Round ID
     * @param {string} role - Role type (participant or judge)
     * @returns {number} Count of assignments
     */
    static async countByRound(roundId, role) {
        try {
            const query = `
                SELECT COUNT(*) as count
                FROM round_assignments
                WHERE round_id = ? AND role = ?
            `;

            const [rows] = await pool.execute(query, [roundId, role]);
            return rows[0].count;
        } catch (error) {
            throw error;
        }
    }
}