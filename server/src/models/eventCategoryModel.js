import { pool } from '../config/db.js';

export class EventCategory {
    /**
     * Get all event categories
     * @returns {Array} Array of categories
     */
    static async findAll() {
        try {
            const [rows] = await pool.execute('SELECT * FROM event_categories ORDER BY name');
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find a category by name
     * @param {string} name - Category name to search for
     * @returns {Object|null} Category object or null if not found
     */
    static async findByName(name) {
        try {
            const [rows] = await pool.execute('SELECT * FROM event_categories WHERE name = ?', [name]);
            return rows.length ? rows[0] : null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find a category by ID
     * @param {number} id - Category ID
     * @returns {Object|null} Category object or null if not found
     */
    static async findById(id) {
        try {
            const [rows] = await pool.execute('SELECT * FROM event_categories WHERE id = ?', [id]);
            return rows.length ? rows[0] : null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Create a new category (admin only)
     * @param {Object} categoryData - Category data
     * @returns {Object} Created category
     */
    static async create(categoryData) {
        try {
            const { name, description } = categoryData;

            const query = 'INSERT INTO event_categories (name, description) VALUES (?, ?)';
            const [result] = await pool.execute(query, [name, description]);

            return { id: result.insertId, name, description };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update a category (admin only)
     * @param {number} id - Category ID
     * @param {Object} categoryData - Updated category data
     * @returns {Object} Updated category
     */
    static async update(id, categoryData) {
        try {
            const { name, description } = categoryData;

            let query = 'UPDATE event_categories SET ';
            const params = [];

            if (name !== undefined) {
                query += 'name = ?, ';
                params.push(name);
            }

            if (description !== undefined) {
                query += 'description = ?, ';
                params.push(description);
            }

            // Add updated_at and remove trailing comma
            query = query.slice(0, -2) + ' WHERE id = ?';
            params.push(id);

            await pool.execute(query, params);

            return { id, ...categoryData };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get event count by category 
     * @returns {Array} Categories with event counts
     */
    static async getEventCountByCategory() {
        try {
            const query = `
                SELECT ec.name, ec.description, COUNT(e.id) as event_count 
                FROM event_categories ec
                LEFT JOIN events e ON ec.name = e.category
                GROUP BY ec.name, ec.description
                ORDER BY event_count DESC
            `;

            const [rows] = await pool.execute(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }
}