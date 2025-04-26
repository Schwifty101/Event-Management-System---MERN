import { pool } from '../config/db.js';

export class Event {
    /**
     * Create a new event
     * @param {Object} eventData - Event data to create
     * @returns {Object} Created event
     */
    static async create(eventData) {
        try {
            const query = `
        INSERT INTO events (
          title, description, location, start_date, end_date, 
          capacity, organizer_id, category, image_url
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

            const [result] = await pool.execute(query, [
                eventData.title,
                eventData.description,
                eventData.location,
                eventData.start_date,
                eventData.end_date,
                eventData.capacity,
                eventData.organizer_id,
                eventData.category,
                eventData.image_url
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

            // Add search by title/description if provided
            if (options.search) {
                query += ' AND (e.title LIKE ? OR e.description LIKE ?)';
                const searchTerm = `%${options.search}%`;
                queryParams.push(searchTerm, searchTerm);
            }

            // Filter by organizer
            if (options.organizer_id) {
                query += ' AND e.organizer_id = ?';
                queryParams.push(options.organizer_id);
            }

            // Add sorting
            const sortField = options.sort_by || 'start_date';
            const sortOrder = options.sort_order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
            query += ` ORDER BY e.${sortField} ${sortOrder}`;

            // Add pagination
            const page = options.page || 1;
            const limit = options.limit || 10;
            const offset = (page - 1) * limit;

            query += ' LIMIT ? OFFSET ?';
            queryParams.push(limit, offset);

            const [rows] = await pool.execute(query, queryParams);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get total count of events with filters
     * @param {Object} options - Filter options
     * @returns {number} Total count
     */
    static async countTotal(options = {}) {
        try {
            let query = `
                SELECT COUNT(*) as count
                FROM events e
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

            // Add search by title/description if provided
            if (options.search) {
                query += ' AND (e.title LIKE ? OR e.description LIKE ?)';
                const searchTerm = `%${options.search}%`;
                queryParams.push(searchTerm, searchTerm);
            }

            // Filter by organizer
            if (options.organizer_id) {
                query += ' AND e.organizer_id = ?';
                queryParams.push(options.organizer_id);
            }

            const [rows] = await pool.execute(query, queryParams);
            return rows[0].count;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all available categories
     * @returns {Array} Array of categories
     */
    static async getCategories() {
        try {
            const query = `
                SELECT DISTINCT category
                FROM events
                ORDER BY category
            `;

            const [rows] = await pool.execute(query);
            return rows.map(row => row.category);
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
            const fields = [
                'title', 'description', 'location', 'start_date',
                'end_date', 'capacity', 'category', 'image_url'
            ];

            let query = 'UPDATE events SET ';
            const params = [];

            // Add fields to update
            fields.forEach(field => {
                if (eventData[field] !== undefined) {
                    query += `${field} = ?, `;
                    params.push(eventData[field]);
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
     * Check for scheduling conflicts
     * @param {Object} eventData - Event data with start_date and end_date
     * @param {string} location - Location to check for conflicts
     * @param {number} excludeEventId - Event ID to exclude from conflict check (for updates)
     * @returns {Array} Array of conflicts
     */
    static async checkSchedulingConflicts(eventData, location, excludeEventId = null) {
        try {
            let query = `
                SELECT id, title, start_date, end_date, location
                FROM events
                WHERE location = ? AND (
                    (start_date < ? AND end_date > ?) OR
                    (start_date < ? AND end_date > ?) OR
                    (start_date >= ? AND end_date <= ?)
                )
            `;

            const params = [
                location,
                eventData.end_date,
                eventData.start_date,
                eventData.end_date,
                eventData.start_date,
                eventData.start_date,
                eventData.end_date
            ];

            // Exclude the current event in case of update
            if (excludeEventId) {
                query += ' AND id != ?';
                params.push(excludeEventId);
            }

            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }
}