
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { apiService } from '../services/api';
import { 
  Download, 
  FileText, 
  BarChart3, 
  Calendar,
  Filter,
  Star,
  MessageSquare,
  TrendingUp,
  Users,
  MapPin,
  RefreshCw,
  PieChart,
  Activity,
  Building2
} from 'lucide-react';

const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [venueFilter, setVenueFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Real data state
  const [eventStats, setEventStats] = useState<any>(null);
  const [eventReports, setEventReports] = useState<any>(null);
  const [venueAnalytics, setVenueAnalytics] = useState<any>(null);
  const [userAnalytics, setUserAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Event types and venues (will be populated from API)
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [venues, setVenues] = useState<any[]>([]);

  // Fetch data from API
  const fetchEventStatistics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getEventStatistics({
        start_date: dateRange.start,
        end_date: dateRange.end,
        event_type: eventTypeFilter === 'all' ? undefined : eventTypeFilter,
        venue_id: venueFilter === 'all' ? undefined : venueFilter
      });
      setEventStats(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch event statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEventReports = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getEventReports({
        start_date: dateRange.start,
        end_date: dateRange.end,
        event_type: eventTypeFilter === 'all' ? undefined : eventTypeFilter,
        venue_id: venueFilter === 'all' ? undefined : venueFilter,
        offset: 0
      });
      setEventReports(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch event reports');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVenueAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getVenueAnalytics({
        start_date: dateRange.start,
        end_date: dateRange.end,
        venue_id: venueFilter === 'all' ? undefined : venueFilter
      });
      setVenueAnalytics(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch venue analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getUserAnalytics({
        start_date: dateRange.start,
        end_date: dateRange.end
      });
      setUserAnalytics(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user analytics');
    } finally {
      setIsLoading(false);
    }
  };


  // Fetch all data when filters change
  useEffect(() => {
    fetchEventStatistics();
    fetchEventReports();
    fetchVenueAnalytics();
    fetchUserAnalytics();
  }, [dateRange.start, dateRange.end, eventTypeFilter, venueFilter]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={16}
        className={index < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate statistics from real data
  const totalEvents = eventStats?.total_events || 0;
  const totalParticipants = eventStats?.total_participants || 0;
  const averageParticipants = eventStats?.avg_participants || 0;

  return (
    <Layout showSidebar={true} backgroundImage="/Wrd.jpg">
      <div className="min-h-screen w-full flex flex-col items-stretch" style={{ backgroundColor: '#bd7880' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8 animate-fade-in text-white">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
                
              </div>
              {/* Removed Refresh, Export PDF, and Export Excel buttons */}
            </div>

            {/* Filters */}
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl shadow-xl border border-white/10 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Report Filters</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="bg-black/60 backdrop-blur-sm text-white border border-white/20 rounded-xl py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">End Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="bg-black/60 backdrop-blur-sm text-white border border-white/20 rounded-xl py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">Event Type</label>
                  <select
                    value={eventTypeFilter}
                    onChange={(e) => setEventTypeFilter(e.target.value)}
                    className="bg-black/60 backdrop-blur-sm text-white border border-white/20 rounded-xl py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="all">All Types</option>
                    {eventTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">Venue</label>
                  <select
                    value={venueFilter}
                    onChange={(e) => setVenueFilter(e.target.value)}
                    className="bg-black/60 backdrop-blur-sm text-white border border-white/20 rounded-xl py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="all">All Venues</option>
                    {venues.map(venue => (
                      <option key={venue} value={venue}>{venue}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-black/30 backdrop-blur-sm rounded-2xl shadow-xl border border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/90">Total Events</p>
                    <p className="text-2xl font-bold text-white">{totalEvents}</p>
                  </div>
                  <div className="bg-blue-900/60 backdrop-blur-sm p-3 rounded-full border border-blue-500/30">
                    <Calendar size={24} className="text-blue-200" />
                  </div>
                </div>
              </div>
              <div className="bg-black/30 backdrop-blur-sm rounded-2xl shadow-xl border border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/90">Total Participants</p>
                    <p className="text-2xl font-bold text-white">{totalParticipants}</p>
                  </div>
                  <div className="bg-green-900/60 backdrop-blur-sm p-3 rounded-full border border-green-500/30">
                    <Users size={24} className="text-green-200" />
                  </div>
                </div>
              </div>
              <div className="bg-black/30 backdrop-blur-sm rounded-2xl shadow-xl border border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/90">Avg Participants</p>
                    <p className="text-2xl font-bold text-white">{averageParticipants}</p>
                  </div>
                  <div className="bg-purple-900/60 backdrop-blur-sm p-3 rounded-full border border-purple-500/30">
                    <TrendingUp size={24} className="text-purple-200" />
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl shadow-xl border border-white/10 p-6">
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-black/70 text-white border border-white/20'
                      : 'bg-black/30 text-white/70 hover:bg-black/50 border border-white/10'
                  }`}
                >
                  <BarChart3 size={16} className="inline mr-2" />
                  Overview
                </button>

                <button
                  onClick={() => setActiveTab('venues')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'venues'
                      ? 'bg-black/70 text-white border border-white/20'
                      : 'bg-black/30 text-white/70 hover:bg-black/50 border border-white/10'
                  }`}
                >
                  <Building2 size={16} className="inline mr-2" />
                  Venue Analytics
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'users'
                      ? 'bg-black/70 text-white border border-white/20'
                      : 'bg-black/30 text-white/70 hover:bg-black/50 border border-white/10'
                  }`}
                >
                  <Users size={16} className="inline mr-2" />
                  User Analytics
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white">Overview Statistics</h3>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="animate-spin mx-auto mb-4" size={32} />
                      <p className="text-white/70">Loading statistics...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <p className="text-red-400">{error}</p>
                      <button
                        onClick={fetchEventStatistics}
                        className="mt-4 px-4 py-2 bg-black/70 text-white rounded-lg border border-white/20 hover:bg-black/80"
                      >
                        Retry
                      </button>
                    </div>
                  ) : eventStats ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Status Distribution */}
                      <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <h4 className="text-lg font-semibold text-white mb-3">Event Status</h4>
                        <div className="space-y-2">
                          {eventStats.status_distribution?.map((status: any) => (
                            <div key={status.status} className="flex justify-between items-center">
                              <span className="text-white/80 capitalize">{status.status}</span>
                              <span className="text-white font-semibold">{status.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Type Distribution */}
                      <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <h4 className="text-lg font-semibold text-white mb-3">Event Types</h4>
                        <div className="space-y-2">
                          {eventStats.type_distribution?.map((type: any) => (
                            <div key={type.event_type} className="flex justify-between items-center">
                              <span className="text-white/80">{type.event_type}</span>
                              <span className="text-white font-semibold">{type.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Top Events */}
                      <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <h4 className="text-lg font-semibold text-white mb-3">Top Events</h4>
                        <div className="space-y-2">
                          {eventStats.top_events?.slice(0, 5).map((event: any) => (
                            <div key={event.title} className="text-sm">
                              <div className="text-white font-medium truncate">{event.title}</div>
                              <div className="text-white/60">{event.expected_participants} participants</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {activeTab === 'events' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white">Event Reports</h3>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="animate-spin mx-auto mb-4" size={32} />
                      <p className="text-white/70">Loading event reports...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <p className="text-red-400">{error}</p>
                      <button
                        onClick={fetchEventReports}
                        className="mt-4 px-4 py-2 bg-black/70 text-white rounded-lg border border-white/20 hover:bg-black/80"
                      >
                        Retry
                      </button>
                    </div>
                  ) : eventReports?.events ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-white">
                        <thead>
                          <tr className="border-b border-white/20">
                            <th className="text-left py-3 px-4">Event</th>
                            <th className="text-left py-3 px-4">Type</th>
                            <th className="text-left py-3 px-4">Venue</th>
                            <th className="text-left py-3 px-4">Participants</th>
                            <th className="text-left py-3 px-4">Status</th>
                            <th className="text-left py-3 px-4">Organizer</th>
                          </tr>
                        </thead>
                        <tbody>
                          {eventReports.events.map((event: any) => (
                            <tr key={event.id} className="border-b border-white/10">
                              <td className="py-3 px-4">
                                <div>
                                  <div className="font-medium">{event.title}</div>
                                  <div className="text-sm text-white/60">{event.description}</div>
                                </div>
                              </td>
                              <td className="py-3 px-4">{event.event_type}</td>
                              <td className="py-3 px-4">{event.venue?.name || 'N/A'}</td>
                              <td className="py-3 px-4">{event.expected_participants}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  event.status === 'approved' ? 'bg-green-600' :
                                  event.status === 'pending' ? 'bg-yellow-600' :
                                  'bg-red-600'
                                }`}>
                                  {event.status}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div>
                                  <div className="font-medium">{event.organizer?.name}</div>
                                  <div className="text-sm text-white/60">{event.organizer?.role}</div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </div>
              )}

              {activeTab === 'venues' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white">Venue Analytics</h3>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="animate-spin mx-auto mb-4" size={32} />
                      <p className="text-white/70">Loading venue analytics...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <p className="text-red-400">{error}</p>
                      <button
                        onClick={fetchVenueAnalytics}
                        className="mt-4 px-4 py-2 bg-black/70 text-white rounded-lg border border-white/20 hover:bg-black/80"
                      >
                        Retry
                      </button>
                    </div>
                  ) : venueAnalytics ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Top Performing Venues */}
                      <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <h4 className="text-lg font-semibold text-white mb-3">Top Performing Venues</h4>
                        <div className="space-y-3">
                          {venueAnalytics.top_performing_venues?.map((venue: any, index: number) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-white/5 rounded">
                              <div>
                                <div className="text-white font-medium">{venue.name}</div>
                                <div className="text-sm text-white/60">{venue.events_held} events</div>
                              </div>
                              <div className="text-right">
                                <div className="text-white font-semibold">{venue.utilization_rate}%</div>
                                <div className="text-sm text-white/60">{venue.total_participants} participants</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Venue Usage Stats */}
                      <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <h4 className="text-lg font-semibold text-white mb-3">Overall Venue Stats</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-white/80">Total Venues:</span>
                            <span className="text-white font-semibold">{venueAnalytics.overall_stats?.total_venues}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/80">Total Capacity:</span>
                            <span className="text-white font-semibold">{venueAnalytics.overall_stats?.total_capacity}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {activeTab === 'users' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white">User Analytics</h3>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="animate-spin mx-auto mb-4" size={32} />
                      <p className="text-white/70">Loading user analytics...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <p className="text-red-400">{error}</p>
                      <button
                        onClick={fetchUserAnalytics}
                        className="mt-4 px-4 py-2 bg-black/70 text-white rounded-lg border border-white/20 hover:bg-black/80"
                      >
                        Retry
                      </button>
                    </div>
                  ) : userAnalytics ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* User Stats */}
                      <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <h4 className="text-lg font-semibold text-white mb-3">User Statistics</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-white/80">Total Users:</span>
                            <span className="text-white font-semibold">{userAnalytics.overall_stats?.total_users}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/80">Active Users:</span>
                            <span className="text-white font-semibold">{userAnalytics.overall_stats?.active_users}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/80">New Users:</span>
                            <span className="text-white font-semibold">{userAnalytics.overall_stats?.new_users}</span>
                          </div>
                        </div>
                      </div>

                      {/* Top Active Users */}
                      <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <h4 className="text-lg font-semibold text-white mb-3">Top Active Users</h4>
                        <div className="space-y-2">
                          {userAnalytics.top_active_users?.slice(0, 5).map((user: any, index: number) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-white/5 rounded">
                              <div>
                                <div className="text-white font-medium">{user.name}</div>
                                <div className="text-sm text-white/60">{user.role}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-white font-semibold">{user.events_created} events</div>
                                <div className="text-sm text-white/60">{user.total_participants} participants</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>


          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
