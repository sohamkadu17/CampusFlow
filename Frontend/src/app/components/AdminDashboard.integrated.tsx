import { useState, useEffect } from 'react';
import { 
  Sparkles, Shield, Search, Bell, Settings, LogOut, 
  Calendar, Users, MapPin, FileText, CheckCircle2, 
  AlertCircle, Clock, ChevronLeft, User, Download
} from 'lucide-react';
import { eventAPI } from '../../services/api';

interface AdminDashboardProps {
  onLogout: () => void;
}

interface PendingEvent {
  id: string;
  title: string;
  organizer: string;
  club: string;
  date: string;
  time: string;
  venue: string;
  capacity: number;
  category: string;
  description: string;
  resources: string[];
  rulebookUrl: string;
  submittedDate: string;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [selectedEvent, setSelectedEvent] = useState<PendingEvent | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPendingEvents();
  }, []);

  const loadPendingEvents = async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getPending();
      setPendingEvents(response.data.data.events || []);
    } catch (err: any) {
      setError('Failed to load pending events');
      console.error('Error loading pending events:', err);
      // Fallback to demo data
      setPendingEvents([
        {
          id: '1',
          title: 'Hackathon Marathon',
          organizer: 'John Doe',
          club: 'Computer Science Club',
          date: 'Mar 2, 2026',
          time: '9:00 AM - 6:00 PM',
          venue: 'Main Auditorium',
          capacity: 150,
          category: 'Technical',
          description: 'A 24-hour hackathon where students build innovative solutions to real-world problems.',
          resources: ['Projector', 'WiFi Access', 'Tables & Chairs', 'Refreshments'],
          rulebookUrl: 'hackathon-rules.pdf',
          submittedDate: 'Jan 20, 2026',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedEvent) return;
    
    try {
      await eventAPI.approve(selectedEvent.id);
      alert('Event approved successfully!');
      setSelectedEvent(null);
      setReviewNotes('');
      loadPendingEvents();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve event');
    }
  };

  const handleRequestChanges = async () => {
    if (!reviewNotes.trim()) {
      alert('Please provide review notes before requesting changes.');
      return;
    }
    if (!selectedEvent) return;

    try {
      await eventAPI.reject(selectedEvent.id, reviewNotes);
      alert('Changes requested. Organizer will be notified.');
      setSelectedEvent(null);
      setReviewNotes('');
      loadPendingEvents();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to request changes');
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
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl text-slate-900 font-semibold">CampusFlow</span>
              </div>
              <div className="h-6 w-px bg-slate-200"></div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-violet-600" />
                <span className="text-slate-600">Admin Portal</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search events..."
                  className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 w-64 focus:outline-none focus:ring-2 focus:ring-violet-200"
                />
              </div>
              <button className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors relative">
                <Bell className="w-5 h-5 text-slate-600" />
                {pendingEvents.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full"></span>
                )}
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
        <div className="mb-8">
          <h1 className="text-3xl text-slate-900 mb-2">Event Approvals</h1>
          <p className="text-slate-600">Review and approve event submissions</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="text-2xl text-violet-600 mb-1">{pendingEvents.length}</div>
            <div className="text-sm text-slate-600">Pending Review</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="text-2xl text-emerald-600 mb-1">45</div>
            <div className="text-sm text-slate-600">Approved This Month</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="text-2xl text-slate-900 mb-1">3</div>
            <div className="text-sm text-slate-600">Changes Requested</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="text-2xl text-slate-900 mb-1">1.2 days</div>
            <div className="text-sm text-slate-600">Avg Review Time</div>
          </div>
        </div>

        {/* Pending Events List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-600">Loading pending events...</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl text-slate-900">Pending Approvals</h2>
            </div>
            <div className="divide-y divide-slate-200">
              {pendingEvents.map((event) => (
                <div key={event.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg text-slate-900">{event.title}</h3>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-700">
                          <Clock className="w-4 h-4" />
                          Pending Review
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <User className="w-4 h-4" />
                          {event.organizer}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {event.date}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          {event.venue}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedEvent(event)}
                      className="px-6 py-2.5 rounded-xl bg-violet-500 text-white hover:bg-violet-600 transition-all text-sm"
                    >
                      Review
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{event.description}</p>
                </div>
              ))}
            </div>
            {pendingEvents.length === 0 && !loading && (
              <div className="p-12 text-center">
                <CheckCircle2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl text-slate-900 mb-2">All Caught Up!</h3>
                <p className="text-slate-600">No pending events to review</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center">
          <div className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-3xl md:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl text-slate-900">Review Event</h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Event Details */}
              <div>
                <h3 className="text-xl text-slate-900 mb-4">{selectedEvent.title}</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50">
                    <User className="w-5 h-5 text-slate-600" />
                    <div>
                      <div className="text-sm text-slate-500">Organizer</div>
                      <div className="text-slate-900">{selectedEvent.organizer}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50">
                    <Calendar className="w-5 h-5 text-slate-600" />
                    <div>
                      <div className="text-sm text-slate-500">Date & Time</div>
                      <div className="text-slate-900">{selectedEvent.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50">
                    <MapPin className="w-5 h-5 text-slate-600" />
                    <div>
                      <div className="text-sm text-slate-500">Venue</div>
                      <div className="text-slate-900">{selectedEvent.venue}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50">
                    <Users className="w-5 h-5 text-slate-600" />
                    <div>
                      <div className="text-sm text-slate-500">Capacity</div>
                      <div className="text-slate-900">{selectedEvent.capacity} attendees</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm text-slate-700 mb-2">Description</h3>
                <p className="text-slate-600">{selectedEvent.description}</p>
              </div>

              {/* Resources */}
              <div>
                <h3 className="text-sm text-slate-700 mb-4">Required Resources</h3>
                <div className="space-y-2">
                  {selectedEvent.resources.map((resource, index) => (
                    <div key={index} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50">
                      <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                      <span className="text-sm text-slate-700">{resource}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Notes */}
              <div>
                <h3 className="text-sm text-slate-700 mb-2">Review Notes (Optional)</h3>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes or feedback for the organizer..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-violet-300 focus:outline-none focus:ring-4 focus:ring-violet-100 resize-none"
                ></textarea>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRequestChanges}
                  className="px-8 py-4 rounded-2xl bg-amber-600 text-white hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/25 flex items-center gap-2"
                >
                  <AlertCircle className="w-5 h-5" />
                  Request Changes
                </button>
                <button
                  onClick={handleApprove}
                  className="px-8 py-4 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/25 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Approve Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
