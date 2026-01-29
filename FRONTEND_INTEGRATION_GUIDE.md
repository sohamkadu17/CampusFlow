# Frontend Integration Quick Start

## Step 1: Install Dependencies

```bash
cd Frontend
npm install axios zustand socket.io-client qrcode.react jspdf html2canvas react-leaflet react-big-calendar react-qr-scanner
```

## Step 2: Create API Services

### `/Frontend/src/services/api.ts`
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh-token', { refreshToken });
          localStorage.setItem('accessToken', data.data.accessToken);
          error.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return axios(error.config);
        } catch {
          localStorage.clear();
          window.location.href = '/auth';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

### `/Frontend/src/services/authAPI.ts`
```typescript
import api from './api';

export const authAPI = {
  register: (data: { email: string; password: string; name: string; role: string }) =>
    api.post('/auth/register', data),
  
  verifyOTP: (data: { email: string; otp: string }) =>
    api.post('/auth/verify-otp', data),
  
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  
  logout: () => api.post('/auth/logout'),
  
  forgotPassword: (data: { email: string }) =>
    api.post('/auth/forgot-password', data),
  
  resetPassword: (data: { token: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),
  
  getMe: () => api.get('/auth/me'),
};
```

### `/Frontend/src/services/eventAPI.ts`
```typescript
import api from './api';

export const eventAPI = {
  getEvents: (params?: { category?: string; status?: string; search?: string; page?: number }) =>
    api.get('/events', { params }),
  
  getEventById: (id: string) => api.get(`/events/${id}`),
  
  createEvent: (data: any) => api.post('/events', data),
  
  updateEvent: (id: string, data: any) => api.put(`/events/${id}`, data),
  
  deleteEvent: (id: string) => api.delete(`/events/${id}`),
  
  submitForApproval: (id: string) => api.post(`/events/${id}/submit`),
  
  approveEvent: (id: string) => api.post(`/events/${id}/approve`),
  
  rejectEvent: (id: string, data: { reason: string }) =>
    api.post(`/events/${id}/reject`, data),
  
  requestChanges: (id: string, data: { feedback: string }) =>
    api.post(`/events/${id}/request-changes`, data),
  
  getPendingEvents: () => api.get('/events/pending'),
  
  getMyEvents: () => api.get('/events/my-events'),
  
  uploadRulebook: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('rulebook', file);
    return api.post(`/events/${id}/rulebook`, formData);
  },
};
```

### `/Frontend/src/services/registrationAPI.ts`
```typescript
import api from './api';

export const registrationAPI = {
  registerForEvent: (eventId: string) =>
    api.post('/registrations/register', { eventId }),
  
  getMyRegistrations: () => api.get('/registrations/my-registrations'),
  
  unregisterFromEvent: (eventId: string) =>
    api.delete(`/registrations/${eventId}`),
  
  checkInAttendee: (registrationNumber: string) =>
    api.post('/registrations/checkin', { registrationNumber }),
  
  getEventRegistrations: (eventId: string) =>
    api.get(`/registrations/event/${eventId}`),
};
```

### `/Frontend/src/services/bookingAPI.ts`
```typescript
import api from './api';

export const bookingAPI = {
  createBooking: (data: {
    resourceId: string;
    startTime: string;
    endTime: string;
    purpose: string;
  }) => api.post('/bookings', data),
  
  checkAvailability: (data: {
    resourceId: string;
    startTime: string;
    endTime: string;
  }) => api.post('/bookings/check-availability', data),
  
  getBookings: (params?: { resourceId?: string; status?: string; date?: string }) =>
    api.get('/bookings', { params }),
  
  getMyBookings: () => api.get('/bookings/my-bookings'),
  
  approveBooking: (id: string) => api.patch(`/bookings/${id}/approve`),
  
  rejectBooking: (id: string, data: { reason: string }) =>
    api.patch(`/bookings/${id}/reject`, data),
  
  cancelBooking: (id: string) => api.patch(`/bookings/${id}/cancel`),
};
```

### `/Frontend/src/services/notificationAPI.ts`
```typescript
import api from './api';

export const notificationAPI = {
  getNotifications: (params?: { page?: number; limit?: number; read?: boolean }) =>
    api.get('/notifications', { params }),
  
  getUnreadCount: () => api.get('/notifications/unread-count'),
  
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  
  markAllAsRead: () => api.patch('/notifications/mark-all-read'),
  
  deleteNotification: (id: string) => api.delete(`/notifications/${id}`),
};
```

### `/Frontend/src/services/socket.ts`
```typescript
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initSocket = (token: string) => {
  socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
    auth: { token },
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('notification:new', (notification) => {
    // Update notification store
    console.log('New notification:', notification);
  });

  socket.on('chat:message', (message) => {
    // Update chat store
    console.log('New message:', message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinChatRoom = (roomId: string) => {
  socket?.emit('chat:join', roomId);
};

export const leaveChatRoom = (roomId: string) => {
  socket?.emit('chat:leave', roomId);
};

export const sendTyping = (roomId: string) => {
  socket?.emit('chat:typing', roomId);
};
```

## Step 3: Create Zustand Stores

### `/Frontend/src/store/useAuthStore.ts`
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  _id: string;
  email: string;
  name: string;
  role: 'student' | 'organizer' | 'admin';
  profilePicture?: string;
  department?: string;
  year?: number;
}

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),
      clearAuth: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

