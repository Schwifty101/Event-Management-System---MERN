import { pool } from '../config/db.js';

export class EventRound {
    /**
     * Create a new event round
     * @param {Object} roundData - Round data to create
     * @returns {Object} Created round
     */
    static async create(roundData) {
        try {
            const {
                event_id, name, description, start_time, end_time,
                location, capacity, round_type, status
            } = roundData;

            // Validate required fields
            if (!event_id || !name || !start_time || !end_time) {
                throw new Error('Missing required fields');
            }

            // Check for time conflicts with other rounds in the same event
            const conflicts = await this.checkTimeConflicts(event_id, null, start_time, end_time);
            if (conflicts.length > 0) {
                throw new Error('Time conflict with another round in this event');
            }

            const query = `
                INSERT INTO event_rounds (
                    event_id, name, description, start_time, end_time,
                    location, capacity, round_type, status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await pool.execute(query, [
                event_id,
                name,
                description || null,
                start_time,
                end_time,
                location || null,
                capacity || null,
                round_type || 'preliminary',
                status || 'upcoming'
            ]);

            return { id: result.insertId, ...roundData };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find a round by ID
     * @param {number} id - Round ID to search for
     * @returns {Object|null} Round object or null if not found
     */
    static async findById(id) {
        try {
            const query = `
                SELECT r.*, e.title as event_title
                FROM event_rounds r
                JOIN events e ON r.event_id = e.id
                WHERE r.id = ?
            `;

            const [rows] = await pool.execute(query, [id]);
            return rows.length ? rows[0] : null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all rounds for an event
     * @param {number} eventId - Event ID
     * @returns {Array} Array of rounds
     */
    static async findByEventId(eventId) {
        try {
            const query = `
                SELECT * FROM event_rounds
                WHERE event_id = ?
                ORDER BY start_time
            `;

            const [rows] = await pool.execute(query, [eventId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update a round
     * @param {number} id - Round ID to update
     * @param {Object} roundData - Updated round data
     * @returns {Object} Updated round
     */
    static async update(id, roundData) {
        try {
            const {
                name, description, start_time, end_time,
                location, capacity, round_type, status
            } = roundData;

            // Get current round data
            const currentRound = await this.findById(id);
            if (!currentRound) {
                throw new Error('Round not found');
            }

            // Check for time conflicts with other rounds in the same event
            if (start_time || end_time) {
                const newStartTime = start_time || currentRound.start_time;
                const newEndTime = end_time || currentRound.end_time;

                const conflicts = await this.checkTimeConflicts(
                    currentRound.event_id,
                    id,
                    newStartTime,
                    newEndTime
                );

                if (conflicts.length > 0) {
                    throw new Error('Time conflict with another round in this event');
                }
            }

            // Build update query
            let query = 'UPDATE event_rounds SET ';
            const params = [];

            // Add fields to update
            const fields = {
                name, description, start_time, end_time,
                location, capacity, round_type, status
            };

            for (const [field, value] of Object.entries(fields)) {
                if (value !== undefined) {
                    query += `${field} = ?, `;
                    params.push(value);
                }
            }

            // Add updated_at and remove trailing comma
            query = query.slice(0, -2) + ' WHERE id = ?';
            params.push(id);

            await pool.execute(query, params);

            // Return updated round
            return await this.findById(id);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete a round
     * @param {number} id - Round ID to delete
     * @returns {boolean} Success status
     */
    static async delete(id) {
        try {
            const [result] = await pool.execute('DELETE FROM event_rounds WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Check for time conflicts with other rounds in the same event
     * @param {number} eventId - Event ID
     * @param {number|null} excludeRoundId - Round ID to exclude from check (for updates)
     * @param {string} startTime - Start time in ISO format
     * @param {string} endTime - End time in ISO format
     * @returns {Array} Conflicting rounds, empty if no conflicts
     */
    static async checkTimeConflicts(eventId, excludeRoundId, startTime, endTime) {
        try {
            let query = `
                SELECT * FROM event_rounds
                WHERE event_id = ?
                AND ((start_time <= ? AND end_time >= ?) OR
                    (start_time <= ? AND end_time >= ?) OR
                    (start_time >= ? AND end_time <= ?))
            `;

            const params = [
                eventId,
                startTime, startTime,  // Case 1: New start time is within an existing round
                endTime, endTime,      // Case 2: New end time is within an existing round
                startTime, endTime     // Case 3: New round completely overlaps an existing round
            ];

            // Exclude the current round when updating
            if (excludeRoundId) {
                query += ' AND id <> ?';
                params.push(excludeRoundId);
            }

            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get rounds with upcoming status
     * @param {Object} options - Filtering options
     * @returns {Array} Array of upcoming rounds
     */
    static async getUpcomingRounds(options = {}) {
        try {
            let query = `
                SELECT r.*, e.title as event_title, e.category
                FROM event_rounds r
                JOIN events e ON r.event_id = e.id
                WHERE r.status = 'upcoming'
            `;

            const params = [];

            // Add category filter if provided
            if (options.category) {
                query += ' AND e.category = ?';
                params.push(options.category);
            }

            // Add date range filter if provided
            if (options.startDate) {
                query += ' AND r.start_time >= ?';
                params.push(options.startDate);
            }

            if (options.endDate) {
                query += ' AND r.start_time <= ?';
                params.push(options.endDate);
            }

            // Add sorting
            query += ' ORDER BY r.start_time ASC';

            // Add pagination
            if (options.limit) {
                query += ' LIMIT ?';
                params.push(parseInt(options.limit));

                if (options.offset) {
                    query += ' OFFSET ?';
                    params.push(parseInt(options.offset));
                }
            }

            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Register a participant for a round
     * @param {number} roundId - Round ID
     * @param {number} userId - User ID
     * @returns {Object} Registration result
     */
    static async registerParticipant(roundId, userId) {
        try {
            // Check if the round exists and has capacity
            const round = await this.findById(roundId);
            if (!round) {
                throw new Error('Round not found');
            }

            // Check capacity if set
            if (round.capacity) {
                const [countResult] = await pool.execute(
                    'SELECT COUNT(*) as count FROM round_participants WHERE round_id = ?',
                    [roundId]
                );

                if (countResult[0].count >= round.capacity) {
                    throw new Error('Round is at full capacity');
                }
            }

            // Register the participant
            const query = `
                INSERT INTO round_participants (round_id, user_id)
                VALUES (?, ?)
            `;

            await pool.execute(query, [roundId, userId]);

            return { success: true, message: 'Registered successfully for the round' };
        } catch (error) {
            // Handle duplicate registration
            if (error.code === 'ER_DUP_ENTRY') {
                return { success: false, message: 'Already registered for this round' };
            }
            throw error;
        }
    }

    /**
     * Update participant status and score in a round
     * @param {number} roundId - Round ID
     * @param {number} userId - User ID
     * @param {Object} data - Update data (status, score)
     * @returns {boolean} Success status
     */
    static async updateParticipantStatus(roundId, userId, data) {
        try {
            const { status, score } = data;

            let query = 'UPDATE round_participants SET ';
            const params = [];

            if (status !== undefined) {
                query += 'status = ?, ';
                params.push(status);
            }

            if (score !== undefined) {
                query += 'score = ?, ';
                params.push(score);
            }

            // Remove trailing comma and add WHERE clause
            query = query.slice(0, -2) + ' WHERE round_id = ? AND user_id = ?';
            params.push(roundId, userId);

            const [result] = await pool.execute(query, params);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get participants for a round
     * @param {number} roundId - Round ID
     * @returns {Array} Array of participants with user details
     */
    static async getParticipants(roundId) {
        try {
            const query = `
                SELECT rp.*, u.name, u.email 
                FROM round_participants rp
                JOIN users u ON rp.user_id = u.id
                WHERE rp.round_id = ?
                ORDER BY rp.score DESC NULLS LAST
            `;

            const [rows] = await pool.execute(query, [roundId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }
}