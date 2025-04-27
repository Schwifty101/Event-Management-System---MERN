import { Migrations } from '../config/migrations.js';
import initialSchema from './001_initial_schema.js';
import eventCategoriesAndRounds from './002_event_categories_and_rounds.js';
import eventDetailsAndTeams from './003_event_details_and_teams.js';
import sponsorshipManagement from './004_sponsorship_management.js';
import accommodationManagement from './005_accommodation_management.js';
import paymentManagement from './006_payment_management.js';

// List all migrations in order
const migrations = [
    initialSchema,
    eventCategoriesAndRounds,
    eventDetailsAndTeams,
    sponsorshipManagement,
    accommodationManagement,
    paymentManagement,
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