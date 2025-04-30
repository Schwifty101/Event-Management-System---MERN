import { pool } from '../config/db.js';

export class Event {
    /**
     * Create a new event
     * @param {Object} eventData - Event data to create
     * @returns {Object} Created event
     */
    static async create(eventData) {
        try {
            // Format dates to MySQL compatible format if they're in ISO format
            const formattedEventData = { ...eventData };
            
            if (formattedEventData.start_date) {
                const startDate = new Date(formattedEventData.start_date);
                if (!isNaN(startDate)) {
                    formattedEventData.start_date = startDate.toISOString().slice(0, 19).replace('T', ' ');
                }
            }
            
            if (formattedEventData.end_date) {
                const endDate = new Date(formattedEventData.end_date);
                if (!isNaN(endDate)) {
                    formattedEventData.end_date = endDate.toISOString().slice(0, 19).replace('T', ' ');
                }
            }

            const query = `
        INSERT INTO events (
          title, description, rules, location, start_date, end_date, 
          capacity, max_participants, registration_fee, team_event, min_team_size, max_team_size,
          organizer_id, category, image_url
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

            const [result] = await pool.execute(query, [
                formattedEventData.title,
                formattedEventData.description,
                formattedEventData.rules || null,
                formattedEventData.location,
                formattedEventData.start_date,
                formattedEventData.end_date,
                formattedEventData.capacity || null,
                formattedEventData.max_participants || null,
                formattedEventData.registration_fee || 0,
                formattedEventData.team_event || false,
                formattedEventData.min_team_size || 1,
                formattedEventData.max_team_size || 1,
                formattedEventData.organizer_id,
                formattedEventData.category || 'Other',
                formattedEventData.image_url || null
            ]);

            return { id: result.insertId, ...eventData };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find an event by ID
     * @param {number} id - Event ID to search for
     * @returns {Object|null} Event object or null if not found
     */
    static async findById(id) {
        try {
            // Join with users table to get organizer information
            const query = `
        SELECT e.*, u.name as organizer_name 
        FROM events e
        LEFT JOIN users u ON e.organizer_id = u.id
        WHERE e.id = ?
      `;

            const [rows] = await pool.execute(query, [id]);
            return rows.length ? rows[0] : null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all events (with pagination and optional filters)
     * @param {Object} options - Search options
     * @returns {Array} Array of events
     */
    static async findAll(options = {}) {
        try {
            let query = `
        SELECT e.*, u.name as organizer_name 
        FROM events e
        LEFT JOIN users u ON e.organizer_id = u.id
        WHERE 1=1
      `;

            const queryParams = [];

            // Add filter for category if provided
            if (options.category) {
                query += ' AND e.category = ?';
                queryParams.push(options.category);
            }

            // Add filter for date range if provided
            if (options.start_date) {
                query += ' AND e.start_date >= ?';
                queryParams.push(options.start_date);
            }

            if (options.end_date) {
                query += ' AND e.end_date <= ?';
                queryParams.push(options.end_date);
            }

            // Add filter for team events if provided
            if (options.team_event !== undefined) {
                query += ' AND e.team_event = ?';
                queryParams.push(options.team_event);
            }

            // Add search by title/description if provided
            if (options.search) {
                query += ' AND (e.title LIKE ? OR e.description LIKE ?)';
                const searchTerm = `%${options.search}%`;
                queryParams.push(searchTerm, searchTerm);
            }

            // Add sorting
            query += ' ORDER BY e.start_date ASC';

            // Get pagination parameters and ensure they're integers
            const page = parseInt(options.page) || 1;
            const limit = parseInt(options.limit) || 10;
            const offset = (page - 1) * limit;

            // Insert the LIMIT and OFFSET directly into the query instead of using placeholders
            query += ` LIMIT ${limit} OFFSET ${offset}`;

            const [rows] = await pool.execute(query, queryParams);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update an event
     * @param {number} id - Event ID to update
     * @param {Object} eventData - Updated event data
     * @returns {Object} Updated event
     */
    static async update(id, eventData) {
        try {
            // Format dates to MySQL compatible format if they're in ISO format
            const formattedEventData = { ...eventData };
            
            if (formattedEventData.start_date) {
                const startDate = new Date(formattedEventData.start_date);
                if (!isNaN(startDate)) {
                    formattedEventData.start_date = startDate.toISOString().slice(0, 19).replace('T', ' ');
                }
            }
            
            if (formattedEventData.end_date) {
                const endDate = new Date(formattedEventData.end_date);
                if (!isNaN(endDate)) {
                    formattedEventData.end_date = endDate.toISOString().slice(0, 19).replace('T', ' ');
                }
            }

            const fields = [
                'title', 'description', 'rules', 'location', 'start_date',
                'end_date', 'capacity', 'max_participants', 'registration_fee',
                'team_event', 'min_team_size', 'max_team_size', 'category', 'image_url'
            ];

            let query = 'UPDATE events SET ';
            const params = [];

            // Add fields to update
            fields.forEach(field => {
                if (formattedEventData[field] !== undefined) {
                    query += `${field} = ?, `;
                    params.push(formattedEventData[field]);
                }
            });

            // Add updated_at and remove trailing comma
            query += 'updated_at = NOW() WHERE id = ?';
            params.push(id);

            await pool.execute(query, params);
            return { id, ...eventData };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete an event
     * @param {number} id - Event ID to delete
     * @returns {boolean} Success status
     */
    static async delete(id) {
        try {
            const [result] = await pool.execute('DELETE FROM events WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Check for scheduling conflicts for an organizer
     * @param {number} organizerId - Organizer ID to check for
     * @param {number|null} excludeEventId - Event ID to exclude from check (for updates)
     * @param {string} startDate - Start date in ISO format
     * @param {string} endDate - End date in ISO format
     * @returns {Array} Conflicting events, empty if no conflicts
     */
    static async checkOrganizerScheduleConflicts(organizerId, excludeEventId, startDate, endDate) {
        try {
            let query = `
                SELECT id, title, start_date, end_date
                FROM events
                WHERE organizer_id = ?
                AND ((start_date <= ? AND end_date >= ?) OR
                     (start_date <= ? AND end_date >= ?) OR
                     (start_date >= ? AND end_date <= ?))
            `;

            const params = [
                organizerId,
                startDate, startDate,  // New event starts during an existing event
                endDate, endDate,      // New event ends during an existing event
                startDate, endDate     // Existing event is completely within new event
            ];

            // Exclude the current event when updating
            if (excludeEventId) {
                query += ' AND id <> ?';
                params.push(excludeEventId);
            }

            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get events by organizer ID
     * @param {number} organizerId - Organizer ID
     * @param {Object} options - Filtering options
     * @returns {Array} Array of events
     */
    static async findByOrganizerId(organizerId, options = {}) {
        try {
            let query = `
                SELECT * 
                FROM events
                WHERE organizer_id = ?
            `;

            const params = [organizerId];

            // Add category filter if provided
            if (options.category) {
                query += ' AND category = ?';
                params.push(options.category);
            }

            // Add date range filter if provided
            if (options.start_date) {
                query += ' AND start_date >= ?';
                params.push(options.start_date);
            }

            if (options.end_date) {
                query += ' AND start_date <= ?';
                params.push(options.end_date);
            }

            // Add sorting
            query += ' ORDER BY start_date ASC';

            // Add pagination
            if (options.limit) {
                // Ensure limit and offset are integers
                const limit = parseInt(options.limit, 10);
                const offset = options.offset ? parseInt(options.offset, 10) : 0;

                // Insert the LIMIT and OFFSET directly into the query instead of using placeholders
                query += ` LIMIT ${limit} OFFSET ${offset}`;
            }

            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Register for an event (individual or team)
     * @param {number} eventId - Event ID 
     * @param {number} userId - User ID
     * @param {number|null} teamId - Optional team ID for team events
     * @returns {Object} Registration result
     */
    static async registerForEvent(eventId, userId, teamId = null) {
        try {
            // Get event details
            const event = await this.findById(eventId);
            if (!event) {
                throw new Error('Event not found');
            }

            // Check if event is a team event and team ID is provided
            if (event.team_event && !teamId) {
                throw new Error('Team ID is required for team events');
            }

            // For team events, check if the team is valid and belongs to this event
            if (teamId) {
                const [team] = await pool.execute(
                    'SELECT * FROM teams WHERE id = ? AND event_id = ?',
                    [teamId, eventId]
                );

                if (team.length === 0) {
                    throw new Error('Team not found or does not belong to this event');
                }
            }

            // Check if registration already exists
            const [existingReg] = await pool.execute(
                'SELECT * FROM event_registrations WHERE event_id = ? AND user_id = ? AND (team_id = ? OR team_id IS NULL)',
                [eventId, userId, teamId]
            );

            if (existingReg.length > 0) {
                return { success: false, message: 'Already registered for this event' };
            }

            // Check event capacity
            if (event.max_participants) {
                const [countResult] = await pool.execute(
                    'SELECT COUNT(*) as count FROM event_registrations WHERE event_id = ?',
                    [eventId]
                );

                if (countResult[0].count >= event.max_participants) {
                    return { success: false, message: 'Event has reached maximum capacity' };
                }
            }

            // Calculate payment amount
            const paymentAmount = event.registration_fee || 0;

            // Create registration
            const query = `
                INSERT INTO event_registrations 
                (event_id, user_id, team_id, payment_amount, payment_status)
                VALUES (?, ?, ?, ?, ?)
            `;

            const paymentStatus = paymentAmount > 0 ? 'pending' : 'completed';

            await pool.execute(query, [
                eventId,
                userId,
                teamId,
                paymentAmount,
                paymentStatus
            ]);

            return {
                success: true,
                message: 'Registration successful',
                paymentRequired: paymentAmount > 0,
                paymentAmount
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get registrations for an event
     * @param {number} eventId - Event ID
     * @returns {Array} Array of registrations with user details
     */
    static async getRegistrations(eventId) {
        try {
            const query = `
                SELECT er.*, u.name, u.email, t.name as team_name
                FROM event_registrations er
                JOIN users u ON er.user_id = u.id
                LEFT JOIN teams t ON er.team_id = t.id
                WHERE er.event_id = ?
                ORDER BY er.registration_date
            `;

            const [rows] = await pool.execute(query, [eventId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }
}