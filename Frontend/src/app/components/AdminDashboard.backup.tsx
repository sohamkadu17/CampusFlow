import { useState } from 'react';
import { 
  Sparkles, Shield, Search, Bell, Settings, LogOut, 
  Calendar, Users, MapPin, FileText, CheckCircle2, 
  AlertCircle, Clock, ChevronLeft, User, Download
} from 'lucide-react';

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

  const [pendingEvents] = useState<PendingEvent[]>([
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
      description: 'A 24-hour hackathon where students build innovative solutions to real-world problems. Teams will compete for prizes and mentorship opportunities.',
      resources: ['Projector', 'WiFi Access', 'Tables & Chairs', 'Refreshments'],
      rulebookUrl: 'hackathon-rules.pdf',
      submittedDate: 'Jan 20, 2026',
    },
    {
      id: '2',
      title: 'Cultural Fest',
      organizer: 'Sarah Johnson',
      club: 'Cultural Committee',
      date: 'Jan 28, 2026',
      time: '4:00 PM - 9:00 PM',
      venue: 'Open Ground',
      capacity: 500,
      category: 'Cultural',
      description: 'Annual cultural celebration featuring performances, exhibitions, and food stalls from various cultural clubs.',
      resources: ['Sound System', 'Stage Setup', 'Security Personnel', 'Lighting'],
      rulebookUrl: 'cultural-fest-guidelines.pdf',
      submittedDate: 'Jan 15, 2026',
    },
  ]);

  const handleApprove = () => {
    // Approve event logic
    alert('Event approved successfully!');
    setSelectedEvent(null);
    setReviewNotes('');
  };

  const handleRequestChanges = () => {
    if (!reviewNotes.trim()) {
      alert('Please provide review notes before requesting changes.');
      return;
    }
    // Request changes logic
    alert('Changes requested. Organizer will be notified.');
    setSelectedEvent(null);
    setReviewNotes('');
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
              <button className="relative p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-violet-600 rounded-full"></span>
              </button>
              <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <Settings className="w-5 h-5 text-slate-600" />
              </button>
              <div className="h-6 w-px bg-slate-200"></div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-violet-600" />
                </div>
                <button 
                  onClick={onLogout}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <span className="text-sm">Logout</span>
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {!selectedEvent ? (
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl text-slate-900 mb-2">Event Review Dashboard</h1>
            <p className="text-slate-600">Review and approve pending event submissions</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="text-2xl text-amber-600 mb-1">2</div>
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
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{event.organizer} • {event.club}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{event.venue}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>Capacity: {event.capacity}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedEvent(event)}
                      className="px-6 py-2.5 rounded-2xl bg-violet-600 text-white hover:bg-violet-700 transition-colors"
                    >
                      Review Event
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    Submitted {event.submittedDate}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Split-Screen Review Panel
        <div className="h-[calc(100vh-73px)] flex flex-col">
          {/* Back Button */}
          <div className="p-6 border-b border-slate-200 bg-white">
            <button 
              onClick={() => {
                setSelectedEvent(null);
                setReviewNotes('');
              }}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to List
            </button>
          </div>

          {/* Split Screen Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - Event Metadata */}
            <div className="w-1/2 border-r border-slate-200 bg-white overflow-y-auto">
              <div className="p-8 space-y-8">
                <div>
                  <h1 className="text-3xl text-slate-900 mb-4">{selectedEvent.title}</h1>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-700">
                    <Clock className="w-4 h-4" />
                    Pending Review
                  </div>
                </div>

                {/* Organizer Info */}
                <div className="bg-slate-50 rounded-2xl p-6">
                  <h3 className="text-sm text-slate-700 mb-4">Organizer Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Name:</span>
                      <span className="text-slate-900">{selectedEvent.organizer}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Club:</span>
                      <span className="text-slate-900">{selectedEvent.club}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Submitted:</span>
                      <span className="text-slate-900">{selectedEvent.submittedDate}</span>
                    </div>
                  </div>
                </div>

                {/* Event Details */}
                <div>
                  <h3 className="text-sm text-slate-700 mb-4">Event Details</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-slate-500 mb-1">Category</div>
                      <div className="px-4 py-3 rounded-2xl bg-slate-50 text-slate-900">
                        {selectedEvent.category}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500 mb-1">Description</div>
                      <div className="px-4 py-3 rounded-2xl bg-slate-50 text-slate-900">
                        {selectedEvent.description}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Schedule */}
                <div>
                  <h3 className="text-sm text-slate-700 mb-4">Schedule</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50">
                      <Calendar className="w-5 h-5 text-slate-600" />
                      <div>
                        <div className="text-sm text-slate-500">Date</div>
                        <div className="text-slate-900">{selectedEvent.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50">
                      <Clock className="w-5 h-5 text-slate-600" />
                      <div>
                        <div className="text-sm text-slate-500">Time</div>
                        <div className="text-slate-900">{selectedEvent.time}</div>
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

                {/* Resources */}
                <div>
                  <h3 className="text-sm text-slate-700 mb-4">Required Resources</h3>
                  <div className="space-y-2">
                    {selectedEvent.resources.map((resource, index) => (
                      <div key={index} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50">
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-600"></div>
                        <span className="text-sm text-slate-900">{resource}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Rulebook Preview */}
            <div className="w-1/2 bg-slate-50 overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg text-slate-900">Rulebook Preview</h3>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors">
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                </div>

                {/* PDF Preview Placeholder */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-slate-600" />
                    <span className="text-sm text-slate-900">{selectedEvent.rulebookUrl}</span>
                  </div>
                  <div className="p-12 min-h-[600px] bg-white">
                    {/* PDF Content Simulation */}
                    <div className="space-y-6 text-sm text-slate-700">
                      <div>
                        <h4 className="text-lg text-slate-900 mb-3">Event Guidelines & Rules</h4>
                        <p className="mb-4">
                          This document outlines the rules, regulations, and guidelines for participating in {selectedEvent.title}.
                        </p>
                      </div>
                      
                      <div>
                        <h5 className="text-slate-900 mb-2">1. Eligibility</h5>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Open to all registered university students</li>
                          <li>Valid student ID required for registration</li>
                          <li>Participants must be available for the entire event duration</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="text-slate-900 mb-2">2. Registration Process</h5>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Registration opens 2 weeks before the event</li>
                          <li>Limited to {selectedEvent.capacity} participants</li>
                          <li>Confirmation email will be sent upon successful registration</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="text-slate-900 mb-2">3. Code of Conduct</h5>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Respectful behavior towards all participants and organizers</li>
                          <li>No plagiarism or unauthorized collaboration</li>
                          <li>Follow venue rules and safety guidelines</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="text-slate-900 mb-2">4. Event Schedule</h5>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Check-in: 30 minutes before start time</li>
                          <li>Main event: {selectedEvent.time}</li>
                          <li>Closing ceremony and results announcement at the end</li>
                        </ul>
                      </div>

                      <div className="pt-4 border-t border-slate-200">
                        <p className="text-xs text-slate-500">
                          For questions or concerns, contact {selectedEvent.organizer} at {selectedEvent.club}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Bar - Review Controls */}
          <div className="bg-white border-t border-slate-200 p-6 shadow-2xl">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-slate-700 mb-2">Review Notes</label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about your review decision (required for requesting changes)..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-violet-300 focus:outline-none focus:ring-4 focus:ring-violet-100 resize-none"
                  ></textarea>
                </div>
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
        </div>
      )}
    </div>
  );
}
