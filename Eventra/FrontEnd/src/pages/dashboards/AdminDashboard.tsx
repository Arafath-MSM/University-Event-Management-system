
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import NotificationPopup from '../../components/NotificationPopup';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import { 
  Users, 
  MapPin, 
  CheckCircle, 
  FileText, 
  BarChart3, 
  Shield,
  Calendar,
  Clock,
  AlertTriangle,
  TrendingUp,
  Bell
} from 'lucide-react';

interface Booking {
  id: string;
  event_title: string;
  venue_name: string;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  participants: number;
  description: string;
  user_name?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

interface Venue {
  id: number;
  name: string;
  capacity: number;
  location: string;
  type: string;
  availability: 'Available' | 'Booked' | 'Maintenance';
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  status: 'unread' | 'read';
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingBookings: 0,
    eventRequests: 0,
    activeVenues: 0,
    totalUsers: 0
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [isNotificationPopupOpen, setIsNotificationPopupOpen] = useState(false);

  // Fetch admin dashboard data
  useEffect(() => {
    fetchAdminData();
  }, []);

  // Refresh notification count when popup is opened
  useEffect(() => {
    if (isNotificationPopupOpen) {
      // This will trigger a refresh of notifications
      fetchAdminData();
    }
  }, [isNotificationPopupOpen]);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // Fetch all pending bookings
      const pendingBookingsResponse = await apiService.getBookings({
        status: 'pending'
      });

      // Fetch all users
      const usersResponse = await apiService.getUsers();

      // Fetch all venues
      const venuesResponse = await apiService.getVenues();

      // Fetch recent notifications
      const notificationsResponse = await apiService.getNotifications({
        limit: 10
      });

      // Calculate stats
      const pendingBookings = pendingBookingsResponse.success ? (pendingBookingsResponse.data || []).length : 0;
      const totalUsers = usersResponse.success ? (usersResponse.data || []).length : 0;
      const activeVenues = venuesResponse.success ? (venuesResponse.data || []).filter((venue: Venue) => venue.availability === 'Available').length : 0;

      setStats({
        pendingBookings,
        eventRequests: pendingBookings, // For now, treating all pending bookings as event requests
        activeVenues,
        totalUsers
      });

      // Set recent data
      if (pendingBookingsResponse.success) {
        setRecentBookings(pendingBookingsResponse.data?.slice(0, 5) || []);
      }

      if (usersResponse.success) {
        setRecentUsers(usersResponse.data?.slice(0, 5) || []);
      }

      if (notificationsResponse.success) {
        setRecentNotifications(notificationsResponse.data?.slice(0, 5) || []);
      }

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const overviewCards = [
    {
      title: 'Pending Bookings',
      value: stats.pendingBookings.toString(),
      change: '+2 from yesterday',
      icon: Clock,
      color: 'bg-yellow-500',
      link: '/admin/tools?tab=approvals'
    },
    {
      title: 'Event Requests',
      value: stats.eventRequests.toString(),
      change: '+5 from last week',
      icon: FileText,
      color: 'bg-blue-500',
      link: '/admin/tools?tab=approvals'
    },
    {
      title: 'Active Venues',
      value: stats.activeVenues.toString(),
      change: '2 new this month',
      icon: MapPin,
      color: 'bg-green-500',
      link: '/venues'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers.toString(),
      change: '+23 this week',
      icon: Users,
      color: 'bg-purple-500',
      link: '/admin/tools'
    }
  ];

