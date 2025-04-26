import { Migrations } from '../config/migrations.js';
import initialSchema from './001_initial_schema.js';

// List all migrations in order
const migrations = [
    initialSchema,
    // Add new migrations here in order
];

/**
 * Run all migrations
 */
export async function runMigrations() {
    console.log('Running database migrations...');
    const success = await Migrations.runAll(migrations);

    if (success) {
        console.log('All migrations applied successfully');
    } else {
        console.error('Failed to apply all migrations');
    }

    return success;
}