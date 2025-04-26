import { SponsorshipPackage } from '../models/sponsorshipPackageModel.js';

/**
 * Get all sponsorship packages
 */
export const getAllPackages = async (req, res) => {
    try {
        // For public viewing, only show active packages
        const isActive = req.query.isActive !== undefined ?
            req.query.isActive === 'true' :
            !req.user || req.user.role !== 'admin';

        const packages = await SponsorshipPackage.findAll({ isActive });
        res.status(200).json({ packages });
    } catch (error) {
        console.error('Error in getAllPackages:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get sponsorship package by ID
 */
export const getPackageById = async (req, res) => {
    try {
        const { id } = req.params;
        const package_ = await SponsorshipPackage.findById(id);

        if (!package_) {
            return res.status(404).json({ message: 'Sponsorship package not found' });
        }

        // Check if package is active for non-admin users
        if (!package_.is_active && (!req.user || req.user.role !== 'admin')) {
            return res.status(404).json({ message: 'Sponsorship package not found' });
        }

        res.status(200).json({ package: package_ });
    } catch (error) {
        console.error('Error in getPackageById:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Create a new sponsorship package (admin only)
 */
export const createPackage = async (req, res) => {
    try {
        const { name, description, price, benefits, max_sponsors, is_active } = req.body;

        // Validate input
        if (!name || !price || !benefits) {
            return res.status(400).json({
                message: 'Please provide name, price, and benefits'
            });
        }

        // Check if package with same name already exists
        const existingPackage = await SponsorshipPackage.findByName(name);
        if (existingPackage) {
            return res.status(409).json({
                message: 'A sponsorship package with this name already exists'
            });
        }

        // Create package
        const packageData = {
            name,
            description,
            price: parseFloat(price),
            benefits,
            max_sponsors: max_sponsors ? parseInt(max_sponsors) : null,
            is_active: is_active !== undefined ? is_active : true
        };

        const newPackage = await SponsorshipPackage.create(packageData);

        res.status(201).json({
            message: 'Sponsorship package created successfully',
            package: newPackage
        });
    } catch (error) {
        console.error('Error in createPackage:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Update a sponsorship package (admin only)
 */
export const updatePackage = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, benefits, max_sponsors, is_active } = req.body;

        // Check if package exists
        const package_ = await SponsorshipPackage.findById(id);
        if (!package_) {
            return res.status(404).json({ message: 'Sponsorship package not found' });
        }

        // If changing name, check for duplicates
        if (name && name !== package_.name) {
            const existingPackage = await SponsorshipPackage.findByName(name);
            if (existingPackage) {
                return res.status(409).json({
                    message: 'A sponsorship package with this name already exists'
                });
            }
        }

        // Prepare data for update
        const packageData = {};
        if (name) packageData.name = name;
        if (description !== undefined) packageData.description = description;
        if (price !== undefined) packageData.price = parseFloat(price);
        if (benefits) packageData.benefits = benefits;
        if (max_sponsors !== undefined) packageData.max_sponsors = max_sponsors ? parseInt(max_sponsors) : null;
        if (is_active !== undefined) packageData.is_active = is_active;

        // Update package
        const updatedPackage = await SponsorshipPackage.update(id, packageData);

        res.status(200).json({
            message: 'Sponsorship package updated successfully',
            package: updatedPackage
        });
    } catch (error) {
        console.error('Error in updatePackage:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Delete a sponsorship package (admin only)
 */
export const deletePackage = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if package exists
        const package_ = await SponsorshipPackage.findById(id);
        if (!package_) {
            return res.status(404).json({ message: 'Sponsorship package not found' });
        }

        // Check if package is in use
        const isAtCapacity = await SponsorshipPackage.isAtCapacity(id);
        if (isAtCapacity) {
            return res.status(400).json({
                message: 'Cannot delete package that has active sponsorships'
            });
        }

        // Delete package
        await SponsorshipPackage.delete(id);

        res.status(200).json({ message: 'Sponsorship package deleted successfully' });
    } catch (error) {
        console.error('Error in deletePackage:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};