// filepath: /Users/sobanahmad/Fast-Nuces/Semester 6/DBlab/semesterProject/server/tests/controllers/sponsorshipPackageController.test.js
import { jest } from '@jest/globals';

// Mock the SponsorshipPackage model
jest.mock('../../src/models/sponsorshipPackageModel.js', () => {
    return {
        SponsorshipPackage: {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByName: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            isAtCapacity: jest.fn()
        }
    };
});

// Import the controller and mocked models
import * as sponsorshipPackageController from '../../src/controllers/sponsorshipPackageController.js';
import { SponsorshipPackage } from '../../src/models/sponsorshipPackageModel.js';

describe('SponsorshipPackageController', () => {
    // Setup mock request and response
    let mockRequest;
    let mockResponse;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Setup mock request and response objects
        mockRequest = {
            body: {},
            params: {},
            query: {},
            user: { id: 1, role: 'admin' }
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    describe('getAllPackages', () => {
        it('should return all active packages for public users', async () => {
            // Setup
            mockRequest.user = null;

            const mockPackages = [
                { id: 1, name: 'Gold', is_active: true },
                { id: 2, name: 'Silver', is_active: true }
            ];

            SponsorshipPackage.findAll.mockResolvedValue(mockPackages);

            // Test
            await sponsorshipPackageController.getAllPackages(mockRequest, mockResponse);

            // Assertions
            expect(SponsorshipPackage.findAll).toHaveBeenCalledWith({ isActive: true });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ packages: mockPackages });
        });

        it('should return all packages for admin users', async () => {
            // Setup
            mockRequest.user = { id: 1, role: 'admin' };

            const mockPackages = [
                { id: 1, name: 'Gold', is_active: true },
                { id: 2, name: 'Silver', is_active: false }
            ];

            SponsorshipPackage.findAll.mockResolvedValue(mockPackages);

            // Test
            await sponsorshipPackageController.getAllPackages(mockRequest, mockResponse);

            // Assertions
            expect(SponsorshipPackage.findAll).toHaveBeenCalledWith({ isActive: false });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ packages: mockPackages });
        });

        it('should filter by isActive when query param is provided', async () => {
            // Setup
            mockRequest.query = { isActive: 'true' };

            const mockActivePackages = [
                { id: 1, name: 'Gold', is_active: true },
                { id: 3, name: 'Bronze', is_active: true }
            ];

            SponsorshipPackage.findAll.mockResolvedValue(mockActivePackages);

            // Test
            await sponsorshipPackageController.getAllPackages(mockRequest, mockResponse);

            // Assertions
            expect(SponsorshipPackage.findAll).toHaveBeenCalledWith({ isActive: true });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ packages: mockActivePackages });
        });
    });

    describe('getPackageById', () => {
        it('should return package when found and active', async () => {
            // Setup
            mockRequest.params = { id: '1' };

            const mockPackage = {
                id: 1,
                name: 'Gold',
                description: 'Premium package',
                is_active: true
            };

            SponsorshipPackage.findById.mockResolvedValue(mockPackage);

            // Test
            await sponsorshipPackageController.getPackageById(mockRequest, mockResponse);

            // Assertions
            expect(SponsorshipPackage.findById).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ package: mockPackage });
        });

        it('should return 404 when package not found', async () => {
            // Setup
            mockRequest.params = { id: '999' };
            SponsorshipPackage.findById.mockResolvedValue(null);

            // Test
            await sponsorshipPackageController.getPackageById(mockRequest, mockResponse);

            // Assertions
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Sponsorship package not found' });
        });

        it('should return 404 when package is inactive for non-admin users', async () => {
            // Setup
            mockRequest.params = { id: '2' };
            mockRequest.user = { role: 'sponsor' };

            const mockPackage = {
                id: 2,
                name: 'Silver',
                is_active: false
            };

            SponsorshipPackage.findById.mockResolvedValue(mockPackage);

            // Test
            await sponsorshipPackageController.getPackageById(mockRequest, mockResponse);

            // Assertions
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Sponsorship package not found' });
        });

        it('should return inactive package for admin users', async () => {
            // Setup
            mockRequest.params = { id: '2' };
            mockRequest.user = { role: 'admin' };

            const mockPackage = {
                id: 2,
                name: 'Silver',
                is_active: false
            };

            SponsorshipPackage.findById.mockResolvedValue(mockPackage);

            // Test
            await sponsorshipPackageController.getPackageById(mockRequest, mockResponse);

            // Assertions
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ package: mockPackage });
        });
    });

    describe('createPackage', () => {
        it('should create package successfully', async () => {
            // Setup
            mockRequest.body = {
                name: 'Platinum',
                description: 'Top tier package',
                price: 5000,
                benefits: ['Logo on website', 'VIP booth'],
                max_sponsors: 5,
                is_active: true
            };

            SponsorshipPackage.findByName.mockResolvedValue(null);

            const newPackage = {
                id: 3,
                name: 'Platinum',
                description: 'Top tier package',
                price: 5000,
                benefits: ['Logo on website', 'VIP booth'],
                max_sponsors: 5,
                is_active: true
            };

            SponsorshipPackage.create.mockResolvedValue(newPackage);

            // Test
            await sponsorshipPackageController.createPackage(mockRequest, mockResponse);

            // Assertions
            expect(SponsorshipPackage.findByName).toHaveBeenCalledWith('Platinum');
            expect(SponsorshipPackage.create).toHaveBeenCalledWith(expect.objectContaining({
                name: 'Platinum',
                price: 5000
            }));
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Sponsorship package created successfully',
                package: newPackage
            }));
        });

        it('should return 400 when required fields are missing', async () => {
            // Setup
            mockRequest.body = {
                name: 'Incomplete Package'
                // missing price and benefits
            };

            // Test
            await sponsorshipPackageController.createPackage(mockRequest, mockResponse);

            // Assertions
            expect(SponsorshipPackage.findByName).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Please provide name, price, and benefits'
            });
        });

        it('should return 409 when package name already exists', async () => {
            // Setup
            mockRequest.body = {
                name: 'Gold',
                description: 'Existing package',
                price: 3000,
                benefits: ['Logo on website']
            };

            SponsorshipPackage.findByName.mockResolvedValue({
                id: 1,
                name: 'Gold'
            });

            // Test
            await sponsorshipPackageController.createPackage(mockRequest, mockResponse);

            // Assertions
            expect(SponsorshipPackage.findByName).toHaveBeenCalledWith('Gold');
            expect(SponsorshipPackage.create).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(409);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'A sponsorship package with this name already exists'
            });
        });
    });

    describe('updatePackage', () => {
        it('should update package successfully', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            mockRequest.body = {
                name: 'Gold Premium',
                price: 4000
            };

            const existingPackage = {
                id: 1,
                name: 'Gold',
                description: 'Original description',
                price: 3000,
                benefits: ['Original benefits']
            };

            const updatedPackage = {
                id: 1,
                name: 'Gold Premium',
                description: 'Original description',
                price: 4000,
                benefits: ['Original benefits']
            };

            SponsorshipPackage.findById.mockResolvedValue(existingPackage);
            SponsorshipPackage.findByName.mockResolvedValue(null); // No duplicate name
            SponsorshipPackage.update.mockResolvedValue(updatedPackage);

            // Test
            await sponsorshipPackageController.updatePackage(mockRequest, mockResponse);

            // Assertions
            expect(SponsorshipPackage.findById).toHaveBeenCalledWith('1');
            expect(SponsorshipPackage.findByName).toHaveBeenCalledWith('Gold Premium');
            expect(SponsorshipPackage.update).toHaveBeenCalledWith('1', expect.objectContaining({
                name: 'Gold Premium',
                price: 4000
            }));
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Sponsorship package updated successfully',
                package: updatedPackage
            }));
        });

        it('should return 404 when package not found', async () => {
            // Setup
            mockRequest.params = { id: '999' };
            mockRequest.body = {
                name: 'Updated Nonexistent'
            };

            SponsorshipPackage.findById.mockResolvedValue(null);

            // Test
            await sponsorshipPackageController.updatePackage(mockRequest, mockResponse);

            // Assertions
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Sponsorship package not found'
            });
        });

        it('should return 409 when new name already exists', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            mockRequest.body = {
                name: 'Silver'
            };

            const existingPackage = {
                id: 1,
                name: 'Gold'
            };

            const duplicatePackage = {
                id: 2,
                name: 'Silver'
            };

            SponsorshipPackage.findById.mockResolvedValue(existingPackage);
            SponsorshipPackage.findByName.mockResolvedValue(duplicatePackage);

            // Test
            await sponsorshipPackageController.updatePackage(mockRequest, mockResponse);

            // Assertions
            expect(SponsorshipPackage.update).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(409);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'A sponsorship package with this name already exists'
            });
        });
    });

    describe('deletePackage', () => {
        it('should delete package successfully', async () => {
            // Setup
            mockRequest.params = { id: '1' };

            const packageToDelete = {
                id: 1,
                name: 'Bronze'
            };

            SponsorshipPackage.findById.mockResolvedValue(packageToDelete);
            SponsorshipPackage.isAtCapacity.mockResolvedValue(false);
            SponsorshipPackage.delete.mockResolvedValue(true);

            // Test
            await sponsorshipPackageController.deletePackage(mockRequest, mockResponse);

            // Assertions
            expect(SponsorshipPackage.findById).toHaveBeenCalledWith('1');
            expect(SponsorshipPackage.isAtCapacity).toHaveBeenCalledWith('1');
            expect(SponsorshipPackage.delete).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Sponsorship package deleted successfully'
            });
        });

        it('should return 404 when package not found', async () => {
            // Setup
            mockRequest.params = { id: '999' };
            SponsorshipPackage.findById.mockResolvedValue(null);

            // Test
            await sponsorshipPackageController.deletePackage(mockRequest, mockResponse);

            // Assertions
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Sponsorship package not found'
            });
        });

        it('should return 400 when package has active sponsorships', async () => {
            // Setup
            mockRequest.params = { id: '1' };

            const packageWithSponsors = {
                id: 1,
                name: 'Gold'
            };

            SponsorshipPackage.findById.mockResolvedValue(packageWithSponsors);
            SponsorshipPackage.isAtCapacity.mockResolvedValue(true);

            // Test
            await sponsorshipPackageController.deletePackage(mockRequest, mockResponse);

            // Assertions
            expect(SponsorshipPackage.delete).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Cannot delete package that has active sponsorships'
            });
        });
    });
});