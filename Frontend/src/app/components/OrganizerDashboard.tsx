import { useState, useEffect } from 'react';
import { 
  Sparkles, Plus, Calendar, Users, Settings, Bell, Search, 
  LogOut, Upload, FileText, ChevronRight, Check, Clock, 
  AlertCircle, CheckCircle2, XCircle, MapPin, User, ExternalLink, Loader2, ArrowLeft, Home
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import api, { eventAPI, notificationAPI } from '../../services/api';
import axios from 'axios';

interface OrganizerDashboardProps {
  onLogout: () => void;
  onHome?: () => void;
}

type EventStatus = 'draft' | 'pending' | 'approved' | 'live' | 'changes-requested';

interface Event {
  id: string;
  title: string;
  date: string;
  status: EventStatus;
  capacity: number;
  registered: number;
  venue?: string;
  imageUrl?: string;
  description?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  time?: string;
}

export default function OrganizerDashboard({ onLogout, onHome }: OrganizerDashboardProps) {
  const [showWizard, setShowWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showRegistrations, setShowRegistrations] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [eventFilter, setEventFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    category: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    venue: '',
    capacity: '',
    resources: [] as string[],
    posterImage: null as File | null, // Event poster/banner image
    rulebookFile: null as File | null,
    formLink: '', // Optional Google Form or registration link
  });

  const [loading, setLoading] = useState(false);
  const [fetchingEvents, setFetchingEvents] = useState(true);
  const [fetchingNotifications, setFetchingNotifications] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState({ total: 0, published: 0, pending: 0, registrations: 0 });

  const steps = [
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'resources', label: 'Resources', icon: MapPin },
    { id: 'poster', label: 'Poster', icon: Upload },
    { id: 'rulebook', label: 'Rulebook', icon: FileText },
    { id: 'submit', label: 'Submit', icon: Check },
  ];

  const [events, setEvents] = useState<Event[]>([]);

  const statusConfig: Record<EventStatus, { label: string; color: string; bg: string; icon: any }> = {
    draft: { label: 'Draft', color: 'text-slate-600', bg: 'bg-slate-100', icon: Clock },
    pending: { label: 'Pending Review', color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock },
    approved: { label: 'Approved', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle2 },
    live: { label: 'Live', color: 'text-indigo-700', bg: 'bg-indigo-100', icon: CheckCircle2 },
    'changes-requested': { label: 'Changes Requested', color: 'text-red-700', bg: 'bg-red-100', icon: AlertCircle },
  };

  // Fetch events and notifications on mount
  useEffect(() => {
    fetchEvents();
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showNotifications && !target.closest('.notification-dropdown-container')) {
        setShowNotifications(false);
      }
    };
    
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const fetchEvents = async () => {
    try {
      setFetchingEvents(true);
      const response = await eventAPI.getMy();
      const fetchedEvents = response.data.data.events || [];
      
      console.log('Fetched events:', fetchedEvents); // Debug log
      
      setEvents(fetchedEvents.map((event: any) => ({
        id: event._id || event.id,
        title: event.title,
        date: event.startDate 
          ? new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: event.status,
        capacity: event.capacity,
        registered: event.registeredCount || 0,
        venue: event.venue,
        imageUrl: event.imageUrl,
        description: event.description,
        category: event.category,
        startDate: event.startDate,
        endDate: event.endDate,
        time: event.time,
      })));
      
      // Calculate stats
      const total = fetchedEvents.length;
      const published = fetchedEvents.filter((e: any) => e.status === 'approved' || e.status === 'live').length;
      const pending = fetchedEvents.filter((e: any) => e.status === 'pending').length;
      const registrations = fetchedEvents.reduce((sum: number, e: any) => sum + (e.registeredCount || 0), 0);
      setStats({ total, published, pending, registrations });
    } catch (err: any) {
      console.error('Failed to fetch events:', err);
      setError(err.response?.data?.message || 'Failed to load events');
    } finally {
      setFetchingEvents(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      setFetchingNotifications(true);
      const [notifResponse, countResponse] = await Promise.all([
        notificationAPI.getAll({ limit: 10 }),
        notificationAPI.getUnreadCount()
      ]);
      
      console.log('Notifications response:', notifResponse.data);
      console.log('Unread count response:', countResponse.data);
      
      const notificationsList = notifResponse.data.data || notifResponse.data.notifications || [];
      const unreadCountValue = countResponse.data.data?.count || countResponse.data.count || 0;
      
      setNotifications(notificationsList);
      setUnreadCount(unreadCountValue);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setFetchingNotifications(false);
    }
  };

  const fetchRegistrations = async (eventId: string) => {
    try {
      const response = await api.get(`/registrations/event/${eventId}`);
      setRegistrations(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch registrations:', err);
      setRegistrations([]);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      await eventAPI.delete(eventId);
      alert('Event deleted successfully!');
      setSelectedEvent(null);
      fetchEvents(); // Refresh the list
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete event');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setEventData({ ...eventData, rulebookFile: file });
    }
  };

  const handleSubmitEvent = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!eventData.title || !eventData.category || !eventData.startDate || !eventData.venue || !eventData.capacity) {
        setError('Please fill in all required fields');
        return;
      }

      // Validate poster image is required
      if (!eventData.posterImage) {
        setError('Event poster image is required');
        return;
      }

      // Validate rulebook is required
      if (!eventData.rulebookFile) {
        setError('Rulebook PDF is required for event submission');
        return;
      }

      const cloudName = (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
      const uploadPreset = (import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';
      
      // Upload poster image to Cloudinary
      let imageUrl = null;
      try {
        const formData = new FormData();
        formData.append('file', eventData.posterImage);
        formData.append('upload_preset', uploadPreset);
        
        const uploadResponse = await axios.post(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          formData
        );
        
        imageUrl = uploadResponse.data.secure_url;
        console.log('Poster image uploaded:', imageUrl);
      } catch (uploadErr: any) {
        console.error('Poster upload failed:', uploadErr);
        setError(`Failed to upload poster image: ${uploadErr.response?.data?.error?.message || uploadErr.message}`);
        return;
      }

      // Upload rulebook to Cloudinary (as raw file for PDFs)
      let rulebookUrl = null;
      
      try {
        const formData = new FormData();
        formData.append('file', eventData.rulebookFile);
        formData.append('upload_preset', uploadPreset);
        
        const uploadResponse = await axios.post(
          `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
          formData
        );
        
        rulebookUrl = uploadResponse.data.secure_url;
        console.log('Rulebook uploaded successfully:', rulebookUrl); // Debug
      } catch (uploadErr: any) {
        console.error('Rulebook upload failed:', uploadErr);
        setError(`Failed to upload rulebook: ${uploadErr.response?.data?.error?.message || uploadErr.message}`);
        return;
      }

      // Prepare event data
      const eventPayload = {
        title: eventData.title,
        description: eventData.description,
        category: eventData.category.charAt(0).toUpperCase() + eventData.category.slice(1), // Capitalize first letter
        startDate: new Date(`${eventData.startDate}T${eventData.startTime || '00:00'}`).toISOString(),
        endDate: new Date(`${eventData.endDate || eventData.startDate}T${eventData.endTime || '23:59'}`).toISOString(),
        venue: eventData.venue,
        capacity: parseInt(eventData.capacity),
        resources: eventData.resources.map((resource, index) => ({
          resourceId: `res_${Date.now()}_${index}`,
          resourceName: resource,
          status: 'pending'
        })),
        imageUrl: imageUrl, // Event poster
        rulebookUrl: rulebookUrl, // Required
        formLink: eventData.formLink || undefined,
        status: 'draft' // Start as draft
      };

      // Create event
      const response = await eventAPI.create(eventPayload);
      const createdEvent = response.data.data;

      // Submit for approval with rulebook
      const eventId = createdEvent._id || createdEvent.id;
      await eventAPI.submitForApproval(eventId);

      // Close wizard and reset form
      setShowWizard(false);
      setCurrentStep(0);
      setEventData({
        title: '',
        description: '',
        category: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        venue: '',
        capacity: '',
        resources: [],
        posterImage: null,
        rulebookFile: null,
        formLink: '',
      });

      // Show success message banner
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000); // Hide after 5 seconds

      // Refresh events list to show the new event
      await fetchEvents();
    } catch (err: any) {
      console.error('Failed to create event:', err);
      setError(err.response?.data?.message || 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 animate-fadeInDown">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl text-slate-900 font-semibold">CampusFlow</span>
              </div>
              <div className="h-6 w-px bg-slate-200"></div>
              <span className="text-slate-600">Organizer Portal</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative notification-dropdown-container">
                <button 
                  className="relative p-2 hover:bg-slate-100 rounded-xl transition-colors animate-fadeIn animate-delay-100"
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) {
                      fetchNotifications();
                    }
                  }}
                >
                  <Bell className="w-5 h-5 text-slate-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-xs text-white font-medium">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 max-h-[500px] overflow-hidden flex flex-col animate-fadeIn">
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <button 
                          onClick={async () => {
                            await notificationAPI.markAllAsRead();
                            fetchNotifications();
                          }}
                          className="text-xs text-emerald-600 hover:text-emerald-700"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {fetchingNotifications ? (
                        <div className="p-8 text-center">
                          <Loader2 className="w-8 h-8 text-emerald-600 mx-auto mb-3 animate-spin" />
                          <p className="text-sm text-slate-600">Loading notifications...</p>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-600">No notifications yet</p>
                          <p className="text-xs text-slate-500 mt-1">You'll see updates here when admins review your events</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif._id || notif.id}
                            className={`p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                              !notif.isRead ? 'bg-emerald-50/30' : ''
                            }`}
                            onClick={async () => {
                              if (!notif.isRead) {
                                await notificationAPI.markAsRead(notif._id || notif.id);
                                fetchNotifications();
                              }
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                !notif.isRead ? 'bg-emerald-600' : 'bg-slate-300'
                              }`}></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-900 mb-1">{notif.message}</p>
                                <p className="text-xs text-slate-500">
                                  {new Date(notif.createdAt).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors animate-fadeIn animate-delay-200">
                <Settings className="w-5 h-5 text-slate-600" />
              </button>
              <div className="h-6 w-px bg-slate-200"></div>
              {onHome && (
                <>
                  <button 
                    onClick={onHome}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-all animate-fadeIn animate-delay-300"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Back to Home</span>
                  </button>
                  <div className="h-6 w-px bg-slate-200"></div>
                </>
              )}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center animate-fadeIn animate-delay-400">
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
                <button 
                  onClick={onLogout}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors animate-fadeIn animate-delay-500"
                >
                  <span className="text-sm">Logout</span>
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Success Message Banner */}
      {showSuccessMessage && (
        <div className="mx-6 mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-900">Event submitted successfully!</p>
            <p className="text-xs text-emerald-700">Admin will review it soon. You'll be notified once approved.</p>
          </div>
        </div>
      )}

      <div className="p-6 animate-fadeInDown">
        {/* Header */}
        <div className="mb-8 animate-fadeInDown">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl text-slate-900 mb-2">Events Dashboard</h1>
              <p className="text-slate-600">Create and manage your campus events</p>
            </div>
            <button 
              onClick={() => setShowWizard(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/25"
            >
              <Plus className="w-5 h-5" />
              Create Event
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fadeInUp animate-delay-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm text-slate-500">Total</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1">{stats.total}</div>
              <div className="text-sm text-slate-600">Events</div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fadeInUp animate-delay-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="text-sm text-slate-500">Active</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1">{stats.published}</div>
              <div className="text-sm text-slate-600">Published</div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fadeInUp animate-delay-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <span className="text-sm text-slate-500">Pending</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1">{stats.pending}</div>
              <div className="text-sm text-slate-600">Review</div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fadeInUp animate-delay-400">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Users className="w-6 h-6 text-violet-600" />
                </div>
                <span className="text-sm text-slate-500">Total</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1">{stats.registrations}</div>
              <div className="text-sm text-slate-600">Registrations</div>
            </div>
          </div>

          {/* Events List */}
          <div className="animate-fadeInUp animate-delay-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl text-slate-900 font-semibold">Your Events</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setEventFilter('all')}
                  className={`px-4 py-2 text-sm rounded-xl transition-all ${
                    eventFilter === 'all' 
                      ? 'bg-emerald-100 text-emerald-700 font-medium' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  All Events
                </button>
                <button 
                  onClick={() => setEventFilter('draft')}
                  className={`px-4 py-2 text-sm rounded-xl transition-all ${
                    eventFilter === 'draft' 
                      ? 'bg-slate-100 text-slate-700 font-medium' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  Draft
                </button>
                <button 
                  onClick={() => setEventFilter('published')}
                  className={`px-4 py-2 text-sm rounded-xl transition-all ${
                    eventFilter === 'published' 
                      ? 'bg-emerald-100 text-emerald-700 font-medium' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  Published
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              {fetchingEvents ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                </div>
              ) : events.filter(event => {
                if (eventFilter === 'all') return true;
                if (eventFilter === 'draft') return event.status === 'draft' || event.status === 'pending';
                if (eventFilter === 'published') return event.status === 'approved' || event.status === 'live';
                return true;
              }).length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg text-slate-900 mb-2">No {eventFilter !== 'all' ? eventFilter : ''} events yet</h3>
                  <p className="text-slate-600 mb-4">Create your first event to get started</p>
                  <button 
                    onClick={() => setShowWizard(true)}
                    className="px-6 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                  >
                    Create Event
                  </button>
                </div>
              ) : events.filter(event => {
                if (eventFilter === 'all') return true;
                if (eventFilter === 'draft') return event.status === 'draft' || event.status === 'pending';
                if (eventFilter === 'published') return event.status === 'approved' || event.status === 'live';
                return true;
              }).map((event, index) => (
                <div 
                  key={event.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fadeInUp"
                  style={{ animationDelay: `${(index + 6) * 100}ms` }}
                >
                  <div className="flex items-center gap-4">
                    {/* Event Poster Image */}
                    {event.imageUrl && (
                      <div className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-slate-100">
                        <img 
                          src={event.imageUrl} 
                          alt={event.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between flex-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            event.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                            event.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            event.status === 'draft' ? 'bg-slate-100 text-slate-700' :
                            event.status === 'live' ? 'bg-blue-100 text-blue-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {event.date}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            {event.registered} / {event.capacity} registered
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedEvent(event)}
                        className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
                      >
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </button>
                    </div>
                  </div>
                  {event.registered > 0 && (
                    <div className="mt-4">
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div 
                          className="bg-emerald-600 h-2 rounded-full transition-all"
                          style={{ width: `${(event.registered / event.capacity) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Event Creation Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Wizard Header */}
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl text-slate-900 mb-6">Create New Event</h2>
              
              {/* Horizontal Stepper */}
              <div className="flex items-center justify-between relative">
                {/* Progress Line */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200 -z-10">
                  <div 
                    className="h-full bg-emerald-600 transition-all duration-300"
                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                  ></div>
                </div>
                
                {steps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep;
                  
                  return (
                    <div key={step.id} className="flex flex-col items-center gap-2">
                      <div 
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          isCompleted 
                            ? 'bg-emerald-600 text-white' 
                            : isActive 
                              ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' 
                              : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                      </div>
                      <span className={`text-sm ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Wizard Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Event Title</label>
                    <input
                      type="text"
                      value={eventData.title}
                      onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                      placeholder="e.g., Tech Symposium 2026"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Description</label>
                    <textarea
                      value={eventData.description}
                      onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                      placeholder="Describe your event..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-100 resize-none"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Category</label>
                    <select
                      value={eventData.category}
                      onChange={(e) => setEventData({ ...eventData, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                    >
                      <option value="">Select category</option>
                      <option value="technical">Technical</option>
                      <option value="cultural">Cultural</option>
                      <option value="sports">Sports</option>
                      <option value="workshop">Workshop</option>
                      <option value="seminar">Seminar</option>
                    </select>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={eventData.startDate}
                        onChange={(e) => setEventData({ ...eventData, startDate: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-700 mb-2">Start Time</label>
                      <input
                        type="time"
                        value={eventData.startTime}
                        onChange={(e) => setEventData({ ...eventData, startTime: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-700 mb-2">End Date</label>
                      <input
                        type="date"
                        value={eventData.endDate}
                        onChange={(e) => setEventData({ ...eventData, endDate: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-700 mb-2">End Time</label>
                      <input
                        type="time"
                        value={eventData.endTime}
                        onChange={(e) => setEventData({ ...eventData, endTime: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Venue</label>
                    <input
                      type="text"
                      value={eventData.venue}
                      onChange={(e) => setEventData({ ...eventData, venue: e.target.value })}
                      placeholder="e.g., Main Auditorium"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Capacity</label>
                    <input
                      type="number"
                      value={eventData.capacity}
                      onChange={(e) => setEventData({ ...eventData, capacity: e.target.value })}
                      placeholder="Maximum attendees"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Required Resources</label>
                    <p className="text-sm text-slate-500 mb-4">Select the resources you need for this event</p>
                    <div className="space-y-3">
                      {['Projector', 'Microphone System', 'Tables & Chairs', 'WiFi Access', 'Refreshments', 'Security Personnel'].map((resource) => (
                        <label key={resource} className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={eventData.resources.includes(resource)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEventData({ ...eventData, resources: [...eventData.resources, resource] });
                              } else {
                                setEventData({ ...eventData, resources: eventData.resources.filter(r => r !== resource) });
                              }
                            }}
                            className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-200"
                          />
                          <span className="text-slate-700">{resource}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-slate-700 mb-2">
                      Registration Form Link 
                      <span className="text-slate-400 font-normal ml-1">(Optional)</span>
                    </label>
                    <p className="text-sm text-slate-500 mb-3">Add a Google Form, Typeform, or any registration link</p>
                    <div className="relative">
                      <input
                        type="url"
                        value={eventData.formLink}
                        onChange={(e) => setEventData({ ...eventData, formLink: e.target.value })}
                        placeholder="https://forms.google.com/..."
                        className="w-full px-4 py-3 pl-10 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                      />
                      <ExternalLink className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm text-slate-700 mb-2">
                      Upload Event Poster/Image
                      <span className="text-red-600 ml-1">*</span>
                    </label>
                    <p className="text-sm text-slate-500 mb-4">This image will be shown to students when browsing events</p>
                    
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && file.type.startsWith('image/')) {
                            setEventData({ ...eventData, posterImage: file });
                          }
                        }}
                        className="hidden"
                        id="poster-upload"
                      />
                      <label
                        htmlFor="poster-upload"
                        className="flex flex-col items-center justify-center p-12 rounded-3xl border-2 border-dashed border-slate-300 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50/50 cursor-pointer transition-all group"
                      >
                        {eventData.posterImage ? (
                          <div className="text-center">
                            <div className="w-32 h-32 rounded-2xl overflow-hidden mx-auto mb-4 border-2 border-emerald-200">
                              <img 
                                src={URL.createObjectURL(eventData.posterImage)} 
                                alt="Event poster preview" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="text-slate-900 mb-1">{eventData.posterImage.name}</div>
                            <div className="text-sm text-slate-500">
                              {(eventData.posterImage.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                            <button 
                              type="button"
                              className="mt-4 text-sm text-emerald-600 hover:text-emerald-700"
                            >
                              Change image
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center mb-4 transition-colors">
                              <Upload className="w-8 h-8 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                            </div>
                            <div className="text-slate-900 mb-1">Drop your image here or click to browse</div>
                            <div className="text-sm text-slate-500">PNG, JPG, or WebP • Maximum 5MB</div>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm text-slate-700 mb-2">
                      Upload Rulebook (PDF) 
                      <span className="text-red-600 ml-1">*</span>
                    </label>
                    <p className="text-sm text-slate-500 mb-4">Required for event approval by admin</p>
                    
                    <div className="relative">
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="rulebook-upload"
                      />
                      <label
                        htmlFor="rulebook-upload"
                        className="flex flex-col items-center justify-center p-12 rounded-3xl border-2 border-dashed border-slate-300 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50/50 cursor-pointer transition-all group"
                      >
                        {eventData.rulebookFile ? (
                          <div className="text-center">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                              <FileText className="w-8 h-8 text-emerald-600" />
                            </div>
                            <div className="text-slate-900 mb-1">{eventData.rulebookFile.name}</div>
                            <div className="text-sm text-slate-500">
                              {(eventData.rulebookFile.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                            <button 
                              type="button"
                              className="mt-4 text-sm text-emerald-600 hover:text-emerald-700"
                            >
                              Change file
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center mb-4 transition-colors">
                              <Upload className="w-8 h-8 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                            </div>
                            <div className="text-slate-900 mb-1">Drop your PDF here or click to browse</div>
                            <div className="text-sm text-slate-500">Maximum file size: 10MB</div>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <div className="w-20 h-20 rounded-3xl bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl text-slate-900 mb-2">Ready to Submit</h3>
                    <p className="text-slate-600 mb-8">
                      Your event will be sent for admin review. You'll be notified once it's approved.
                    </p>
                    
                    <div className="bg-slate-50 rounded-2xl p-6 text-left max-w-md mx-auto">
                      <h4 className="text-sm text-slate-700 mb-4">Event Summary</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Title:</span>
                          <span className="text-slate-900">{eventData.title || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Category:</span>
                          <span className="text-slate-900">{eventData.category || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Date:</span>
                          <span className="text-slate-900">{eventData.startDate || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Venue:</span>
                          <span className="text-slate-900">{eventData.venue || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Resources:</span>
                          <span className="text-slate-900">{eventData.resources.length} selected</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Poster Image:</span>
                          <span className="text-slate-900">{eventData.posterImage ? 'Uploaded' : 'Not uploaded'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Form Link:</span>
                          <span className="text-slate-900">{eventData.formLink ? 'Added' : 'Not added'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Rulebook:</span>
                          <span className="text-slate-900">{eventData.rulebookFile ? 'Uploaded' : 'Not uploaded'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Wizard Footer */}
            <div className="p-6 border-t border-slate-200">
              {error && (
                <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowWizard(false);
                    setError(null);
                  }}
                  disabled={loading}
                  className="px-6 py-3 rounded-2xl text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-3">
                  {currentStep > 0 && (
                    <button
                      onClick={() => {
                        setCurrentStep(currentStep - 1);
                        setError(null);
                      }}
                      disabled={loading}
                      className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                      Previous
                    </button>
                  )}
                  {currentStep < steps.length - 1 ? (
                    <button
                      onClick={() => {
                        setCurrentStep(currentStep + 1);
                        setError(null);
                      }}
                      disabled={loading}
                      className="px-6 py-3 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitEvent}
                      disabled={loading}
                      className="px-8 py-3 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/25 disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit for Review'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-2xl text-slate-900 font-semibold">Event Details</h2>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <XCircle className="w-6 h-6 text-slate-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Title and Status */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-slate-900">{selectedEvent.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedEvent.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      selectedEvent.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      selectedEvent.status === 'draft' ? 'bg-slate-100 text-slate-700' :
                      selectedEvent.status === 'live' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Event Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">Date</span>
                    </div>
                    <p className="text-slate-900 font-medium">{selectedEvent.date}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">Venue</span>
                    </div>
                    <p className="text-slate-900 font-medium">{selectedEvent.venue || 'Not specified'}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">Capacity</span>
                    </div>
                    <p className="text-slate-900 font-medium">{selectedEvent.capacity} attendees</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm">Registered</span>
                    </div>
                    <p className="text-slate-900 font-medium">{selectedEvent.registered} / {selectedEvent.capacity}</p>
                  </div>
                </div>

                {/* Registration Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Registration Progress</span>
                    <span className="text-sm font-medium text-slate-900">
                      {Math.round((selectedEvent.registered / selectedEvent.capacity) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div 
                      className="bg-emerald-600 h-3 rounded-full transition-all"
                      style={{ width: `${(selectedEvent.registered / selectedEvent.capacity) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => {
                      fetchRegistrations(selectedEvent.id);
                      setShowRegistrations(true);
                    }}
                    className="px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    View Registrations
                  </button>
                  <button 
                    onClick={() => setShowEditModal(true)}
                    className="px-4 py-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Edit Event
                  </button>
                  <button 
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                    disabled={selectedEvent.registered > 0}
                    className="px-4 py-3 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={selectedEvent.registered > 0 ? 'Cannot delete event with registrations' : 'Delete event'}
                  >
                    <XCircle className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Registrations Modal */}
      {showRegistrations && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-2xl text-slate-900 font-semibold">
                Registrations - {selectedEvent.title}
              </h2>
              <button 
                onClick={() => setShowRegistrations(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <XCircle className="w-6 h-6 text-slate-600" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {registrations.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg text-slate-900 mb-2">No registrations yet</h3>
                  <p className="text-slate-600">Students haven't registered for this event yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {registrations.map((reg: any, index: number) => (
                    <div 
                      key={reg._id || index}
                      className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {reg.userId?.name || reg.studentName || 'Student'}
                            </p>
                            <p className="text-xs text-slate-600">
                              {reg.userId?.email || reg.email || 'No email'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Registered</p>
                          <p className="text-sm text-slate-900">
                            {new Date(reg.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-2xl text-slate-900 font-semibold">Edit Event</h2>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <XCircle className="w-6 h-6 text-slate-600" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-700 mb-2">Event Title</label>
                  <input
                    type="text"
                    defaultValue={selectedEvent.title}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Venue</label>
                    <input
                      type="text"
                      defaultValue={selectedEvent.venue}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Capacity</label>
                    <input
                      type="number"
                      defaultValue={selectedEvent.capacity}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm text-amber-800">
                    ⚠️ <strong>Coming Soon:</strong> Full edit functionality is being implemented. For now, you can view the current values. Contact admin for urgent changes.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-6 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Edit functionality coming soon!');
                  setShowEditModal(false);
                }}
                className="flex-1 px-6 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
