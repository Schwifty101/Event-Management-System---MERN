import { SponsorProfile } from '../models/sponsorProfileModel.js';
import { User } from '../models/userModel.js';

/**
 * Create or update sponsor profile for the current user
 */
export const createOrUpdateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            organization_name, organization_description, logo_url,
            website, industry, contact_person, contact_email, contact_phone
        } = req.body;

        // Validate essential input
        if (!organization_name) {
            return res.status(400).json({ message: 'Organization name is required' });
        }

        // Check if user already has a profile
        const existingProfile = await SponsorProfile.findByUserId(userId);

        let profile;
        if (existingProfile) {
            // Update existing profile
            profile = await SponsorProfile.update(userId, {
                organization_name,
                organization_description,
                logo_url,
                website,
                industry,
                contact_person,
                contact_email,
                contact_phone
            });

            // If user role is not 'sponsor', update it
            if (req.user.role !== 'sponsor') {
                await User.update(userId, { role: 'sponsor' });
            }

            res.status(200).json({
                message: 'Sponsor profile updated successfully',
                profile
            });
        } else {
            // Create new profile
            profile = await SponsorProfile.create({
                user_id: userId,
                organization_name,
                organization_description,
                logo_url,
                website,
                industry,
                contact_person,
                contact_email,
                contact_phone
            });

            // Update user role to sponsor
            await User.update(userId, { role: 'sponsor' });

            res.status(201).json({
                message: 'Sponsor profile created successfully',
                profile
            });
        }
    } catch (error) {
        console.error('Error in createOrUpdateProfile:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get sponsor profile for the current user
 */
export const getMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const profile = await SponsorProfile.findByUserId(userId);

        if (!profile) {
            return res.status(404).json({ message: 'Sponsor profile not found' });
        }

        res.status(200).json({ profile });
    } catch (error) {
        console.error('Error in getMyProfile:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get all sponsor profiles (admin only)
 */
export const getAllProfiles = async (req, res) => {
    try {
        const options = {
            limit: parseInt(req.query.limit) || 10,
            offset: parseInt(req.query.offset) || 0
        };

        const profiles = await SponsorProfile.findAll(options);
        res.status(200).json({ profiles });
    } catch (error) {
        console.error('Error in getAllProfiles:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get sponsor profile by ID
 */
export const getProfileById = async (req, res) => {
    try {
        const { id } = req.params;
        let profile;

        // Check if ID is for a user or a profile
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid profile ID' });
        }

        // Determine if it's a user ID or profile ID
        if (req.query.type === 'user') {
            profile = await SponsorProfile.findByUserId(id);
        } else {
            profile = await SponsorProfile.findById(id);
        }

        if (!profile) {
            return res.status(404).json({ message: 'Sponsor profile not found' });
        }

        res.status(200).json({ profile });
    } catch (error) {
        console.error('Error in getProfileById:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Delete sponsor profile for the current user or specified ID (admin only)
 */
export const deleteProfile = async (req, res) => {
    try {
        const { id } = req.params;
        let userId;

        // Admin can delete any profile, users can only delete their own
        if (req.user.role === 'admin' && id) {
            userId = id;
        } else {
            userId = req.user.id;
        }

        // Check if profile exists
        const profile = await SponsorProfile.findByUserId(userId);
        if (!profile) {
            return res.status(404).json({ message: 'Sponsor profile not found' });
        }

        // Delete profile
        await SponsorProfile.delete(userId);

        // If user deleted their own profile and they're a sponsor, update role
        if (userId === req.user.id && req.user.role === 'sponsor') {
            await User.update(userId, { role: 'participant' });
        }

        res.status(200).json({ message: 'Sponsor profile deleted successfully' });
    } catch (error) {
        console.error('Error in deleteProfile:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};