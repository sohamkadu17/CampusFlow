import { useState, useEffect } from 'react';
import {
  Sparkles, TrendingUp, Calendar, Users, MapPin, Download,
  ArrowLeft, BarChart3, PieChart, Activity, DollarSign
} from 'lucide-react';
import axios from 'axios';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';

interface AnalyticsDashboardProps {
  onBack: () => void;
}

interface AnalyticsData {
  eventAnalytics: {
    overview: {
      totalEvents: number;
      approvedEvents: number;
      pendingEvents: number;
      completedEvents: number;
      totalRegistrations: number;
      totalAttendance: number;
      attendanceRate: number;
    };
    eventsByCategory: Array<{ _id: string; count: number }>;
    eventTrends: Array<{ _id: { year: number; month: number }; count: number }>;
    avgCapacityUtilization: number;
  };
  budgetAnalytics: {
    summary: {
      totalRequested: number;
      totalApproved: number;
      totalSpent: number;
      eventCount: number;
    };
    byCategory: Array<{
      _id: string;
      totalRequested: number;
      totalApproved: number;
      totalSpent: number;
    }>;
  };
  clubAnalytics: {
    clubStats: Record<string, { memberCount: number; eventCount: number }>;
    topClubs: Array<{ clubName: string; metrics: { memberCount: number; eventCount: number } }>;
  };
  resourceAnalytics: {
    totalResources: number;
    availableResources: number;
    maintenanceResources: number;
    utilizationRate: number;
    bookingsByResource: Array<{ _id: string; resourceName: string; count: number }>;
    peakBookingHours: Array<{ hour: number; count: number }>;
  };
  userAnalytics: {
    totalUsers: number;
    activeUsers: number;
    usersByRole: Array<{ _id: string; count: number }>;
    newUsersThisMonth: number;
    usersByDepartment?: Array<{ _id: string; count: number }>;
  };
}

