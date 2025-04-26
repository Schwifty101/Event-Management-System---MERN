/**
 * Migration to add accommodation management functionality
 */
export default {
    name: '005_accommodation_management',
    up: async (pool) => {
        // Create accommodations table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS accommodations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                location VARCHAR(255) NOT NULL,
                total_rooms INT NOT NULL,
                price_per_night DECIMAL(10,2) NOT NULL,
                amenities TEXT,
                image_url VARCHAR(255),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Create accommodation_rooms table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS accommodation_rooms (
                id INT AUTO_INCREMENT PRIMARY KEY,
                accommodation_id INT NOT NULL,
                room_number VARCHAR(50) NOT NULL,
                room_type ENUM('single', 'double', 'suite', 'dormitory') NOT NULL,
                capacity INT NOT NULL DEFAULT 1,
                is_available BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (accommodation_id) REFERENCES accommodations(id) ON DELETE CASCADE,
                UNIQUE KEY (accommodation_id, room_number)
            )
        `);

        // Create accommodation_bookings table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS accommodation_bookings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                event_id INT NOT NULL,
                room_id INT NOT NULL,
                check_in_date DATE NOT NULL,
                check_out_date DATE NOT NULL,
                status ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled') DEFAULT 'pending',
                total_price DECIMAL(10,2) NOT NULL,
                payment_status ENUM('pending', 'partial', 'completed') DEFAULT 'pending',
                payment_method ENUM('online', 'bank_transfer', 'cash', 'other') DEFAULT NULL,
                special_requests TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
                FOREIGN KEY (room_id) REFERENCES accommodation_rooms(id) ON DELETE CASCADE
            )
        `);

        // Create accommodation_payments table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS accommodation_payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                booking_id INT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                payment_date DATE NOT NULL,
                payment_method ENUM('credit_card', 'bank_transfer', 'cash', 'other') NOT NULL,
                reference_number VARCHAR(100),
                receipt_url VARCHAR(255),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (booking_id) REFERENCES accommodation_bookings(id) ON DELETE CASCADE
            )
        `);

        // Insert some sample accommodation data
        await pool.query(`
            INSERT INTO accommodations (name, description, location, total_rooms, price_per_night, amenities) VALUES 
            ('Event Center Hotel', 'Luxurious hotel located near the event venue', 'Downtown Conference Center', 50, 120.00, 'WiFi, Breakfast, Swimming Pool, Gym'),
            ('University Dorms', 'Affordable accommodation for students', 'University Campus', 100, 40.00, 'WiFi, Shared Kitchen, Laundry'),
            ('Executive Suites', 'Premium suites for VIP guests and speakers', 'Main Boulevard', 20, 250.00, 'WiFi, Breakfast, Room Service, Airport Shuttle')
        `);
    }
}