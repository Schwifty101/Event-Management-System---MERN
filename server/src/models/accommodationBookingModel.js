import { pool } from '../config/db.js';

export class AccommodationBooking {
    /**
     * Create a new accommodation booking
     * @param {Object} bookingData - Booking data
     * @returns {Object} Created booking
     */
    static async create(bookingData) {
        try {
            const {
                user_id, event_id, room_id, check_in_date, check_out_date,
                status, total_price, payment_status, payment_method, special_requests
            } = bookingData;

            // Validate the room is available for the dates
            const [availabilityCheck] = await pool.execute(`
                SELECT COUNT(*) as conflictCount 
                FROM accommodation_bookings 
                WHERE room_id = ?
                AND status != 'cancelled'
                AND (
                    (check_in_date <= ? AND check_out_date > ?) OR
                    (check_in_date < ? AND check_out_date >= ?) OR
                    (check_in_date >= ? AND check_out_date <= ?)
                )
            `, [
                room_id,
                check_out_date, check_in_date,    // Overlap check 1
                check_out_date, check_out_date,   // Overlap check 2
                check_in_date, check_out_date     // Overlap check 3
            ]);

            if (availabilityCheck[0].conflictCount > 0) {
                throw new Error('Room is not available for the selected dates');
            }

            const query = `
                INSERT INTO accommodation_bookings
                (user_id, event_id, room_id, check_in_date, check_out_date,
                status, total_price, payment_status, payment_method, special_requests)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await pool.execute(query, [
                user_id,
                event_id,
                room_id,
                check_in_date,
                check_out_date,
                status || 'pending',
                total_price,
                payment_status || 'pending',
                payment_method || null,
                special_requests || null
            ]);

            return { id: result.insertId, ...bookingData };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find booking by ID
     * @param {number} id - Booking ID
     * @returns {Object|null} Booking or null if not found
     */
    static async findById(id) {
        try {
            const [bookings] = await pool.execute(`
                SELECT b.*, 
                       u.name as user_name,
                       u.email as user_email,
                       e.title as event_title,
                       e.location as event_location,
                       a.name as accommodation_name,
                       a.location as accommodation_location,
                       r.room_number, r.room_type, r.capacity
                FROM accommodation_bookings b
                JOIN users u ON b.user_id = u.id
                JOIN events e ON b.event_id = e.id
                JOIN accommodation_rooms r ON b.room_id = r.id
                JOIN accommodations a ON r.accommodation_id = a.id
                WHERE b.id = ?
            `, [id]);

            if (bookings.length === 0) {
                return null;
            }

            // Get payments for this booking
            const [payments] = await pool.execute(
                'SELECT * FROM accommodation_payments WHERE booking_id = ? ORDER BY payment_date',
                [id]
            );

            return {
                ...bookings[0],
                payments
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all bookings with filtering
     * @param {Object} options - Filter options
     * @returns {Array} Array of bookings
     */
    static async findAll(options = {}) {
        try {
            let query = `
                SELECT b.*, 
                       u.name as user_name,
                       e.title as event_title,
                       a.name as accommodation_name,
                       r.room_number, r.room_type
                FROM accommodation_bookings b
                JOIN users u ON b.user_id = u.id
                JOIN events e ON b.event_id = e.id
                JOIN accommodation_rooms r ON b.room_id = r.id
                JOIN accommodations a ON r.accommodation_id = a.id
                WHERE 1=1
            `;

            const params = [];

            // Filter by status
            if (options.status) {
                query += ' AND b.status = ?';
                params.push(options.status);
            }

            // Filter by event
            if (options.eventId) {
                query += ' AND b.event_id = ?';
                params.push(options.eventId);
            }

            // Filter by user
            if (options.userId) {
                query += ' AND b.user_id = ?';
                params.push(options.userId);
            }

            // Filter by accommodation
            if (options.accommodationId) {
                query += ' AND a.id = ?';
                params.push(options.accommodationId);
            }

            // Filter by date range
            if (options.startDate) {
                query += ' AND b.check_in_date >= ?';
                params.push(options.startDate);
            }

            if (options.endDate) {
                query += ' AND b.check_out_date <= ?';
                params.push(options.endDate);
            }

            // Filter by payment status
            if (options.paymentStatus) {
                query += ' AND b.payment_status = ?';
                params.push(options.paymentStatus);
            }

            // Add sorting
            query += ' ORDER BY b.created_at DESC';

            // Add pagination
            if (options.limit) {
                const limit = parseInt(options.limit);
                const offset = options.offset ? parseInt(options.offset) : 0;
                query += ' LIMIT ? OFFSET ?';
                params.push(limit, offset);
            }

            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update booking status and details
     * @param {number} id - Booking ID
     * @param {Object} bookingData - Updated booking data
     * @returns {Object} Updated booking
     */
    static async update(id, bookingData) {
        try {
            const fields = [
                'check_in_date', 'check_out_date', 'status',
                'total_price', 'payment_status', 'payment_method',
                'special_requests'
            ];

            let query = 'UPDATE accommodation_bookings SET ';
            const params = [];

            // Add fields to update
            fields.forEach(field => {
                if (bookingData[field] !== undefined) {
                    query += `${field} = ?, `;
                    params.push(bookingData[field]);
                }
            });

            // Remove trailing comma and add WHERE clause
            query = query.slice(0, -2) + ' WHERE id = ?';
            params.push(id);

            await pool.execute(query, params);

            // Return updated booking
            return await this.findById(id);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Cancel a booking
     * @param {number} id - Booking ID
     * @returns {Object} Updated booking
     */
    static async cancel(id) {
        try {
            await pool.execute(
                'UPDATE accommodation_bookings SET status = ? WHERE id = ?',
                ['cancelled', id]
            );

            return await this.findById(id);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Add a payment to a booking
     * @param {Object} paymentData - Payment data
     * @returns {Object} Created payment
     */
    static async addPayment(paymentData) {
        try {
            const {
                booking_id, amount, payment_date,
                payment_method, reference_number, receipt_url, notes
            } = paymentData;

            const query = `
                INSERT INTO accommodation_payments
                (booking_id, amount, payment_date,
                payment_method, reference_number, receipt_url, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await pool.execute(query, [
                booking_id,
                amount,
                payment_date,
                payment_method,
                reference_number || null,
                receipt_url || null,
                notes || null
            ]);

            // Check if payment completes the total price and update status
            const [bookingResult] = await pool.execute(
                'SELECT total_price FROM accommodation_bookings WHERE id = ?',
                [booking_id]
            );

            if (bookingResult.length > 0) {
                const totalPrice = bookingResult[0].total_price;

                const [paymentsResult] = await pool.execute(
                    'SELECT SUM(amount) as total_paid FROM accommodation_payments WHERE booking_id = ?',
                    [booking_id]
                );

                const totalPaid = paymentsResult[0].total_paid || 0;

                let paymentStatus = 'pending';
                if (totalPaid >= totalPrice) {
                    paymentStatus = 'completed';
                } else if (totalPaid > 0) {
                    paymentStatus = 'partial';
                }

                await pool.execute(
                    'UPDATE accommodation_bookings SET payment_status = ? WHERE id = ?',
                    [paymentStatus, booking_id]
                );
            }

            return { id: result.insertId, ...paymentData };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get payments for a booking
     * @param {number} bookingId - Booking ID
     * @returns {Array} Array of payments
     */
    static async getPayments(bookingId) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM accommodation_payments WHERE booking_id = ? ORDER BY payment_date',
                [bookingId]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Generate booking reports
     * @param {Object} options - Filter options
     * @returns {Object} Booking reports
     */
    static async generateReports(options = {}) {
        try {
            // Start transaction for consistent report data
            await pool.execute('START TRANSACTION');

            try {
                // Revenue summary
                let revenueQuery = `
                    SELECT 
                        COUNT(id) as total_bookings,
                        SUM(total_price) as total_revenue,
                        SUM(CASE WHEN payment_status = 'completed' THEN total_price ELSE 0 END) as collected_revenue,
                        SUM(CASE WHEN payment_status != 'completed' THEN total_price ELSE 0 END) as pending_revenue
                    FROM accommodation_bookings
                    WHERE status != 'cancelled'
                `;

                const revenueParams = [];

                // Booking status breakdown
                let statusQuery = `
                    SELECT 
                        status,
                        COUNT(id) as count,
                        SUM(total_price) as revenue
                    FROM accommodation_bookings
                    GROUP BY status
                    ORDER BY count DESC
                `;

                // Event breakdown
                let eventQuery = `
                    SELECT 
                        e.id, e.title as event_name,
                        COUNT(b.id) as booking_count,
                        SUM(b.total_price) as total_revenue
                    FROM accommodation_bookings b
                    JOIN events e ON b.event_id = e.id
                    WHERE b.status != 'cancelled'
                    GROUP BY e.id
                    ORDER BY total_revenue DESC
                `;

                // Add filters to queries
                if (options.startDate) {
                    const dateFilter = ' AND check_in_date >= ?';
                    revenueQuery += dateFilter;
                    revenueParams.push(options.startDate);
                }

                if (options.endDate) {
                    const dateFilter = ' AND check_out_date <= ?';
                    revenueQuery += dateFilter;
                    revenueParams.push(options.endDate);
                }

                if (options.eventId) {
                    const eventFilter = ' AND event_id = ?';
                    revenueQuery += eventFilter;
                    revenueParams.push(options.eventId);
                }

                // Execute queries
                const [revenueSummary] = await pool.execute(revenueQuery, revenueParams);
                const [statusBreakdown] = await pool.execute(statusQuery);
                const [eventBreakdown] = await pool.execute(eventQuery);

                // Recent bookings
                const [recentBookings] = await pool.execute(`
                    SELECT b.id, b.check_in_date, b.check_out_date, b.total_price, b.status, b.payment_status,
                           u.name as user_name,
                           e.title as event_title,
                           a.name as accommodation_name,
                           r.room_number, r.room_type
                    FROM accommodation_bookings b
                    JOIN users u ON b.user_id = u.id
                    JOIN events e ON b.event_id = e.id
                    JOIN accommodation_rooms r ON b.room_id = r.id
                    JOIN accommodations a ON r.accommodation_id = a.id
                    ORDER BY b.created_at DESC
                    LIMIT 5
                `);

                await pool.execute('COMMIT');

                // Compile the report
                return {
                    summary: revenueSummary[0],
                    statusBreakdown,
                    eventBreakdown,
                    recentBookings
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