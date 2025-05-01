import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
    baseURL: '/api', // Changed to use relative path that works with the proxy
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
});

// Request interceptor for API calls
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for API calls
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        // Handle 401 Unauthorized errors
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Clear token and redirect to login
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// API service functions for different resources
export const userService = {
    login: (credentials) => api.post('/users/login', credentials),
    register: (userData) => api.post('/users/register', userData),
    getProfile: () => api.get('/users/me'),
    updateProfile: (data) => api.put(`/users/${data.id || 'profile'}`, data),
    changePassword: (data) => api.post('/users/change-password', data),
};

export const eventService = {
    getAll: (params) => api.get('/events', { params }),
    getById: (id) => api.get(`/events/${id}`),
    create: (data) => api.post('/events', data),
    update: (id, data) => api.put(`/events/${id}`, data),
    delete: (id) => api.delete(`/events/${id}`),
};

export const categoryService = {
    getAll: () => api.get('/categories'),
    getById: (id) => api.get(`/categories/${id}`),
    create: (data) => api.post('/categories', data),
    update: (id, data) => api.put(`/categories/${id}`, data),
    delete: (id) => api.delete(`/categories/${id}`),
};

export const roundService = {
    getAll: (eventId) => api.get(`/events/${eventId}/rounds`),
    getById: (eventId, roundId) => api.get(`/events/${eventId}/rounds/${roundId}`),
    create: (eventId, data) => api.post(`/events/${eventId}/rounds`, data),
    update: (eventId, roundId, data) => api.put(`/events/${eventId}/rounds/${roundId}`, data),
    delete: (eventId, roundId) => api.delete(`/events/${eventId}/rounds/${roundId}`),
};

export const teamService = {
    getMyTeams: () => api.get('/teams/my-teams'),
    getById: (id) => api.get(`/teams/${id}`),
    getByEventId: (eventId) => api.get(`/teams/event/${eventId}`),
    getTeamMembers: (teamId) => api.get(`/teams/${teamId}`),
    create: (data) => api.post('/teams', data),
    update: (id, data) => api.put(`/teams/${id}`, data),
    delete: (id) => api.delete(`/teams/${id}`),
    addMember: (teamId, userId, status) => api.post(`/teams/${teamId}/members`, { userId, status }),
    removeMember: (teamId, userId) => api.delete(`/teams/${teamId}/members/${userId}`),
    transferLeadership: (teamId, newLeaderId) => api.post(`/teams/${teamId}/transfer-leadership`, { newLeaderId }),
};

export const sponsorshipService = {
    getAll: (filters) => api.get('/sponsorships', { params: filters }),
    getById: (id, details = false) => api.get(`/sponsorships/${id}`, {
        params: { details }
    }),
    getMySponsorships: () => api.get('/sponsorships/me'),
    getByEventId: (eventId) => api.get(`/sponsorships/event/${eventId}`),
    create: (data) => api.post('/sponsorships', data),
    update: (id, data) => api.put(`/sponsorships/${id}`, data),
    updateStatus: (id, status, notes) => api.put(`/sponsorships/${id}/status`, { status, notes }),
    delete: (id) => api.delete(`/sponsorships/${id}`),
    // Payment related functions
    addPayment: (sponsorshipId, data) => api.post(`/sponsorships/${sponsorshipId}/payments`, data),
    getPayments: (sponsorshipId) => api.get(`/sponsorships/${sponsorshipId}/payments`),
    // Promotion related functions
    addPromotion: (sponsorshipId, data) => api.post(`/sponsorships/${sponsorshipId}/promotions`, data),
    getPromotions: (sponsorshipId) => api.get(`/sponsorships/${sponsorshipId}/promotions`),
    // Reports
    generateReport: (filters) => api.get('/sponsorships/reports/summary', { params: filters }),
};

export const sponsorPackageService = {
    getAll: (isActive) => api.get('/sponsor-packages', { params: { isActive } }),
    getById: (id) => api.get(`/sponsor-packages/${id}`),
    create: (data) => api.post('/sponsor-packages', data),
    update: (id, data) => api.put(`/sponsor-packages/${id}`, data),
    delete: (id) => api.delete(`/sponsor-packages/${id}`),
};

export const sponsorProfileService = {
    getMyProfile: () => api.get('/sponsor-profiles/me'),
    getAllProfiles: (options) => api.get('/sponsor-profiles', { params: options }),
    getProfileById: (id, type = 'profile') => api.get(`/sponsor-profiles/${id}`, {
        params: { type }
    }),
    createOrUpdateProfile: (data) => api.post('/sponsor-profiles', data),
    deleteProfile: () => api.delete('/sponsor-profiles/me'),
};

export const accommodationService = {
    getAll: (params) => api.get('/accommodations', { params }),
    getById: (id) => api.get(`/accommodations/${id}`),
    create: (data) => api.post('/accommodations', data),
    update: (id, data) => api.put(`/accommodations/${id}`, data),
    delete: (id) => api.delete(`/accommodations/${id}`),
    getAvailableRooms: (accommodationId, checkInDate, checkOutDate) =>
        api.get(`/accommodations/${accommodationId}/available-rooms`, {
            params: { check_in_date: checkInDate, check_out_date: checkOutDate }
        }),
    getAvailabilitySummary: (eventId) =>
        api.get('/accommodations/availability/summary', { params: { eventId } }),
    // Updated booking method to correctly handle the endpoint structure
    bookings: (data) => api.post('/accommodations/bookings', data),
    getMyBookings: () => api.get('/accommodations/bookings/my'),
    getBookingById: (id) => api.get(`/accommodations/bookings/${id}`),
    cancelBooking: (id) => api.put(`/accommodations/bookings/${id}/cancel`),
    updateBookingStatus: (id, status) => api.put(`/accommodations/bookings/${id}/status`, { status }),
    addPayment: (bookingId, data) => api.post(`/accommodations/bookings/${bookingId}/payments`, data),
    getPayments: (bookingId) => api.get(`/accommodations/bookings/${bookingId}/payments`),
};

export const paymentService = {
    getAll: () => api.get('/payments'),
    getById: (id) => api.get(`/payments/${id}`),
    create: (data) => api.post('/payments', data),
    verify: (id, data) => api.post(`/payments/${id}/verify`, data),
};

export const judgeService = {
    getAssignments: () => api.get('/judge/assignments'),
    getSubmissions: (eventId, roundId) => api.get(`/judge/events/${eventId}/rounds/${roundId}/submissions`),
    submitEvaluation: (eventId, roundId, teamId, data) =>
        api.post(`/judge/events/${eventId}/rounds/${roundId}/teams/${teamId}/evaluate`, data),
};

export const analyticsService = {
    getEventStats: () => api.get('/analytics/events'),
    getTeamStats: () => api.get('/analytics/teams'),
    getSponsorshipStats: () => api.get('/analytics/sponsorships'),
    getDashboardMetrics: () => api.get('/analytics/dashboard'),
};

export default api;