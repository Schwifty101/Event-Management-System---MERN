/**
 * Migration for judge evaluation system
 */
export async function up(pool) {
    // Create round_participants table if it doesn't exist
    await pool.query(`
        CREATE TABLE IF NOT EXISTS round_participants (
            id INT AUTO_INCREMENT PRIMARY KEY,
            round_id INT NOT NULL,
            user_id INT,
            team_id INT,
            status ENUM('registered', 'checked_in', 'absent', 'disqualified', 'advanced', 'eliminated') DEFAULT 'registered',
            score DECIMAL(5,2),
            technical_score DECIMAL(5,2),
            presentation_score DECIMAL(5,2),
            creativity_score DECIMAL(5,2),
            implementation_score DECIMAL(5,2),
            judge_comments TEXT,
            registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (round_id) REFERENCES event_rounds(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
            CONSTRAINT unique_round_user UNIQUE (round_id, user_id),
            CONSTRAINT unique_round_team UNIQUE (round_id, team_id),
            CHECK (
                (user_id IS NOT NULL AND team_id IS NULL) OR
                (user_id IS NULL AND team_id IS NOT NULL)
            )
        )
    `);

    // Add status to judge_assignments if it doesn't exist
    await pool.query(`
        ALTER TABLE judge_assignments
        ADD COLUMN IF NOT EXISTS status ENUM('pending', 'accepted', 'declined', 'completed') DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    `);
}

export async function down(pool) {
    // Drop round_participants table
    await pool.query(`DROP TABLE IF EXISTS round_participants`);

    // Remove new columns from judge_assignments
    await pool.query(`
        ALTER TABLE judge_assignments 
        DROP COLUMN IF EXISTS status,
        DROP COLUMN IF EXISTS assigned_at,
        DROP COLUMN IF EXISTS updated_at
    `);
}