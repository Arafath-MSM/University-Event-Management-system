
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Calendar, Clock, MapPin, Users, Search, Plus, X } from 'lucide-react';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Booking {
  id: string;
  event_title: string;
  venue_name: string;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  participants: number;
  description: string;
  facilities?: string[];
}

interface Venue {
  id: number;
  name: string;
  capacity: number;
  location: string;
  type: string;
  availability: 'Available' | 'Booked' | 'Maintenance';
}

const BookingSystem: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [minCapacity, setMinCapacity] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [bookingForm, setBookingForm] = useState({
    venue_id: '',
    event_title: '',
    description: '',
    date: '',
    time: '',
    participants: '',
    facilities: [] as string[]
  });

  // Real bookings data from API
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Dummy venues for booking (keeping the 4 original venues)
  const availableVenues = [
    { id: '1', name: 'E BlockMain Auditorium', capacity: 500, available: true },
    { id: '2', name: 'Technology Lecture Theater', capacity: 250, available: false },
    { id: '3', name: 'Open Ground', capacity: 1000, available: true },
    { id: '4', name: 'Namunukula Open Air Theater', capacity: 700, available: true }
  ];

  const availableFacilities = [
    'Projector', 'Microphone', 'Speaker System', 'Wi-Fi', 'Air Conditioning',
    'Whiteboard', 'Flip Chart', 'Stage Setup', 'Lighting System', 'Recording Equipment'
  ];

  const timeSlots = [
    '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM', '12:00 AM'
  ];

  // Fetch user's bookings on component mount
  useEffect(() => {
    fetchUserBookings();
  }, []);

  const fetchUserBookings = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Fetch user's bookings from backend
      const bookingsResponse = await apiService.getBookings({
        user_id: parseInt(user?.id || '0'),
        status: undefined // Get all bookings
      });
      
      if (bookingsResponse.success) {
        setBookings(bookingsResponse.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchVenues = () => {
    // Filter logic would go here
    console.log('Searching venues with:', { selectedDate, selectedTime, minCapacity });
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const bookingData = {
        venue_id: parseInt(bookingForm.venue_id),
        event_title: bookingForm.event_title,
        description: bookingForm.description,
        date: bookingForm.date,
        time: bookingForm.time,
        participants: parseInt(bookingForm.participants),
        facilities: bookingForm.facilities
      };

      console.log('Submitting booking data:', bookingData);
      const response = await apiService.createBooking(bookingData);
      console.log('Booking response:', response);
      
      if (response.success) {
        // Show success message
        setError(''); // Clear any previous errors
        setSuccess('Booking created successfully!');
        
        // Refresh bookings list
        await fetchUserBookings();
        setShowBookingForm(false);
        setBookingForm({
          venue_id: '',
          event_title: '',
          description: '',
          date: '',
          time: '',
          participants: '',
          facilities: []
        });
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'Failed to create booking');
      }
    } catch (error: any) {
      console.error('Error creating booking:', error);
      setError('Failed to create booking. Please try again.');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        const response = await apiService.cancelBooking(parseInt(bookingId));
        
        if (response.success) {
          setSuccess('Booking cancelled successfully!');
          // Refresh bookings list to show updated status
          await fetchUserBookings();
          // Clear success message after 3 seconds
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError(response.message || 'Failed to cancel booking');
        }
      } catch (error: any) {
        console.error('Error canceling booking:', error);
        setError('Failed to cancel booking. Please try again.');
      }
    }
  };

  const handleFacilityToggle = (facility: string) => {
    const updatedFacilities = bookingForm.facilities.includes(facility)
      ? bookingForm.facilities.filter(f => f !== facility)
      : [...bookingForm.facilities, facility];
    
    setBookingForm({ ...bookingForm, facilities: updatedFacilities });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen w-full flex items-center justify-center" style={{ backgroundColor: '#bd7880' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen w-full flex flex-col items-stretch" style={{ backgroundColor: '#bd7880' }}>
        <div className="w-full max-w-5xl mx-auto px-4 md:px-8">
          {/* Header */}
          <div className="flex flex-col items-center text-center w-full mb-6">
            <h1 className="text-3xl font-bold text-white">Booking System</h1>
            <p className="text-white mt-2">Search and book venues for your events</p>
            <button
              onClick={() => setShowBookingForm(true)}
              className="mt-4 bg-gray-800/80 hover:bg-gray-900 text-white flex items-center px-6 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus size={20} className="mr-2" />
              New Booking
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/50 border border-red-500/30 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-100">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-900/50 border border-green-500/30 rounded-xl p-4 mb-6">
              <p className="text-sm text-green-100">{success}</p>
            </div>
          )}

          {/* Available Venues */}
          <div className="bg-black bg-opacity-60 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Available Venues</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableVenues.map((venue) => (
                <div
                  key={venue.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 bg-gray-800/70 text-white ${
                    venue.available 
                      ? 'border-green-400' 
                      : 'border-red-400 opacity-50'
                  }`}
                  onClick={() => venue.available && setSelectedVenue(venue.name)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">{venue.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      venue.available ? 'bg-green-700 text-white' : 'bg-red-700 text-white'
                    }`} style={{ color: '#fff' }}>
                      {venue.available ? 'Available' : 'Booked'}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-white">
                    <Users size={16} className="mr-2 text-white" />
                    Capacity: {venue.capacity}
                  </div>
                  {venue.available && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setBookingForm({ ...bookingForm, venue_id: venue.id });
                        setShowBookingForm(true);
                      }}
                      className="mt-3 w-full bg-gray-700/80 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Book Now
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Booking History */}
          <div className="bg-black bg-opacity-60 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">My Bookings</h2>
            {bookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-white/70">No bookings found. Create your first booking!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-white">Event Title</th>
                      <th className="text-left py-3 px-4 font-medium text-white">Venue</th>
                      <th className="text-left py-3 px-4 font-medium text-white">Date & Time</th>
                      <th className="text-left py-3 px-4 font-medium text-white">Participants</th>
                      <th className="text-left py-3 px-4 font-medium text-white">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="border-b border-gray-100 bg-gray-800/70 hover:bg-gray-700">
                        <td className="py-4 px-4 text-white">
                          <div>
                            <div className="font-medium text-white">{booking.event_title}</div>
                            <div className="text-sm text-gray-200">{booking.description}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-white">
                          <div className="flex items-center">
                            <MapPin size={16} className="mr-2 text-white" />
                            {booking.venue_name}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-white">
                          <div className="flex items-center">
                            <Calendar size={16} className="mr-2 text-white" />
                            <div>
                              <div>{booking.date}</div>
                              <div className="text-sm text-gray-200">{booking.time}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-white">
                          <div className="flex items-center">
                            <Users size={16} className="mr-2 text-white" />
                            {booking.participants}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-white">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-white">
                          {booking.status === 'pending' && (
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                          {booking.status === 'cancelled' && (
                            <span className="text-gray-400 text-sm">Cancelled</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Booking Form Modal */}
          {showBookingForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-black bg-opacity-80 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto text-white">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">New Booking</h2>
                    <button
                      onClick={() => setShowBookingForm(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleBookingSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Venue
                        </label>
                        <select
                          value={bookingForm.venue_id}
                          onChange={(e) => setBookingForm({...bookingForm, venue_id: e.target.value})}
                          className="bg-gray-800/70 text-white border border-gray-600 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-300"
                          required
                        >
                          <option value="">Select venue</option>
                          {availableVenues.filter(v => v.available).map(venue => (
                            <option key={venue.id} value={venue.id}>{venue.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Event Title
                        </label>
                        <input
                          type="text"
                          value={bookingForm.event_title}
                          onChange={(e) => setBookingForm({...bookingForm, event_title: e.target.value})}
                          className="bg-gray-800/70 text-white border border-gray-600 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-300"
                          placeholder="Enter event title"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Event Description
                      </label>
                      <textarea
                        value={bookingForm.description}
                        onChange={(e) => setBookingForm({...bookingForm, description: e.target.value})}
                        className="bg-gray-800/70 text-white border border-gray-600 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-300"
                        rows={3}
                        placeholder="Describe your event"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Date
                        </label>
                        <input
                          type="date"
                          value={bookingForm.date}
                          onChange={(e) => setBookingForm({...bookingForm, date: e.target.value})}
                          className="bg-gray-800/70 text-white border border-gray-600 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-300"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Time
                        </label>
                        <div className="relative">
                          <input
                            type="time"
                            value={bookingForm.time}
                            onChange={(e) => setBookingForm({...bookingForm, time: e.target.value})}
                            className="bg-gray-800/70 text-white border border-gray-600 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-300 pr-10"
                            required
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <Clock size={18} className="text-white" />
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Expected Participants
                        </label>
                        <input
                          type="number"
                          value={bookingForm.participants}
                          onChange={(e) => setBookingForm({...bookingForm, participants: e.target.value})}
                          className="bg-gray-800/70 text-white border border-gray-600 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-300"
                          placeholder="Number of participants"
                          min="1"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => setShowBookingForm(false)}
                        className="bg-gray-800/70 hover:bg-gray-900 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-gray-800/90 hover:bg-gray-900 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                      >
                        Submit Booking
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default BookingSystem;
