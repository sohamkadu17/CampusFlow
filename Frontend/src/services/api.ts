import axios from 'axios';
import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Supabase token
api.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
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
      // Token expired, refresh or redirect to login
      const { data: { session } } = await supabase.auth.refreshSession();
      if (!session) {
        // Redirect to login
        window.location.href = '/auth';
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
  approve: (id: string) => api.post(`/events/${id}/approve`),
  reject: (id: string, reason: string) => api.post(`/events/${id}/reject`, { reason }),
  getPending: () => api.get('/events/pending'),
  getMy: () => api.get('/events/my-events'),
};

export const registrationAPI = {
  register: (eventId: string) => api.post('/registrations/register', { eventId }),
  getMy: () => api.get('/registrations/my-registrations'),
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
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/mark-all-read'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};
