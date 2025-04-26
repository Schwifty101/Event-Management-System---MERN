import { pool } from '../config/db.js';

export class JudgeAssignment {
    /**
     * Assign a judge to an event or round
     * @param {Object} assignmentData - Assignment data
     * @returns {Object} Created assignment
     */
    static async create(assignmentData) {
        try {
            const { event_id, round_id, judge_id } = assignmentData;

            if (!event_id || !judge_id) {
                throw new Error('Event ID and judge ID are required');
            }

            // Check if judge has the correct role
            const [judge] = await pool.execute(
                'SELECT role FROM users WHERE id = ?',
                [judge_id]
            );

            if (!judge.length || judge[0].role !== 'judge') {
                throw new Error('User must have a judge role to be assigned');
            }

            // Check if judge is already assigned to this event/round
            let checkQuery = 'SELECT * FROM judge_assignments WHERE event_id = ? AND judge_id = ?';
            let checkParams = [event_id, judge_id];

            if (round_id) {
                checkQuery += ' AND round_id = ?';
                checkParams.push(round_id);
            } else {
                checkQuery += ' AND round_id IS NULL';
            }

            const [existingAssignment] = await pool.execute(checkQuery, checkParams);

            if (existingAssignment.length > 0) {
                throw new Error('Judge is already assigned to this event/round');
            }

            // Create assignment
            const query = `
                INSERT INTO judge_assignments (event_id, round_id, judge_id)
                VALUES (?, ?, ?)
            `;

            const [result] = await pool.execute(query, [event_id, round_id || null, judge_id]);

            return { id: result.insertId, ...assignmentData };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find an assignment by ID
     * @param {number} id - Assignment ID
     * @returns {Object|null} Assignment object or null if not found
     */
    static async findById(id) {
        try {
            const [rows] = await pool.execute(`
                SELECT ja.*, e.title as event_title, 
                       u.name as judge_name, 
                       er.name as round_name
                FROM judge_assignments ja
                JOIN events e ON ja.event_id = e.id
                JOIN users u ON ja.judge_id = u.id
                LEFT JOIN event_rounds er ON ja.round_id = er.id
                WHERE ja.id = ?
            `, [id]);

            return rows.length ? rows[0] : null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find assignments by event ID
     * @param {number} eventId - Event ID
     * @returns {Array} Array of assignments
     */
    static async findByEventId(eventId) {
        try {
            const [rows] = await pool.execute(`
                SELECT ja.*, u.name as judge_name, 
                       er.name as round_name, er.round_type
                FROM judge_assignments ja
                JOIN users u ON ja.judge_id = u.id
                LEFT JOIN event_rounds er ON ja.round_id = er.id
                WHERE ja.event_id = ?
                ORDER BY ja.round_id, ja.assigned_at
            `, [eventId]);

            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find assignments by round ID
     * @param {number} roundId - Round ID
     * @returns {Array} Array of assignments
     */
    static async findByRoundId(roundId) {
        try {
            const [rows] = await pool.execute(`
                SELECT ja.*, u.name as judge_name, u.email as judge_email
                FROM judge_assignments ja
                JOIN users u ON ja.judge_id = u.id
                WHERE ja.round_id = ?
                ORDER BY ja.assigned_at
            `, [roundId]);

            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find assignments by judge ID
     * @param {number} judgeId - Judge user ID
     * @returns {Array} Array of assignments
     */
    static async findByJudgeId(judgeId) {
        try {
            const [rows] = await pool.execute(`
                SELECT ja.*, e.title as event_title, 
                       er.name as round_name, er.round_type,
                       er.start_time, er.end_time
                FROM judge_assignments ja
                JOIN events e ON ja.event_id = e.id
                LEFT JOIN event_rounds er ON ja.round_id = er.id
                WHERE ja.judge_id = ?
                ORDER BY er.start_time IS NULL, er.start_time, e.start_date
            `, [judgeId]);

            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update assignment status
     * @param {number} id - Assignment ID
     * @param {Object} data - Update data
     * @returns {Object} Updated assignment
     */
    static async updateStatus(id, data) {
        try {
            const { status } = data;

            if (!status) {
                throw new Error('Status is required');
            }

            // Validate status
            const validStatuses = ['pending', 'accepted', 'declined', 'completed'];
            if (!validStatuses.includes(status)) {
                throw new Error('Invalid status');
            }

            await pool.execute(
                'UPDATE judge_assignments SET status = ? WHERE id = ?',
                [status, id]
            );

            return this.findById(id);
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
            const [result] = await pool.execute('DELETE FROM judge_assignments WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Submit scores for participants in a round
     * @param {number} roundId - Round ID 
     * @param {number} judgeId - Judge ID
     * @param {Array} scores - Array of participant scores
     * @returns {boolean} Success status
     */
    static async submitScores(roundId, judgeId, scores) {
        try {
            // Start a transaction
            await pool.execute('START TRANSACTION');

            try {
                // Verify judge is assigned to this round
                const [assignments] = await pool.execute(
                    'SELECT * FROM judge_assignments WHERE round_id = ? AND judge_id = ?',
                    [roundId, judgeId]
                );

                if (assignments.length === 0) {
                    throw new Error('Judge is not assigned to this round');
                }

                // Update scores for each participant
                for (const score of scores) {
                    const {
                        participant_id, team_id,
                        technical_score, presentation_score,
                        creativity_score, implementation_score,
                        judge_comments
                    } = score;

                    // Calculate total score
                    let totalScore = 0;
                    let scoreCount = 0;

                    if (technical_score !== undefined) {
                        totalScore += parseFloat(technical_score);
                        scoreCount++;
                    }

                    if (presentation_score !== undefined) {
                        totalScore += parseFloat(presentation_score);
                        scoreCount++;
                    }

                    if (creativity_score !== undefined) {
                        totalScore += parseFloat(creativity_score);
                        scoreCount++;
                    }

                    if (implementation_score !== undefined) {
                        totalScore += parseFloat(implementation_score);
                        scoreCount++;
                    }

                    // Calculate average score
                    const avgScore = scoreCount > 0 ? totalScore / scoreCount : null;

                    // Build query based on whether it's an individual or team score
                    let query = `
                        UPDATE round_participants 
                        SET score = ?,
                            technical_score = ?,
                            presentation_score = ?,
                            creativity_score = ?,
                            implementation_score = ?,
                            judge_comments = ?
                        WHERE round_id = ? AND 
                    `;

                    const params = [
                        avgScore,
                        technical_score || null,
                        presentation_score || null,
                        creativity_score || null,
                        implementation_score || null,
                        judge_comments || null,
                        roundId
                    ];

                    if (participant_id) {
                        query += 'user_id = ?';
                        params.push(participant_id);
                    } else if (team_id) {
                        query += 'team_id = ?';
                        params.push(team_id);
                    } else {
                        throw new Error('Either participant_id or team_id must be provided');
                    }

                    await pool.execute(query, params);
                }

                // Update judge assignment status to completed
                await pool.execute(
                    'UPDATE judge_assignments SET status = ? WHERE round_id = ? AND judge_id = ?',
                    ['completed', roundId, judgeId]
                );

                // Commit transaction
                await pool.execute('COMMIT');
                return true;
            } catch (error) {
                // Rollback transaction on error
                await pool.execute('ROLLBACK');
                throw error;
            }
        } catch (error) {
            throw error;
        }
    }
}