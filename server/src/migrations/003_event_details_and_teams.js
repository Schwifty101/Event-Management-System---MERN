/**
 * Migration to add additional event details and team functionality
 */
export default {
    name: '003_event_details_and_teams',
    up: async (pool) => {
        // Update events table with additional fields
        await pool.query(`
      ALTER TABLE events 
      ADD COLUMN rules TEXT AFTER description,
      ADD COLUMN max_participants INT DEFAULT NULL AFTER capacity,
      ADD COLUMN registration_fee DECIMAL(10,2) DEFAULT 0.00 AFTER max_participants,
      ADD COLUMN team_event BOOLEAN DEFAULT FALSE AFTER registration_fee,
      ADD COLUMN min_team_size INT DEFAULT 1 AFTER team_event,
      ADD COLUMN max_team_size INT DEFAULT 1 AFTER min_team_size
    `);

        // Create teams table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        event_id INT NOT NULL,
        leader_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY (name, event_id)
      )
    `);

        // Create team_members table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        team_id INT NOT NULL,
        user_id INT NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('invited', 'joined', 'declined', 'removed') DEFAULT 'joined',
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY (team_id, user_id)
      )
    `);

        // Update event_registrations to support both individual and team registrations
        await pool.query(`
      ALTER TABLE event_registrations 
      ADD COLUMN team_id INT DEFAULT NULL AFTER user_id,
      ADD COLUMN payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending' AFTER status,
      ADD COLUMN payment_amount DECIMAL(10,2) DEFAULT 0.00 AFTER payment_status,
      ADD COLUMN payment_date TIMESTAMP NULL DEFAULT NULL AFTER payment_amount,
      ADD FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
      DROP INDEX event_id, 
      ADD UNIQUE INDEX (event_id, user_id, team_id)
    `);

        // Create judge_assignments table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS judge_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        round_id INT DEFAULT NULL,
        judge_id INT NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('pending', 'accepted', 'declined', 'completed') DEFAULT 'pending',
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (round_id) REFERENCES event_rounds(id) ON DELETE CASCADE,
        FOREIGN KEY (judge_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY (round_id, judge_id)
      )
    `);

        // Update round_participants table to support team participation and scoring
        await pool.query(`
      ALTER TABLE round_participants
      ADD COLUMN team_id INT DEFAULT NULL AFTER user_id,
      ADD COLUMN technical_score DECIMAL(10,2) DEFAULT NULL AFTER score,
      ADD COLUMN presentation_score DECIMAL(10,2) DEFAULT NULL AFTER technical_score,
      ADD COLUMN creativity_score DECIMAL(10,2) DEFAULT NULL AFTER presentation_score,
      ADD COLUMN implementation_score DECIMAL(10,2) DEFAULT NULL AFTER creativity_score,
      ADD COLUMN judge_comments TEXT DEFAULT NULL AFTER implementation_score,
      ADD FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
    `);
    }
}