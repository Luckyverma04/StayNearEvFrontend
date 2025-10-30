import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, User, Zap, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const HostBookingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, completed

  useEffect(() => {
    if (user && (user.role === 'host' || user.role === 'admin')) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getStationBookings();
      console.log('📦 Host Bookings API Response:', response); // Debug log
      
      // ✅ FIXED: Handle different response structures
      const bookingsData = response.data || response.bookings || response || [];
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
    } catch (err) {
      console.error('Error fetching host bookings:', err);
      setError(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    const confirmMessage = {
      confirmed: 'Are you sure you want to confirm this booking?',
      rejected: 'Are you sure you want to reject this booking?',
      completed: 'Mark this booking as completed?'
    };

    if (!window.confirm(confirmMessage[newStatus])) return;

    try {
      setUpdatingId(bookingId);
      await bookingService.updateBookingStatus(bookingId, newStatus);
      await fetchBookings();
      alert(`Booking ${newStatus} successfully`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update booking');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertCircle },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <Icon className="h-4 w-4" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // ✅ FIXED: Handle different date formats from backend
  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    
    try {
      // Handle both "2024-01-30" format and ISO format
      const date = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00`);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // ✅ FIXED: Extract time from startTime field
  const extractTime = (dateTimeString) => {
    if (!dateTimeString) return 'Time not available';
    
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'Invalid time';
    }
  };

  // ✅ FIXED: Calculate end time based on startTime and duration
  const calculateEndTime = (startTime, duration) => {
    if (!startTime || !duration) return 'Time not available';
    
    try {
      const start = new Date(startTime);
      const end = new Date(start.getTime() + duration * 60000); // duration in minutes
      return end.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'Invalid time';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  const getBookingStats = () => {
    return {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      completed: bookings.filter(b => b.status === 'completed').length,
    };
  };

  if (!user || (user.role !== 'host' && user.role !== 'admin')) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-4">Only hosts and admins can view this page</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (loading) return <LoadingSpinner message="Loading bookings..." />;

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchBookings}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = getBookingStats();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Station Bookings</h1>
        <button
          onClick={fetchBookings}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <p className="text-gray-600 text-sm mb-1">Total Bookings</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl shadow-sm p-6 border border-yellow-200">
          <p className="text-yellow-700 text-sm mb-1">Pending</p>
          <p className="text-3xl font-bold text-yellow-800">{stats.pending}</p>
        </div>
        <div className="bg-blue-50 rounded-xl shadow-sm p-6 border border-blue-200">
          <p className="text-blue-700 text-sm mb-1">Confirmed</p>
          <p className="text-3xl font-bold text-blue-800">{stats.confirmed}</p>
        </div>
        <div className="bg-green-50 rounded-xl shadow-sm p-6 border border-green-200">
          <p className="text-green-700 text-sm mb-1">Completed</p>
          <p className="text-3xl font-bold text-green-800">{stats.completed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'confirmed', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Zap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            {filter === 'all' ? 'No bookings yet' : `No ${filter} bookings`}
          </h2>
          <p className="text-gray-500">Bookings will appear here when customers book your stations</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div key={booking._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {booking.station?.name || 'Station'}
                    </h3>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="text-sm">{booking.station?.location || 'Location not available'}</span>
                    </div>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-5 w-5 text-gray-600" />
                    <p className="font-semibold text-gray-900">
                      {booking.user?.name || booking.user?.email || 'Customer'}
                    </p>
                  </div>
                  {booking.user?.email && (
                    <p className="text-sm text-gray-600 ml-7">{booking.user.email}</p>
                  )}
                </div>

                {/* ✅ FIXED: Booking Details - Updated to match backend fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-600">Date</p>
                      <p className="font-semibold text-gray-900">
                        {formatDate(booking.startTime || booking.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-600">Time</p>
                      <p className="font-semibold text-gray-900">
                        {extractTime(booking.startTime)} - {calculateEndTime(booking.startTime, booking.duration)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-600">Duration</p>
                      <p className="font-semibold text-gray-900">{booking.duration} minutes</p>
                    </div>
                  </div>
                </div>

                {/* ✅ FIXED: Vehicle Information */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Vehicle Information:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    {booking.vehicleInfo?.licensePlate && (
                      <p><span className="font-medium">License Plate:</span> {booking.vehicleInfo.licensePlate}</p>
                    )}
                    {booking.vehicleInfo?.vehicleType && (
                      <p><span className="font-medium">Vehicle Type:</span> {booking.vehicleInfo.vehicleType}</p>
                    )}
                    {booking.vehicleInfo?.vehicleModel && (
                      <p><span className="font-medium">Model:</span> {booking.vehicleInfo.vehicleModel}</p>
                    )}
                    {booking.vehicleInfo?.batteryCapacity && (
                      <p><span className="font-medium">Battery:</span> {booking.vehicleInfo.batteryCapacity}kWh</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  {booking.station?._id && (
                    <button
                      onClick={() => navigate(`/stations/${booking.station._id}`)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      View Station
                    </button>
                  )}

                  {booking.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(booking._id, 'confirmed')}
                        disabled={updatingId === booking._id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:bg-gray-400 flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Confirm
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(booking._id, 'rejected')}
                        disabled={updatingId === booking._id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:bg-gray-400 flex items-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </>
                  )}

                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => handleUpdateStatus(booking._id, 'completed')}
                      disabled={updatingId === booking._id}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:bg-gray-400"
                    >
                      Mark as Completed
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HostBookingsPage;