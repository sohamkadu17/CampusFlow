import { useState, useEffect } from 'react';
import { 
  Sparkles, Plus, Calendar, Users, Settings, Bell, Search, 
  LogOut, Upload, FileText, ChevronRight, Check, Clock, 
  AlertCircle, CheckCircle2, XCircle, MapPin, User
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { eventAPI, bookingAPI } from '../../services/api';

interface OrganizerDashboardProps {
  onLogout: () => void;
}

type EventStatus = 'draft' | 'pending' | 'approved' | 'live' | 'changes-requested';

interface Event {
  id: string;
  title: string;
  date: string;
  status: EventStatus;
  capacity: number;
  registered: number;
}

export default function OrganizerDashboard({ onLogout }: OrganizerDashboardProps) {
  const [showWizard, setShowWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
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
    rulebookFile: null as File | null,
  });

  const steps = [
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'resources', label: 'Resources', icon: MapPin },
    { id: 'rulebook', label: 'Rulebook', icon: Upload },
    { id: 'submit', label: 'Submit', icon: Check },
  ];

  const statusConfig: Record<EventStatus, { label: string; color: string; bg: string; icon: any }> = {
    draft: { label: 'Draft', color: 'text-slate-600', bg: 'bg-slate-100', icon: Clock },
    pending: { label: 'Pending Review', color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock },
    approved: { label: 'Approved', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle2 },
    live: { label: 'Live', color: 'text-indigo-700', bg: 'bg-indigo-100', icon: CheckCircle2 },
    'changes-requested': { label: 'Changes Requested', color: 'text-red-700', bg: 'bg-red-100', icon: AlertCircle },
  };

  useEffect(() => {
    loadMyEvents();
  }, []);

  const loadMyEvents = async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getMy();
      setEvents(response.data.data.events || []);
    } catch (err: any) {
      setError('Failed to load your events');
      console.error('Error loading events:', err);
      // Fallback to demo data
      setEvents([
        { id: '1', title: 'Tech Symposium 2026', date: 'Feb 15, 2026', status: 'approved', capacity: 200, registered: 156 },
        { id: '2', title: 'Hackathon Marathon', date: 'Mar 2, 2026', status: 'pending', capacity: 150, registered: 0 },
      ]);
    } finally {
      setLoading(false);
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
      
      // Create event
      const response = await eventAPI.create({
        ...eventData,
        startDateTime: `${eventData.startDate}T${eventData.startTime}`,
        endDateTime: `${eventData.endDate}T${eventData.endTime}`,
      });

      const eventId = response.data.data.event._id;

      // Upload rulebook if exists
      if (eventData.rulebookFile) {
        const formData = new FormData();
        formData.append('rulebook', eventData.rulebookFile);
        await eventAPI.update(eventId, formData);
      }

      // Submit for approval
      await eventAPI.submitForApproval(eventId);

      alert('Event submitted successfully! Waiting for admin approval.');
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
        rulebookFile: null,
      });
      loadMyEvents();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
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
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search events..."
                  className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 w-64 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
              <button className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                <Bell className="w-5 h-5 text-slate-600" />
              </button>
              <button className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                <Settings className="w-5 h-5 text-slate-600" />
              </button>
              <button 
                onClick={onLogout}
                className="w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
              >
                <LogOut className="w-5 h-5 text-red-600" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl text-slate-900 mb-2">Event Management</h1>
            <p className="text-slate-600">Create and manage your campus events</p>
          </div>
          <button
            onClick={() => setShowWizard(true)}
            className="px-6 py-3 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create New Event
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
            {error}
          </div>
        )}

        {/* Events Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-600">Loading your events...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const status = statusConfig[event.status];
              const StatusIcon = status.icon;
              
              return (
                <div key={event.id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${status.bg} ${status.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      {status.label}
                    </span>
                  </div>
                  
                  <h3 className="text-xl text-slate-900 mb-2">{event.title}</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4" />
                      {event.date}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Users className="w-4 h-4" />
                      {event.registered}/{event.capacity} registered
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-sm">
                      View Details
                    </button>
                    {event.status === 'draft' && (
                      <button className="flex-1 px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors text-sm">
                        Continue Editing
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {events.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl text-slate-900 mb-2">No Events Yet</h3>
            <p className="text-slate-600 mb-6">Start by creating your first campus event</p>
            <button
              onClick={() => setShowWizard(true)}
              className="px-6 py-3 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all"
            >
              Create Event
            </button>
          </div>
        )}
      </div>

      {/* Event Creation Wizard - Simplified for now */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <h2 className="text-2xl text-slate-900 mb-6">Create New Event</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-slate-700 mb-2">Event Title</label>
                  <input
                    type="text"
                    value={eventData.title}
                    onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="Enter event title"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-2">Description</label>
                  <textarea
                    value={eventData.description}
                    onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-none"
                    rows={4}
                    placeholder="Describe your event"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Category</label>
                    <select
                      value={eventData.category}
                      onChange={(e) => setEventData({ ...eventData, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    >
                      <option value="">Select category</option>
                      <option value="Technical">Technical</option>
                      <option value="Cultural">Cultural</option>
                      <option value="Sports">Sports</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Seminar">Seminar</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Capacity</label>
                    <input
                      type="number"
                      value={eventData.capacity}
                      onChange={(e) => setEventData({ ...eventData, capacity: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      placeholder="Max attendees"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-2">Venue</label>
                  <input
                    type="text"
                    value={eventData.venue}
                    onChange={(e) => setEventData({ ...eventData, venue: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="Event location"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={eventData.startDate}
                      onChange={(e) => setEventData({ ...eventData, startDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={eventData.startTime}
                      onChange={(e) => setEventData({ ...eventData, startTime: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowWizard(false)}
                  className="flex-1 px-6 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitEvent}
                  disabled={loading || !eventData.title || !eventData.category}
                  className="flex-1 px-6 py-3 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit for Approval'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