  const adminActions = [
    {
      title: 'Manage Users',
      icon: Users,
      link: '/admin/tools',
      color: 'bg-blue-500'
    },
    {
      title: 'Manage Venues',
      icon: MapPin,
      link: '/venues',
      color: 'bg-green-500'
    },
    {
      title: 'Booking Approvals',
      icon: CheckCircle,
      link: '/admin/tools?tab=approvals',
      color: 'bg-yellow-500'
    },
    {
      title: 'Event Planning Approvals',
      icon: FileText,
      link: '/admin/tools?tab=approvals',
      color: 'bg-purple-500'
    },
    {
      title: 'Reports & Analytics',
      icon: BarChart3,
      link: '/admin/reports',
      color: 'bg-indigo-500'
    },
    {
      title: 'System Logs',
      icon: Shield,
      link: '/admin/tools?tab=logs',
      color: 'bg-red-500'
    }
  ];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'approval':
        return CheckCircle;
      case 'registration':
        return Users;
      case 'update':
        return MapPin;
      case 'submission':
        return FileText;
      default:
        return Clock;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  // Custom notification bell component for admin dashboard
  const AdminNotificationBell = () => {
    const [notificationCount, setNotificationCount] = useState(0);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

    useEffect(() => {
      fetchNotificationCount();
    }, []);

    const fetchNotificationCount = async () => {
      setIsLoadingNotifications(true);
      try {
        const response = await apiService.getNotifications({
          status: 'unread'
        });
        
        if (response.success) {
          const count = response.data?.length || 0;
          console.log('Setting notification count:', count);
          setNotificationCount(count);
        }
      } catch (error) {
        console.error('Error fetching notification count:', error);
      } finally {
        setIsLoadingNotifications(false);
      }
    };

    return (
      <div className="relative">
        <button 
          onClick={() => setIsNotificationPopupOpen(true)}
          className="p-2 text-white hover:text-blue-200 hover:bg-black rounded-lg relative"
        >
          <Bell size={20} />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold shadow-lg z-10">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
          {isLoadingNotifications && (
            <div className="absolute -top-1 -right-1 w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          )}
        </button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Layout showSidebar={true} notificationBell={<AdminNotificationBell />}>
        <div className="min-h-full flex items-center justify-center" style={{ backgroundColor: '#bd7880' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Loading admin dashboard...</p>
          </div>
        </div>
        <NotificationPopup 
          isOpen={isNotificationPopupOpen} 
          onClose={() => setIsNotificationPopupOpen(false)} 
        />
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true} notificationBell={<AdminNotificationBell />}>
      <div className="min-h-full" style={{ backgroundColor: '#bd7880' }}>
        {/* Removed background image and overlay for solid color */}
        <div className="max-w-7xl mx-auto py-8">
          <div className="space-y-8 animate-fade-in">
            {/* Welcome Section */}
            <div className="bg-black/30 backdrop-blur-sm text-white rounded-2xl py-12 px-8 shadow-xl border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-extrabold mb-2">
                    Welcome, {user?.name}!
                  </h1>
                  <p className="text-white/90 text-lg font-semibold">
                    Manage the entire event management system from here
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="bg-black/60 backdrop-blur-sm rounded-xl p-4 flex items-center justify-center border border-white/10">
                    <Shield size={48} className="text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {overviewCards.map((card, index) => (
                <div
                  key={index}
                  className="bg-black/30 backdrop-blur-sm rounded-2xl shadow-xl border border-white/10 p-6 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${card.color} bg-opacity-80 p-3 rounded-xl text-white transition-transform duration-200 shadow-lg`}>
                      <card.icon size={24} />
                    </div>
                    <TrendingUp size={16} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/90">{card.title}</p>
                    <p className="text-2xl font-bold text-white mb-1">{card.value}</p>
                    <p className="text-xs text-white/70">{card.change}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Admin Actions */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Admin Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminActions.map((action, index) => (
                  <Link
                    key={index}
                    to={action.link}
                    className="bg-black/30 backdrop-blur-sm rounded-2xl shadow-xl border border-white/10 p-6 hover:scale-105 transition-all duration-200 group hover:bg-black/40"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`${action.color} bg-opacity-80 p-3 rounded-xl text-white group-hover:scale-110 transition-transform duration-200 shadow-lg`}>
                        <action.icon size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white group-hover:text-blue-200 transition-colors">
                          {action.title}
                        </h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pending Approvals */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Pending Approvals</h2>
                <div className="bg-black/30 backdrop-blur-sm rounded-2xl shadow-xl border border-white/10 p-6">
                  {recentBookings.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-white/70">No pending approvals</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-white/10">
                      {recentBookings.map(booking => (
                        <li key={booking.id} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div className="flex-1">
                            <div className="font-semibold text-white">{booking.event_title}</div>
                            <div className="text-sm text-white/80">Booking Request &ndash; {booking.venue_name}</div>
                            <div className="text-xs text-white/60">{booking.date} at {booking.time}</div>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-bold ml-2 bg-yellow-900/60 text-yellow-200 border border-yellow-500/30">
                            PENDING
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Recent Activities */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Recent Activities</h2>
                <div className="bg-black/30 backdrop-blur-sm rounded-2xl shadow-xl border border-white/10 p-6">
                  {recentNotifications.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-white/70">No recent activities</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-white/10">
                      {recentNotifications.map(notification => {
                        const Icon = getActivityIcon(notification.type);
                        return (
                          <li key={notification.id} className="py-4 flex items-center gap-4">
                            <div className="bg-blue-900/60 backdrop-blur-sm p-3 rounded-full text-white flex items-center justify-center border border-blue-500/30 shadow-lg">
                              <Icon size={20} />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-white">{notification.title}</div>
                              <div className="text-sm text-white/80">{notification.message}</div>
                            </div>
                            <div className="text-xs text-white/60">{formatTimeAgo(notification.created_at)}</div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <NotificationPopup 
        isOpen={isNotificationPopupOpen} 
        onClose={() => setIsNotificationPopupOpen(false)} 
      />
    </Layout>
  );
};

export default AdminDashboard;