import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
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
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data) => api.put('/users/profile', data),
};

export const eventService = {
    getAll: () => api.get('/events'),
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
    getAll: () => api.get('/teams'),
    getById: (id) => api.get(`/teams/${id}`),
    create: (data) => api.post('/teams', data),
    update: (id, data) => api.put(`/teams/${id}`, data),
    delete: (id) => api.delete(`/teams/${id}`),
    joinTeam: (teamId) => api.post(`/teams/${teamId}/members`),
    leaveTeam: (teamId) => api.delete(`/teams/${teamId}/members/me`),
};

export const sponsorshipService = {
    getAll: () => api.get('/sponsorships'),
    getById: (id) => api.get(`/sponsorships/${id}`),
    create: (data) => api.post('/sponsorships', data),
    update: (id, data) => api.put(`/sponsorships/${id}`, data),
    delete: (id) => api.delete(`/sponsorships/${id}`),
};

export const sponsorPackageService = {
    getAll: () => api.get('/sponsor-packages'),
    getById: (id) => api.get(`/sponsor-packages/${id}`),
    create: (data) => api.post('/sponsor-packages', data),
    update: (id, data) => api.put(`/sponsor-packages/${id}`, data),
    delete: (id) => api.delete(`/sponsor-packages/${id}`),
};

export const accommodationService = {
    getAll: () => api.get('/accommodations'),
    getById: (id) => api.get(`/accommodations/${id}`),
    create: (data) => api.post('/accommodations', data),
    update: (id, data) => api.put(`/accommodations/${id}`, data),
    delete: (id) => api.delete(`/accommodations/${id}`),
    book: (accommodationId, data) => api.post(`/accommodations/${accommodationId}/bookings`, data),
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
};

export default api;