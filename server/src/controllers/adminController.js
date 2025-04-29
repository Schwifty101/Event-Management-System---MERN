import { pool } from '../config/db.js';

/**
 * Get system-wide role permissions
 */
export const getPermissions = async (req, res) => {
    try {
        // In a real implementation, permissions would be stored in the database
        // For now, we'll generate a default set of permissions

        const roles = ['admin', 'organizer', 'judge', 'sponsor', 'participant'];
        const modules = ['events', 'users', 'teams', 'sponsors', 'accommodations', 'payments', 'reports', 'analytics', 'judges'];

        // Default permissions structure
        const permissions = {};

        // Set permissions for each role
        roles.forEach(role => {
            permissions[role] = {};

            modules.forEach(module => {
                permissions[role][module] = {};

                // Define actions for each module and set default values based on role
                const actions = module === 'reports' || module === 'analytics'
                    ? ['view', 'export']
                    : ['view', 'create', 'update', 'delete'];

                actions.forEach(action => {
                    // Default permission logic based on roles
                    if (role === 'admin') {
                        // Admins have full permissions
                        permissions[role][module][action] = true;
                    } else if (role === 'organizer') {
                        // Organizers can view everything, manage most things except users/admin functions
                        permissions[role][module][action] = (
                            action === 'view' ||
                            (module !== 'users' && action !== 'delete')
                        );
                    } else if (role === 'judge') {
                        // Judges can view events, teams, and perform judging evaluations
                        permissions[role][module][action] = (
                            (module === 'events' && action === 'view') ||
                            (module === 'teams' && action === 'view') ||
                            (module === 'judges' && ['view', 'evaluate'].includes(action))
                        );
                    } else if (role === 'sponsor') {
                        // Sponsors can view events and manage their own profiles
                        permissions[role][module][action] = (
                            (module === 'events' && action === 'view') ||
                            (module === 'sponsors' && ['view', 'update'].includes(action))
                        );
                    } else {
                        // Participants can view events, manage their team
                        permissions[role][module][action] = (
                            (module === 'events' && action === 'view') ||
                            (module === 'teams' && ['view', 'create', 'update'].includes(action)) ||
                            (module === 'accommodations' && action === 'view')
                        );
                    }
                });
            });
        });

        res.status(200).json({ permissions });
    } catch (error) {
        console.error('Error in getPermissions:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Update system-wide role permissions
 */
export const updatePermissions = async (req, res) => {
    try {
        const { permissions } = req.body;

        if (!permissions) {
            return res.status(400).json({ message: 'Permissions data is required' });
        }

        // In a real implementation, permissions would be stored in the database
        // For now, we'll just validate and return success

        // Validate permissions structure
        const roles = ['admin', 'organizer', 'judge', 'sponsor', 'participant'];
        const modules = ['events', 'users', 'teams', 'sponsors', 'accommodations', 'payments', 'reports', 'analytics', 'judges'];

        // Check if roles are valid
        const receivedRoles = Object.keys(permissions);
        for (const role of receivedRoles) {
            if (!roles.includes(role)) {
                return res.status(400).json({ message: `Invalid role: ${role}` });
            }

            // Check if modules are valid
            const receivedModules = Object.keys(permissions[role]);
            for (const module of receivedModules) {
                if (!modules.includes(module)) {
                    return res.status(400).json({ message: `Invalid module: ${module}` });
                }
            }
        }

        // In a real implementation, we would save the permissions to the database
        // For now, just return success

        res.status(200).json({ message: 'Permissions updated successfully' });
    } catch (error) {
        console.error('Error in updatePermissions:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get dashboard metrics for admin dashboard
 */
export const getDashboardMetrics = async (req, res) => {
    try {
        // Execute queries in parallel for better performance
        const [
            userCountResult,
            eventCountResult,
            activeEventResult,
            teamCountResult,
            revenueResult,
            accommodationResult
        ] = await Promise.all([
            pool.execute('SELECT COUNT(*) as count FROM users'),
            pool.execute('SELECT COUNT(*) as count FROM events'),
            pool.execute('SELECT COUNT(*) as count FROM events WHERE status = "active"'),
            pool.execute('SELECT COUNT(*) as count FROM teams'),
            pool.execute('SELECT SUM(amount) as total FROM payments'),
            pool.execute('SELECT COUNT(*) as count FROM accommodation_bookings')
        ]);

        const dashboardData = {
            totalUsers: userCountResult[0][0].count,
            totalEvents: eventCountResult[0][0].count,
            activeEvents: activeEventResult[0][0].count,
            totalTeams: teamCountResult[0][0].count,
            totalRevenue: revenueResult[0][0].total || 0,
            accommodationBookings: accommodationResult[0][0].count
        };

        res.status(200).json(dashboardData);
    } catch (error) {
        console.error('Error in getDashboardMetrics:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};