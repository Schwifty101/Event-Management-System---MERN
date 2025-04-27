import { pool } from '../config/db.js';

export class Payment {
    /**
     * Add payment for event registration
     * @param {Object} paymentData - Payment data
     * @returns {Object} Created payment
     */
    static async addEventRegistrationPayment(paymentData) {
        try {
            const {
                registration_id, amount, payment_date,
                payment_method, reference_number, notes, receipt_url
            } = paymentData;

            const query = `
                INSERT INTO event_registration_payments
                (registration_id, amount, payment_date,
                 payment_method, reference_number, notes, receipt_url)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await pool.execute(query, [
                registration_id,
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
     * Get payments for an event registration
     * @param {number} registrationId - Registration ID
     * @returns {Array} Array of payments
     */
    static async getRegistrationPayments(registrationId) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM event_registration_payments WHERE registration_id = ? ORDER BY payment_date',
                [registrationId]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Generate comprehensive financial report
     * @param {Object} options - Filter options (startDate, endDate, eventId)
     * @returns {Object} Financial summary data
     */
    static async generateFinancialReport(options = {}, userId) {
        try {
            // Start transaction for consistent report data
            await pool.execute('START TRANSACTION');

            try {
                const { startDate, endDate, eventId } = options;
                const now = new Date();
                const reportDate = now.toISOString().split('T')[0];

                // Set default period if none provided
                const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                const end = endDate || now.toISOString().split('T')[0];

                // Event Registration Revenue
                let regRevenueQuery = `
                    SELECT 
                        COALESCE(SUM(er.payment_amount), 0) as total_contracted_amount,
                        COALESCE(SUM(CASE WHEN er.payment_status = 'completed' THEN er.payment_amount ELSE 0 END), 0) as total_received_amount,
                        COUNT(er.id) as total_registrations
                    FROM event_registrations er
                    JOIN events e ON er.event_id = e.id
                    WHERE er.registration_date BETWEEN ? AND ?
                `;

                const regParams = [start, end];

                // Add event filter if provided
                if (eventId) {
                    regRevenueQuery += ' AND er.event_id = ?';
                    regParams.push(eventId);
                }

                // Sponsorship Revenue
                let sponsorRevenueQuery = `
                    SELECT 
                        COALESCE(SUM(s.total_amount), 0) as total_contracted_amount,
                        COALESCE((
                            SELECT SUM(sp.amount) 
                            FROM sponsorship_payments sp
                            JOIN sponsorships s2 ON sp.sponsorship_id = s2.id
                            WHERE sp.payment_date BETWEEN ? AND ?
                            ${eventId ? 'AND s2.event_id = ?' : ''}
                        ), 0) as total_received_amount,
                        COUNT(s.id) as total_sponsorships
                    FROM sponsorships s
                    WHERE s.status != 'cancelled'
                    AND s.contract_start_date <= ? AND s.contract_end_date >= ?
                `;

                const sponsorParams = [start, end];
                if (eventId) {
                    sponsorParams.push(eventId);
                }
                sponsorParams.push(end, start);

                if (eventId) {
                    sponsorRevenueQuery += ' AND s.event_id = ?';
                    sponsorParams.push(eventId);
                }

                // Accommodation Revenue
                let accomRevenueQuery = `
                    SELECT 
                        COALESCE(SUM(b.total_price), 0) as total_contracted_amount,
                        COALESCE(SUM(CASE WHEN b.payment_status = 'completed' THEN b.total_price ELSE 0 END), 0) as total_received_amount,
                        COUNT(b.id) as total_bookings
                    FROM accommodation_bookings b
                    WHERE b.status != 'cancelled'
                    AND b.created_at BETWEEN ? AND ?
                `;

                const accomParams = [start, end];

                if (eventId) {
                    accomRevenueQuery += ' AND b.event_id = ?';
                    accomParams.push(eventId);
                }

                // Execute queries
                const [regResults] = await pool.execute(regRevenueQuery, regParams);
                const [sponsorResults] = await pool.execute(sponsorRevenueQuery, sponsorParams);
                const [accomResults] = await pool.execute(accomRevenueQuery, accomParams);

                // Get event breakdown if no specific event was requested
                let eventBreakdown = [];
                if (!eventId) {
                    const [eventResults] = await pool.execute(`
                        SELECT 
                            e.id, e.title as event_name,
                            COALESCE(SUM(er.payment_amount), 0) as registration_revenue,
                            COUNT(er.id) as registration_count
                        FROM events e
                        LEFT JOIN event_registrations er ON e.id = er.event_id
                        WHERE e.start_date <= ? AND e.end_date >= ?
                        GROUP BY e.id
                        ORDER BY registration_revenue DESC
                    `, [end, start]);

                    eventBreakdown = eventResults;
                }

                // Calculate totals
                const regRevenue = regResults[0].total_contracted_amount;
                const sponsorRevenue = sponsorResults[0].total_contracted_amount;
                const accomRevenue = accomResults[0].total_contracted_amount;

                const regReceived = regResults[0].total_received_amount;
                const sponsorReceived = sponsorResults[0].total_received_amount;
                const accomReceived = accomResults[0].total_received_amount;

                const totalRevenue = regRevenue + sponsorRevenue + accomRevenue;
                const totalReceived = regReceived + sponsorReceived + accomReceived;
                const pendingRevenue = totalRevenue - totalReceived;

                // Compile the report
                const report = {
                    summary: {
                        total_registration_revenue: regRevenue,
                        total_sponsorship_revenue: sponsorRevenue,
                        total_accommodation_revenue: accomRevenue,
                        total_revenue: totalRevenue,
                        pending_revenue: pendingRevenue
                    },
                    registrations: {
                        total_amount: regRevenue,
                        received_amount: regReceived,
                        count: regResults[0].total_registrations
                    },
                    sponsorships: {
                        total_amount: sponsorRevenue,
                        received_amount: sponsorReceived,
                        count: sponsorResults[0].total_sponsorships
                    },
                    accommodations: {
                        total_amount: accomRevenue,
                        received_amount: accomReceived,
                        count: accomResults[0].total_bookings
                    },
                    event_breakdown: eventBreakdown
                };

                // Save report to financial_summaries
                const saveQuery = `
                    INSERT INTO financial_summaries
                    (report_date, report_type, start_period, end_period, 
                     total_registration_revenue, total_sponsorship_revenue, 
                     total_accommodation_revenue, total_revenue, 
                     pending_revenue, report_data, generated_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                await pool.execute(saveQuery, [
                    reportDate,
                    'custom',
                    start,
                    end,
                    regRevenue,
                    sponsorRevenue,
                    accomRevenue,
                    totalRevenue,
                    pendingRevenue,
                    JSON.stringify(report),
                    userId
                ]);

                await pool.execute('COMMIT');

                return report;
            } catch (error) {
                await pool.execute('ROLLBACK');
                throw error;
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get saved financial reports
     * @param {Object} options - Filter options
     * @returns {Array} Array of reports
     */
    static async getSavedReports(options = {}) {
        try {
            let query = `
                SELECT id, report_date, report_type, 
                       start_period, end_period, 
                       total_registration_revenue, total_sponsorship_revenue, 
                       total_accommodation_revenue, total_revenue,
                       pending_revenue, created_at
                FROM financial_summaries
                WHERE 1=1
            `;

            const params = [];

            if (options.startDate) {
                query += ` AND report_date >= ?`;
                params.push(options.startDate);
            }

            if (options.endDate) {
                query += ` AND report_date <= ?`;
                params.push(options.endDate);
            }

            query += ` ORDER BY report_date DESC`;

            if (options.limit) {
                query += ` LIMIT ?`;
                params.push(parseInt(options.limit));
            }

            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get detailed report by ID
     * @param {number} id - Report ID
     * @returns {Object|null} Report data or null if not found
     */
    static async getReportById(id) {
        try {
            const [rows] = await pool.execute(`
                SELECT * FROM financial_summaries WHERE id = ?
            `, [id]);

            if (rows.length === 0) {
                return null;
            }

            const report = rows[0];
            // Parse the JSON report data
            report.report_data = JSON.parse(report.report_data);

            return report;
        } catch (error) {
            throw error;
        }
    }
}