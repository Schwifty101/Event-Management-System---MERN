/**
 * Migration to add sponsorship management functionality
 */
export default {
    name: '004_sponsorship_management',
    up: async (pool) => {
        // Create sponsorship_packages table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sponsorship_packages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                benefits TEXT NOT NULL,
                max_sponsors INT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Insert predefined sponsorship packages
        await pool.query(`
            INSERT INTO sponsorship_packages (name, description, price, benefits, max_sponsors) VALUES 
            ('Title Sponsor', 'Premier sponsorship package with maximum brand exposure', 500000.00, 'Logo on all materials, prominent placement on stage, dedicated booth, speaking opportunity, social media promotion', 1),
            ('Gold Sponsor', 'High-visibility sponsorship package', 300000.00, 'Logo on select materials, booth space, social media mentions, press release inclusion', 3),
            ('Silver Sponsor', 'Standard sponsorship package', 150000.00, 'Logo on website, small booth space, social media mention', 5),
            ('Media Partner', 'Exchange of promotional services', 0.00, 'Cross-promotion, media coverage of the event', NULL)
        `);

        // Create sponsor_profiles table to extend user table for sponsors
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sponsor_profiles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL UNIQUE,
                organization_name VARCHAR(200) NOT NULL,
                organization_description TEXT,
                logo_url VARCHAR(255),
                website VARCHAR(255),
                industry VARCHAR(100),
                contact_person VARCHAR(100),
                contact_email VARCHAR(100),
                contact_phone VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Create sponsorships table for actual sponsorship contracts
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sponsorships (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sponsor_id INT NOT NULL,
                package_id INT NOT NULL,
                event_id INT NOT NULL,
                status ENUM('pending', 'approved', 'active', 'completed', 'cancelled') DEFAULT 'pending',
                contract_start_date DATE NOT NULL,
                contract_end_date DATE NOT NULL,
                contract_document VARCHAR(255),
                total_amount DECIMAL(10,2) NOT NULL,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (sponsor_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (package_id) REFERENCES sponsorship_packages(id) ON DELETE RESTRICT,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
            )
        `);

        // Create sponsorship_payments table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sponsorship_payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sponsorship_id INT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                payment_date DATE NOT NULL,
                payment_method ENUM('bank_transfer', 'check', 'credit_card', 'cash', 'other') NOT NULL,
                reference_number VARCHAR(100),
                notes TEXT,
                receipt_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (sponsorship_id) REFERENCES sponsorships(id) ON DELETE CASCADE
            )
        `);

        // Create brand_promotions table to track promotional activities
        await pool.query(`
            CREATE TABLE IF NOT EXISTS brand_promotions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sponsorship_id INT NOT NULL,
                promotion_type ENUM('logo_display', 'booth', 'banner', 'speech', 'social_media', 'other') NOT NULL,
                description TEXT NOT NULL,
                location VARCHAR(200),
                start_date DATE,
                end_date DATE,
                status ENUM('planned', 'active', 'completed') DEFAULT 'planned',
                verification_image VARCHAR(255),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (sponsorship_id) REFERENCES sponsorships(id) ON DELETE CASCADE
            )
        `);
    }
}