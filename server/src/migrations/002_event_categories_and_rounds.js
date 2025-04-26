/**
 * Migration to add event categories and rounds tables
 */
export default {
    name: '002_event_categories_and_rounds',
    up: async (pool) => {
        // Create event_categories table with predefined categories
        await pool.query(`
      CREATE TABLE IF NOT EXISTS event_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

        // Insert predefined categories
        await pool.query(`
      INSERT INTO event_categories (name, description) VALUES 
      ('Tech Events', 'Coding competitions, hackathons, and AI challenges'),
      ('Business Competitions', 'Case studies, entrepreneurship challenges, and business plan competitions'),
      ('Gaming Tournaments', 'E-sports tournaments and console gaming competitions'),
      ('General Events', 'Debates, photography contests, and quiz competitions'),
      ('Other', 'Miscellaneous events that do not fit into other categories')
    `);

        // Update events table to use category as foreign key
        await pool.query(`
      ALTER TABLE events 
      MODIFY category VARCHAR(100) DEFAULT 'Other',
      ADD CONSTRAINT fk_event_category FOREIGN KEY (category) REFERENCES event_categories(name) ON DELETE SET DEFAULT ON UPDATE CASCADE
    `);

        // Create event_rounds table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS event_rounds (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        location VARCHAR(200),
        capacity INT,
        round_type ENUM('preliminary', 'semifinal', 'final', 'other') NOT NULL DEFAULT 'preliminary',
        status ENUM('upcoming', 'ongoing', 'completed', 'cancelled') NOT NULL DEFAULT 'upcoming',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        INDEX (event_id, round_type),
        INDEX (start_time)
      )
    `);

        // Create round_participants table to track participants in each round
        await pool.query(`
      CREATE TABLE IF NOT EXISTS round_participants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        round_id INT NOT NULL,
        user_id INT NOT NULL,
        score DECIMAL(10,2) DEFAULT NULL,
        status ENUM('registered', 'checked_in', 'no_show', 'disqualified', 'advanced', 'eliminated') DEFAULT 'registered',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (round_id) REFERENCES event_rounds(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY (round_id, user_id)
      )
    `);
    }
}