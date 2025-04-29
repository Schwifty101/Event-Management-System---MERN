import { jest } from '@jest/globals';
import * as controller from '../../src/controllers/analyticsController.js';
import { Event } from '../../src/models/eventModel.js';
import { EventCategory } from '../../src/models/eventCategoryModel.js';
import { Payment } from '../../src/models/paymentModel.js';
import { Sponsorship } from '../../src/models/sponsorshipModel.js';
import { AccommodationBooking } from '../../src/models/accommodationBookingModel.js';
import { Accommodation } from '../../src/models/accommodationModel.js';

// Mock the models and dependencies
jest.mock('../../src/models/eventModel.js');
jest.mock('../../src/models/eventCategoryModel.js');
jest.mock('../../src/models/paymentModel.js');
jest.mock('../../src/models/sponsorshipModel.js');
jest.mock('../../src/models/accommodationBookingModel.js');
jest.mock('../../src/models/accommodationModel.js');

// Import the pool before mocking it
import { pool } from '../../src/config/db.js';

// Now mock the db module
jest.mock('../../src/config/db.js', () => {
    const originalModule = jest.requireActual('../../src/config/db.js');
    return {
        ...originalModule,
        pool: {
            execute: jest.fn()
        }
    };
});

describe('Analytics Controller', () => {
    let req;
    let res;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Setup the pool.execute mock for each test
        pool.execute = jest.fn();

        // Mock request object
        req = {
            body: {},
            params: {},
            query: {},
            user: {
                id: 1,
                role: 'admin'
            }
        };

        // Mock response object
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            setHeader: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
    });

    describe('getParticipationStats', () => {
        beforeEach(() => {
            req.query = {
                eventId: '1',
                startDate: '2025-01-01',
                endDate: '2025-12-31'
            };

            // Mock the pool.execute responses for each query
            pool.execute.mockImplementation((query, params) => {
                if (query.includes('SELECT e.id, e.title')) {
                    return Promise.resolve([[
                        {
                            id: 1,
                            title: 'Test Event',
                            team_count: 5,
                            individual_participants: 20,
                            total_participants: 45,
                            paid_registrations: 40,
                            pending_registrations: 5
                        }
                    ]]);
                } else if (query.includes('SELECT ec.name as category')) {
                    return Promise.resolve([[
                        { category: 'Technical', event_count: 3, total_participants: 150 }
                    ]]);
                } else if (query.includes('DATE_FORMAT(er.registration_date')) {
                    return Promise.resolve([[
                        { period: '2025-01', registrations: 15 },
                        { period: '2025-02', registrations: 30 }
                    ]]);
                }
                return Promise.resolve([[]]);
            });
        });

        test('should return participation stats for admin', async () => {
            await controller.getParticipationStats(req, res);

            expect(pool.execute).toHaveBeenCalledTimes(2); // Two queries executed
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    events: expect.arrayContaining([
                        expect.objectContaining({
                            id: 1,
                            title: 'Test Event'
                        })
                    ]),
                    registrationTrends: expect.arrayContaining([
                        expect.objectContaining({
                            period: expect.any(String),
                            registrations: expect.any(Number)
                        })
                    ])
                })
            );
        });

        test('should return participation stats for organizer', async () => {
            req.user.role = 'organizer';

            await controller.getParticipationStats(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('should return 403 for non-admin/non-organizer users', async () => {
            req.user.role = 'user';

            await controller.getParticipationStats(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('Only admins and organizers')
                })
            );
        });

        test('should handle errors', async () => {
            pool.execute.mockRejectedValue(new Error('Database error'));

            await controller.getParticipationStats(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Server error'
                })
            );
        });
    });

    describe('getVenueUtilization', () => {
        beforeEach(() => {
            req.query = {
                startDate: '2025-01-01',
                endDate: '2025-12-31'
            };

            // Spy on res.json to intercept the response
            res.json = jest.fn();

            // Mock the pool.execute responses for venue utilization queries
            pool.execute.mockImplementation((query, params) => {
                if (query.includes('SELECT location, COUNT(*) as event_count')) {
                    return Promise.resolve([[
                        {
                            location: 'Main Hall',
                            event_count: 10,
                            total_hours: 50,
                            first_usage: '2025-01-15',
                            last_usage: '2025-10-20'
                        }
                    ]]);
                } else if (query.includes('SELECT e.location, r.name as round_name')) {
                    return Promise.resolve([[
                        {
                            location: 'Main Hall',
                            round_name: 'Final Round',
                            session_count: 5,
                            avg_duration_minutes: 120,
                            total_capacity: 500,
                            total_actual_attendance: 450,
                            avg_capacity_utilization_percent: 90
                        }
                    ]]);
                } else if (query.includes('SELECT location, HOUR(start_time)')) {
                    return Promise.resolve([[
                        { location: 'Main Hall', hour_of_day: 9, session_count: 3 },
                        { location: 'Main Hall', hour_of_day: 14, session_count: 7 }
                    ]]);
                }
                return Promise.resolve([[]]);
            });
        });

        test('should return venue utilization data for admin', async () => {
            await controller.getVenueUtilization(req, res);

            expect(pool.execute).toHaveBeenCalledTimes(3); // Three queries executed
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    venues: expect.arrayContaining([
                        expect.objectContaining({
                            location: 'Main Hall',
                            event_count: 10
                        })
                    ]),
                    roundUtilization: expect.arrayContaining([
                        expect.objectContaining({
                            location: 'Main Hall',
                            round_name: 'Final Round'
                        })
                    ]),
                    timeDistribution: expect.arrayContaining([
                        expect.objectContaining({
                            location: 'Main Hall',
                            hour_of_day: expect.any(Number)
                        })
                    ])
                })
            );
        });

        test('should return 403 for non-admin/non-organizer users', async () => {
            req.user.role = 'user';

            await controller.getVenueUtilization(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
        });

        test('should handle errors', async () => {
            pool.execute.mockRejectedValue(new Error('Database error'));

            await controller.getVenueUtilization(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getFinancialMetrics', () => {
        beforeEach(() => {
            req.query = {
                startDate: '2025-01-01',
                endDate: '2025-12-31',
                eventId: '1'
            };

            // Spy on res.json to intercept the response
            res.json = jest.fn();

            // Mock Financial Report
            Payment.generateFinancialReport = jest.fn().mockResolvedValue({
                summary: {
                    total_revenue: 50000,
                    pending_revenue: 5000
                },
                registrations: { total_amount: 30000 },
                sponsorships: { total_amount: 15000 },
                accommodations: { total_amount: 5000 },
                event_breakdown: [{ event_id: 1, event_name: 'Test Event', total: 50000 }]
            });

            // Mock sponsorship breakdown query
            pool.execute.mockImplementation((query, params) => {
                if (query.includes('SELECT p.name as package_name')) {
                    return Promise.resolve([[
                        {
                            package_name: 'Gold Sponsor',
                            package_price: 10000,
                            sponsor_count: 2,
                            total_amount: 20000,
                            received_amount: 15000
                        }
                    ]]);
                } else if (query.includes('SELECT DATE_FORMAT(COALESCE(erp.payment_date')) {
                    return Promise.resolve([[
                        {
                            month: '2025-01',
                            registration_revenue: 10000,
                            sponsorship_revenue: 5000,
                            accommodation_revenue: 2000,
                            total_revenue: 17000
                        }
                    ]]);
                }
                return Promise.resolve([[]]);
            });
        });

        test('should return financial metrics for admin', async () => {
            await controller.getFinancialMetrics(req, res);

            expect(Payment.generateFinancialReport).toHaveBeenCalled();
            expect(pool.execute).toHaveBeenCalledTimes(2); // Two queries executed
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    financialSummary: expect.objectContaining({
                        total_revenue: 50000
                    }),
                    revenueSources: expect.objectContaining({
                        registrations: expect.objectContaining({
                            total_amount: 30000
                        })
                    }),
                    sponsorshipBreakdown: expect.arrayContaining([
                        expect.objectContaining({
                            package_name: 'Gold Sponsor'
                        })
                    ]),
                    revenueByMonth: expect.arrayContaining([
                        expect.objectContaining({
                            month: '2025-01'
                        })
                    ])
                })
            );
        });

        test('should return 403 for non-admin/non-organizer users', async () => {
            req.user.role = 'user';

            await controller.getFinancialMetrics(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(Payment.generateFinancialReport).not.toHaveBeenCalled();
        });

        test('should handle errors in financial report generation', async () => {
            Payment.generateFinancialReport.mockRejectedValue(new Error('Report generation failed'));

            await controller.getFinancialMetrics(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getAccommodationMetrics', () => {
        beforeEach(() => {
            req.query = {
                startDate: '2025-01-01',
                endDate: '2025-12-31',
                eventId: '1'
            };

            // Mock booking reports
            AccommodationBooking.generateReports = jest.fn().mockResolvedValue({
                summary: {
                    total_bookings: 100,
                    total_revenue: 25000,
                    avg_booking_value: 250
                },
                statusBreakdown: [
                    { status: 'confirmed', count: 80 },
                    { status: 'pending', count: 15 },
                    { status: 'cancelled', count: 5 }
                ],
                eventBreakdown: [
                    { event_id: 1, event_name: 'Test Event', bookings: 100 }
                ]
            });

            // Mock accommodation queries
            pool.execute.mockImplementation((query, params) => {
                if (query.includes('SELECT a.id, a.name, a.location')) {
                    return Promise.resolve([[
                        {
                            id: 1,
                            name: 'Grand Hotel',
                            location: 'Downtown',
                            total_rooms: 50,
                            booked_rooms: 45,
                            occupancy_rate: 90.00,
                            total_revenue: 15000,
                            rate_per_night: 150,
                            total_nights_booked: 100
                        }
                    ]]);
                } else if (query.includes('SELECT r.room_type')) {
                    return Promise.resolve([[
                        {
                            room_type: 'Standard',
                            total_rooms: 30,
                            bookings: 28,
                            popularity_percent: 93.33
                        }
                    ]]);
                } else if (query.includes('SELECT DATE_FORMAT(b.check_in_date')) {
                    return Promise.resolve([[
                        {
                            month: '2025-01',
                            bookings: 40,
                            revenue: 10000
                        },
                        {
                            month: '2025-02',
                            bookings: 60,
                            revenue: 15000
                        }
                    ]]);
                }
                return Promise.resolve([[]]);
            });
        });

        test('should return accommodation metrics for admin', async () => {
            await controller.getAccommodationMetrics(req, res);

            expect(AccommodationBooking.generateReports).toHaveBeenCalled();
            expect(pool.execute).toHaveBeenCalledTimes(3); // Three queries executed
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    summary: expect.objectContaining({
                        total_bookings: 100
                    }),
                    occupancyRates: expect.arrayContaining([
                        expect.objectContaining({
                            name: 'Grand Hotel'
                        })
                    ]),
                    roomTypePopularity: expect.arrayContaining([
                        expect.objectContaining({
                            room_type: 'Standard'
                        })
                    ]),
                    bookingTimeline: expect.arrayContaining([
                        expect.objectContaining({
                            month: expect.any(String)
                        })
                    ])
                })
            );
        });

        test('should return 403 for non-admin/non-organizer users', async () => {
            req.user.role = 'user';

            await controller.getAccommodationMetrics(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(AccommodationBooking.generateReports).not.toHaveBeenCalled();
        });

        test('should handle errors in booking report generation', async () => {
            AccommodationBooking.generateReports.mockRejectedValue(new Error('Report generation failed'));

            await controller.getAccommodationMetrics(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getDemographicMetrics', () => {
        beforeEach(() => {
            req.query = {
                eventId: '1'
            };

            // Mock demographic queries
            pool.execute.mockImplementation((query, params) => {
                if (query.includes('TIMESTAMPDIFF(YEAR, u.birth_date')) {
                    return Promise.resolve([[
                        { age_group: '18-24', count: 50 },
                        { age_group: '25-34', count: 30 }
                    ]]);
                } else if (query.includes('gender')) {
                    return Promise.resolve([[
                        { gender: 'Male', count: 40 },
                        { gender: 'Female', count: 35 },
                        { gender: 'Other', count: 5 }
                    ]]);
                } else if (query.includes('location')) {
                    return Promise.resolve([[
                        { location: 'New York', count: 25 },
                        { location: 'Los Angeles', count: 20 }
                    ]]);
                } else if (query.includes('education_level')) {
                    return Promise.resolve([[
                        { education_level: 'Bachelor', count: 40 },
                        { education_level: 'Master', count: 25 }
                    ]]);
                } else if (query.includes('profession')) {
                    return Promise.resolve([[
                        { profession: 'Engineer', count: 30 },
                        { profession: 'Designer', count: 15 }
                    ]]);
                }
                return Promise.resolve([[]]);
            });
        });

        test('should return demographic metrics for admin', async () => {
            await controller.getDemographicMetrics(req, res);

            expect(pool.execute).toHaveBeenCalledTimes(5); // Five queries executed
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    ageDistribution: expect.arrayContaining([
                        expect.objectContaining({
                            age_group: expect.any(String)
                        })
                    ]),
                    genderDistribution: expect.arrayContaining([
                        expect.objectContaining({
                            gender: expect.any(String)
                        })
                    ]),
                    locationDistribution: expect.arrayContaining([
                        expect.objectContaining({
                            location: expect.any(String)
                        })
                    ]),
                    educationDistribution: expect.arrayContaining([
                        expect.objectContaining({
                            education_level: expect.any(String)
                        })
                    ]),
                    professionDistribution: expect.arrayContaining([
                        expect.objectContaining({
                            profession: expect.any(String)
                        })
                    ])
                })
            );
        });

        test('should return 403 for non-admin/non-organizer users', async () => {
            req.user.role = 'user';

            await controller.getDemographicMetrics(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
        });

        test('should handle errors', async () => {
            pool.execute.mockRejectedValue(new Error('Database error'));

            await controller.getDemographicMetrics(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('exportData', () => {
        beforeEach(() => {
            req.query = {
                type: 'events',
                format: 'csv',
                eventId: '1',
                startDate: '2025-01-01',
                endDate: '2025-12-31'
            };

            // Mock export data query
            pool.execute.mockImplementation((query, params) => {
                return Promise.resolve([[
                    {
                        id: 1,
                        title: 'Test Event',
                        description: 'A test event',
                        location: 'Main Venue',
                        start_date: '2025-05-01',
                        end_date: '2025-05-03',
                        capacity: 100,
                        category: 'Conference',
                        organizer_name: 'John Doe',
                        registration_count: 75
                    }
                ]]);
            });
        });

        test('should export data as CSV for admin', async () => {
            await controller.exportData(req, res);

            expect(pool.execute).toHaveBeenCalled();
            expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
            expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringContaining('events_export'));
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalled();
        });

        test('should export data as JSON when format is json', async () => {
            req.query.format = 'json';

            await controller.exportData(req, res);

            expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.any(Array)
            }));
        });

        test('should return 400 if no type is specified', async () => {
            delete req.query.type;

            await controller.exportData(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('Please specify a data type')
            }));
        });

        test('should return 400 if invalid type is specified', async () => {
            req.query.type = 'invalid_type';

            await controller.exportData(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('Invalid export type')
            }));
        });

        test('should return 400 if invalid format is specified', async () => {
            req.query.format = 'invalid_format';

            await controller.exportData(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('Export format must be csv or json')
            }));
        });

        test('should return 404 if no data found', async () => {
            pool.execute.mockImplementation(() => Promise.resolve([[]]));

            await controller.exportData(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('No data found')
            }));
        });

        test('should return 403 for non-admin/non-organizer users', async () => {
            req.user.role = 'user';

            await controller.exportData(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
        });

        test('should handle errors', async () => {
            pool.execute.mockRejectedValue(new Error('Database error'));

            await controller.exportData(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getDashboardMetrics', () => {
        beforeEach(() => {
            // Mock dashboard queries
            pool.execute.mockImplementation((query, params) => {
                if (query.includes('SELECT COUNT(*) as total FROM events')) {
                    return Promise.resolve([[{ total: 50 }]]);
                } else if (query.includes('start_date > CURDATE()')) {
                    return Promise.resolve([[{ total: 15 }]]);
                } else if (query.includes('FROM event_registrations')) {
                    return Promise.resolve([[{ total: 500 }]]);
                } else if (query.includes('FROM users')) {
                    return Promise.resolve([[{ total: 1000 }]]);
                } else if (query.includes('er.id, er.registration_date')) {
                    return Promise.resolve([[
                        {
                            id: 1,
                            registration_date: '2025-04-01',
                            participant_name: 'Alice Smith',
                            event_title: 'Spring Conference',
                            payment_amount: 150,
                            payment_status: 'completed'
                        }
                    ]]);
                } else if (query.includes('DATE_FORMAT(payment_date')) {
                    return Promise.resolve([[
                        { month: '2025-01', total: 10000 },
                        { month: '2025-02', total: 15000 }
                    ]]);
                } else if (query.includes('SELECT category')) {
                    return Promise.resolve([[
                        { category: 'Conference', count: 20 },
                        { category: 'Workshop', count: 15 }
                    ]]);
                } else if (query.includes('WHERE start_date > CURDATE() ORDER BY start_date')) {
                    return Promise.resolve([[
                        {
                            id: 1,
                            title: 'Spring Conference',
                            start_date: '2025-05-01',
                            end_date: '2025-05-03',
                            location: 'Main Venue',
                            category: 'Conference',
                            registration_count: 75
                        }
                    ]]);
                }
                return Promise.resolve([[]]);
            });

            // Mock financial report
            Payment.generateFinancialReport = jest.fn().mockResolvedValue({
                summary: {
                    total_revenue: 50000,
                    pending_revenue: 5000
                },
                registrations: { total_amount: 30000 },
                sponsorships: { total_amount: 15000 },
                accommodations: { total_amount: 5000 }
            });
        });

        test('should return dashboard metrics for admin', async () => {
            await controller.getDashboardMetrics(req, res);

            expect(Payment.generateFinancialReport).toHaveBeenCalled();
            expect(pool.execute).toHaveBeenCalledTimes(8); // Eight queries executed
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    counts: expect.objectContaining({
                        events: 50,
                        upcomingEvents: 15,
                        registrations: 500,
                        users: 1000
                    }),
                    financials: expect.objectContaining({
                        totalRevenue: 50000,
                        pendingRevenue: 5000,
                        revenueSources: expect.objectContaining({
                            registrations: 30000,
                            sponsorships: 15000,
                            accommodations: 5000
                        })
                    }),
                    recentActivity: expect.objectContaining({
                        registrations: expect.any(Array)
                    }),
                    charts: expect.objectContaining({
                        revenueTrends: expect.any(Array),
                        categoryDistribution: expect.any(Array)
                    }),
                    upcomingEvents: expect.any(Array)
                })
            );
        });

        test('should return 403 for non-admin/non-organizer users', async () => {
            req.user.role = 'user';

            await controller.getDashboardMetrics(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(Payment.generateFinancialReport).not.toHaveBeenCalled();
        });

        test('should handle errors', async () => {
            pool.execute.mockRejectedValue(new Error('Database error'));

            await controller.getDashboardMetrics(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});