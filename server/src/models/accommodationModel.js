import { pool } from '../config/db.js';

export class Accommodation {
    /**
     * Create a new accommodation
     * @param {Object} accommodationData - Accommodation data
     * @returns {Object} Created accommodation
     */
    static async create(accommodationData) {
        try {
            const {
                name, description, location, total_rooms,
                price_per_night, amenities, image_url, is_active
            } = accommodationData;

            const query = `
                INSERT INTO accommodations
                (name, description, location, total_rooms, price_per_night, amenities, image_url, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await pool.execute(query, [
                name,
                description || null,
                location,
                total_rooms,
                price_per_night,
                amenities || null,
                image_url || null,
                is_active !== undefined ? is_active : true
            ]);

            return { id: result.insertId, ...accommodationData };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find accommodation by ID
     * @param {number} id - Accommodation ID
     * @returns {Object|null} Accommodation or null if not found
     */
    static async findById(id) {
        try {
            const [rows] = await pool.execute('SELECT * FROM accommodations WHERE id = ?', [id]);

            if (rows.length === 0) {
                return null;
            }

            // Get rooms for this accommodation
            const [rooms] = await pool.execute(
                'SELECT * FROM accommodation_rooms WHERE accommodation_id = ?',
                [id]
            );

            return {
                ...rows[0],
                rooms
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all accommodations with filtering
     * @param {Object} options - Filter options
     * @returns {Array} Array of accommodations
     */
    static async findAll(options = {}) {
        try {
            let query = 'SELECT * FROM accommodations WHERE 1=1';
            const params = [];

            // Filter by active status if specified
            if (options.isActive !== undefined) {
                query += ' AND is_active = ?';
                params.push(options.isActive);
            }

            // Filter by price range
            if (options.minPrice) {
                query += ' AND price_per_night >= ?';
                params.push(options.minPrice);
            }

            if (options.maxPrice) {
                query += ' AND price_per_night <= ?';
                params.push(options.maxPrice);
            }

            // Filter by location
            if (options.location) {
                query += ' AND location LIKE ?';
                params.push(`%${options.location}%`);
            }

            // Add sorting
            query += ' ORDER BY price_per_night ASC';

            // Execute query
            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update accommodation details
     * @param {number} id - Accommodation ID
     * @param {Object} accommodationData - Updated accommodation data
     * @returns {Object} Updated accommodation
     */
    static async update(id, accommodationData) {
        try {
            const fields = [
                'name', 'description', 'location', 'total_rooms',
                'price_per_night', 'amenities', 'image_url', 'is_active'
            ];

            let query = 'UPDATE accommodations SET ';
            const params = [];

            // Add fields to update
            fields.forEach(field => {
                if (accommodationData[field] !== undefined) {
                    query += `${field} = ?, `;
                    params.push(accommodationData[field]);
                }
            });

            // Remove trailing comma and add WHERE clause
            query = query.slice(0, -2) + ' WHERE id = ?';
            params.push(id);

            await pool.execute(query, params);

            // Return updated accommodation
            return await this.findById(id);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete an accommodation
     * @param {number} id - Accommodation ID
     * @returns {boolean} Success status
     */
    static async delete(id) {
        try {
            const [result] = await pool.execute('DELETE FROM accommodations WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Add a room to an accommodation
     * @param {Object} roomData - Room data
     * @returns {Object} Created room
     */
    static async addRoom(roomData) {
        try {
            const {
                accommodation_id, room_number, room_type,
                capacity, is_available
            } = roomData;

            const query = `
                INSERT INTO accommodation_rooms
                (accommodation_id, room_number, room_type, capacity, is_available)
                VALUES (?, ?, ?, ?, ?)
            `;

            const [result] = await pool.execute(query, [
                accommodation_id,
                room_number,
                room_type,
                capacity || 1,
                is_available !== undefined ? is_available : true
            ]);

            return { id: result.insertId, ...roomData };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update a room
     * @param {number} id - Room ID
     * @param {Object} roomData - Updated room data
     * @returns {Object} Updated room
     */
    static async updateRoom(id, roomData) {
        try {
            const fields = [
                'room_number', 'room_type', 'capacity', 'is_available'
            ];

            let query = 'UPDATE accommodation_rooms SET ';
            const params = [];

            // Add fields to update
            fields.forEach(field => {
                if (roomData[field] !== undefined) {
                    query += `${field} = ?, `;
                    params.push(roomData[field]);
                }
            });

            // Remove trailing comma and add WHERE clause
            query = query.slice(0, -2) + ' WHERE id = ?';
            params.push(id);

            await pool.execute(query, params);

            // Return updated room
            const [rows] = await pool.execute('SELECT * FROM accommodation_rooms WHERE id = ?', [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete a room
     * @param {number} id - Room ID
     * @returns {boolean} Success status
     */
    static async deleteRoom(id) {
        try {
            const [result] = await pool.execute('DELETE FROM accommodation_rooms WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find available rooms for a specific accommodation and date range
     * @param {number} accommodationId - Accommodation ID
     * @param {string} checkInDate - Check-in date (YYYY-MM-DD)
     * @param {string} checkOutDate - Check-out date (YYYY-MM-DD)
     * @returns {Array} Available rooms
     */
    static async findAvailableRooms(accommodationId, checkInDate, checkOutDate) {
        try {
            const query = `
                SELECT r.* FROM accommodation_rooms r
                WHERE r.accommodation_id = ?
                AND r.is_available = true
                AND r.id NOT IN (
                    SELECT b.room_id FROM accommodation_bookings b
                    WHERE b.status != 'cancelled'
                    AND (
                        (b.check_in_date <= ? AND b.check_out_date > ?) OR
                        (b.check_in_date < ? AND b.check_out_date >= ?) OR
                        (b.check_in_date >= ? AND b.check_out_date <= ?)
                    )
                )
                ORDER BY r.room_type, r.room_number
            `;

            const [rows] = await pool.execute(query, [
                accommodationId,
                checkOutDate, checkInDate,    // Overlap check 1
                checkOutDate, checkOutDate,   // Overlap check 2
                checkInDate, checkOutDate     // Overlap check 3
            ]);

            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get summary of accommodation availability
     * @param {number} eventId - Event ID (optional)
     * @returns {Array} Accommodation availability summary
     */
    static async getAvailabilitySummary(eventId = null) {
        try {
            let query = `
                SELECT 
                    a.id, a.name, a.location, a.price_per_night,
                    COUNT(r.id) as total_rooms,
                    SUM(CASE WHEN r.is_available = true THEN 1 ELSE 0 END) as available_rooms
                FROM accommodations a
                LEFT JOIN accommodation_rooms r ON a.id = r.accommodation_id
            `;

            const params = [];

            // Add event filter if provided
            if (eventId) {
                query += `
                    LEFT JOIN events e ON e.id = ?
                    WHERE a.is_active = true
                    AND (
                        (a.location = e.location) OR
                        (ST_Distance_Sphere(
                            POINT(a.longitude, a.latitude),
                            POINT(e.longitude, e.latitude)
                        ) <= 5000)  -- Within 5km of event
                    )
                `;
                params.push(eventId);
            } else {
                query += ` WHERE a.is_active = true`;
            }

            query += ` GROUP BY a.id ORDER BY a.price_per_night ASC`;

            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }
}