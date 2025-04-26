import { pool } from '../config/db.js';

export class Team {
    /**
     * Create a new team
     * @param {Object} teamData - Team data to create
     * @returns {Object} Created team
     */
    static async create(teamData) {
        try {
            const { name, event_id, leader_id } = teamData;

            // Validate required fields
            if (!name || !event_id || !leader_id) {
                throw new Error('Missing required fields');
            }

            const query = `
                INSERT INTO teams (name, event_id, leader_id)
                VALUES (?, ?, ?)
            `;

            const [result] = await pool.execute(query, [name, event_id, leader_id]);

            // Add leader as a team member automatically
            await this.addMember(result.insertId, leader_id);

            return { id: result.insertId, ...teamData };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find a team by ID
     * @param {number} id - Team ID
     * @returns {Object|null} Team object or null if not found
     */
    static async findById(id) {
        try {
            const [rows] = await pool.execute(`
                SELECT t.*, e.title as event_title, u.name as leader_name, 
                       COUNT(tm.id) as member_count
                FROM teams t
                JOIN events e ON t.event_id = e.id
                JOIN users u ON t.leader_id = u.id
                LEFT JOIN team_members tm ON t.id = tm.team_id
                WHERE t.id = ?
                GROUP BY t.id
            `, [id]);

            return rows.length ? rows[0] : null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find teams by event ID
     * @param {number} eventId - Event ID
     * @returns {Array} Array of teams
     */
    static async findByEventId(eventId) {
        try {
            const [rows] = await pool.execute(`
                SELECT t.*, u.name as leader_name, COUNT(tm.id) as member_count
                FROM teams t
                JOIN users u ON t.leader_id = u.id
                LEFT JOIN team_members tm ON t.id = tm.team_id
                WHERE t.event_id = ?
                GROUP BY t.id
                ORDER BY t.name
            `, [eventId]);

            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find teams by user ID (teams user is a member of)
     * @param {number} userId - User ID
     * @returns {Array} Array of teams
     */
    static async findByUserId(userId) {
        try {
            const [rows] = await pool.execute(`
                SELECT t.*, e.title as event_title, 
                       u.name as leader_name, 
                       COUNT(tm.id) as member_count,
                       (t.leader_id = ?) as is_leader,
                       tm.status as member_status
                FROM teams t
                JOIN events e ON t.event_id = e.id
                JOIN users u ON t.leader_id = u.id
                JOIN team_members tm ON t.id = tm.team_id
                WHERE tm.user_id = ?
                GROUP BY t.id
                ORDER BY e.start_date DESC
            `, [userId, userId]);

            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update team information
     * @param {number} id - Team ID
     * @param {Object} teamData - Team data to update
     * @returns {Object} Updated team
     */
    static async update(id, teamData) {
        try {
            const { name } = teamData;

            if (!name) {
                throw new Error('Team name is required');
            }

            await pool.execute(
                'UPDATE teams SET name = ? WHERE id = ?',
                [name, id]
            );

            return this.findById(id);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete a team
     * @param {number} id - Team ID
     * @returns {boolean} Success status
     */
    static async delete(id) {
        try {
            const [result] = await pool.execute('DELETE FROM teams WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Add a member to a team
     * @param {number} teamId - Team ID
     * @param {number} userId - User ID
     * @param {string} status - Member status (default: 'joined')
     * @returns {Object} Created team member
     */
    static async addMember(teamId, userId, status = 'joined') {
        try {
            // Check if member already exists
            const [existingMember] = await pool.execute(
                'SELECT * FROM team_members WHERE team_id = ? AND user_id = ?',
                [teamId, userId]
            );

            if (existingMember.length > 0) {
                // Update status if member exists
                if (existingMember[0].status !== status) {
                    await pool.execute(
                        'UPDATE team_members SET status = ? WHERE team_id = ? AND user_id = ?',
                        [status, teamId, userId]
                    );
                }
                return existingMember[0];
            }

            // Check team size limit
            const team = await this.findById(teamId);
            const event = await pool.execute(
                'SELECT team_event, max_team_size FROM events WHERE id = ?',
                [team.event_id]
            );

            if (event[0][0].max_team_size && team.member_count >= event[0][0].max_team_size) {
                throw new Error('Team is already at maximum capacity');
            }

            // Add new member
            const [result] = await pool.execute(
                'INSERT INTO team_members (team_id, user_id, status) VALUES (?, ?, ?)',
                [teamId, userId, status]
            );

            return { id: result.insertId, teamId, userId, status };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Remove a member from a team
     * @param {number} teamId - Team ID
     * @param {number} userId - User ID
     * @returns {boolean} Success status
     */
    static async removeMember(teamId, userId) {
        try {
            // Check if user is the team leader
            const [leader] = await pool.execute(
                'SELECT leader_id FROM teams WHERE id = ?',
                [teamId]
            );

            if (leader.length > 0 && leader[0].leader_id === userId) {
                throw new Error('Team leader cannot be removed. Transfer leadership first.');
            }

            const [result] = await pool.execute(
                'DELETE FROM team_members WHERE team_id = ? AND user_id = ?',
                [teamId, userId]
            );

            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all members of a team
     * @param {number} teamId - Team ID
     * @returns {Array} Array of team members
     */
    static async getMembers(teamId) {
        try {
            const [rows] = await pool.execute(`
                SELECT tm.*, u.name, u.email 
                FROM team_members tm
                JOIN users u ON tm.user_id = u.id
                WHERE tm.team_id = ?
                ORDER BY tm.joined_at
            `, [teamId]);

            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Transfer team leadership
     * @param {number} teamId - Team ID
     * @param {number} newLeaderId - New leader user ID
     * @returns {boolean} Success status
     */
    static async transferLeadership(teamId, newLeaderId) {
        try {
            // Check if new leader is a member of the team
            const [member] = await pool.execute(
                'SELECT * FROM team_members WHERE team_id = ? AND user_id = ?',
                [teamId, newLeaderId]
            );

            if (member.length === 0) {
                throw new Error('New leader must be a member of the team');
            }

            await pool.execute(
                'UPDATE teams SET leader_id = ? WHERE id = ?',
                [newLeaderId, teamId]
            );

            return true;
        } catch (error) {
            throw error;
        }
    }
}