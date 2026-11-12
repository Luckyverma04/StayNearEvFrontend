import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, Clock, Zap, AlertCircle, CheckCircle2, Car, Mail } from 'lucide-react';
import { bookingService } from '../../services/bookingService';

const BookingModal = ({ station, isOpen, onClose: closeModal, onSuccess }) => {
  const navigate = useNavigate();
  // Booking ho jaane par "confirmed" screen dikhane ke liye
  const [confirmed, setConfirmed] = useState(null);
  const onClose = () => {
    // Booking hui thi to ab parent ko batao (station refresh wagairah) —
    // pehle batate to page reload me ye success screen gayab ho jaati
    if (confirmed) onSuccess?.();
    setConfirmed(null);
    closeModal();
  };
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
      

      // Final booking data (matches backend API EXACTLY)
      const finalBookingData = {
        stationId: station._id,
        startTime: utcDateTime, // ✅ Now correctly converted to UTC
        duration: bookingData.duration,
        vehicleInfo: {
          licensePlate: bookingData.vehicleInfo.licensePlate, // ✅ Required by backend
          vehicleType: bookingData.vehicleInfo.vehicleType,   // ✅ Required by backend
          model: bookingData.vehicleInfo.vehicleModel || '', // Optional (backend field: model)
          batteryCapacity: batteryCapacity // Must be number, not string
        }
      };

      const response = await bookingService.createBooking(finalBookingData);

      if (response.success) {
        // Modal band mat karo — "Booking ho gayi" screen dikhao
        const b = response.data || {};
        setConfirmed({
          id: b._id,
          start: b.startTime || utcDateTime,
          end: b.endTime || new Date(new Date(utcDateTime).getTime() + bookingData.duration * 60000).toISOString(),
          duration: b.duration || bookingData.duration,
          cost: b.totalCost,
          plate: bookingData.vehicleInfo.licensePlate,
          vehicle: [bookingData.vehicleInfo.vehicleType, bookingData.vehicleInfo.vehicleModel].filter(Boolean).join(' · '),
        });
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

  /* ── Booking ho gayi 🎉 ── */
  if (confirmed) {
    const fmt = (d, opts) => new Date(d).toLocaleString('en-IN', opts);
    const dateText = fmt(confirmed.start, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const timeText = `${fmt(confirmed.start, { hour: 'numeric', minute: '2-digit' })} – ${fmt(confirmed.end, { hour: 'numeric', minute: '2-digit' })}`;
    const row = (Icon, label, value) => (
      <div className="flex items-start gap-3 py-2.5 border-b border-white/[0.06] last:border-0">
        <Icon className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
        <span className="text-sm text-slate-400 w-24 shrink-0">{label}</span>
        <span className="text-sm font-semibold text-[#F8FAFC]">{value}</span>
      </div>
    );
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
        <div className="bg-[#0E1130] rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="px-6 pt-8 pb-5 text-center bg-gradient-to-b from-[#22D3EE]/10 to-transparent">
            <div className="mx-auto h-16 w-16 rounded-full bg-[#22D3EE]/15 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-9 w-9 text-[#22D3EE]" />
            </div>
            <h2 className="text-2xl font-bold text-[#F8FAFC]">Booking received! 🎉</h2>
            <p className="text-sm text-[#94A3B8] mt-1">{station?.name}</p>
            <span className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300">
              Waiting for the station owner to confirm
            </span>
          </div>

          <div className="px-6">
            {confirmed.id && row(Zap, 'Booking ID', `#${String(confirmed.id).slice(-6).toUpperCase()}`)}
            {row(Calendar, 'Date', dateText)}
            {row(Clock, 'Time', `${timeText} (${confirmed.duration} min)`)}
            {(confirmed.vehicle || confirmed.plate) &&
              row(Car, 'Vehicle', [confirmed.vehicle, confirmed.plate].filter(Boolean).join(' · '))}
            {typeof confirmed.cost === 'number' && row(Zap, 'Est. cost', `₹${confirmed.cost.toFixed(2)}`)}
          </div>

          <div className="mx-6 mt-4 p-3 rounded-xl bg-white/[0.04] flex items-start gap-2.5 text-xs text-[#94A3B8]">
            <Mail className="h-4 w-4 shrink-0 mt-0.5 text-slate-500" />
            We've emailed you the details. You'll get another email when the owner confirms your slot.
          </div>

          <div className="p-6 flex flex-col-reverse sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-white/[0.12] text-slate-300 font-medium hover:bg-white/[0.06]"
            >
              Done
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/my-bookings');
              }}
              className="flex-1 px-4 py-3 rounded-xl bg-[#22D3EE] text-slate-950 font-semibold font-semibold hover:bg-[#67E8F9]"
            >
              View my bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0E1130] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0E1130] border-b border-white/[0.08] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#F8FAFC]">Book Charging Slot</h2>
            <p className="text-sm text-[#94A3B8] mt-1">{station?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Calendar className="h-4 w-4 inline mr-2" />
              Select Date *
            </label>
            <input
              type="date"
              value={selectedDate || ''}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={getTodayDate()}
              required
              className="w-full border border-white/[0.12] px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/60 focus:border-[#22D3EE]/60 bg-[#05061A]/60 text-[#F8FAFC] placeholder:text-slate-500 [color-scheme:dark]"
            />
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Clock className="h-4 w-4 inline mr-2" />
                Start Time *
              </label>
              <input
                type="time"
                value={selectedStartTime || ''}
                onChange={(e) => handleTimeChange('startTime', e.target.value)}
                required
                className="w-full border border-white/[0.12] px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/60 focus:border-[#22D3EE]/60 bg-[#05061A]/60 text-[#F8FAFC] placeholder:text-slate-500 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Clock className="h-4 w-4 inline mr-2" />
                End Time *
              </label>
              <input
                type="time"
                value={selectedEndTime || ''}
                onChange={(e) => handleTimeChange('endTime', e.target.value)}
                required
                className="w-full border border-white/[0.12] px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/60 focus:border-[#22D3EE]/60 bg-[#05061A]/60 text-[#F8FAFC] placeholder:text-slate-500 [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Duration Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
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
                      ? 'bg-[#8B5CF6] text-white border-[#22D3EE]'
                      : 'bg-[#0E1130] text-slate-300 border-white/[0.12] hover:bg-white/[0.06]'
                  }`}
                >
                  {minutes} min
                </button>
              ))}
            </div>
          </div>

          {/* Available Slots Info */}
          {loadingSlots ? (
            <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-4">
              <p className="text-sky-300 text-sm">Loading available slots...</p>
            </div>
          ) : availableSlots.length > 0 ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
              <p className="text-emerald-300 text-sm font-medium mb-2">Available Time Slots:</p>
              <div className="flex flex-wrap gap-2">
                {availableSlots.map((slot, idx) => (
                  <span key={idx} className="bg-[#0E1130] text-emerald-300 px-3 py-1 rounded-md text-sm border border-emerald-500/30">
                    {slot}
                  </span>
                ))}
              </div>
            </div>
          ) : selectedDate ? (
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg p-4">
              <p className="text-[#94A3B8] text-sm">No slots information available</p>
            </div>
          ) : null}

          {/* Vehicle Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#F8FAFC]">Vehicle Information</h3>
            
            {/* License Plate (Required by Backend) */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                License Plate Number *
              </label>
              <input
                type="text"
                name="licensePlate"
                value={bookingData.vehicleInfo.licensePlate || ''}
                onChange={handleVehicleInfoChange}
                placeholder="e.g., DL01AB1234"
                required
                className="w-full border border-white/[0.12] px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/60 focus:border-[#22D3EE]/60 bg-[#05061A]/60 text-[#F8FAFC] placeholder:text-slate-500 [color-scheme:dark]"
              />
            </div>

            {/* Vehicle Type (Required by Backend) */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Vehicle Type *
              </label>
              <select
                name="vehicleType"
                value={bookingData.vehicleInfo.vehicleType || ''}
                onChange={handleVehicleInfoChange}
                required
                className="w-full border border-white/[0.12] px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/60 focus:border-[#22D3EE]/60 bg-[#05061A]/60 text-[#F8FAFC] placeholder:text-slate-500 [color-scheme:dark]"
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
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Vehicle Model (Optional)
              </label>
              <input
                type="text"
                name="vehicleModel"
                value={bookingData.vehicleInfo.vehicleModel || ''}
                onChange={handleVehicleInfoChange}
                placeholder="e.g., Tesla Model 3, Ola Electric"
                className="w-full border border-white/[0.12] px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/60 focus:border-[#22D3EE]/60 bg-[#05061A]/60 text-[#F8FAFC] placeholder:text-slate-500 [color-scheme:dark]"
              />
            </div>

            {/* Battery Capacity (Numbers only) */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
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
                className="w-full border border-white/[0.12] px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/60 focus:border-[#22D3EE]/60 bg-[#05061A]/60 text-[#F8FAFC] placeholder:text-slate-500 [color-scheme:dark]"
              />
              <p className="text-xs text-slate-400 mt-1">Enter only numbers (e.g., 30.2 not 30.2kWh)</p>
            </div>
          </div>

          {/* Pricing Info */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg p-4">
            <p className="text-sm text-[#94A3B8] mb-1">Estimated Cost</p>
            <p className="text-2xl font-bold text-[#F8FAFC]">
              ₹{station?.pricePerUnit || '16'} <span className="text-sm font-normal text-[#94A3B8]">per kWh</span>
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Final cost will be calculated based on actual energy consumed
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-white/[0.12] text-slate-300 rounded-lg hover:bg-white/[0.06] transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-[#22D3EE] text-slate-950 font-semibold rounded-lg hover:bg-[#67E8F9] transition-colors font-medium disabled:bg-slate-700 disabled:cursor-not-allowed"
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