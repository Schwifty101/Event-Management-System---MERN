import { pool } from '../config/db.js';

export class Sponsorship {
    /**
     * Create a new sponsorship contract
     * @param {Object} sponsorshipData - Sponsorship data
     * @returns {Object} Created sponsorship
     */
    static async create(sponsorshipData) {
        try {
            const {
                sponsor_id, package_id, event_id, status,
                contract_start_date, contract_end_date,
                contract_document, total_amount, notes
            } = sponsorshipData;

            const query = `
                INSERT INTO sponsorships
                (sponsor_id, package_id, event_id, status,
                contract_start_date, contract_end_date,
                contract_document, total_amount, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await pool.execute(query, [
                sponsor_id,
                package_id,
                event_id,
                status || 'pending',
                contract_start_date,
                contract_end_date,
                contract_document || null,
                total_amount,
                notes || null
            ]);

            return { id: result.insertId, ...sponsorshipData };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find sponsorship by ID
     * @param {number} id - Sponsorship ID
     * @returns {Object|null} Sponsorship or null if not found
     */
    static async findById(id) {
        try {
            const [rows] = await pool.execute(`
                SELECT s.*, 
                       u.name as sponsor_name,
                       sp.organization_name,
                       pkg.name as package_name,
                       e.title as event_title
                FROM sponsorships s
                JOIN users u ON s.sponsor_id = u.id
                JOIN sponsor_profiles sp ON u.id = sp.user_id
                JOIN sponsorship_packages pkg ON s.package_id = pkg.id
                JOIN events e ON s.event_id = e.id
                WHERE s.id = ?
            `, [id]);

            return rows.length ? rows[0] : null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find sponsorships for a specific event
     * @param {number} eventId - Event ID
     * @returns {Array} Array of sponsorships
     */
    static async findByEventId(eventId) {
        try {
            const [rows] = await pool.execute(`
                SELECT s.*, 
                       u.name as sponsor_name,
                       sp.organization_name,
                       pkg.name as package_name
                FROM sponsorships s
                JOIN users u ON s.sponsor_id = u.id
                JOIN sponsor_profiles sp ON u.id = sp.user_id
                JOIN sponsorship_packages pkg ON s.package_id = pkg.id
                WHERE s.event_id = ?
                ORDER BY s.created_at DESC
            `, [eventId]);

            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find sponsorships by sponsor ID
     * @param {number} sponsorId - Sponsor user ID
     * @returns {Array} Array of sponsorships
     */
    static async findBySponsorId(sponsorId) {
        try {
            const [rows] = await pool.execute(`
                SELECT s.*, 
                       pkg.name as package_name,
                       e.title as event_title
                FROM sponsorships s
                JOIN sponsorship_packages pkg ON s.package_id = pkg.id
                JOIN events e ON s.event_id = e.id
                WHERE s.sponsor_id = ?
                ORDER BY s.contract_start_date DESC
            `, [sponsorId]);

            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all sponsorships with filtering and pagination
     * @param {Object} options - Filter and pagination options
     * @returns {Array} Array of sponsorships
     */
    static async findAll(options = {}) {
        try {
            let query = `
                SELECT s.*, 
                       u.name as sponsor_name,
                       sp.organization_name,
                       pkg.name as package_name,
                       e.title as event_title
                FROM sponsorships s
                JOIN users u ON s.sponsor_id = u.id
                JOIN sponsor_profiles sp ON u.id = sp.user_id
                JOIN sponsorship_packages pkg ON s.package_id = pkg.id
                JOIN events e ON s.event_id = e.id
                WHERE 1=1
            `;

            const params = [];

            // Add status filter
            if (options.status) {
                query += ` AND s.status = ?`;
                params.push(options.status);
            }

            // Add package filter
            if (options.packageId) {
                query += ` AND s.package_id = ?`;
                params.push(options.packageId);
            }

            // Add date range filter
            if (options.startDate) {
                query += ` AND s.contract_start_date >= ?`;
                params.push(options.startDate);
            }

            if (options.endDate) {
                query += ` AND s.contract_end_date <= ?`;
                params.push(options.endDate);
            }

            // Add sorting
            query += ` ORDER BY s.created_at DESC`;

            // Add pagination
            if (options.limit) {
                const limit = parseInt(options.limit);
                const offset = options.offset ? parseInt(options.offset) : 0;
                query += ` LIMIT ? OFFSET ?`;
                params.push(limit, offset);
            }

            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update sponsorship status and details
     * @param {number} id - Sponsorship ID
     * @param {Object} sponsorshipData - Updated sponsorship data
     * @returns {Object} Updated sponsorship
     */
    static async update(id, sponsorshipData) {
        try {
            const fields = [
                'status', 'contract_start_date', 'contract_end_date',
                'contract_document', 'total_amount', 'notes'
            ];

            let query = 'UPDATE sponsorships SET ';
            const params = [];

            // Add fields to update
            fields.forEach(field => {
                if (sponsorshipData[field] !== undefined) {
                    query += `${field} = ?, `;
                    params.push(sponsorshipData[field]);
                }
            });

            // Remove trailing comma and add WHERE clause
            query = query.slice(0, -2) + ' WHERE id = ?';
            params.push(id);

            await pool.execute(query, params);

            // Return updated sponsorship
            return await this.findById(id);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete a sponsorship
     * @param {number} id - Sponsorship ID
     * @returns {boolean} Success status
     */
    static async delete(id) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM sponsorships WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Add a payment to a sponsorship
     * @param {Object} paymentData - Payment data
     * @returns {Object} Created payment
     */
    static async addPayment(paymentData) {
        try {
            const {
                sponsorship_id, amount, payment_date,
                payment_method, reference_number, notes, receipt_url
            } = paymentData;

            const query = `
                INSERT INTO sponsorship_payments
                (sponsorship_id, amount, payment_date,
                 payment_method, reference_number, notes, receipt_url)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await pool.execute(query, [
                sponsorship_id,
                amount,
                payment_date,
                payment_method,
                reference_number || null,
                notes || null,
                receipt_url || null
            ]);

            return { id: result.insertId, ...paymentData };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get payments for a sponsorship
     * @param {number} sponsorshipId - Sponsorship ID
     * @returns {Array} Array of payments
     */
    static async getPayments(sponsorshipId) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM sponsorship_payments WHERE sponsorship_id = ? ORDER BY payment_date',
                [sponsorshipId]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Add a brand promotion activity
     * @param {Object} promotionData - Brand promotion data
     * @returns {Object} Created promotion
     */
    static async addPromotion(promotionData) {
        try {
            const {
                sponsorship_id, promotion_type, description,
                location, start_date, end_date, status, verification_image, notes
            } = promotionData;

            const query = `
                INSERT INTO brand_promotions
                (sponsorship_id, promotion_type, description,
                 location, start_date, end_date, status, verification_image, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await pool.execute(query, [
                sponsorship_id,
                promotion_type,
                description,
                location || null,
                start_date || null,
                end_date || null,
                status || 'planned',
                verification_image || null,
                notes || null
            ]);

            return { id: result.insertId, ...promotionData };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get promotions for a sponsorship
     * @param {number} sponsorshipId - Sponsorship ID
     * @returns {Array} Array of promotional activities
     */
    static async getPromotions(sponsorshipId) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM brand_promotions WHERE sponsorship_id = ? ORDER BY start_date',
                [sponsorshipId]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Generate summary report of sponsorships
     * @param {Object} options - Filter options
     * @returns {Object} Sponsorship summary data
     */
    static async generateSummaryReport(options = {}) {
        try {
            // Start transaction for consistent report data
            await pool.execute('START TRANSACTION');

            try {
                // Total funds data
                let fundsQuery = `
                    SELECT 
                        SUM(total_amount) as total_contracted_amount,
                        (SELECT SUM(amount) FROM sponsorship_payments) as total_received_amount,
                        COUNT(DISTINCT id) as total_sponsorships,
                        COUNT(DISTINCT sponsor_id) as total_sponsors
                    FROM sponsorships
                    WHERE 1=1
                `;

                const fundsParams = [];

                // By package breakdown
                let packageQuery = `
                    SELECT 
                        p.name as package_name,
                        COUNT(s.id) as sponsorship_count,
                        SUM(s.total_amount) as total_amount
                    FROM sponsorships s
                    JOIN sponsorship_packages p ON s.package_id = p.id
                    WHERE 1=1
                `;

                const packageParams = [];

                // By event breakdown
                let eventQuery = `
                    SELECT 
                        e.title as event_name,
                        COUNT(s.id) as sponsorship_count,
                        SUM(s.total_amount) as total_amount
                    FROM sponsorships s
                    JOIN events e ON s.event_id = e.id
                    WHERE 1=1
                `;

                const eventParams = [];

                // Add filters to all queries
                if (options.startDate) {
                    const filterClause = ` AND contract_start_date >= ?`;
                    fundsQuery += filterClause;
                    packageQuery += filterClause;
                    eventQuery += filterClause;

                    fundsParams.push(options.startDate);
                    packageParams.push(options.startDate);
                    eventParams.push(options.startDate);
                }

                if (options.endDate) {
                    const filterClause = ` AND contract_end_date <= ?`;
                    fundsQuery += filterClause;
                    packageQuery += filterClause;
                    eventQuery += filterClause;

                    fundsParams.push(options.endDate);
                    packageParams.push(options.endDate);
                    eventParams.push(options.endDate);
                }

                if (options.status) {
                    const filterClause = ` AND status = ?`;
                    fundsQuery += filterClause;
                    packageQuery += filterClause;
                    eventQuery += filterClause;

                    fundsParams.push(options.status);
                    packageParams.push(options.status);
                    eventParams.push(options.status);
                }

                // Add group by clauses for breakdown queries
                packageQuery += ` GROUP BY p.id ORDER BY total_amount DESC`;
                eventQuery += ` GROUP BY e.id ORDER BY total_amount DESC`;

                // Execute queries
                const [fundsResult] = await pool.execute(fundsQuery, fundsParams);
                const [packageBreakdown] = await pool.execute(packageQuery, packageParams);
                const [eventBreakdown] = await pool.execute(eventQuery, eventParams);

                // Recent sponsorships
                const [recentSponsorships] = await pool.execute(`
                    SELECT s.id, s.total_amount, s.status, s.created_at, 
                           u.name as sponsor_name,
                           sp.organization_name,
                           p.name as package_name,
                           e.title as event_title
                    FROM sponsorships s
                    JOIN users u ON s.sponsor_id = u.id
                    JOIN sponsor_profiles sp ON u.id = sp.user_id
                    JOIN sponsorship_packages p ON s.package_id = p.id
                    JOIN events e ON s.event_id = e.id
                    ORDER BY s.created_at DESC
                    LIMIT 5
                `);

                await pool.execute('COMMIT');

                // Compile the report
                return {
                    summary: fundsResult[0],
                    packageBreakdown,
                    eventBreakdown,
                    recentSponsorships
                };

            } catch (error) {
                await pool.execute('ROLLBACK');
                throw error;
            }
        } catch (error) {
            throw error;
        }
    }
}