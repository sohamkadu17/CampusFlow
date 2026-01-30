import { useState, useEffect } from 'react';
import { 
  Sparkles, Shield, Search, Bell, Settings, LogOut, 
  Calendar, Users, MapPin, FileText, CheckCircle2, 
  AlertCircle, Clock, ChevronLeft, User, Download, ArrowLeft, BarChart3
} from 'lucide-react';
import { eventAPI } from '../../services/api';
import AnalyticsDashboard from './AnalyticsDashboard';
import ResourceBookingCalendar from './ResourceBookingCalendar';

interface AdminDashboardProps {
  onLogout: () => void;
  onHome?: () => void;
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
  imageUrl?: string; // Event poster image
  formLink?: string;
  submittedDate: string;
}

export default function AdminDashboard({ onLogout, onHome }: AdminDashboardProps) {
  const [view, setView] = useState<'events' | 'analytics' | 'resources'>('events');
  const [selectedEvent, setSelectedEvent] = useState<PendingEvent | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (view === 'events') {
      loadPendingEvents();
    }
  }, [view]);

  const loadPendingEvents = async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getPending();
      const events = response.data.data.events || [];
      
      console.log('Admin - Pending events:', events); // Debug
      
      // Transform backend data to match interface
      const transformedEvents = events.map((event: any) => ({
        id: event._id || event.id,
        title: event.title,
        organizer: event.organizerName,
        club: event.clubs?.[0]?.clubName || 'N/A',
        date: new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: event.time,
        venue: event.venue,
        capacity: event.capacity,
        category: event.category,
        description: event.description,
        resources: event.resources?.map((r: any) => r.resourceName || r) || [],
        rulebookUrl: event.rulebookUrl || '',
        imageUrl: event.imageUrl || '', // Event poster
        formLink: event.formLink,
        budget: event.budget, // Include budget data
        submittedDate: new Date(event.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      }));
      
      console.log('Events with budget:', transformedEvents.map((e: any) => ({ title: e.title, budget: e.budget }))); // Debug
      
      setPendingEvents(transformedEvents);
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
          imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
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
      // Trigger analytics refresh if available
      if (typeof (window as any).refreshAnalytics === 'function') {
        (window as any).refreshAnalytics();
      }
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
      await eventAPI.requestChanges(selectedEvent.id, reviewNotes);
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
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-violet-600" />
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
      </nav>

      {/* Show Analytics Dashboard if view is analytics */}
      {view === 'analytics' && (
        <AnalyticsDashboard onBack={() => setView('events')} />
      )}

      {/* Show Resource Calendar if view is resources */}
      {view === 'resources' && (
        <ResourceBookingCalendar onBack={() => setView('events')} />
      )}

      {/* Show Event Approvals if view is events */}
      {view === 'events' && (
        <>
          {/* Main Content */}
          <div className="p-6 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl text-slate-900 mb-2">Event Approvals</h1>
                <p className="text-slate-600">Review and approve event submissions</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setView('analytics')}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="font-medium">View Analytics</span>
                </button>
                <button
                  onClick={() => setView('resources')}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  <MapPin className="w-5 h-5" />
                  <span className="font-medium">Resource Calendar</span>
                </button>
              </div>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between flex-shrink-0">
              <h2 className="text-2xl text-slate-900">Review Event</h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Event Poster */}
              {selectedEvent.imageUrl && (
                <div className="mb-6">
                  <h3 className="text-sm text-slate-700 mb-3">Event Poster</h3>
                  <div className="relative rounded-2xl overflow-hidden bg-slate-100 group">
                    <img 
                      src={selectedEvent.imageUrl} 
                      alt={selectedEvent.title}
                      className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <span className="text-white text-sm font-medium">Event Poster</span>
                    </div>
                  </div>
                </div>
              )}

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
                
                {/* Budget Information */}
                {(selectedEvent as any).budget && (
                  <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200">
                    <h4 className="text-sm font-semibold text-amber-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Budget Request
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-amber-700 mb-1">Requested Amount</div>
                        <div className="text-lg font-semibold text-amber-900">
                          ₹{((selectedEvent as any).budget.requested || 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-amber-700 mb-1">Category</div>
                        <div className="text-sm font-medium text-amber-900 capitalize">
                          {(selectedEvent as any).budget.category || 'Not specified'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-amber-700 mb-1">Status</div>
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-amber-200 text-amber-800">
                          Pending Review
                        </span>
                      </div>
                    </div>
                    {(selectedEvent as any).budget.description && (
                      <div className="mt-3 pt-3 border-t border-amber-200">
                        <div className="text-xs text-amber-700 mb-1">Budget Breakdown</div>
                        <p className="text-sm text-amber-900">{(selectedEvent as any).budget.description}</p>
                      </div>
                    )}
                  </div>
                )}
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

              {/* Rulebook */}
              {selectedEvent.rulebookUrl && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm text-slate-700">Event Rulebook</h3>
                    <div className="flex gap-2">
                      <a
                        href={selectedEvent.rulebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 border border-violet-200 transition-colors flex items-center gap-2 text-xs"
                        title="Open in new tab"
                      >
                        <FileText className="w-4 h-4 text-violet-600" />
                        <span className="text-violet-700">Open</span>
                      </a>
                      <a
                        href={selectedEvent.rulebookUrl}
                        download={`${selectedEvent.title.replace(/[^a-z0-9]/gi, '-')}-rulebook.pdf`}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-2 text-xs"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">Download</span>
                      </a>
                    </div>
                  </div>
                  <div className="rounded-2xl border-2 border-slate-200 overflow-hidden bg-white">
                    <iframe
                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedEvent.rulebookUrl)}&embedded=true`}
                      className="w-full h-[600px] border-0"
                      title="Event Rulebook PDF"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2 text-center">Showing PDF preview • Use buttons above to open or download</p>
                </div>
              )}

              {/* Registration Form Link */}
              {selectedEvent.formLink && (
                <div>
                  <h3 className="text-sm text-slate-700 mb-3">Registration Form</h3>
                  <a
                    href={selectedEvent.formLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center transition-colors">
                      <FileText className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900">View Registration Form</div>
                      <div className="text-xs text-slate-600">Opens in new tab</div>
                    </div>
                    <Download className="w-5 h-5 text-emerald-600" />
                  </a>
                </div>
              )}

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
        </>
      )}
    </div>
  );
}
