import { Sponsorship } from '../models/sponsorshipModel.js';
import { SponsorshipPackage } from '../models/sponsorshipPackageModel.js';
import { SponsorProfile } from '../models/sponsorProfileModel.js';
import { Event } from '../models/eventModel.js';

/**
 * Create a new sponsorship contract
 */
export const createSponsorship = async (req, res) => {
    try {
        const {
            package_id, event_id, contract_start_date,
            contract_end_date, contract_document, notes
        } = req.body;

        // Sponsor ID is the current user's ID
        const sponsor_id = req.user.id;

        // Validate essential input
        if (!package_id || !event_id || !contract_start_date || !contract_end_date) {
            return res.status(400).json({
                message: 'Please provide package_id, event_id, contract_start_date, and contract_end_date'
            });
        }

        // Check if sponsor profile exists
        const sponsorProfile = await SponsorProfile.findByUserId(sponsor_id);
        if (!sponsorProfile) {
            return res.status(400).json({
                message: 'You must create a sponsor profile before applying for sponsorship'
            });
        }

        // Check if package exists and is active
        const package_ = await SponsorshipPackage.findById(package_id);
        if (!package_ || !package_.is_active) {
            return res.status(404).json({ message: 'Sponsorship package not found or not active' });
        }

        // Check if event exists
        const event = await Event.findById(event_id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check package capacity
        const isAtCapacity = await SponsorshipPackage.isAtCapacity(package_id);
        if (isAtCapacity) {
            return res.status(400).json({
                message: 'This sponsorship package has reached its maximum number of sponsors'
            });
        }

        // Validate date format and logic
        const startDate = new Date(contract_start_date);
        const endDate = new Date(contract_end_date);

        // Set time to midnight for proper date comparison without time component
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        // Get event dates and also set time to midnight
        const eventStartDate = new Date(event.start_date);
        const eventEndDate = new Date(event.end_date);
        eventStartDate.setHours(0, 0, 0, 0);
        eventEndDate.setHours(0, 0, 0, 0);

        if (isNaN(startDate) || isNaN(endDate)) {
            return res.status(400).json({ message: 'Invalid date format' });
        }

        if (endDate < startDate) {
            return res.status(400).json({ message: 'Contract end date must be after start date' });
        }

        // Contract dates should make sense for the event
        // Adjust the comparison to be inclusive (using <= and >=)
        if (startDate > eventStartDate || endDate < eventEndDate) {
            console.log('Date validation failed:', {
                contract_start: startDate.toISOString(),
                contract_end: endDate.toISOString(),
                event_start: eventStartDate.toISOString(),
                event_end: eventEndDate.toISOString()
            });
            return res.status(400).json({
                message: 'Contract dates should cover the event dates'
            });
        }

        // Create sponsorship
        const sponsorshipData = {
            sponsor_id,
            package_id,
            event_id,
            contract_start_date,
            contract_end_date,
            contract_document,
            total_amount: package_.price,
            notes,
            status: 'pending' // Default status for new contracts
        };

        const sponsorship = await Sponsorship.create(sponsorshipData);

        res.status(201).json({
            message: 'Sponsorship application submitted successfully',
            sponsorship
        });
    } catch (error) {
        console.error('Error in createSponsorship:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get all sponsorships (with filtering)
 */
export const getAllSponsorships = async (req, res) => {
    try {
        // Parse query params for filtering
        const options = {
            status: req.query.status,
            packageId: req.query.packageId ? parseInt(req.query.packageId) : undefined,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            limit: req.query.limit ? parseInt(req.query.limit) : 10,
            offset: req.query.offset ? parseInt(req.query.offset) : 0
        };

        const sponsorships = await Sponsorship.findAll(options);

        res.status(200).json({ sponsorships });
    } catch (error) {
        console.error('Error in getAllSponsorships:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get sponsorship by ID
 */
export const getSponsorshipById = async (req, res) => {
    try {
        const { id } = req.params;
        const sponsorship = await Sponsorship.findById(id);

        if (!sponsorship) {
            return res.status(404).json({ message: 'Sponsorship not found' });
        }

        // Check authorization: Only admins, organizers of the event, and the sponsor can see
        const isAdmin = req.user.role === 'admin';
        const isOrganizer = req.user.id === sponsorship.organizer_id;
        const isSponsor = req.user.id === sponsorship.sponsor_id;

        if (!isAdmin && !isOrganizer && !isSponsor) {
            return res.status(403).json({
                message: 'You do not have permission to view this sponsorship'
            });
        }

        // Get payments and promotions if requested
        if (req.query.details === 'true') {
            const [payments, promotions] = await Promise.all([
                Sponsorship.getPayments(id),
                Sponsorship.getPromotions(id)
            ]);

            res.status(200).json({
                sponsorship,
                payments,
                promotions
            });
        } else {
            res.status(200).json({ sponsorship });
        }
    } catch (error) {
        console.error('Error in getSponsorshipById:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get sponsorships for a specific event
 */
export const getSponsorshipsByEventId = async (req, res) => {
    try {
        const { eventId } = req.params;

        // Check if event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Only show approved/active sponsorships for public viewing
        // Show all for organizers and admins
        const isOrganizer = req.user && (req.user.role === 'admin' || req.user.id === event.organizer_id);

        let sponsorships;
        if (isOrganizer) {
            // Show all sponsorships to organizers/admins
            sponsorships = await Sponsorship.findByEventId(eventId);
        } else {
            // Filter to only approved/active for public
            const allSponsorships = await Sponsorship.findByEventId(eventId);
            sponsorships = allSponsorships.filter(s =>
                s.status === 'approved' || s.status === 'active');
        }

        res.status(200).json({ sponsorships });
    } catch (error) {
        console.error('Error in getSponsorshipsByEventId:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get sponsorships for the current user (sponsor)
 */
export const getMySponsorships = async (req, res) => {
    try {
        const sponsorId = req.user.id;
        const sponsorships = await Sponsorship.findBySponsorId(sponsorId);

        res.status(200).json({ sponsorships });
    } catch (error) {
        console.error('Error in getMySponsorships:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Update sponsorship status (admin/organizer only)
 */
export const updateSponsorshipStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        // Check if sponsorship exists
        const sponsorship = await Sponsorship.findById(id);
        if (!sponsorship) {
            return res.status(404).json({ message: 'Sponsorship not found' });
        }

        // Get event details to check if user is the organizer
        const event = await Event.findById(sponsorship.event_id);

        // Authorization check: Only admins and event organizers can update status
        const isAdmin = req.user.role === 'admin';
        const isOrganizer = event && req.user.id === event.organizer_id;

        if (!isAdmin && !isOrganizer) {
            return res.status(403).json({
                message: 'You do not have permission to update this sponsorship'
            });
        }

        // Update status
        const updateData = {
            status: status,
            notes: notes !== undefined ? notes : sponsorship.notes
        };

        const updatedSponsorship = await Sponsorship.update(id, updateData);

        res.status(200).json({
            message: `Sponsorship ${status} successfully`,
            sponsorship: updatedSponsorship
        });
    } catch (error) {
        console.error('Error in updateSponsorshipStatus:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Update sponsorship contract details (by sponsor or admin)
 */
export const updateSponsorship = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            contract_start_date, contract_end_date,
            contract_document, notes
        } = req.body;

        // Check if sponsorship exists
        const sponsorship = await Sponsorship.findById(id);
        if (!sponsorship) {
            return res.status(404).json({ message: 'Sponsorship not found' });
        }

        // Authorization check: Only sponsor who created it, admins, or event organizers can update
        const isOwner = req.user.id === sponsorship.sponsor_id;
        const isAdmin = req.user.role === 'admin';

        // Get event details to check if user is the organizer
        const event = await Event.findById(sponsorship.event_id);
        const isOrganizer = event && req.user.id === event.organizer_id;

        if (!isOwner && !isAdmin && !isOrganizer) {
            return res.status(403).json({
                message: 'You do not have permission to update this sponsorship'
            });
        }

        // Cannot update once approved except for admins/organizers
        if (sponsorship.status !== 'pending' && !isAdmin && !isOrganizer) {
            return res.status(400).json({
                message: 'Cannot update sponsorship after it has been approved'
            });
        }

        // Prepare update data
        const updateData = {};

        if (contract_start_date) updateData.contract_start_date = contract_start_date;
        if (contract_end_date) updateData.contract_end_date = contract_end_date;
        if (contract_document) updateData.contract_document = contract_document;
        if (notes !== undefined) updateData.notes = notes;

        // Validate date logic if updating dates
        if (contract_start_date || contract_end_date) {
            const startDate = new Date(contract_start_date || sponsorship.contract_start_date);
            const endDate = new Date(contract_end_date || sponsorship.contract_end_date);

            if (isNaN(startDate) || isNaN(endDate)) {
                return res.status(400).json({ message: 'Invalid date format' });
            }

            if (endDate <= startDate) {
                return res.status(400).json({ message: 'Contract end date must be after start date' });
            }

            // Contract dates should make sense for the event
            const eventStartDate = new Date(event.start_date);
            const eventEndDate = new Date(event.end_date);

            if (startDate > eventStartDate || endDate < eventEndDate) {
                return res.status(400).json({
                    message: 'Contract dates should cover the event dates'
                });
            }
        }

        // Update sponsorship
        const updatedSponsorship = await Sponsorship.update(id, updateData);

        res.status(200).json({
            message: 'Sponsorship updated successfully',
            sponsorship: updatedSponsorship
        });
    } catch (error) {
        console.error('Error in updateSponsorship:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Delete a sponsorship (admin or sponsor who created it only)
 */
export const deleteSponsorship = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if sponsorship exists
        const sponsorship = await Sponsorship.findById(id);
        if (!sponsorship) {
            return res.status(404).json({ message: 'Sponsorship not found' });
        }

        // Authorization check
        const isAdmin = req.user.role === 'admin';
        const isOwner = req.user.id === sponsorship.sponsor_id;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({
                message: 'You do not have permission to delete this sponsorship'
            });
        }

        // Cannot delete approved sponsorships except by admin
        if (!isAdmin && sponsorship.status !== 'pending') {
            return res.status(400).json({
                message: 'Cannot delete sponsorship after it has been approved'
            });
        }

        // Delete sponsorship
        await Sponsorship.delete(id);

        res.status(200).json({
            message: 'Sponsorship deleted successfully'
        });
    } catch (error) {
        console.error('Error in deleteSponsorship:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Add payment to sponsorship
 */
export const addPayment = async (req, res) => {
    try {
        const { sponsorshipId } = req.params;
        const {
            amount, payment_date, payment_method,
            reference_number, notes, receipt_url
        } = req.body;

        // Validate essential input
        if (!amount || !payment_date || !payment_method) {
            return res.status(400).json({
                message: 'Please provide amount, payment date, and payment method'
            });
        }

        // Check if sponsorship exists
        const sponsorship = await Sponsorship.findById(sponsorshipId);
        if (!sponsorship) {
            return res.status(404).json({ message: 'Sponsorship not found' });
        }

        // Authorization check
        const isAdmin = req.user.role === 'admin';
        const isOrganizer = req.user.id === sponsorship.organizer_id;
        const isSponsor = req.user.id === sponsorship.sponsor_id;

        if (!isAdmin && !isOrganizer && !isSponsor) {
            return res.status(403).json({
                message: 'You do not have permission to add payments to this sponsorship'
            });
        }

        // Cannot add payments to pending or cancelled sponsorships
        if (sponsorship.status === 'pending' || sponsorship.status === 'cancelled') {
            return res.status(400).json({
                message: `Cannot add payments to ${sponsorship.status} sponsorships`
            });
        }

        // Add payment
        const paymentData = {
            sponsorship_id: parseInt(sponsorshipId),
            amount: parseFloat(amount),
            payment_date,
            payment_method,
            reference_number,
            notes,
            receipt_url
        };

        const payment = await Sponsorship.addPayment(paymentData);

        // Check if status needs update to 'active'
        if (sponsorship.status === 'approved') {
            await Sponsorship.update(sponsorshipId, { status: 'active' });
        }

        res.status(201).json({
            message: 'Payment added successfully',
            payment
        });
    } catch (error) {
        console.error('Error in addPayment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get payments for a sponsorship
 */
export const getPayments = async (req, res) => {
    try {
        const { sponsorshipId } = req.params;

        // Check if sponsorship exists
        const sponsorship = await Sponsorship.findById(sponsorshipId);
        if (!sponsorship) {
            return res.status(404).json({ message: 'Sponsorship not found' });
        }

        // Authorization check
        const isAdmin = req.user.role === 'admin';
        const isOrganizer = req.user.id === sponsorship.organizer_id;
        const isSponsor = req.user.id === sponsorship.sponsor_id;

        if (!isAdmin && !isOrganizer && !isSponsor) {
            return res.status(403).json({
                message: 'You do not have permission to view payments for this sponsorship'
            });
        }

        // Get payments
        const payments = await Sponsorship.getPayments(sponsorshipId);

        res.status(200).json({ payments });
    } catch (error) {
        console.error('Error in getPayments:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Add promotional activity to sponsorship
 */
export const addPromotion = async (req, res) => {
    try {
        const { sponsorshipId } = req.params;
        const {
            promotion_type, description, location,
            start_date, end_date, status, verification_image, notes
        } = req.body;

        // Validate essential input
        if (!promotion_type || !description) {
            return res.status(400).json({
                message: 'Please provide promotion type and description'
            });
        }

        // Check if sponsorship exists
        const sponsorship = await Sponsorship.findById(sponsorshipId);
        if (!sponsorship) {
            return res.status(404).json({ message: 'Sponsorship not found' });
        }

        // Authorization check
        const isAdmin = req.user.role === 'admin';
        const isOrganizer = req.user.id === sponsorship.organizer_id;

        if (!isAdmin && !isOrganizer) {
            return res.status(403).json({
                message: 'Only admins and event organizers can add promotional activities'
            });
        }

        // Cannot add promotions to pending or cancelled sponsorships
        if (sponsorship.status === 'pending' || sponsorship.status === 'cancelled') {
            return res.status(400).json({
                message: `Cannot add promotions to ${sponsorship.status} sponsorships`
            });
        }

        // Add promotion
        const promotionData = {
            sponsorship_id: parseInt(sponsorshipId),
            promotion_type,
            description,
            location,
            start_date,
            end_date,
            status: status || 'planned',
            verification_image,
            notes
        };

        const promotion = await Sponsorship.addPromotion(promotionData);

        res.status(201).json({
            message: 'Promotion added successfully',
            promotion
        });
    } catch (error) {
        console.error('Error in addPromotion:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get promotional activities for a sponsorship
 */
export const getPromotions = async (req, res) => {
    try {
        const { sponsorshipId } = req.params;

        // Check if sponsorship exists
        const sponsorship = await Sponsorship.findById(sponsorshipId);
        if (!sponsorship) {
            return res.status(404).json({ message: 'Sponsorship not found' });
        }

        // Authorization check
        const isAdmin = req.user.role === 'admin';
        const isOrganizer = req.user.id === sponsorship.organizer_id;
        const isSponsor = req.user.id === sponsorship.sponsor_id;

        if (!isAdmin && !isOrganizer && !isSponsor) {
            return res.status(403).json({
                message: 'You do not have permission to view promotions for this sponsorship'
            });
        }

        // Get promotions
        const promotions = await Sponsorship.getPromotions(sponsorshipId);

        res.status(200).json({ promotions });
    } catch (error) {
        console.error('Error in getPromotions:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Generate sponsorship report
 */
export const generateReport = async (req, res) => {
    try {
        // Only admins and organizers can generate reports
        if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
            return res.status(403).json({
                message: 'Only admins and event organizers can generate reports'
            });
        }

        // Parse filter options from query params
        const options = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            status: req.query.status
        };

        // Generate report
        const report = await Sponsorship.generateSummaryReport(options);

        res.status(200).json({ report });
    } catch (error) {
        console.error('Error in generateReport:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};