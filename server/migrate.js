#!/usr/bin/env node
import dotenv from 'dotenv';
import { testConnection, pool } from './src/config/db.js';
import { runMigrations } from './src/migrations/index.js';
import { resetDatabase } from './src/config/dbInit.js';

// Load environment variables
dotenv.config();

/**
 * Migration CLI
 */
async function main() {
    // Get command from arguments
    const command = process.argv[2]?.toLowerCase();

    if (!command) {
        showHelp();
        process.exit(1);
    }

    // Test database connection
    if (!(await testConnection())) {
        console.error('Failed to connect to database. Check your configuration.');
        process.exit(1);
    }

    // Handle commands
    switch (command) {
        case 'up':
        case 'run':
        case 'migrate':
            await runMigrations();
            break;

        case 'reset':
            await resetDatabase();
            break;

        case 'status':
            await showMigrationStatus();
            break;

        case 'help':
            showHelp();
            break;

        default:
            console.error(`Unknown command: ${command}`);
            showHelp();
            process.exit(1);
    }

    // Close pool connection
    await pool.end();
}

/**
 * Show migration status
 */
async function showMigrationStatus() {
    try {
        console.log('Checking migration status...');

        // Check if migrations table exists
        const [tables] = await pool.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_name = ?",
            [process.env.DB_NAME, 'migrations']
        );

        if (tables.length === 0) {
            console.log('Migration table does not exist. No migrations have been run.');
            return;
        }

        // Get applied migrations
        const [migrations] = await pool.query('SELECT * FROM migrations ORDER BY applied_at');

        console.log('\nApplied migrations:');
        console.log('-'.repeat(60));

        if (migrations.length === 0) {
            console.log('No migrations have been applied yet.');
        } else {
            console.log('| Migration Name'.padEnd(40) + '| Applied At'.padEnd(22) + '|');
            console.log('-'.repeat(60));

            migrations.forEach(migration => {
                const appliedAt = new Date(migration.applied_at).toISOString().replace('T', ' ').slice(0, 19);
                console.log(`| ${migration.name.padEnd(38)}| ${appliedAt.padEnd(20)}|`);
            });

            console.log('-'.repeat(60));
            console.log(`Total: ${migrations.length} migration(s) applied`);
        }
    } catch (error) {
        console.error('Error checking migration status:', error);
    }
}

/**
 * Show help
 */
function showHelp() {
    console.log(`
Database Migration CLI

Usage:
  node migrate.js <command>

Commands:
  up, run, migrate    Run all pending migrations
  status              Show migration status
  reset               Reset database (drop all tables) - Development only!
  help                Show this help message
  
Example:
  node migrate.js up      # Run all pending migrations
  `);
}

// Run main function
main().catch(error => {
    console.error('Error in migration CLI:', error);
    process.exit(1);
});