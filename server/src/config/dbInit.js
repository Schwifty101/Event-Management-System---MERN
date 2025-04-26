import { pool } from './db.js';
import bcrypt from 'bcrypt';

/**
 * Initialize database schema
 * @deprecated Use migrations instead
 */
export async function initializeDatabase() {
    try {
        console.log('Starting database initialization...');

        // Create database if it doesn't exist
        await pool.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
        await pool.query(`USE ${process.env.DB_NAME}`);

        // Note: Schema creation is now handled by migrations
        console.log('Database initialization completed successfully');
        return true;
    } catch (error) {
        console.error('Error initializing database:', error.message);
        return false;
    }
}

/**
 * Seed the database with initial data
 */
export async function seedDatabase() {
    try {
        console.log('Checking for admin user...');

        // Check if admin user exists
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND role = ?',
            ['admin@example.com', 'admin']);

        if (rows.length === 0) {
            console.log('Creating admin user...');

            const hashedPassword = await bcrypt.hash('admin123', 10);

            await pool.query(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                ['Admin', 'admin@example.com', hashedPassword, 'admin']
            );

            console.log('Admin user created successfully');
        } else {
            console.log('Admin user already exists');
        }

        return true;
    } catch (error) {
        console.error('Error seeding database:', error.message);
        return false;
    }
}

/**
 * Reset database (for development/testing only)
 */
export async function resetDatabase() {
    if (process.env.NODE_ENV === 'production') {
        console.error('Cannot reset database in production environment');
        return false;
    }

    try {
        console.log('Resetting database...');

        // Drop tables in reverse order to avoid foreign key constraints
        await pool.query('DROP TABLE IF EXISTS event_registrations');
        await pool.query('DROP TABLE IF EXISTS events');
        await pool.query('DROP TABLE IF EXISTS users');
        await pool.query('DROP TABLE IF EXISTS migrations');

        console.log('Database reset successfully');
        return true;
    } catch (error) {
        console.error('Error resetting database:', error.message);
        return false;
    }
}