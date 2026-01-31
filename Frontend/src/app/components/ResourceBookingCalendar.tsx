import { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock,
  MapPin, Users, Plus, X, Check, AlertCircle, Loader2, ArrowLeft
} from 'lucide-react';
import axios from 'axios';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';

interface ResourceBookingCalendarProps {
  onBack: () => void;
}

interface Resource {
  _id: string;
  name: string;
  type: string;
  capacity: number;
  location: string;
  amenities: string[];
  status: 'available' | 'unavailable' | 'maintenance';
}

interface Booking {
  _id: string;
  resourceId: string;
  userId: {
    _id: string;
    name: string;
  };
  clubName?: string;
  eventTitle?: string;
  startTime: Date;
  endTime: Date;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: string;
}

interface TimeSlot {
  hour: number;
  minute: number;
  displayTime: string;
}

export default function ResourceBookingCalendar({ onBack }: ResourceBookingCalendarProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour: number } | null>(null);
  const [bookingForm, setBookingForm] = useState({
    purpose: '',
    startTime: '',
    endTime: '',
    notes: '',
    clubName: '',
    eventTitle: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadResources();
  }, []);

  useEffect(() => {
    if (selectedResource) {
      loadBookings(selectedResource._id);
    }
  }, [selectedResource, currentDate]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Define venue resources (matching the venue options from OrganizerDashboard)
      const venueResources: Resource[] = [
        {
          _id: 'venue_old_seminar',
          name: 'Old Seminar Hall',
          type: 'venue',
          capacity: 100,
          location: 'Academic Block A',
          amenities: ['Projector', 'Sound System', 'AC'],
          status: 'available',
        },
        {
          _id: 'venue_new_seminar',
          name: 'New Seminar Hall',
          type: 'venue',
          capacity: 100,
          location: 'Academic Block B',
          amenities: ['Projector', 'Sound System', 'AC', 'Smart Board'],
          status: 'available',
        },
        {
          _id: 'venue_main_auditorium',
          name: 'Main Auditorium',
          type: 'venue',
          capacity: 500,
          location: 'Central Building',
          amenities: ['Stage', 'Professional Sound System', 'Lighting', 'AC'],
          status: 'available',
        },
        {
          _id: 'venue_lawn',
          name: 'Lawn',
          type: 'venue',
          capacity: 200,
          location: 'Outdoor Area',
          amenities: ['Open Air', 'Portable Stage Available'],
          status: 'available',
        },
        {
          _id: 'venue_conf_a',
          name: 'Conference Room A',
          type: 'venue',
          capacity: 50,
          location: 'Administrative Block',
          amenities: ['Projector', 'Whiteboard', 'AC', 'Video Conferencing'],
          status: 'available',
        },
        {
          _id: 'venue_conf_b',
          name: 'Conference Room B',
          type: 'venue',
          capacity: 50,
          location: 'Administrative Block',
          amenities: ['Projector', 'Whiteboard', 'AC'],
          status: 'available',
        },
        {
          _id: 'venue_open_air',
          name: 'Open Air Theatre',
          type: 'venue',
          capacity: 300,
          location: 'Campus Grounds',
          amenities: ['Stage', 'Sound System', 'Outdoor Seating'],
          status: 'available',
        },
      ];
      
      // Try to load additional resources from backend (if any)
      try {
        console.log('Loading resources from:', `${API_URL}/resources`);
        const response = await axios.get(`${API_URL}/resources`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Resources response:', response.data);
        const backendResources = response.data.data?.resources || [];
        
        // Combine venue resources with any backend resources
        const allResources = [...venueResources, ...backendResources];
        setResources(allResources);
        if (allResources.length > 0) {
          setSelectedResource(allResources[0]);
        }
      } catch (err) {
        // If backend resources fail, just use venue resources
        console.log('Using venue resources only');
        setResources(venueResources);
        if (venueResources.length > 0) {
          setSelectedResource(venueResources[0]);
        }
      }
    } catch (err: any) {
      console.error('Failed to load resources:', err);
      console.error('Error response:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async (resourceId: string) => {
    try {
      const token = localStorage.getItem('token');
      const startDate = getWeekStart(currentDate);
      const endDate = getWeekEnd(currentDate);
      
      // Fetch both regular bookings and event-based venue bookings
      const [bookingsResponse, eventsResponse] = await Promise.all([
        axios.get(`${API_URL}/bookings`, {
          params: {
            resourceId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
          headers: { Authorization: `Bearer ${token}` },
        }).catch((error) => {
          console.error('Failed to fetch bookings, falling back to empty list:', error);
          return { data: { data: { bookings: [] } } };
        }), // Handle if bookings endpoint doesn't exist
        
        // Fetch all approved/pending events to show venue bookings
        axios.get(`${API_URL}/events`, {
          params: {
            limit: 100,
          },
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);
      
      console.log('Loaded bookings:', bookingsResponse.data);
      console.log('Loaded events:', eventsResponse.data);
      
      const regularBookings = bookingsResponse.data.data?.bookings || [];
      const events = eventsResponse.data.data?.events || [];
      
      // Convert approved events to booking format for calendar display
      const eventBookings = events
        .filter((event: any) => {
          // Only show approved events (not pending, draft, cancelled, or rejected)
          return event.status === 'approved';
        })
        .filter((event: any) => {
          // Match venue name with resource name
          const venueName = event.venue?.toLowerCase() || '';
          const resourceName = selectedResource?.name?.toLowerCase() || '';
          return venueName === resourceName;
        })
        .map((event: any) => ({
          _id: `event_${event._id}`,
          resourceId: resourceId,
          userId: {
            _id: event.organizerId || 'unknown',
            name: event.organizerName || 'Event Organizer',
          },
          clubName: event.clubs?.[0]?.clubName || 'Campus Event',
          eventTitle: event.title,
          startTime: new Date(event.startDate || event.date),
          endTime: new Date(event.endDate || event.date),
          purpose: event.description || 'Event',
          status: 'approved',
          approvedBy: 'Admin',
        }));
      
      // Combine both types of bookings
      setBookings([...regularBookings, ...eventBookings]);
    } catch (err) {
      console.error('Failed to load bookings:', err);
      setBookings([]);
    }
  };

  const createBooking = async () => {
    if (!selectedResource || !selectedSlot) return;

    try {
      setSubmitting(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const startDateTime = new Date(selectedSlot.date);
      startDateTime.setHours(parseInt(bookingForm.startTime.split(':')[0]), parseInt(bookingForm.startTime.split(':')[1]));
      
      const endDateTime = new Date(selectedSlot.date);
      endDateTime.setHours(parseInt(bookingForm.endTime.split(':')[0]), parseInt(bookingForm.endTime.split(':')[1]));

      await axios.post(
        `${API_URL}/bookings`,
        {
          resourceId: selectedResource._id,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          purpose: bookingForm.purpose,
          clubName: bookingForm.clubName || undefined,
          eventTitle: bookingForm.eventTitle || undefined,
          notes: bookingForm.notes,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowBookingModal(false);
      setBookingForm({ purpose: '', startTime: '', endTime: '', notes: '', clubName: '', eventTitle: '' });
      loadBookings(selectedResource._id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const getWeekEnd = (date: Date) => {
    const start = getWeekStart(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end;
  };

  const getWeekDays = () => {
    const start = getWeekStart(currentDate);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const timeSlots: TimeSlot[] = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    minute: 0,
    displayTime: `${i.toString().padStart(2, '0')}:00`,
  }));

  const getBookingsForSlot = (date: Date, hour: number) => {
    return bookings.filter((booking) => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      return (
        bookingStart < slotEnd &&
        bookingEnd > slotStart &&
        bookingStart.toDateString() === date.toDateString()
      );
    });
  };

  const isSlotBooked = (date: Date, hour: number) => {
    return getBookingsForSlot(date, hour).length > 0;
  };

  const getBookingHeight = (booking: Booking) => {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return Math.max(hours * 80, 40); // 80px per hour, minimum 40px
  };

  const getBookingTop = (booking: Booking) => {
    const start = new Date(booking.startTime);
    const minutes = start.getMinutes();
    return (minutes / 60) * 80; // 80px per hour
  };

  const getBookingColor = (status: Booking['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'pending':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'cancelled':
        return 'bg-slate-100 border-slate-300 text-slate-600';
      default:
        return 'bg-violet-100 border-violet-300 text-violet-800';
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleSlotClick = (date: Date, hour: number) => {
    if (isSlotBooked(date, hour)) return;
    setSelectedSlot({ date, hour });
    setBookingForm({
      purpose: '',
      startTime: `${hour.toString().padStart(2, '0')}:00`,
      endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
      notes: '',
      clubName: '',
      eventTitle: '',
    });
    setShowBookingModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Resource Calendar</h1>
              <p className="text-slate-600">Manage facility bookings and availability</p>
            </div>
          </div>
          
          <button
            onClick={goToToday}
            className="px-4 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors"
          >
            Today
          </button>
        </div>

        {/* Resource Selector */}
        <div className="flex items-center gap-4 overflow-x-auto pb-2">
          {resources.length === 0 ? (
            <div className="w-full text-center py-8">
              <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium mb-1">No Resources Found</p>
              <p className="text-sm text-slate-500">Please contact administrator to add resources</p>
            </div>
          ) : (
            resources.map((resource) => (
              <button
                key={resource._id}
                onClick={() => setSelectedResource(resource)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all whitespace-nowrap ${
                  selectedResource?._id === resource._id
                    ? 'border-violet-600 bg-violet-50 text-violet-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <MapPin className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">{resource.name}</div>
                  <div className="text-xs opacity-70">
                    {resource.type} • {resource.capacity} capacity
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateWeek('prev')}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h2 className="text-lg font-semibold text-slate-900">
              {getWeekStart(currentDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} -{' '}
              {getWeekEnd(currentDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>
            <button
              onClick={() => navigateWeek('next')}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-300" />
                <span>Approved</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-300" />
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-300" />
                <span>Rejected</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6 overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Day Headers */}
          <div className="flex">
            <div className="w-20 flex-shrink-0" /> {/* Time column spacer */}
            {getWeekDays().map((day, index) => (
              <div key={index} className="flex-1 min-w-[140px] text-center py-3 border-b border-slate-200">
                <div className="text-sm text-slate-600">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-lg font-semibold mt-1 ${
                  day.toDateString() === new Date().toDateString()
                    ? 'text-violet-600'
                    : 'text-slate-900'
                }`}>
                  {day.getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Time Slots */}
          <div className="relative">
            {timeSlots.map((slot) => (
              <div key={slot.hour} className="flex h-20 border-b border-slate-100">
                {/* Time Label */}
                <div className="w-20 flex-shrink-0 text-sm text-slate-500 pr-4 text-right pt-1">
                  {slot.displayTime}
                </div>

                {/* Day Columns */}
                {getWeekDays().map((day, dayIndex) => {
                  const slotBookings = getBookingsForSlot(day, slot.hour);
                  const isBooked = slotBookings.length > 0;

                  return (
                    <div
                      key={dayIndex}
                      className={`flex-1 min-w-[140px] border-l border-slate-100 relative ${
                        !isBooked ? 'hover:bg-violet-50 cursor-pointer' : ''
                      }`}
                      onClick={() => !isBooked && handleSlotClick(day, slot.hour)}
                    >
                      {slotBookings.map((booking, bookingIndex) => {
                        const bookingStart = new Date(booking.startTime);
                        if (bookingStart.getHours() === slot.hour) {
                          return (
                            <div
                              key={bookingIndex}
                              className={`absolute left-1 right-1 rounded-lg border-l-4 p-2 shadow-sm ${getBookingColor(
                                booking.status
                              )}`}
                              style={{
                                height: `${getBookingHeight(booking)}px`,
                                top: `${getBookingTop(booking)}px`,
                                zIndex: 10,
                              }}
                            >
                              <div className="text-xs font-semibold truncate">{booking.purpose}</div>
                              {booking.clubName && (
                                <div className="text-xs font-medium truncate">📍 {booking.clubName}</div>
                              )}
                              {booking.eventTitle && (
                                <div className="text-xs opacity-70 truncate">🎯 {booking.eventTitle}</div>
                              )}
                              <div className="text-xs opacity-70 truncate">👤 {booking.userId.name}</div>
                              <div className="text-xs opacity-70 flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3" />
                                {bookingStart.toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true,
                                })}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedSlot && selectedResource && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-900">New Booking</h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-violet-50 border border-violet-200">
                <div className="flex items-center gap-2 text-violet-700 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">{selectedResource.name}</span>
                </div>
                <div className="text-sm text-violet-600">
                  {selectedSlot.date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Purpose</label>
                <input
                  type="text"
                  value={bookingForm.purpose}
                  onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                  placeholder="e.g., Team Meeting, Workshop, Event"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Club/Committee Name</label>
                <input
                  type="text"
                  value={bookingForm.clubName}
                  onChange={(e) => setBookingForm({ ...bookingForm, clubName: e.target.value })}
                  placeholder="e.g., Tech Club, Cultural Committee"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Event Title (Optional)</label>
                <input
                  type="text"
                  value={bookingForm.eventTitle}
                  onChange={(e) => setBookingForm({ ...bookingForm, eventTitle: e.target.value })}
                  placeholder="e.g., Annual Tech Fest"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={bookingForm.startTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={bookingForm.endTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  placeholder="Additional details..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-200 resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createBooking}
                  disabled={submitting || !bookingForm.purpose || !bookingForm.startTime || !bookingForm.endTime}
                  className="flex-1 px-4 py-3 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:bg-slate-300 transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Create Booking</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
