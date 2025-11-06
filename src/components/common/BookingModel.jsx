import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Zap, AlertCircle } from 'lucide-react';
import { bookingService } from '../../services/bookingService';

const BookingModal = ({ station, isOpen, onClose, onSuccess }) => {
  const [bookingData, setBookingData] = useState({
    stationId: '',
    startTime: '',
    duration: 60,
    vehicleInfo: {
      licensePlate: '',       // ✅ Backend requires this
      vehicleType: '',        // ✅ Backend requires this
      vehicleModel: '',       // Optional
      batteryCapacity: ''     // Must be NUMBER only (no "kWh")
    }
  });
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStartTime, setSelectedStartTime] = useState('');
  const [selectedEndTime, setSelectedEndTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Initialize - FIXED: Properly set all values
  useEffect(() => {
    if (isOpen && station) {
      const today = getTodayDate();
      setSelectedDate(today);
      setSelectedStartTime('');
      setSelectedEndTime('');
      setBookingData({
        stationId: station._id || '',
        startTime: '',
        duration: 60,
        vehicleInfo: {
          licensePlate: '',       // ✅ Initialize properly
          vehicleType: '',        // ✅ Initialize properly
          vehicleModel: '',       // ✅ Initialize properly
          batteryCapacity: ''     // ✅ Initialize properly
        }
      });
      setError('');
    }
  }, [isOpen, station]);

  // Fetch available slots when date changes
  useEffect(() => {
    if (selectedDate && station?._id) {
      fetchAvailableSlots();
    }
  }, [selectedDate, station?._id]);

  const fetchAvailableSlots = async () => {
    try {
      setLoadingSlots(true);
      const response = await bookingService.getAvailableSlots(station._id, selectedDate);
      setAvailableSlots(response.availableSlots || []);
    } catch (err) {
      console.error('Error fetching slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 60;
    
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const durationMs = end - start;
    return Math.round(durationMs / (1000 * 60)); // Convert to minutes
  };

  const handleTimeChange = (field, value) => {
    if (field === 'startTime') {
      setSelectedStartTime(value);
    } else {
      setSelectedEndTime(value);
    }

    // Update bookingData when both times are selected
    if (selectedDate && ((field === 'startTime' && selectedEndTime) || (field === 'endTime' && selectedStartTime))) {
      const startTimeValue = field === 'startTime' ? value : selectedStartTime;
      const endTimeValue = field === 'endTime' ? value : selectedEndTime;
      
      if (startTimeValue && endTimeValue) {
        const duration = calculateDuration(startTimeValue, endTimeValue);
        
        // ✅ FIXED: Convert local time to proper ISO string
        const localDateTimeString = `${selectedDate}T${startTimeValue}`;
        const utcDateTime = new Date(localDateTimeString).toISOString();
        
        setBookingData(prev => ({
          ...prev,
          startTime: utcDateTime, // ✅ Now correctly converted to UTC
          duration: duration
        }));
      }
    }
  };

  const handleVehicleInfoChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      vehicleInfo: {
        ...prev.vehicleInfo,
        [name]: value
      }
    }));
    setError('');
  };

  const handleDurationChange = (minutes) => {
    setBookingData(prev => ({
      ...prev,
      duration: minutes
    }));
    
    // Calculate end time based on selected start time and duration
    if (selectedStartTime) {
      const start = new Date(`2000-01-01T${selectedStartTime}`);
      const end = new Date(start.getTime() + minutes * 60000);
      const endTimeString = end.toTimeString().slice(0, 5);
      setSelectedEndTime(endTimeString);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation - FIXED: Check backend required fields
    if (!selectedDate || !selectedStartTime || !selectedEndTime || 
        !bookingData.vehicleInfo.licensePlate || !bookingData.vehicleInfo.vehicleType) {
      setError('Please fill in all required fields (License Plate and Vehicle Type are required)');
      return;
    }

    if (selectedStartTime >= selectedEndTime) {
      setError('End time must be after start time');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare battery capacity - convert to number or remove if empty
      const batteryCapacity = bookingData.vehicleInfo.batteryCapacity 
        ? parseFloat(bookingData.vehicleInfo.batteryCapacity) 
        : undefined;

      // ✅ FIXED: Convert local time to proper ISO string
      const localDateTimeString = `${selectedDate}T${selectedStartTime}`;
      const utcDateTime = new Date(localDateTimeString).toISOString();
      
      console.log('🕒 TIME DEBUGGING:');
      console.log('Local time selected:', localDateTimeString);
      console.log('Converted to UTC:', utcDateTime);
      console.log('Back to local for display:', new Date(utcDateTime).toString());

      // Final booking data (matches backend API EXACTLY)
      const finalBookingData = {
        stationId: station._id,
        startTime: utcDateTime, // ✅ Now correctly converted to UTC
        duration: bookingData.duration,
        vehicleInfo: {
          licensePlate: bookingData.vehicleInfo.licensePlate, // ✅ Required by backend
          vehicleType: bookingData.vehicleInfo.vehicleType,   // ✅ Required by backend
          vehicleModel: bookingData.vehicleInfo.vehicleModel || '', // Optional
          batteryCapacity: batteryCapacity // Must be number, not string
        }
      };

      console.log('📦 Sending booking data to backend:', finalBookingData);

      const response = await bookingService.createBooking(finalBookingData);

      if (response.success) {
        onSuccess();
        onClose();
        // Reset form
        setSelectedDate(getTodayDate());
        setSelectedStartTime('');
        setSelectedEndTime('');
        setBookingData({
          stationId: station._id,
          startTime: '',
          duration: 60,
          vehicleInfo: {
            licensePlate: '',
            vehicleType: '',
            vehicleModel: '',
            batteryCapacity: ''
          }
        });
      } else {
        setError(response.message || 'Failed to create booking');
      }
    } catch (err) {
      console.error('Full error details:', err);
      setError(err.response?.data?.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Book Charging Slot</h2>
            <p className="text-sm text-gray-600 mt-1">{station?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-2" />
              Select Date *
            </label>
            <input
              type="date"
              value={selectedDate || ''}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={getTodayDate()}
              required
              className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 inline mr-2" />
                Start Time *
              </label>
              <input
                type="time"
                value={selectedStartTime || ''}
                onChange={(e) => handleTimeChange('startTime', e.target.value)}
                required
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 inline mr-2" />
                End Time *
              </label>
              <input
                type="time"
                value={selectedEndTime || ''}
                onChange={(e) => handleTimeChange('endTime', e.target.value)}
                required
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Duration Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration
            </label>
            <div className="flex gap-2">
              {[30, 60, 90, 120].map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => handleDurationChange(minutes)}
                  className={`flex-1 px-3 py-2 text-sm border rounded-lg transition-colors ${
                    bookingData.duration === minutes
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {minutes} min
                </button>
              ))}
            </div>
          </div>

          {/* Available Slots Info */}
          {loadingSlots ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">Loading available slots...</p>
            </div>
          ) : availableSlots.length > 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm font-medium mb-2">Available Time Slots:</p>
              <div className="flex flex-wrap gap-2">
                {availableSlots.map((slot, idx) => (
                  <span key={idx} className="bg-white text-green-700 px-3 py-1 rounded-md text-sm border border-green-300">
                    {slot}
                  </span>
                ))}
              </div>
            </div>
          ) : selectedDate ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-600 text-sm">No slots information available</p>
            </div>
          ) : null}

          {/* Vehicle Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Vehicle Information</h3>
            
            {/* License Plate (Required by Backend) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                License Plate Number *
              </label>
              <input
                type="text"
                name="licensePlate"
                value={bookingData.vehicleInfo.licensePlate || ''}
                onChange={handleVehicleInfoChange}
                placeholder="e.g., DL01AB1234"
                required
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Vehicle Type (Required by Backend) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Type *
              </label>
              <select
                name="vehicleType"
                value={bookingData.vehicleInfo.vehicleType || ''}
                onChange={handleVehicleInfoChange}
                required
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select vehicle type</option>
                <option value="Electric Car">Electric Car</option>
                <option value="Electric Bike">Electric Bike</option>
                <option value="Electric Scooter">Electric Scooter</option>
                <option value="Electric Auto">Electric Auto</option>
              </select>
            </div>

            {/* Vehicle Model (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Model (Optional)
              </label>
              <input
                type="text"
                name="vehicleModel"
                value={bookingData.vehicleInfo.vehicleModel || ''}
                onChange={handleVehicleInfoChange}
                placeholder="e.g., Tesla Model 3, Ola Electric"
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Battery Capacity (Numbers only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Battery Capacity (kWh) - Numbers only
              </label>
              <input
                type="number"
                name="batteryCapacity"
                value={bookingData.vehicleInfo.batteryCapacity || ''}
                onChange={handleVehicleInfoChange}
                placeholder="e.g., 30.2"
                step="0.1"
                min="0"
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Enter only numbers (e.g., 30.2 not 30.2kWh)</p>
            </div>
          </div>

          {/* Pricing Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Estimated Cost</p>
            <p className="text-2xl font-bold text-gray-900">
              ₹{station?.pricePerUnit || '16'} <span className="text-sm font-normal text-gray-600">per kWh</span>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Final cost will be calculated based on actual energy consumed
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;