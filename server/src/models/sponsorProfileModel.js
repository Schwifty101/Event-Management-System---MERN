import { pool } from '../config/db.js';

export class SponsorProfile {
    /**
     * Create a sponsor profile 
     * @param {Object} profileData - Sponsor profile data
     * @returns {Object} Created profile
     */
    static async create(profileData) {
        try {
            const {
                user_id, organization_name, organization_description, logo_url,
                website, industry, contact_person, contact_email, contact_phone
            } = profileData;

            const query = `
                INSERT INTO sponsor_profiles
                (user_id, organization_name, organization_description, logo_url, 
                website, industry, contact_person, contact_email, contact_phone)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await pool.execute(query, [
                user_id,
                organization_name,
                organization_description || null,
                logo_url || null,
                website || null,
                industry || null,
                contact_person || null,
                contact_email || null,
                contact_phone || null
            ]);

            return { id: result.insertId, ...profileData };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find sponsor profile by user ID
     * @param {number} userId - User ID
     * @returns {Object|null} Sponsor profile or null if not found
     */
    static async findByUserId(userId) {
        try {
            const [rows] = await pool.execute(
                `SELECT * FROM sponsor_profiles WHERE user_id = ?`,
                [userId]
            );
            return rows.length ? rows[0] : null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find sponsor profile by ID
     * @param {number} id - Profile ID
     * @returns {Object|null} Sponsor profile or null if not found
     */
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                `SELECT * FROM sponsor_profiles WHERE id = ?`,
                [id]
            );
            return rows.length ? rows[0] : null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all sponsor profiles with pagination
     * @param {Object} options - Pagination and filter options
     * @returns {Array} Array of sponsor profiles
     */
    static async findAll(options = {}) {
        try {
            let query = `
                SELECT sp.*, u.name, u.email
                FROM sponsor_profiles sp
                JOIN users u ON sp.user_id = u.id
            `;

            // Add sorting
            query += ` ORDER BY sp.organization_name`;

            // Add pagination
            if (options.limit) {
                const limit = parseInt(options.limit, 10);
                const offset = parseInt(options.offset || 0, 10);

                // Convert to integers and ensure they're valid
                if (isNaN(limit) || isNaN(offset)) {
                    throw new Error('Invalid pagination parameters');
                }

                query += ` LIMIT ${limit} OFFSET ${offset}`;
                // Not using parameterized queries for LIMIT/OFFSET as MySQL2 has issues with them
            }

            const [rows] = await pool.execute(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update a sponsor profile
     * @param {number} userId - User ID
     * @param {Object} profileData - Updated profile data
     * @returns {Object} Updated profile
     */
    static async update(userId, profileData) {
        try {
            const fields = [
                'organization_name', 'organization_description', 'logo_url',
                'website', 'industry', 'contact_person', 'contact_email', 'contact_phone'
            ];

            let query = 'UPDATE sponsor_profiles SET ';
            const params = [];

            // Add fields to update
            fields.forEach(field => {
                if (profileData[field] !== undefined) {
                    query += `${field} = ?, `;
                    params.push(profileData[field]);
                }
            });

            // Remove trailing comma and add WHERE clause
            query = query.slice(0, -2) + ' WHERE user_id = ?';
            params.push(userId);

            await pool.execute(query, params);

            // Return updated profile
            return await this.findByUserId(userId);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete a sponsor profile
     * @param {number} userId - User ID
     * @returns {boolean} Success status
     */
    static async delete(userId) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM sponsor_profiles WHERE user_id = ?',
                [userId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }
}