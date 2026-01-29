import { useState } from 'react';
import { 
  Sparkles, Plus, Calendar, Users, Settings, Bell, Search, 
  LogOut, Upload, FileText, ChevronRight, Check, Clock, 
  AlertCircle, CheckCircle2, XCircle, MapPin, User
} from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

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

  const [events] = useState<Event[]>([
    { id: '1', title: 'Tech Symposium 2026', date: 'Feb 15, 2026', status: 'approved', capacity: 200, registered: 156 },
    { id: '2', title: 'Hackathon Marathon', date: 'Mar 2, 2026', status: 'pending', capacity: 150, registered: 0 },
    { id: '3', title: 'Cultural Fest', date: 'Jan 28, 2026', status: 'changes-requested', capacity: 500, registered: 0 },
    { id: '4', title: 'Workshop: AI Basics', date: 'Feb 1, 2026', status: 'draft', capacity: 50, registered: 0 },
  ]);

  const statusConfig: Record<EventStatus, { label: string; color: string; bg: string; icon: any }> = {
    draft: { label: 'Draft', color: 'text-slate-600', bg: 'bg-slate-100', icon: Clock },
    pending: { label: 'Pending Review', color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock },
    approved: { label: 'Approved', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle2 },
    live: { label: 'Live', color: 'text-indigo-700', bg: 'bg-indigo-100', icon: CheckCircle2 },
    'changes-requested': { label: 'Changes Requested', color: 'text-red-700', bg: 'bg-red-100', icon: AlertCircle },
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setEventData({ ...eventData, rulebookFile: file });
    }
  };

  const handleSubmitEvent = () => {
    // Submit event logic
    setShowWizard(false);
    setCurrentStep(0);
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
              <button className="relative p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-600 rounded-full"></span>
              </button>
              <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <Settings className="w-5 h-5 text-slate-600" />
              </button>
              <div className="h-6 w-px bg-slate-200"></div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-600" />
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

      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
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
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="text-2xl text-slate-900 mb-1">12</div>
              <div className="text-sm text-slate-600">Total Events</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="text-2xl text-emerald-600 mb-1">8</div>
              <div className="text-sm text-slate-600">Approved</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="text-2xl text-amber-600 mb-1">2</div>
              <div className="text-sm text-slate-600">Pending Review</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="text-2xl text-slate-900 mb-1">2.4K</div>
              <div className="text-sm text-slate-600">Total Registrations</div>
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl text-slate-900">Your Events</h2>
          </div>
          <div className="divide-y divide-slate-200">
            {events.map((event) => {
              const status = statusConfig[event.status];
              const StatusIcon = status.icon;
              return (
                <div key={event.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg text-slate-900">{event.title}</h3>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${status.bg} ${status.color}`}>
                          <StatusIcon className="w-4 h-4" />
                          {status.label}
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
                    <button className="p-2 hover:bg-white rounded-xl transition-colors">
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                  {event.registered > 0 && (
                    <div className="mt-3">
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div 
                          className="bg-emerald-600 h-2 rounded-full transition-all"
                          style={{ width: `${(event.registered / event.capacity) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Upload Rulebook (PDF)</label>
                    <p className="text-sm text-slate-500 mb-4">Required for event approval</p>
                    
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

              {currentStep === 4 && (
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
            <div className="p-6 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setShowWizard(false)}
                className="px-6 py-3 rounded-2xl text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <div className="flex items-center gap-3">
                {currentStep > 0 && (
                  <button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Previous
                  </button>
                )}
                {currentStep < steps.length - 1 ? (
                  <button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="px-6 py-3 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitEvent}
                    className="px-8 py-3 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/25"
                  >
                    Submit for Review
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