export default function AnalyticsDashboard({ onBack }: AnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'events' | 'clubs' | 'resources' | 'users'>('events');

  useEffect(() => {
    loadAnalytics();
    // Set up global refresh function
    (window as any).refreshAnalytics = loadAnalytics;
    return () => {
      delete (window as any).refreshAnalytics;
    };
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [eventRes, budgetRes, clubRes, resourceRes, userRes] = await Promise.all([
        axios.get(`${API_URL}/analytics/events`, { headers }),
        axios.get(`${API_URL}/analytics/budget`, { headers }),
        axios.get(`${API_URL}/analytics/clubs`, { headers }),
        axios.get(`${API_URL}/analytics/resources`, { headers }),
        axios.get(`${API_URL}/analytics/users`, { headers }),
      ]);

      setAnalytics({
        eventAnalytics: eventRes.data.data,
        budgetAnalytics: budgetRes.data.data,
        clubAnalytics: clubRes.data.data,
        resourceAnalytics: resourceRes.data.data,
        userAnalytics: userRes.data.data,
      });
    } catch (err: any) {
      console.error('Analytics error:', err);
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportEventAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/analytics/export?type=events`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'text',
      });
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `events-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Export error:', err);
      alert(err.response?.data?.message || 'Export failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl text-slate-900 mb-2">Failed to Load Analytics</h3>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={loadAnalytics}
            className="px-6 py-3 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    Technical: 'bg-blue-500',
    Cultural: 'bg-purple-500',
    Sports: 'bg-green-500',
    Workshop: 'bg-orange-500',
    Seminar: 'bg-indigo-500',
    Other: 'bg-slate-500',
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl text-slate-900 font-semibold">Analytics Dashboard</span>
              </div>
            </div>
            <button
              onClick={exportEventAnalytics}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export to CSV</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-6 max-w-[1400px] mx-auto">
        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-2 mb-6 flex gap-2">
          {[
            { key: 'events', label: 'Events', icon: Calendar },
            { key: 'clubs', label: 'Clubs', icon: Users },
            { key: 'resources', label: 'Resources', icon: MapPin },
            { key: 'users', label: 'Users', icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${
                  activeTab === tab.key
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Event Analytics */}
        {activeTab === 'events' && analytics?.eventAnalytics && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Total Events</span>
                  <Calendar className="w-5 h-5 text-violet-600" />
                </div>
                <div className="text-3xl font-bold text-slate-900">
                  {analytics.eventAnalytics.overview?.totalEvents || 0}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Approved</span>
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-3xl font-bold text-emerald-600">
                  {analytics.eventAnalytics.overview?.approvedEvents || 0}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Total Registrations</span>
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {analytics.eventAnalytics.overview?.totalRegistrations || 0}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Attendance Rate</span>
                  <BarChart3 className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-orange-600">
                  {analytics.eventAnalytics.overview?.attendanceRate?.toFixed(1) || '0.0'}%
                </div>
              </div>
            </div>

            {/* Events by Category */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Events by Category</h3>
                <PieChart className="w-5 h-5 text-slate-400" />
              </div>
              <div className="space-y-4">
                {(analytics.eventAnalytics.eventsByCategory || []).map((cat) => {
                  const total = analytics.eventAnalytics.eventsByCategory.reduce((sum, c) => sum + c.count, 0);
                  const percentage = ((cat.count / total) * 100).toFixed(1);
                  const colorClass = categoryColors[cat._id] || categoryColors.Other;

                  return (
                    <div key={cat._id}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">{cat._id}</span>
                        <span className="text-sm text-slate-600">
                          {cat.count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full ${colorClass} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Capacity Utilization */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Average Capacity Utilization</h3>
                <TrendingUp className="w-5 h-5 text-slate-400" />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="w-full bg-slate-100 rounded-full h-8 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-violet-600 flex items-center justify-end px-3 transition-all duration-500"
                      style={{ width: `${analytics.eventAnalytics.avgCapacityUtilization}%` }}
                    >
                      <span className="text-white text-sm font-medium">
                        {analytics.eventAnalytics.avgCapacityUtilization.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Budget Overview */}
            {analytics.budgetAnalytics && analytics.budgetAnalytics.summary && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">Budget Overview</h3>
                  <DollarSign className="w-5 h-5 text-slate-400" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <div className="text-sm text-blue-700 mb-2">Total Requested</div>
                    <div className="text-2xl font-bold text-blue-900">
                      ₹{analytics.budgetAnalytics.summary.totalRequested?.toLocaleString() || 0}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      {analytics.budgetAnalytics.summary.eventCount || 0} events
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-sm text-emerald-700 mb-2">Total Approved</div>
                    <div className="text-2xl font-bold text-emerald-900">
                      ₹{analytics.budgetAnalytics.summary.totalApproved?.toLocaleString() || 0}
                    </div>
                    <div className="text-xs text-emerald-600 mt-1">
                      {analytics.budgetAnalytics.summary.totalRequested > 0 
                        ? `${((analytics.budgetAnalytics.summary.totalApproved / analytics.budgetAnalytics.summary.totalRequested) * 100).toFixed(1)}% approved`
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-orange-50 border border-orange-200">
                    <div className="text-sm text-orange-700 mb-2">Total Spent</div>
                    <div className="text-2xl font-bold text-orange-900">
                      ₹{analytics.budgetAnalytics.summary.totalSpent?.toLocaleString() || 0}
                    </div>
                    <div className="text-xs text-orange-600 mt-1">
                      {analytics.budgetAnalytics.summary.totalApproved > 0
                        ? `${((analytics.budgetAnalytics.summary.totalSpent / analytics.budgetAnalytics.summary.totalApproved) * 100).toFixed(1)}% utilized`
                        : 'N/A'}
                    </div>
                  </div>
                </div>
                
                {/* Budget by Category */}
                {analytics.budgetAnalytics.byCategory && analytics.budgetAnalytics.byCategory.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-700 mb-4">Budget by Category</h4>
                    <div className="space-y-3">
                      {analytics.budgetAnalytics.byCategory.map((cat) => (
                        <div key={cat._id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                          <span className="text-sm font-medium text-slate-700 capitalize">{cat._id}</span>
                          <div className="flex items-center gap-6 text-sm">
                            <span className="text-blue-700">Req: ₹{cat.totalRequested?.toLocaleString() || 0}</span>
                            <span className="text-emerald-700">App: ₹{cat.totalApproved?.toLocaleString() || 0}</span>
                            <span className="text-orange-700">Spent: ₹{cat.totalSpent?.toLocaleString() || 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Club Analytics */}
        {activeTab === 'clubs' && analytics?.clubAnalytics && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Top Performing Clubs</h3>
                <Users className="w-5 h-5 text-slate-400" />
              </div>
              <div className="space-y-4">
                {(analytics.clubAnalytics.topClubs || []).length > 0 ? (
                  (analytics.clubAnalytics.topClubs || []).map((club, index) => (
                    <div key={club.clubName || index} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50">
                      <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center font-bold text-violet-600">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">{club.clubName}</div>
                        <div className="text-sm text-slate-600">
                          {club.metrics?.memberCount || 0} members • {club.metrics?.eventCount || 0} events
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-600">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p>No club data available yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Resource Analytics */}
        {activeTab === 'resources' && analytics?.resourceAnalytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Total Resources</span>
                  <MapPin className="w-5 h-5 text-slate-600" />
                </div>
                <div className="text-3xl font-bold text-slate-900">
                  {analytics.resourceAnalytics.totalResources || 0}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Available</span>
                  <Activity className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-3xl font-bold text-emerald-600">
                  {analytics.resourceAnalytics.availableResources || 0}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Utilization Rate</span>
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {analytics.resourceAnalytics.utilizationRate?.toFixed(1) || '0.0'}%
                </div>
              </div>
            </div>

            {/* Most Booked Resources */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">Most Booked Resources</h3>
              <div className="space-y-3">
                {(analytics.resourceAnalytics.bookingsByResource || []).map((resource) => (
                  <div key={resource._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <span className="font-medium text-slate-700">{resource.resourceName}</span>
                    <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-sm font-medium">
                      {resource.count} bookings
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* User Analytics */}
        {activeTab === 'users' && analytics?.userAnalytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Total Users</span>
                  <Users className="w-5 h-5 text-slate-600" />
                </div>
                <div className="text-3xl font-bold text-slate-900">
                  {analytics.userAnalytics.totalUsers || 0}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Active Users</span>
                  <Activity className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-3xl font-bold text-emerald-600">
                  {analytics.userAnalytics.activeUsers || 0}
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  Last 30 days
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">New This Month</span>
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {analytics.userAnalytics.newUsersThisMonth || 0}
                </div>
              </div>
            </div>

            {/* Users by Role */}
            {analytics.userAnalytics.usersByRole && analytics.userAnalytics.usersByRole.length > 0 ? (
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">Users by Role</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {analytics.userAnalytics.usersByRole.map((role) => (
                    <div key={role._id} className="text-center p-6 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200">
                      <div className="text-4xl font-bold text-violet-900 mb-2">{role.count}</div>
                      <div className="text-sm font-medium text-violet-700 capitalize">{role._id}s</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No user role data available</p>
              </div>
            )}

            {/* Users by Department */}
            {analytics.userAnalytics.usersByDepartment && analytics.userAnalytics.usersByDepartment.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">Users by Department</h3>
                <div className="space-y-3">
                  {analytics.userAnalytics.usersByDepartment.slice(0, 10).map((dept: any) => {
                    const maxCount = (analytics.userAnalytics.usersByDepartment && analytics.userAnalytics.usersByDepartment[0]?.count) || 1;
                    const percentage = (dept.count / maxCount) * 100;
                    return (
                      <div key={dept._id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">{dept._id || 'Not Specified'}</span>
                          <span className="text-slate-500">{dept.count} users</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
