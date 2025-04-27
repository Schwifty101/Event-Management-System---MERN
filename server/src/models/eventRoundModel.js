import { pool } from '../config/db.js';

export class EventRound {
    /**
     * Create a new event round
     * @param {Object} roundData - Round data
     * @returns {Object} Created round
     */
    static async create(roundData) {
        try {
            const {
                event_id, name, description, round_type,
                start_time, end_time, location, max_participants
            } = roundData;

            if (!event_id || !name || !round_type) {
                throw new Error('Event ID, name, and round type are required');
            }

            const query = `
                INSERT INTO event_rounds (
                    event_id, name, description, round_type,
                    start_time, end_time, location, max_participants
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await pool.execute(query, [
                event_id, name, description, round_type,
                start_time || null, end_time || null,
                location || null, max_participants || null
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
            const [rows] = await pool.execute(`
                SELECT er.*, e.title as event_title
                FROM event_rounds er
                JOIN events e ON er.event_id = e.id
                WHERE er.id = ?
            `, [id]);

            return rows.length ? rows[0] : null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find rounds by event ID
     * @param {number} eventId - Event ID
     * @returns {Array} Array of rounds
     */
    static async findByEventId(eventId) {
        try {
            const [rows] = await pool.execute(`
                SELECT er.*, 
                       (SELECT COUNT(*) FROM round_participants WHERE round_id = er.id) as participant_count
                FROM event_rounds er
                WHERE er.event_id = ?
                ORDER BY er.start_time IS NULL, er.start_time
            `, [eventId]);

            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update a round
     * @param {number} id - Round ID
     * @param {Object} updateData - Data to update
     * @returns {Object} Updated round
     */
    static async update(id, updateData) {
        try {
            const allowedFields = [
                'name', 'description', 'round_type',
                'start_time', 'end_time', 'location', 'max_participants', 'status'
            ];

            // Filter out undefined values and non-allowed fields
            const updates = Object.keys(updateData)
                .filter(key => allowedFields.includes(key) && updateData[key] !== undefined)
                .reduce((obj, key) => {
                    obj[key] = updateData[key];
                    return obj;
                }, {});

            if (Object.keys(updates).length === 0) {
                throw new Error('No valid fields to update');
            }

            // Build the SET part of the query
            const setClause = Object.keys(updates)
                .map(key => `${key} = ?`)
                .join(', ');

            const query = `UPDATE event_rounds SET ${setClause} WHERE id = ?`;

            // Prepare values for the query
            const values = [...Object.values(updates), id];

            await pool.execute(query, values);

            return this.findById(id);
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
            // First remove all participants, judge assignments, etc.
            await pool.execute('DELETE FROM round_participants WHERE round_id = ?', [id]);
            await pool.execute('DELETE FROM judge_assignments WHERE round_id = ?', [id]);

            // Now delete the round
            const [result] = await pool.execute('DELETE FROM event_rounds WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Add participant to a round
     * @param {number} roundId - Round ID
     * @param {Object} participantData - Participant data (user_id or team_id)
     * @returns {Object} Created participation record
     */
    static async addParticipant(roundId, participantData) {
        try {
            const { user_id, team_id } = participantData;

            if (!user_id && !team_id) {
                throw new Error('Either user_id or team_id is required');
            }

            // Check if already registered
            let checkQuery = 'SELECT * FROM round_participants WHERE round_id = ? AND ';
            let checkParams = [roundId];

            if (user_id) {
                checkQuery += 'user_id = ?';
                checkParams.push(user_id);
            } else {
                checkQuery += 'team_id = ?';
                checkParams.push(team_id);
            }

            const [existingParticipant] = await pool.execute(checkQuery, checkParams);

            if (existingParticipant.length > 0) {
                throw new Error('Participant is already registered for this round');
            }

            // Add participant
            const query = `
                INSERT INTO round_participants (round_id, user_id, team_id, status)
                VALUES (?, ?, ?, 'registered')
            `;

            const [result] = await pool.execute(query, [roundId, user_id || null, team_id || null]);

            return {
                id: result.insertId,
                round_id: roundId,
                user_id: user_id || null,
                team_id: team_id || null,
                status: 'registered'
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all participants for a round
     * @param {number} roundId - Round ID
     * @returns {Array} Array of participants
     */
    static async getParticipants(roundId) {
        try {
            const [rows] = await pool.execute(`
                SELECT rp.*, 
                       u.name as participant_name, u.email as participant_email,
                       t.name as team_name
                FROM round_participants rp
                LEFT JOIN users u ON rp.user_id = u.id
                LEFT JOIN teams t ON rp.team_id = t.id
                WHERE rp.round_id = ?
                ORDER BY rp.registered_at
            `, [roundId]);

            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get participants with scores for a round
     * @param {number} roundId - Round ID
     * @returns {Array} Array of participants with scores
     */
    static async getParticipantsWithScores(roundId) {
        try {
            const [rows] = await pool.execute(`
                SELECT rp.*, 
                       rp.score,
                       rp.technical_score,
                       rp.presentation_score,
                       rp.creativity_score,
                       rp.implementation_score,
                       rp.judge_comments,
                       u.name as participant_name, 
                       u.email as participant_email,
                       t.name as team_name
                FROM round_participants rp
                LEFT JOIN users u ON rp.user_id = u.id
                LEFT JOIN teams t ON rp.team_id = t.id
                WHERE rp.round_id = ?
                ORDER BY rp.score DESC, rp.registered_at
            `, [roundId]);

            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update participant status
     * @param {number} roundId - Round ID
     * @param {number} participantId - User ID or Team ID
     * @param {Object} updateData - Data to update
     * @returns {Object} Updated participant record
     */
    static async updateParticipantStatus(roundId, participantId, updateData) {
        try {
            const { status } = updateData;

            if (!status) {
                throw new Error('Status is required');
            }

            // Validate status
            const validStatuses = ['registered', 'checked_in', 'absent', 'disqualified', 'advanced', 'eliminated'];
            if (!validStatuses.includes(status)) {
                throw new Error('Invalid status');
            }

            // Check if participant is in this round
            const [participant] = await pool.execute(
                'SELECT * FROM round_participants WHERE round_id = ? AND (user_id = ? OR team_id = ?)',
                [roundId, participantId, participantId]
            );

            if (participant.length === 0) {
                throw new Error('Participant not found in this round');
            }

            // Update status
            await pool.execute(
                'UPDATE round_participants SET status = ? WHERE round_id = ? AND (user_id = ? OR team_id = ?)',
                [status, roundId, participantId, participantId]
            );

            // Get updated participant data
            const [updatedParticipant] = await pool.execute(`
                SELECT rp.*, 
                       u.name as participant_name, u.email as participant_email,
                       t.name as team_name
                FROM round_participants rp
                LEFT JOIN users u ON rp.user_id = u.id
                LEFT JOIN teams t ON rp.team_id = t.id
                WHERE rp.round_id = ? AND (rp.user_id = ? OR rp.team_id = ?)
            `, [roundId, participantId, participantId]);

            return updatedParticipant[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Calculate average scores for all participants in a round
     * @param {number} roundId - Round ID
     * @returns {boolean} Success status
     */
    static async calculateAverageScores(roundId) {
        try {
            // Get all participants with scores
            const [participants] = await pool.execute(`
                SELECT rp.id, rp.user_id, rp.team_id,
                       AVG(COALESCE(rp.score, 0)) as average_score
                FROM round_participants rp
                JOIN judge_scores js ON js.participant_id = rp.id
                WHERE rp.round_id = ?
                GROUP BY rp.id
            `, [roundId]);

            // Update average scores
            for (const participant of participants) {
                await pool.execute(
                    'UPDATE round_participants SET score = ? WHERE id = ?',
                    [participant.average_score, participant.id]
                );
            }

            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get winners for a round
     * @param {number} roundId - Round ID
     * @param {number} limit - Maximum number of winners to return
     * @returns {Array} Array of winners
     */
    static async getWinners(roundId, limit = 3) {
        try {
            const [winners] = await pool.execute(`
                SELECT rp.*, 
                       u.name as participant_name, u.email as participant_email,
                       t.name as team_name
                FROM round_participants rp
                LEFT JOIN users u ON rp.user_id = u.id
                LEFT JOIN teams t ON rp.team_id = t.id
                WHERE rp.round_id = ? AND rp.status = 'advanced'
                ORDER BY rp.score DESC
                LIMIT ?
            `, [roundId, limit]);

            return winners;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Advance winners to the next round
     * @param {number} currentRoundId - Current round ID
     * @param {number} nextRoundId - Next round ID
     * @param {Array} winnerIds - Array of winner user IDs or team IDs
     * @returns {boolean} Success status
     */
    static async advanceWinnersToNextRound(currentRoundId, nextRoundId, winnerIds) {
        try {
            // Start transaction
            await pool.execute('START TRANSACTION');

            try {
                // Get winner details from current round
                const winners = [];
                for (const id of winnerIds) {
                    const [participant] = await pool.execute(`
                        SELECT user_id, team_id
                        FROM round_participants
                        WHERE round_id = ? AND (user_id = ? OR team_id = ?)
                    `, [currentRoundId, id, id]);

                    if (participant.length > 0) {
                        winners.push(participant[0]);
                    }
                }

                // Add winners to next round
                for (const winner of winners) {
                    // Check if already added to next round
                    const { user_id, team_id } = winner;

                    let checkQuery = 'SELECT * FROM round_participants WHERE round_id = ? AND ';
                    let checkParams = [nextRoundId];

                    if (user_id) {
                        checkQuery += 'user_id = ?';
                        checkParams.push(user_id);
                    } else {
                        checkQuery += 'team_id = ?';
                        checkParams.push(team_id);
                    }

                    const [existingParticipant] = await pool.execute(checkQuery, checkParams);

                    if (existingParticipant.length === 0) {
                        // Add to next round
                        await pool.execute(`
                            INSERT INTO round_participants (round_id, user_id, team_id, status)
                            VALUES (?, ?, ?, 'advanced')
                        `, [nextRoundId, user_id || null, team_id || null]);
                    }
                }

                // Commit transaction
                await pool.execute('COMMIT');
                return true;
            } catch (error) {
                // Rollback on error
                await pool.execute('ROLLBACK');
                throw error;
            }
        } catch (error) {
            throw error;
        }
    }
}