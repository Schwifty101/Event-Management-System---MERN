// filepath: /Users/sobanahmad/Fast-Nuces/Semester 6/DBlab/semesterProject/server/tests/controllers/userController.test.js
import { jest } from '@jest/globals';

// Mock the User model and other dependencies
jest.mock('../../src/models/userModel.js', () => {
    return {
        User: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            countByRole: jest.fn()
        }
    };
});

jest.mock('bcrypt', () => {
    return {
        compare: jest.fn()
    };
});

jest.mock('jsonwebtoken', () => {
    return {
        sign: jest.fn().mockReturnValue('test-token')
    };
});

jest.mock('../../src/config/db.js', () => {
    return {
        pool: {
            execute: jest.fn()
        }
    };
});

// Import controller and mocked modules
import * as userController from '../../src/controllers/userController.js';
import { User } from '../../src/models/userModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../../src/config/db.js';

describe('UserController', () => {
    // Setup mock request and response
    let mockRequest;
    let mockResponse;
    let mockUser;

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

        mockUser = {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            password: 'hashedpassword',
            role: 'participant'
        };
    });

    describe('createUser', () => {
        it('should create a new user successfully', async () => {
            // Setup
            mockRequest.body = {
                name: 'New User',
                email: 'new@example.com',
                password: 'password123'
            };

            User.findByEmail.mockResolvedValue(null); // User doesn't exist
            User.create.mockResolvedValue({
                id: 2,
                name: 'New User',
                email: 'new@example.com',
                role: 'participant'
            });

            // Test
            await userController.createUser(mockRequest, mockResponse);

            // Assertions
            expect(User.findByEmail).toHaveBeenCalledWith('new@example.com');
            expect(User.create).toHaveBeenCalledWith({
                name: 'New User',
                email: 'new@example.com',
                password: 'password123',
                role: 'participant'
            });
            expect(jwt.sign).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'User created successfully',
                    token: 'test-token'
                })
            );
        });

        it('should return 400 if required fields are missing', async () => {
            // Setup
            mockRequest.body = {
                name: 'Incomplete User'
            };

            // Test
            await userController.createUser(mockRequest, mockResponse);

            // Assertions
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Please provide name, email, and password'
            });
        });

        it('should return 409 if user already exists', async () => {
            // Setup
            mockRequest.body = {
                name: 'Existing User',
                email: 'existing@example.com',
                password: 'password123'
            };

            User.findByEmail.mockResolvedValue({ id: 3, email: 'existing@example.com' });

            // Test
            await userController.createUser(mockRequest, mockResponse);

            // Assertions
            expect(User.findByEmail).toHaveBeenCalledWith('existing@example.com');
            expect(mockResponse.status).toHaveBeenCalledWith(409);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'User with this email already exists'
            });
        });

        it('should handle errors', async () => {
            // Setup
            mockRequest.body = {
                name: 'Error User',
                email: 'error@example.com',
                password: 'password123'
            };

            const error = new Error('Database error');
            User.findByEmail.mockRejectedValue(error);

            // Test
            await userController.createUser(mockRequest, mockResponse);

            // Assertions
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Server error',
                error: error.message
            });
        });
    });

    describe('loginUser', () => {
        it('should login successfully with valid credentials', async () => {
            // Setup
            mockRequest.body = {
                email: 'test@example.com',
                password: 'password123'
            };

            User.findByEmail.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);

            // Test
            await userController.loginUser(mockRequest, mockResponse);

            // Assertions
            expect(User.findByEmail).toHaveBeenCalledWith('test@example.com');
            expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
            expect(jwt.sign).toHaveBeenCalledWith(
                { id: mockUser.id, email: mockUser.email, role: mockUser.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Login successful',
                    token: 'test-token'
                })
            );
        });

        it('should return 400 if required fields are missing', async () => {
            // Setup
            mockRequest.body = {
                email: 'test@example.com'
            };

            // Test
            await userController.loginUser(mockRequest, mockResponse);

            // Assertions
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Please provide email and password'
            });
        });

        it('should return 401 if user is not found', async () => {
            // Setup
            mockRequest.body = {
                email: 'nonexistent@example.com',
                password: 'password123'
            };

            User.findByEmail.mockResolvedValue(null);

            // Test
            await userController.loginUser(mockRequest, mockResponse);

            // Assertions
            expect(User.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Invalid credentials'
            });
        });

        it('should return 401 if password is incorrect', async () => {
            // Setup
            mockRequest.body = {
                email: 'test@example.com',
                password: 'wrongpassword'
            };

            User.findByEmail.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(false);

            // Test
            await userController.loginUser(mockRequest, mockResponse);

            // Assertions
            expect(User.findByEmail).toHaveBeenCalledWith('test@example.com');
            expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Invalid credentials'
            });
        });
    });

    describe('getAllUsers', () => {
        it('should fetch all users when user is admin', async () => {
            // Setup
            mockRequest.user = { id: 1, role: 'admin' };
            mockRequest.query = { page: '1', limit: '10' };

            const mockUsers = [mockUser, { id: 2, name: 'Another User', email: 'another@example.com', role: 'participant' }];
            const mockRoleCounts = { admin: 1, participant: 10, organizer: 5 };

            User.findAll.mockResolvedValue(mockUsers);
            User.countByRole.mockResolvedValue(mockRoleCounts);

            // Test
            await userController.getAllUsers(mockRequest, mockResponse);

            // Assertions
            expect(User.findAll).toHaveBeenCalledWith(1, 10, {});
            expect(User.countByRole).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                users: mockUsers,
                meta: {
                    page: 1,
                    limit: 10,
                    roleCounts: mockRoleCounts
                }
            });
        });

        it('should fetch users filtered by role', async () => {
            // Setup
            mockRequest.user = { id: 1, role: 'admin' };
            mockRequest.query = { role: 'participant' };

            const mockUsers = [mockUser];
            const mockRoleCounts = { admin: 1, participant: 10, organizer: 5 };

            User.findAll.mockResolvedValue(mockUsers);
            User.countByRole.mockResolvedValue(mockRoleCounts);

            // Test
            await userController.getAllUsers(mockRequest, mockResponse);

            // Assertions
            expect(User.findAll).toHaveBeenCalledWith(1, 10, { role: 'participant' });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });

        it('should return 403 if user is not admin or organizer', async () => {
            // Setup
            mockRequest.user = { id: 1, role: 'participant' };

            // Test
            await userController.getAllUsers(mockRequest, mockResponse);

            // Assertions
            expect(User.findAll).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Forbidden: Insufficient permissions'
            });
        });
    });

    describe('getUserById', () => {
        it('should return user by ID when found', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            User.findById.mockResolvedValue(mockUser);

            // Test
            await userController.getUserById(mockRequest, mockResponse);

            // Assertions
            expect(User.findById).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ user: mockUser });
        });

        it('should return 404 when user not found', async () => {
            // Setup
            mockRequest.params = { id: '999' };
            User.findById.mockResolvedValue(null);

            // Test
            await userController.getUserById(mockRequest, mockResponse);

            // Assertions
            expect(User.findById).toHaveBeenCalledWith('999');
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not found' });
        });
    });

    describe('updateUser', () => {
        it('should update user successfully', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            mockRequest.body = { name: 'Updated Name', email: 'updated@example.com' };

            User.findById.mockResolvedValue(mockUser);
            User.update.mockResolvedValue({
                id: 1,
                name: 'Updated Name',
                email: 'updated@example.com',
                role: 'participant'
            });

            // Test
            await userController.updateUser(mockRequest, mockResponse);

            // Assertions
            expect(User.findById).toHaveBeenCalledWith('1');
            expect(User.update).toHaveBeenCalledWith('1', expect.objectContaining({
                name: 'Updated Name',
                email: 'updated@example.com'
            }));
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'User updated successfully'
            }));
        });

        it('should allow admin to update user role', async () => {
            // Setup
            mockRequest.user = { id: 1, role: 'admin' };
            mockRequest.params = { id: '2' };
            mockRequest.body = { role: 'organizer' };

            User.findById.mockResolvedValue({ id: 2, name: 'User', role: 'participant' });
            User.update.mockResolvedValue({
                id: 2,
                name: 'User',
                role: 'organizer'
            });

            // Test
            await userController.updateUser(mockRequest, mockResponse);

            // Assertions
            expect(User.update).toHaveBeenCalledWith('2', expect.objectContaining({
                role: 'organizer'
            }));
        });

        it('should return 404 when user not found', async () => {
            // Setup
            mockRequest.params = { id: '999' };
            mockRequest.body = { name: 'Updated Name' };
            User.findById.mockResolvedValue(null);

            // Test
            await userController.updateUser(mockRequest, mockResponse);

            // Assertions
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not found' });
        });
    });

    describe('deleteUser', () => {
        it('should delete user successfully', async () => {
            // Setup
            mockRequest.params = { id: '1' };
            User.delete.mockResolvedValue(true);

            // Test
            await userController.deleteUser(mockRequest, mockResponse);

            // Assertions
            expect(User.delete).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'User deleted successfully'
            });
        });

        it('should return 404 when user not found', async () => {
            // Setup
            mockRequest.params = { id: '999' };
            User.delete.mockResolvedValue(false);

            // Test
            await userController.deleteUser(mockRequest, mockResponse);

            // Assertions
            expect(User.delete).toHaveBeenCalledWith('999');
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'User not found'
            });
        });
    });

    describe('getCurrentUser', () => {
        it('should fetch current user profile', async () => {
            // Setup
            mockRequest.user = { id: 1 };
            User.findById.mockResolvedValue(mockUser);

            // Test
            await userController.getCurrentUser(mockRequest, mockResponse);

            // Assertions
            expect(User.findById).toHaveBeenCalledWith(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ user: mockUser });
        });

        it('should return 404 when user not found', async () => {
            // Setup
            mockRequest.user = { id: 999 };
            User.findById.mockResolvedValue(null);

            // Test
            await userController.getCurrentUser(mockRequest, mockResponse);

            // Assertions
            expect(User.findById).toHaveBeenCalledWith(999);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'User not found'
            });
        });
    });

    describe('changePassword', () => {
        it('should validate required fields', async () => {
            // Setup
            mockRequest.user = { id: 1 };
            mockRequest.body = { currentPassword: 'oldpass' };

            // Test
            await userController.changePassword(mockRequest, mockResponse);

            // Assertions
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Current password and new password are required'
            });
        });

        it('should check if user exists', async () => {
            // Setup
            mockRequest.user = { id: 1 };
            mockRequest.body = { currentPassword: 'oldpass', newPassword: 'newpass' };

            pool.execute.mockResolvedValue([[]]);

            // Test
            await userController.changePassword(mockRequest, mockResponse);

            // Assertions
            expect(pool.execute).toHaveBeenCalledWith('SELECT * FROM users WHERE id = ?', [1]);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'User not found'
            });
        });

        it('should validate current password', async () => {
            // Setup
            mockRequest.user = { id: 1 };
            mockRequest.body = { currentPassword: 'wrongpass', newPassword: 'newpass' };

            pool.execute.mockResolvedValue([[mockUser]]);
            bcrypt.compare.mockResolvedValue(false);

            // Test
            await userController.changePassword(mockRequest, mockResponse);

            // Assertions
            expect(bcrypt.compare).toHaveBeenCalledWith('wrongpass', 'hashedpassword');
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Current password is incorrect'
            });
        });
    });
});