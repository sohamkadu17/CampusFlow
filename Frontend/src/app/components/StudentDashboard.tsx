import { useState, useEffect } from 'react';
import { 
  Search, Bell, Home, MessageCircle, Calendar as CalendarIcon,
  MapPin, Clock, Users, Heart, ChevronRight, QrCode, X, LogOut, User
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
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

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

  const handleUnregister = async (eventId: string) => {
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
                className="flex w-10 h-10 rounded-xl bg-white/80 hover:bg-white border border-white/50 items-center justify-center transition-all shadow-md shadow-indigo-500/10"
              >
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </button>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative flex w-10 h-10 rounded-xl bg-white/80 hover:bg-white border border-white/50 items-center justify-center transition-all shadow-md shadow-indigo-500/10"
              >
                <Bell className="w-5 h-5 text-blue-600" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
              <button 
                onClick={onLogout}
                className="flex w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 border border-red-100 items-center justify-center transition-all shadow-md shadow-red-500/10"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-red-600" />
              </button>
            </div>
          </div>

          {/* Search Bar - Mobile Optimized */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events, clubs..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/80 border border-white/50 focus:bg-white focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-md shadow-indigo-500/10 text-slate-900 placeholder:text-slate-400"
              />
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
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6">
          {/* Tabs */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('discover')}
              className={`px-6 py-3 rounded-2xl font-semibold whitespace-nowrap transition-all ${
                activeTab === 'discover'
                  ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white/60 text-slate-600 hover:bg-white/80 border border-white/50'
              }`}
            >
              Discover
            </button>
            <button
              onClick={() => setActiveTab('registered')}
              className={`px-6 py-3 rounded-2xl font-semibold whitespace-nowrap transition-all ${
                activeTab === 'registered'
                  ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white/60 text-slate-600 hover:bg-white/80 border border-white/50'
              }`}
            >
              My Events ({registeredEvents.length})
            </button>
          </div>

          {/* Category Pills */}
          {activeTab === 'discover' && (
            <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                      : 'bg-white/60 text-slate-600 hover:bg-white/80 border border-white/50'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Discover Tab - 3 Column Grid (Mobile: 1 Column) */}
          {activeTab === 'discover' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse backdrop-blur-xl bg-white/60 rounded-3xl border border-white/50 shadow-lg shadow-indigo-500/10 overflow-hidden">
                    <div className="aspect-video bg-slate-200"></div>
                    <div className="p-6 space-y-4">
                      <div className="h-6 bg-slate-200 rounded"></div>
                      <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                      <div className="h-4 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                ))
              ) : (
                filteredEvents.map((event) => (
                  <motion.div
                    key={event._id || event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="backdrop-blur-xl bg-white/60 rounded-3xl border border-white/50 shadow-lg shadow-indigo-500/10 overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300"
                  >
                    {/* 16:9 Image with Date Badge */}
                    <div className="relative aspect-video overflow-hidden bg-slate-100">
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
                        className="w-full px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        {event.registered >= event.capacity ? 'Full' : 'Register Now'}
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Registered Events Tab */}
          {activeTab === 'registered' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {registeredEvents.map((event) => (
                <div
                  key={event._id || event.id}
                  className="backdrop-blur-xl bg-white/60 rounded-3xl border border-white/50 shadow-lg shadow-indigo-500/10 overflow-hidden"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{event.title}</h3>
                        <p className="text-sm text-teal-600 font-medium">{event.club}</p>
                      </div>
                      <Heart className="w-6 h-6 text-red-500 fill-current" />
                    </div>

                    <div className="flex items-center justify-center p-6 bg-white/80 rounded-2xl border border-white/50">
                      <img src={event.qrCode} alt="QR Code" className="w-48 h-48" />
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-slate-600">Registration Number</p>
                      <p className="text-2xl font-bold text-blue-600">{event.registrationNumber}</p>
                    </div>

                    <button
                      onClick={() => handleUnregister(event._id || event.id || '')}
                      className="w-full px-6 py-3 rounded-2xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                    >
                      Unregister
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fixed Bottom Navigation - Mobile Only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/60 border-t border-white/50 shadow-2xl shadow-indigo-500/20">
        <div className="flex items-center justify-around px-4 py-3">
          <button 
            onClick={() => { setView('main'); setActiveTab('discover'); }}
            className={`flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center ${
              view === 'main' && activeTab === 'discover' ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button 
            className="flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center text-slate-400"
          >
            <Search className="w-6 h-6" />
            <span className="text-xs font-medium">Search</span>
          </button>
          <button 
            onClick={() => setView('chat')}
            className={`flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center ${
              view === 'chat' ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs font-medium">Messages</span>
          </button>
          <button 
            onClick={() => setView('calendar')}
            className={`flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center ${
              view === 'calendar' ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <CalendarIcon className="w-6 h-6" />
            <span className="text-xs font-medium">Calendar</span>
          </button>
          <button 
            onClick={onLogout}
            className="flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center text-slate-400"
          >
            <User className="w-6 h-6" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </nav>

      {/* Registration Modal */}
      {showRegistrationModal && selectedEventForRegistration && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="backdrop-blur-xl bg-white/90 rounded-3xl border border-white/50 shadow-2xl shadow-indigo-500/30 w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-slate-200/50">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Register for Event</h2>
                  <p className="text-sm text-slate-600 mt-1">{selectedEventForRegistration.title}</p>
                </div>
                <button
                  onClick={() => {
                    setShowRegistrationModal(false);
                    setSelectedEventForRegistration(null);
                  }}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>
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
          </motion.div>
        </div>
      )}
    </div>
  );
}
