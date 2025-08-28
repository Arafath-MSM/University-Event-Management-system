import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import DashboardNavbar from '../../components/DashboardNavbar';
import { 
  Search, 
  Plus, 
  Calendar, 
  User, 
  FileText, 
  Bell,
  MapPin,
  Clock,
  Users
} from 'lucide-react';
import '../../App.css'; // Ensure global styles are available

interface Booking {
  id: string;
  event_title: string;
  venue_name: string;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  participants: number;
  description: string;
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
  type: 'booking_request' | 'booking_approved' | 'booking_rejected' | 'letter_sent' | 'letter_received' | 'service_provider_notified' | 'final_approval' | 'system';
  status: 'unread' | 'read';
  related_booking_id?: number;
  related_venue_id?: number;
  booking_title?: string;
  venue_name?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

function UserDashboard() {
  const { user } = useAuth();
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [allVenues, setAllVenues] = useState<Venue[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch user's data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Fetch user's bookings from backend
      const bookingsResponse = await apiService.getBookings({
        user_id: parseInt(user?.id || '0'),
        status: undefined // Get all bookings
      });
      
      // Fetch all venues
      const venuesResponse = await apiService.getVenues();
      
      // Fetch user's notifications
      const notificationsResponse = await apiService.getNotifications({
        limit: 5 // Get latest 5 notifications
      });
      
      if (bookingsResponse.success) {
        const bookings = bookingsResponse.data || [];
        setAllBookings(bookings);
        // Get the 3 most recent bookings
        const recent = bookings.slice(0, 3);
        setRecentBookings(recent);
      }
      
      if (venuesResponse.success) {
        setAllVenues(venuesResponse.data || []);
      }
      
      if (notificationsResponse.success) {
        setNotifications(notificationsResponse.data || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const calculateStats = () => {
    // Count total bookings
    const totalBookings = allBookings.length;
    
    // Count pending approvals
    const pendingApprovals = allBookings.filter(booking => booking.status === 'pending').length;
    
    // Count upcoming events (bookings with dates in the future)
    const today = new Date().toISOString().split('T')[0];
    const upcomingEvents = allBookings.filter(booking => {
      // Convert booking date string to Date object format for comparison
      const bookingDate = booking.date;
      
      // Compare dates
      return bookingDate >= today && booking.status !== 'cancelled';
    }).length;
    
    // Count available venues
    const availableVenues = allVenues.filter(venue => venue.availability === 'Available').length;
    
    return {
      totalBookings,
      pendingApprovals,
      upcomingEvents,
      availableVenues
    };
  };

  const quickActions = [
    {
      title: 'Search Venues',
      description: 'Find the perfect venue for your event',
      icon: Search,
      link: '/venues',
      color: 'bg-blue-500'
    },
    {
      title: 'New Booking',
      description: 'Book a venue for your upcoming event',
      icon: Plus,
      link: '/booking',
      color: 'bg-green-500'
    },
    {
      title: 'Submit Event Plan',
      description: 'Submit your event planning proposal',
      icon: FileText,
      link: '/event-planning',
      color: 'bg-purple-500'
    }
  ];



  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-600';
      case 'under review':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark notification as read if it's unread
      if (notification.status === 'unread') {
        await apiService.markNotificationAsRead(notification.id);
        
        // Update the notification status locally
        setNotifications(prevNotifications =>
          prevNotifications.map(n =>
            n.id === notification.id ? { ...n, status: 'read' as const } : n
          )
        );
      }
      
      // Handle different notification types
      switch (notification.type) {
        case 'booking_approved':
        case 'final_approval':
          // Could navigate to booking details or show success message
          console.log('Booking approved notification clicked');
          break;
        case 'booking_rejected':
          // Could navigate to booking details or show rejection details
          console.log('Booking rejected notification clicked');
          break;
        case 'booking_request':
          // Could navigate to booking details
          console.log('Booking request notification clicked');
          break;
        default:
          console.log('Notification clicked:', notification.type);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center w-full" style={{ backgroundImage: "url('/Party.jpg')" }}>
      <DashboardNavbar />

      {/* Dashboard Background - solid Rose color */}
      <div className="relative min-h-screen w-full overflow-x-hidden" style={{ backgroundColor: '#bd7880' }}>
        <div className="flex justify-center">
          <div className="relative z-10 space-y-8 animate-fade-in pt-8 pb-8 w-full max-w-6xl px-2 md:px-6 lg:px-8">
            <div className="bg-black bg-opacity-30 rounded-2xl p-4 w-full mx-0">
              <div className="w-full">
                {/* Welcome Section */}
                <div className="bg-transparent text-white py-12 px-4 shadow-none">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-extrabold mb-2">
                        Welcome, {user?.name}!
                      </h1>
                      <p className="text-white text-lg font-semibold">
                        Ready to organize your next amazing event?
                      </p>
                    </div>
                    <div className="hidden md:block">
                      <div className="bg-black bg-opacity-60 rounded-lg p-4 flex items-center justify-center">
                        <Calendar size={48} className="text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Each stat card is now transparent, no white box */}
                  <div className="bg-black bg-opacity-40 rounded-xl shadow-none p-6 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Total Bookings</p>
                        <p className="text-2xl font-bold text-white">{calculateStats().totalBookings}</p>
                      </div>
                      <div className="bg-blue-900 bg-opacity-60 p-3 rounded-full">
                        <Calendar size={20} className="text-blue-200" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-black bg-opacity-40 rounded-xl shadow-none p-6 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Pending Approvals</p>
                        <p className="text-2xl font-bold text-white">{calculateStats().pendingApprovals}</p>
                      </div>
                      <div className="bg-yellow-900 bg-opacity-60 p-3 rounded-full">
                        <Clock size={20} className="text-yellow-200" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-black bg-opacity-40 rounded-xl shadow-none p-6 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Upcoming Events</p>
                        <p className="text-2xl font-bold text-white">{calculateStats().upcomingEvents}</p>
                      </div>
                      <div className="bg-green-900 bg-opacity-60 p-3 rounded-full">
                        <Users size={20} className="text-green-200" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-black bg-opacity-40 rounded-xl shadow-none p-6 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Available Venues</p>
                        <p className="text-2xl font-bold text-white">{calculateStats().availableVenues}</p>
                      </div>
                      <div className="bg-purple-900 bg-opacity-60 p-3 rounded-full">
                        <MapPin size={20} className="text-purple-200" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6 drop-shadow">Quick Actions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {quickActions.map((action, index) => (
                      <Link
                        key={index}
                        to={action.link}
                        className="group bg-black bg-opacity-40 rounded-xl shadow-none p-6 hover:scale-105 transition-transform duration-200"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`${action.color} p-3 rounded-lg text-white group-hover:scale-110 transition-transform duration-200 shadow-md bg-opacity-80`}>
                            <action.icon size={24} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white group-hover:text-blue-200 transition-colors">
                              {action.title}
                            </h3>
                            <p className="text-sm text-white mt-1">
                              {action.description}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Recent Bookings */}
                  <div className="bg-black bg-opacity-40 rounded-xl shadow-none p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-white">Recent Bookings</h2>
                      <Link
                        to="/booking"
                        className="text-white hover:text-gray-200 text-sm font-medium"
                      >
                        View All
                      </Link>
                    </div>
                    <div className="space-y-4">
                      {isLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                          <p className="text-white text-sm">Loading bookings...</p>
                        </div>
                      ) : error ? (
                        <div className="text-center py-8">
                          <p className="text-red-200 text-sm">{error}</p>
                        </div>
                      ) : recentBookings.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-white/70 text-sm">No recent bookings found</p>
                        </div>
                      ) : (
                        recentBookings.map((booking) => (
                          <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-black hover:bg-opacity-60 transition-colors bg-transparent">
                            <div className="flex-1">
                              <h3 className="font-semibold text-white">{booking.event_title}</h3>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-white">
                                <div className="flex items-center">
                                  <MapPin size={14} className="mr-1" />
                                  {booking.venue_name}
                                </div>
                                <div className="flex items-center">
                                  <Calendar size={14} className="mr-1" />
                                  {booking.date}
                                </div>
                                <div className="flex items-center">
                                  <Users size={14} className="mr-1" />
                                  {booking.participants}
                                </div>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Notifications */}
                  <div id="notifications" className="bg-black bg-opacity-40 rounded-xl shadow-none p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-white">Notifications</h2>
                      <Bell size={20} className="text-gray-200" />
                    </div>
                    <div className="space-y-4">
                      {notifications.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-white/70 text-sm">No notifications found</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div 
                            key={notification.id} 
                            className={`p-4 border rounded-lg bg-transparent cursor-pointer hover:bg-black hover:bg-opacity-60 transition-colors ${
                              notification.status === 'unread' ? 'border-blue-400' : 'border-gray-200'
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-white mb-1">{notification.title}</h3>
                                <p className="text-sm text-white mb-2">{notification.message}</p>
                                <p className="text-xs text-gray-200">
                                  {new Date(notification.created_at).toLocaleDateString()} at {new Date(notification.created_at).toLocaleTimeString()}
                                </p>
                              </div>
                              {notification.status === 'unread' && (
                                <div className="w-2 h-2 bg-blue-400 rounded-full ml-2"></div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
