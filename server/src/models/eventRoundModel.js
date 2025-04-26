import { pool } from '../config/db.js';

export class EventRound {
    /**
     * Create a new event round
     * @param {Object} roundData - Round data
     * @returns {Object} Created round
     */
    static async create(roundData) {
        try {
            const query = `
                INSERT INTO event_rounds (
                    event_id, name, type, description, start_time, 
                    end_time, location, judges_required, max_participants
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await pool.execute(query, [
                roundData.event_id,
                roundData.name,
                roundData.type,
                roundData.description || null,
                roundData.start_time,
                roundData.end_time,
                roundData.location || null,
                roundData.judges_required || 1,
                roundData.max_participants || null
            ]);

            return { id: result.insertId, ...roundData };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find a round by ID
     * @param {number} id - Round ID
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
                ORDER BY type, start_time
            `;

            const [rows] = await pool.execute(query, [eventId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update a round
     * @param {number} id - Round ID
     * @param {Object} roundData - Updated round data
     * @returns {Object} Updated round
     */
    static async update(id, roundData) {
        try {
            const fields = [
                'name', 'type', 'description', 'start_time', 'end_time', 
                'location', 'judges_required', 'max_participants'
            ];

            let query = 'UPDATE event_rounds SET ';
            const params = [];

            // Add fields to update
            fields.forEach(field => {
                if (roundData[field] !== undefined) {
                    query += `${field} = ?, `;
                    params.push(roundData[field]);
                }
            });

            // Add updated_at and remove trailing comma
            query += 'updated_at = NOW() WHERE id = ?';
            params.push(id);

            await pool.execute(query, params);
            return { id, ...roundData };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete a round
     * @param {number} id - Round ID
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
     * Check for scheduling conflicts
     * @param {Object} roundData - Round data to check
     * @param {number} excludeRoundId - Round ID to exclude from conflict check (for updates)
     * @returns {Array} Array of conflicts
     */
    static async checkSchedulingConflicts(roundData, excludeRoundId = null) {
        try {
            let query = `
                SELECT r.id, r.name, r.type, r.start_time, r.end_time, e.title as event_title
                FROM event_rounds r
                JOIN events e ON r.event_id = e.id
                WHERE 
                    (r.start_time < ? AND r.end_time > ?) OR
                    (r.start_time < ? AND r.end_time > ?) OR
                    (r.start_time >= ? AND r.end_time <= ?)
            `;

            const params = [
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
            
            // If checking conflicts for a specific location
            if (roundData.location) {
                query += ' AND r.location = ?';
                params.push(roundData.location);
            }

            // If checking conflicts within the same event
            if (roundData.event_id) {
                query += ' AND r.event_id = ?';
                params.push(roundData.event_id);
            }

            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }
}