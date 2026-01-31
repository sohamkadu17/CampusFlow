import axios from 'axios';
import { supabase } from '../lib/supabase';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token from localStorage
api.interceptors.request.use(
  async (config) => {
    // Try to get token from localStorage first (backend JWT)
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Fallback to Supabase token if backend token not available
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          // Call refresh token endpoint (you'll need to implement this)
          const { data } = await api.post('/auth/refresh-token', { refreshToken });
          localStorage.setItem('token', data.data.token);
          // Retry the original request
          return api.request(error.config);
        } catch (refreshError) {
          // Refresh failed, clear storage and redirect
          localStorage.clear();
          window.location.href = '/';
        }
      } else {
        // No refresh token, redirect to login
        localStorage.clear();
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// API Services
export const authAPI = {
  register: (data: { email: string; password: string; name: string; role: string }) => 
    api.post('/auth/register', data),
  verifyOTP: (data: { email: string; otp: string }) =>
    api.post('/auth/verify-otp', data),
  login: (data: { email: string; password: string; role: string }) => 
    api.post('/auth/login', data),
  syncUser: (userData: any) => api.post('/auth/sync', userData),
  getProfile: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const eventAPI = {
  getAll: (params?: any) => api.get('/events', { params }),
  getById: (id: string) => api.get(`/events/${id}`),
  create: (data: any) => api.post('/events', data),
  update: (id: string, data: any) => api.put(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
  submitForApproval: (id: string) => api.post(`/events/${id}/submit`),
  approve: (id: string, notes?: string) => api.post(`/events/${id}/approve`, { notes }),
  reject: (id: string, notes: string) => api.post(`/events/${id}/reject`, { notes }),
  requestChanges: (id: string, notes: string) => api.post(`/events/${id}/request-changes`, { notes }),
  getPending: () => api.get('/events/admin/pending'),
  getMy: () => api.get('/events/my/events'),
};

export const registrationAPI = {
  register: (eventId: string) => api.post('/registrations', { eventId }),
  getMy: () => api.get('/registrations/my'),
  unregister: (eventId: string) => api.delete(`/registrations/${eventId}`),
  checkIn: (registrationNumber: string) => api.post('/registrations/checkin', { registrationNumber }),
};

export const bookingAPI = {
  create: (data: any) => api.post('/bookings', data),
  checkAvailability: (data: any) => api.post('/bookings/check-availability', data),
  getAll: (params?: any) => api.get('/bookings', { params }),
  getMy: () => api.get('/bookings/my-bookings'),
  approve: (id: string) => api.patch(`/bookings/${id}/approve`),
  reject: (id: string, reason: string) => api.patch(`/bookings/${id}/reject`, { reason }),
  cancel: (id: string) => api.patch(`/bookings/${id}/cancel`),
};

export const notificationAPI = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread/count'),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};
