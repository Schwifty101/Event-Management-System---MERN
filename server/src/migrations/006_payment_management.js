/**
 * Migration to add payment management functionality
 */
export default {
    name: '006_payment_management',
    up: async (pool) => {
        // Create event_registration_payments table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS event_registration_payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                registration_id INT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                payment_date DATE NOT NULL,
                payment_method ENUM('online', 'bank_transfer', 'cash', 'other') NOT NULL,
                reference_number VARCHAR(100),
                notes TEXT,
                receipt_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (registration_id) REFERENCES event_registrations(id) ON DELETE CASCADE
            )
        `);

        // Create financial_summaries table to store periodic financial reports
        await pool.query(`
            CREATE TABLE IF NOT EXISTS financial_summaries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                report_date DATE NOT NULL,
                report_type ENUM('daily', 'weekly', 'monthly', 'custom') NOT NULL,
                start_period DATE NOT NULL,
                end_period DATE NOT NULL,
                total_registration_revenue DECIMAL(10,2) DEFAULT 0,
                total_sponsorship_revenue DECIMAL(10,2) DEFAULT 0,
                total_accommodation_revenue DECIMAL(10,2) DEFAULT 0,
                total_revenue DECIMAL(10,2) DEFAULT 0,
                pending_revenue DECIMAL(10,2) DEFAULT 0,
                report_data JSON,
                generated_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // Create payment_notifications table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS payment_notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                payment_type ENUM('event_registration', 'sponsorship', 'accommodation') NOT NULL,
                reference_id INT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Add triggers to update payment statuses automatically

        // Trigger for event registration payments
        await pool.query(`
            CREATE TRIGGER update_event_reg_payment_status AFTER INSERT ON event_registration_payments
            FOR EACH ROW
            BEGIN
                DECLARE total_paid DECIMAL(10,2);
                DECLARE payment_amount DECIMAL(10,2);
                
                SELECT SUM(amount) INTO total_paid
                FROM event_registration_payments
                WHERE registration_id = NEW.registration_id;
                
                SELECT payment_amount INTO payment_amount
                FROM event_registrations
                WHERE id = NEW.registration_id;
                
                IF total_paid >= payment_amount THEN
                    UPDATE event_registrations 
                    SET payment_status = 'completed'
                    WHERE id = NEW.registration_id;
                ELSE
                    UPDATE event_registrations 
                    SET payment_status = 'partial'
                    WHERE id = NEW.registration_id AND payment_status = 'pending';
                END IF;
            END;
        `);
    }
}