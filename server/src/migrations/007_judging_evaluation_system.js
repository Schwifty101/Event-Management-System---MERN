/**
 * Migration for judge evaluation system
 */
export default {
    name: '007_judging_evaluation_system',
    up: async (pool) => {
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

        // First check if the columns exist before trying to add them
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'judge_assignments'
            AND COLUMN_NAME IN ('status', 'assigned_at', 'updated_at')
        `);

        const columnNames = columns.map(col => col.COLUMN_NAME);

        // Add status to judge_assignments if it doesn't exist
        if (!columnNames.includes('status')) {
            await pool.query(`
                ALTER TABLE judge_assignments
                ADD COLUMN status ENUM('pending', 'accepted', 'declined', 'completed') DEFAULT 'pending'
            `);
        }

        if (!columnNames.includes('assigned_at')) {
            await pool.query(`
                ALTER TABLE judge_assignments
                ADD COLUMN assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            `);
        }

        if (!columnNames.includes('updated_at')) {
            await pool.query(`
                ALTER TABLE judge_assignments
                ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            `);
        }
    },

    down: async (pool) => {
        // Drop round_participants table
        await pool.query(`DROP TABLE IF EXISTS round_participants`);

        // Remove columns from judge_assignments
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'judge_assignments'
            AND COLUMN_NAME IN ('status', 'assigned_at', 'updated_at')
        `);

        const columnNames = columns.map(col => col.COLUMN_NAME);

        if (columnNames.includes('status')) {
            await pool.query(`ALTER TABLE judge_assignments DROP COLUMN status`);
        }

        if (columnNames.includes('assigned_at')) {
            await pool.query(`ALTER TABLE judge_assignments DROP COLUMN assigned_at`);
        }

        if (columnNames.includes('updated_at')) {
            await pool.query(`ALTER TABLE judge_assignments DROP COLUMN updated_at`);
        }
    }
}