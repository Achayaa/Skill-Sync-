import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Users API
export const usersAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  getProfile: () => api.get('/user/profile'), // GET /api/user/profile
  updateProfile: (data) => api.put('/users/profile', data),
};

// Skills API
export const skillsAPI = {
  getSkills: (params) => api.get('/skills', { params }),
  createSkill: (data) => api.post('/skills', data),
  addOfferedSkill: (data) => api.post('/skills/offered', data),
  removeOfferedSkill: (skillId) => api.delete(`/skills/offered/${skillId}`),
  addRequestedSkill: (data) => api.post('/skills/requested', data),
  removeRequestedSkill: (skillId) => api.delete(`/skills/requested/${skillId}`),
};

// Matches API
export const matchesAPI = {
  getPotentialMatches: () => api.get('/matches/potential'),
  findMatches: () => api.get('/match/find'), // GET /api/match/find
  getMatches: (params) => api.get('/matches', { params }),
  createMatch: (data) => api.post('/matches', data),
  updateMatch: (id, data) => api.put(`/matches/${id}`, data),
};

// Sessions API
export const sessionsAPI = {
  getSessions: (params) => api.get('/sessions', { params }),
  getMySessions: (params) => api.get('/session/my-sessions', { params }), // GET /api/session/my-sessions
  getSession: (id) => api.get(`/sessions/${id}`),
  createSession: (data) => api.post('/session/create', data), // POST /api/session/create
  updateSession: (id, data) => api.put(`/sessions/${id}`, data),
  submitReview: (data) => api.post('/session/review', data), // POST /api/session/review
};

// Credits API
export const creditsAPI = {
  getBalance: () => api.get('/credits/balance'),
  getTransactions: () => api.get('/credits/transactions'),
};

export default api;

