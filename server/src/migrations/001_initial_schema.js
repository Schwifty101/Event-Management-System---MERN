/**
 * Initial database schema migration
 */
export default {
  name: '001_initial_schema',
  up: async (pool) => {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'organizer', 'participant', 'sponsor', 'judge') DEFAULT 'participant',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (email)
      )
    `);

    // Create events table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        location VARCHAR(200) NOT NULL,
        start_date DATETIME NOT NULL,
        end_date DATETIME NOT NULL,
        capacity INT,
        organizer_id INT NOT NULL,
        category VARCHAR(50) DEFAULT 'Other',
        image_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX (start_date),
        INDEX (category)
      )
    `);

    // Create event_rounds table for managing event rounds (preliminaries, semifinals, finals)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_rounds (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        type ENUM('preliminary', 'semifinal', 'final', 'other') NOT NULL,
        description TEXT,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        location VARCHAR(200),
        judges_required INT DEFAULT 1,
        max_participants INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        INDEX (event_id),
        INDEX (start_time)
      )
    `);

    // Create event_registrations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        user_id INT NOT NULL,
        registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY (event_id, user_id)
      )
    `);

    // Create round_assignments table for tracking participants/judges in each round
    await pool.query(`
      CREATE TABLE IF NOT EXISTS round_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        round_id INT NOT NULL,
        user_id INT NOT NULL,
        role ENUM('participant', 'judge') NOT NULL,
        status ENUM('assigned', 'confirmed', 'completed', 'absent') DEFAULT 'assigned',
        score DECIMAL(5,2),
        feedback TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (round_id) REFERENCES event_rounds(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY (round_id, user_id, role)
      )
    `);
  }
}