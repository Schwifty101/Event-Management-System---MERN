// Import all migrations in order
import m001_initial_schema from './001_initial_schema.js';
import m002_event_categories_and_rounds from './002_event_categories_and_rounds.js';
import m003_event_details_and_teams from './003_event_details_and_teams.js';
import m004_sponsorship_management from './004_sponsorship_management.js';
import m005_accommodation_management from './005_accommodation_management.js';
import m006_payment_management from './006_payment_management.js';
import m007_judging_evaluation_system from './007_judging_evaluation_system.js';
import { Migrations } from '../config/migrations.js';

// Export migrations in an array (order matters)
export const migrations = [
    m001_initial_schema,
    m002_event_categories_and_rounds,
    m003_event_details_and_teams,
    m004_sponsorship_management,
    m005_accommodation_management,
    m006_payment_management,
    m007_judging_evaluation_system
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