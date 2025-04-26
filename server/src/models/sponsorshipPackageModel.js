import { pool } from '../config/db.js';

export class SponsorshipPackage {
    /**
     * Get all sponsorship packages
     * @param {Object} options - Filter options
     * @returns {Array} Array of packages
     */
    static async findAll(options = {}) {
        try {
            let query = `SELECT * FROM sponsorship_packages`;
            const params = [];

            // Filter by active status if specified
            if (options.isActive !== undefined) {
                query += ` WHERE is_active = ?`;
                params.push(options.isActive);
            }

            // Add sorting
            query += ` ORDER BY price DESC`;

            // Execute query
            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find sponsorship package by ID
     * @param {number} id - Package ID
     * @returns {Object|null} - Package details or null if not found
     */
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM sponsorship_packages WHERE id = ?',
                [id]
            );
            return rows.length ? rows[0] : null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find sponsorship package by name
     * @param {string} name - Package name
     * @returns {Object|null} - Package details or null if not found
     */
    static async findByName(name) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM sponsorship_packages WHERE name = ?',
                [name]
            );
            return rows.length ? rows[0] : null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Create a new sponsorship package
     * @param {Object} packageData - Package data
     * @returns {Object} Created package
     */
    static async create(packageData) {
        try {
            const { name, description, price, benefits, max_sponsors, is_active } = packageData;

            const query = `
                INSERT INTO sponsorship_packages 
                (name, description, price, benefits, max_sponsors, is_active)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            const [result] = await pool.execute(query, [
                name,
                description || null,
                price,
                benefits,
                max_sponsors || null,
                is_active !== undefined ? is_active : true
            ]);

            return { id: result.insertId, ...packageData };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update a sponsorship package
     * @param {number} id - Package ID
     * @param {Object} packageData - Updated package data
     * @returns {Object} Updated package
     */
    static async update(id, packageData) {
        try {
            const fields = ['name', 'description', 'price', 'benefits', 'max_sponsors', 'is_active'];
            let query = 'UPDATE sponsorship_packages SET ';
            const params = [];

            // Add fields to update
            fields.forEach(field => {
                if (packageData[field] !== undefined) {
                    query += `${field} = ?, `;
                    params.push(packageData[field]);
                }
            });

            // Remove trailing comma and add WHERE clause
            query = query.slice(0, -2) + ' WHERE id = ?';
            params.push(id);

            await pool.execute(query, params);

            // Return updated package
            return await this.findById(id);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete a sponsorship package
     * @param {number} id - Package ID
     * @returns {boolean} Success status
     */
    static async delete(id) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM sponsorship_packages WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Check if a package has reached its maximum number of sponsors
     * @param {number} packageId - Package ID
     * @returns {boolean} True if at capacity, false otherwise
     */
    static async isAtCapacity(packageId) {
        try {
            // Get the package details to check max_sponsors
            const package_ = await this.findById(packageId);

            if (!package_ || package_.max_sponsors === null) {
                return false; // No limit or package doesn't exist
            }

            // Count active sponsorships for this package
            const [rows] = await pool.execute(
                `SELECT COUNT(*) as count FROM sponsorships 
                WHERE package_id = ? AND status IN ('approved', 'active')`,
                [packageId]
            );

            return rows[0].count >= package_.max_sponsors;
        } catch (error) {
            throw error;
        }
    }
}