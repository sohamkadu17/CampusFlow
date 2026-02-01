import { useState, useEffect } from 'react';
import { 
  Search, Bell, Settings, LogOut, Home,
  Calendar as CalendarIcon, Users, MapPin,
  Clock, User, Filter, Grid, List, Heart,
  QrCode, CheckCircle2, Download, ChevronRight, ArrowLeft, MessageCircle, X
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { motion, AnimatePresence } from 'motion/react';
import { eventAPI, registrationAPI, notificationAPI } from '../../services/api';
import ChatInterface from './ChatInterface';
import ResourceBookingCalendar from './ResourceBookingCalendar';

interface StudentDashboardProps {
  onLogout: () => void;
  onHome?: () => void;
}

interface Event {
  id?: string;
  _id?: string;
  title: string;
  club: string;
  date: string;
  time: string;
  venue: string;
  capacity: number;
  registered: number;
  category: string;
  description: string;
  imageUrl: string;
  hasRulebook: boolean;
  formLink?: string;
  tags: string[];
  isFavorite?: boolean;
  status?: string;
}

interface RegisteredEvent extends Event {
  registrationDate: string;
  qrCode: string;
  registrationNumber: string;
}

export default function StudentDashboard({ onLogout, onHome }: StudentDashboardProps) {
  const [view, setView] = useState<'main' | 'chat' | 'calendar'>('main');
  const [activeTab, setActiveTab] = useState<'discover' | 'registered'>('discover');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [events, setEvents] = useState<Event[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedEventForRegistration, setSelectedEventForRegistration] = useState<Event | null>(null);
  const [registering, setRegistering] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [notificationCount, setNotificationCount] = useState(0);

  const categories = ['all', 'Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar'];

  useEffect(() => {
    if (view === 'main') {
      loadEvents();
      loadRegisteredEvents();
      loadNotificationCount();
    }
  }, [view]);

  const loadNotificationCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      setNotificationCount(response.data.data.count || 0);
    } catch (err: any) {
      console.error('Error loading notification count:', err);
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getAll({ status: 'approved' });
      setEvents(response.data.data.events || []);
    } catch (err: any) {
      console.error('Error loading events:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRegisteredEvents = async () => {
    try {
      const response = await registrationAPI.getMy();
      setRegisteredEvents(response.data.data.registrations || []);
    } catch (err) {
      console.error('Error loading registered events:', err);
    }
  };

  const handleRegister = async (eventId: string) => {
    const event = events.find(e => (e._id || e.id) === eventId);
    if (!event) return;
    setSelectedEventForRegistration(event);
    setShowRegistrationModal(true);
  };

  const submitRegistration = async () => {
    if (!selectedEventForRegistration) return;

    try {
      setRegistering(true);
      const eventId = selectedEventForRegistration._id || selectedEventForRegistration.id;
      if (!eventId) {
        alert('Invalid event ID');
        return;
      }
      await registrationAPI.register(eventId);
      
      setShowRegistrationModal(false);
      setSelectedEventForRegistration(null);
      
      alert('✅ Registration confirmed! Check the "My Events" tab to view your QR code.');
      loadRegisteredEvents();
      loadEvents();
    } catch (err: any) {
      console.error('Registration error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      alert(errorMsg);
    } finally {
      setRegistering(false);
    }
  };

  const handleUnregister = async (registrationId: string, eventId: string) => {
    if (!confirm('Are you sure you want to unregister from this event?')) return;
    
    try {
      await registrationAPI.unregister(eventId);
      alert('Successfully unregistered from the event.');
      loadRegisteredEvents();
      loadEvents();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to unregister. Please try again.');
    }
  };

  const filteredEvents = events.filter(e => {
    const matchesCategory = selectedCategory === 'all' || e.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.club.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getRegistrationProgress = (registered: number, capacity: number) => {
    return Math.min((registered / capacity) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      {/* Sticky Glassmorphism Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/60 border-b border-white/50 shadow-lg shadow-indigo-500/10">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Discovery Hub</h1>
                <p className="text-sm text-slate-500 hidden sm:block">Explore campus events</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => setView('chat')}
                className={`w-10 h-10 rounded-xl ${view === 'chat' ? 'bg-indigo-100' : 'bg-slate-100 hover:bg-slate-200'} flex items-center justify-center transition-colors`}
              >
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </button>
              <button className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                <Settings className="w-5 h-5 text-slate-600" />
              </button>
              <div className="h-6 w-px bg-slate-200"></div>
              {onHome && (
                <>
                  <button 
                    onClick={onHome}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Back to Home</span>
                  </button>
                  <div className="h-6 w-px bg-slate-200"></div>
                </>
              )}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <button 
                  onClick={onLogout}
                  className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <span className="text-sm font-medium">Logout</span>
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Interface */}
      {view === 'chat' && <ChatInterface onBack={() => setView('main')} />}

      {/* Resource Calendar */}
      {view === 'calendar' && <ResourceBookingCalendar onBack={() => setView('main')} />}

      {/* Main Content */}
      {view === 'main' && (
        <div className="p-6 max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl text-slate-900 mb-2">Welcome back! 👋</h1>
          <p className="text-slate-600">Discover events, join clubs, and enhance your campus experience</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-200">
          {[
            { id: 'discover', label: 'Discover Events', icon: Search },
            { id: 'registered', label: 'My Events', icon: CheckCircle2 },
            { id: 'clubs', label: 'My Clubs', icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
              {tab.id === 'registered' && registeredEvents.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-medium">
                  {registeredEvents.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Discover Tab */}
        {activeTab === 'discover' && (
          <div>
            {/* Filters */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-600" />
                <div className="flex gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-sm transition-all ${
                        selectedCategory === cat
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-600'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-600'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-600">Loading events...</p>
              </div>
            ) : (
              <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'} gap-6`}>
                {filteredEvents.map((event) => (
                  <div key={event.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-48">
                      <ImageWithFallback 
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {/* Date Badge - Top Right */}
                      <div className="absolute top-4 right-4 backdrop-blur-xl bg-white/90 px-4 py-2 rounded-2xl shadow-lg shadow-indigo-500/20 border border-white/50">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{new Date(event.date).getDate()}</div>
                          <div className="text-xs font-semibold text-slate-600 uppercase">
                            {new Date(event.date).toLocaleString('en', { month: 'short' })}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2">
                          {event.title}
                        </h3>
                        <p className="text-sm font-medium text-teal-600">{event.club}</p>
                      </div>

                      <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span>{event.venue}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span>{event.registered} / {event.capacity} registered</span>
                        </div>
                      </div>

                      {/* Thick Rounded Progress Bar - Teal to Emerald Gradient */}
                      <div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                          <div
                            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500 shadow-lg shadow-teal-500/30"
                            style={{ width: `${getRegistrationProgress(event.registered, event.capacity)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 text-center">
                          {Math.round(getRegistrationProgress(event.registered, event.capacity))}% Full
                        </p>
                      </div>

                      <button
                        onClick={() => handleRegister(event._id || event.id || '')}
                        disabled={event.registered >= event.capacity}
                        className="w-full px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105 active:scale-100 transition-all duration-300 flex items-center justify-center gap-2 group/btn relative overflow-hidden"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          {event.registered >= event.capacity ? 'Full' : 'Register Now'}
                          <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-blue-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Registered Events Tab */}
        {activeTab === 'registered' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {registeredEvents.map((event) => (
              <div key={event._id || event.id} className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-32 h-32 bg-slate-100 rounded-xl flex items-center justify-center">
                      <QrCode className="w-20 h-20 text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-500 text-center mt-2">Scan at venue</p>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{event.title}</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <CalendarIcon className="w-4 h-4" />
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="w-4 h-4" />
                        {event.time}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="w-4 h-4" />
                        {event.venue}
                      </div>
                      <div className="text-sm text-slate-600">
                        Registration: {event.registrationNumber}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-sm flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Download QR
                      </button>
                      <button
                        onClick={() => handleUnregister(event._id || event.id || '', event._id || event.id || '')}
                        className="px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm"
                      >
                        Unregister
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {registeredEvents.length === 0 && (
              <div className="col-span-2 text-center py-12">
                <CalendarIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl text-slate-900 mb-2">No Registered Events</h3>
                <p className="text-slate-600 mb-6">Start exploring and register for exciting campus events!</p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="px-6 py-3 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-all"
                >
                  Discover Events
                </button>
              </div>
            )}
          </div>
        )}
        </div>
      )}

      {/* Registration Modal */}
      {showRegistrationModal && selectedEventForRegistration && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">Register for Event</h2>
              <p className="text-sm text-slate-600 mt-1">{selectedEventForRegistration.title}</p>
            </div>

            <div className="p-6 space-y-6">
              {selectedEventForRegistration.formLink ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Step 1: Fill Registration Form
                    </label>
                    <a
                      href={selectedEventForRegistration.formLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-2xl border-2 border-blue-200 transition-colors"
                    >
                      <span className="text-blue-700 font-medium">Open Google Form</span>
                      <ChevronRight className="w-5 h-5 text-blue-600" />
                    </a>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Step 2: Confirm Registration
                    </label>
                    <button
                      onClick={submitRegistration}
                      disabled={registering}
                      className="w-full px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300"
                    >
                      {registering ? 'Submitting...' : 'Submit Registration'}
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={submitRegistration}
                  disabled={registering}
                  className="w-full px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300"
                >
                  {registering ? 'Submitting...' : 'Submit Registration'}
                </button>
              )}
            </div>

            <div className="p-6 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowRegistrationModal(false);
                  setSelectedEventForRegistration(null);
                }}
                disabled={registering}
                className="w-full px-6 py-3 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
