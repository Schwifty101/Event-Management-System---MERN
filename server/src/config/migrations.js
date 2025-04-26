import { pool } from './db.js';

/**
 * Migration system for database
 */
export class Migrations {
    /**
     * Initialize migrations table
     */
    static async init() {
        try {
            // Create migrations table if it doesn't exist
            await pool.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            return true;
        } catch (error) {
            console.error('Error initializing migrations table:', error);
            return false;
        }
    }

    /**
     * Check if a migration has been applied
     */
    static async isApplied(migrationName) {
        try {
            const [rows] = await pool.query('SELECT * FROM migrations WHERE name = ?', [migrationName]);
            return rows.length > 0;
        } catch (error) {
            console.error(`Error checking migration ${migrationName}:`, error);
            return false;
        }
    }

    /**
     * Record a migration as applied
     */
    static async markApplied(migrationName) {
        try {
            await pool.query('INSERT INTO migrations (name) VALUES (?)', [migrationName]);
            return true;
        } catch (error) {
            console.error(`Error marking migration ${migrationName} as applied:`, error);
            return false;
        }
    }

    /**
     * Apply a migration
     */
    static async apply(migration) {
        try {
            const { name, up } = migration;

            // Check if migration has already been applied
            if (await this.isApplied(name)) {
                console.log(`Migration ${name} already applied, skipping`);
                return true;
            }

            // Apply migration
            console.log(`Applying migration: ${name}`);
            await up(pool);

            // Mark migration as applied
            await this.markApplied(name);
            console.log(`Migration ${name} applied successfully`);

            return true;
        } catch (error) {
            console.error(`Error applying migration ${migration.name}:`, error);
            return false;
        }
    }

    /**
     * Run all migrations
     */
    static async runAll(migrations) {
        try {
            // Initialize migrations table
            await this.init();

            // Apply each migration in order
            for (const migration of migrations) {
                await this.apply(migration);
            }

            return true;
        } catch (error) {
            console.error('Error running migrations:', error);
            return false;
        }
    }
}