### `/Frontend/src/store/useNotificationStore.ts`
```typescript
import { create } from 'zustand';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  setNotifications: (notifications: Notification[]) => void;
  markAsRead: (id: string) => void;
  setUnreadCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
  setNotifications: (notifications) => set({ notifications }),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n._id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  setUnreadCount: (count) => set({ unreadCount: count }),
}));
```

## Step 4: Update AuthScreen.tsx

Replace mock authentication with real API:

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/authAPI';
import { useAuthStore } from '../store/useAuthStore';
import { initSocket } from '../services/socket';

// In your login handler:
const handleLogin = async (email: string, password: string) => {
  try {
    const { data } = await authAPI.login({ email, password });
    const { user, accessToken, refreshToken } = data.data;
    
    // Save to store and localStorage
    useAuthStore.getState().setAuth(user, accessToken, refreshToken);
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    // Initialize Socket.IO
    initSocket(accessToken);
    
    // Navigate to dashboard
    navigate(user.role === 'admin' ? '/admin' : user.role === 'organizer' ? '/organizer' : '/student');
  } catch (error) {
    console.error('Login failed:', error);
    // Show error toast
  }
};

// In your register handler:
const handleRegister = async (formData) => {
  try {
    await authAPI.register(formData);
    setStep('verify-otp'); // Show OTP input
  } catch (error) {
    console.error('Registration failed:', error);
  }
};

// In your OTP verification:
const handleVerifyOTP = async (otp: string) => {
  try {
    const { data } = await authAPI.verifyOTP({ email, otp });
    // Auto-login after verification
    const { user, accessToken, refreshToken } = data.data;
    useAuthStore.getState().setAuth(user, accessToken, refreshToken);
    initSocket(accessToken);
    navigate(user.role === 'admin' ? '/admin' : user.role === 'organizer' ? '/organizer' : '/student');
  } catch (error) {
    console.error('OTP verification failed:', error);
  }
};
```

## Step 5: Update Dashboard Components

### StudentDashboard.tsx
```typescript
import { useEffect, useState } from 'react';
import { eventAPI } from '../services/eventAPI';
import { registrationAPI } from '../services/registrationAPI';

export const StudentDashboard = () => {
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [eventsRes, regsRes] = await Promise.all([
        eventAPI.getEvents({ status: 'approved' }),
        registrationAPI.getMyRegistrations(),
      ]);
      setEvents(eventsRes.data.data.events);
      setRegistrations(regsRes.data.data.registrations);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleRegister = async (eventId: string) => {
    try {
      await registrationAPI.registerForEvent(eventId);
      loadData(); // Reload
      // Show success toast
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  // Rest of component...
};
```

### OrganizerDashboard.tsx
```typescript
import { useEffect, useState } from 'react';
import { eventAPI } from '../services/eventAPI';

export const OrganizerDashboard = () => {
  const [myEvents, setMyEvents] = useState([]);

  useEffect(() => {
    loadMyEvents();
  }, []);

  const loadMyEvents = async () => {
    try {
      const { data } = await eventAPI.getMyEvents();
      setMyEvents(data.data.events);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const handleCreateEvent = async (formData: any) => {
    try {
      await eventAPI.createEvent(formData);
      loadMyEvents();
      // Show success toast
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const handleSubmitForApproval = async (eventId: string) => {
    try {
      await eventAPI.submitForApproval(eventId);
      loadMyEvents();
      // Show success toast
    } catch (error) {
      console.error('Failed to submit event:', error);
    }
  };

  // Rest of component...
};
```

### AdminDashboard.tsx
```typescript
import { useEffect, useState } from 'react';
import { eventAPI } from '../services/eventAPI';

export const AdminDashboard = () => {
  const [pendingEvents, setPendingEvents] = useState([]);

  useEffect(() => {
    loadPendingEvents();
  }, []);

  const loadPendingEvents = async () => {
    try {
      const { data } = await eventAPI.getPendingEvents();
      setPendingEvents(data.data.events);
    } catch (error) {
      console.error('Failed to load pending events:', error);
    }
  };

  const handleApproveEvent = async (eventId: string) => {
    try {
      await eventAPI.approveEvent(eventId);
      loadPendingEvents();
      // Show success toast
    } catch (error) {
      console.error('Failed to approve event:', error);
    }
  };

  const handleRejectEvent = async (eventId: string, reason: string) => {
    try {
      await eventAPI.rejectEvent(eventId, { reason });
      loadPendingEvents();
      // Show success toast
    } catch (error) {
      console.error('Failed to reject event:', error);
    }
  };

  // Rest of component...
};
```

## Step 6: Add Environment Variables

Create `/Frontend/.env`:
```env
VITE_API_URL=http://localhost:3000/api
```

For production (Vercel):
```env
VITE_API_URL=https://your-railway-backend.up.railway.app/api
```

## Step 7: Test Integration

1. Start backend: `cd Backend && npm run dev`
2. Start frontend: `cd Frontend && npm run dev`
3. Test full flow:
   - Register → Verify OTP → Login
   - Create event → Submit for approval
   - Admin approves event
   - Student registers for event
   - Check real-time notifications

## Next: Build Missing Components

After basic integration works, build these components:
1. NotificationPanel (dropdown with real-time updates)
2. ResourceBookingCalendar (with conflict checking)
3. ChatInterface (with Socket.IO)
4. AnalyticsDashboard (with Recharts)
5. CertificateGenerator (with jsPDF)
6. And more...

---

**Ready to go!** Start with Step 1 and work your way through. 🚀
