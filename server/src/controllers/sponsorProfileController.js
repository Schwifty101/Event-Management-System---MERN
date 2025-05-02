import { pool } from '../config/db.js';

/**
 * Get the sponsor profile of the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getMyProfile = async (req, res) => {
    try {
        console.log('Getting sponsor profile for user ID:', req.user.id);
        const userId = req.user.id;

        // Get user information
        const [users] = await pool.execute(
            `SELECT name, email FROM users WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const [profiles] = await pool.execute(
            `SELECT * FROM sponsor_profiles WHERE user_id = ?`,
            [userId]
        );

        if (profiles.length === 0) {
            console.log('No profile found for user ID:', userId);
            // Return an empty profile template instead of a 404 error
            return res.status(200).json({
                success: true,
                data: {
                    user_id: userId,
                    name: users[0].name,
                    email: users[0].email,
                    organization_name: '',
                    organization_description: '',
                    industry: '',
                    website: '',
                    logo_url: '',
                    contact_email: users[0].email, // Pre-fill with user's email
                    contact_phone: '',
                    exists: false // Flag to indicate this is a template, not a saved profile
                },
                message: 'No profile exists yet. Please create one.'
            });
        }

        const profile = {
            ...profiles[0],
            name: users[0].name,
            email: users[0].email,
            exists: true // Flag to indicate this is an existing profile
        };

        console.log('Profile found:', profile);

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error('Error in getMyProfile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve sponsor profile',
            error: error.message
        });
    }
};

/**
 * Create or update a sponsor profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createOrUpdateProfile = async (req, res) => {
    try {
        console.log('Creating/updating sponsor profile for user ID:', req.user.id);
        console.log('Profile data:', req.body);

        const userId = req.user.id;
        const {
            organization_name,
            organization_description,
            industry,
            website,
            logo_url,
            contact_email,
            contact_phone,
            address,
            social_media_links
        } = req.body;

        // Check if profile exists
        const [profiles] = await pool.execute(
            `SELECT * FROM sponsor_profiles WHERE user_id = ?`,
            [userId]
        );

        let query;
        let params;

        if (profiles.length === 0) {
            // Create new profile
            query = `
                INSERT INTO sponsor_profiles (
                    user_id, organization_name, organization_description,
                    industry, website, logo_url, contact_email,
                    contact_phone
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            params = [
                userId,
                organization_name,
                organization_description || null,
                industry || null,
                website || null,
                logo_url || null,
                contact_email || null,
                contact_phone || null
            ];

            console.log('Creating new profile with params:', params);
        } else {
            // Update existing profile
            query = `
                UPDATE sponsor_profiles
                SET organization_name = ?,
                    organization_description = ?,
                    industry = ?,
                    website = ?,
                    logo_url = ?,
                    contact_email = ?,
                    contact_phone = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            `;

            params = [
                organization_name,
                organization_description || null,
                industry || null,
                website || null,
                logo_url || null,
                contact_email || null,
                contact_phone || null,
                userId
            ];

            console.log('Updating profile with params:', params);
        }

        await pool.execute(query, params);

        // Get updated profile
        const [updatedProfiles] = await pool.execute(
            `SELECT * FROM sponsor_profiles WHERE user_id = ?`,
            [userId]
        );

        res.status(200).json({
            success: true,
            message: profiles.length === 0 ? 'Sponsor profile created' : 'Sponsor profile updated',
            data: updatedProfiles[0]
        });
    } catch (error) {
        console.error('Error in createOrUpdateProfile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save sponsor profile',
            error: error.message
        });
    }
};

/**
 * Get all sponsor profiles (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllProfiles = async (req, res) => {
    try {
        const [profiles] = await pool.execute(`
            SELECT sp.*, u.name, u.email
            FROM sponsor_profiles sp
            JOIN users u ON sp.user_id = u.id
            ORDER BY sp.created_at DESC
        `);

        res.status(200).json({
            success: true,
            count: profiles.length,
            data: profiles
        });
    } catch (error) {
        console.error('Error in getAllProfiles:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve sponsor profiles',
            error: error.message
        });
    }
};

/**
 * Get a specific sponsor profile by ID (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getProfileById = async (req, res) => {
    try {
        const { id } = req.params;
        const type = req.query.type || 'profile';

        let query;
        let params;

        if (type === 'user') {
            query = `
                SELECT sp.*, u.name, u.email
                FROM sponsor_profiles sp
                JOIN users u ON sp.user_id = u.id
                WHERE sp.user_id = ?
            `;
            params = [id];
        } else {
            query = `
                SELECT sp.*, u.name, u.email
                FROM sponsor_profiles sp
                JOIN users u ON sp.user_id = u.id
                WHERE sp.id = ?
            `;
            params = [id];
        }

        const [profiles] = await pool.execute(query, params);

        if (profiles.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sponsor profile not found'
            });
        }

        // Get sponsorships data for this sponsor
        const [sponsorships] = await pool.execute(`
            SELECT s.id, s.status, s.contract_start_date, s.contract_end_date, s.total_amount,
                   e.title as event_title, pkg.name as package_name
            FROM sponsorships s
            JOIN events e ON s.event_id = e.id
            JOIN sponsorship_packages pkg ON s.package_id = pkg.id
            WHERE s.sponsor_id = ?
            ORDER BY s.created_at DESC
            LIMIT 5
        `, [profiles[0].user_id]);

        res.status(200).json({
            success: true,
            data: {
                profile: profiles[0],
                recentSponsorships: sponsorships
            }
        });
    } catch (error) {
        console.error('Error in getProfileById:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve sponsor profile',
            error: error.message
        });
    }
};

/**
 * Delete a sponsor profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteProfile = async (req, res) => {
    try {
        // If an ID is provided, delete that profile (admin only)
        // Otherwise, delete the authenticated user's profile
        const id = req.params.id || req.user.id;
        const type = req.params.id ? 'id' : 'user_id';

        const [result] = await pool.execute(
            `DELETE FROM sponsor_profiles WHERE ${type} = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sponsor profile not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Sponsor profile deleted successfully'
        });
    } catch (error) {
        console.error('Error in deleteProfile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete sponsor profile',
            error: error.message
        });
    }
};