import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, Zap, CheckCircle, XCircle, AlertCircle,
  Star, RefreshCw, X, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { useAuth } from '../context/AuthContext';

/* ─── Design tokens (same as the rest of the site) ─── */
const ACCENT = '#00E5A8';
const NAVBAR_CLEARANCE = 'pt-28'; // fixed navbar — content must clear it

const gridStyle = {
  backgroundImage:
    'linear-gradient(rgba(148,163,184,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.025) 1px, transparent 1px)',
  backgroundSize: '48px 48px',
};

const FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

/* ── Sliding pill tabs — same interaction as the navbar ── */
const SlidingTabs = ({ tabs, active, onChange }) => {
  const wrapRef = useRef(null);
  const tabRefs = useRef({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0, opacity: 0 });
  const [hovered, setHovered] = useState(null);

  const target = hovered || active;

  const moveTo = useCallback((key) => {
    const el = tabRefs.current[key];
    const wrap = wrapRef.current;
    if (!el || !wrap) return;
    const wrapRect = wrap.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    setIndicator({ left: rect.left - wrapRect.left, width: rect.width, opacity: 1 });
  }, []);

  useEffect(() => {
    moveTo(target);
  }, [target, moveTo]);

  useEffect(() => {
    const onResize = () => moveTo(target);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [target, moveTo]);

  return (
    <div
      ref={wrapRef}
      onMouseLeave={() => setHovered(null)}
      className="relative inline-flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-full p-1 overflow-x-auto max-w-full"
    >
      <span
        aria-hidden="true"
        className="absolute top-1 bottom-1 rounded-full pointer-events-none"
        style={{
          left: indicator.left,
          width: indicator.width,
          opacity: indicator.opacity,
          background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)`,
          boxShadow: `0 6px 18px -6px ${ACCENT}80`,
          transition:
            'left 0.35s cubic-bezier(0.22, 1, 0.36, 1), width 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease',
        }}
      />
      {tabs.map((tab) => {
        const highlighted = hovered === tab || (!hovered && active === tab);
        return (
          <button
            key={tab}
            ref={(el) => (tabRefs.current[tab] = el)}
            onClick={() => onChange(tab)}
            onMouseEnter={() => setHovered(tab)}
            className={`relative z-10 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-300 ${
              highlighted ? 'text-slate-950' : 'text-[#94A3B8]'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        );
      })}
    </div>
  );
};

const MyBookingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null); // booking pending cancel confirm
  const [reviewingBooking, setReviewingBooking] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });

  // Toast replaces every alert() — auto-dismisses after 3.5s
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (type, message) => setToast({ type, message });

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await bookingService.getUserBookings();

      // Handle different response structures
      const bookingsData = response.data || response.bookings || response || [];
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  /* Confirmed from the modal — replaces window.confirm */
  const confirmCancelBooking = async () => {
    if (!cancelTarget) return;
    const bookingId = cancelTarget._id;
    try {
      setCancellingId(bookingId);
      setCancelTarget(null);
      await bookingService.cancelBooking(bookingId);
      await fetchBookings();
      showToast('success', 'Booking cancelled successfully.');
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewingBooking) return;

    try {
      await bookingService.addBookingReview(reviewingBooking._id, reviewData);
      await fetchBookings();
      setReviewingBooking(null);
      setReviewData({ rating: 5, comment: '' });
      showToast('success', 'Review submitted. Thanks!');
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to submit review.');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        classes: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
        icon: AlertCircle,
      },
      confirmed: {
        classes: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
        icon: CheckCircle,
      },
      completed: {
        classes: 'bg-[#00E5A8]/10 border-[#00E5A8]/30',
        style: { color: ACCENT },
        icon: CheckCircle,
      },
      cancelled: {
        classes: 'bg-red-500/10 text-red-300 border-red-500/30',
        icon: XCircle,
      },
      rejected: {
        classes: 'bg-red-500/10 text-red-300 border-red-500/30',
        icon: XCircle,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${config.classes}`}
        style={config.style}
      >
        <Icon className="h-4 w-4" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    try {
      const date = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00`);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const extractTime = (dateTimeString) => {
    if (!dateTimeString) return 'Time not available';
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      return 'Invalid time';
    }
  };

  const calculateEndTime = (startTime, duration) => {
    if (!startTime || !duration) return 'Time not available';
    try {
      const start = new Date(startTime);
      const end = new Date(start.getTime() + duration * 60000);
      return end.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      return 'Invalid time';
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  /* ── Not logged in ── */
  if (!user) {
    return (
      <div className={`min-h-screen bg-[#020617] flex items-center justify-center px-4 ${NAVBAR_CLEARANCE}`} style={gridStyle}>
        <div className="bg-[#0F172A] border border-white/[0.08] rounded-2xl p-10 text-center max-w-md w-full shadow-xl">
          <p className="text-[#94A3B8] mb-6">Please login to view your bookings</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 text-slate-950 font-semibold rounded-xl transition-all hover:scale-[1.03]"
            style={{ background: ACCENT, boxShadow: `0 8px 24px -8px ${ACCENT}66` }}
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className={`min-h-screen bg-[#020617] ${NAVBAR_CLEARANCE}`} style={gridStyle}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="h-10 w-60 bg-slate-800 rounded-lg animate-pulse mb-6" />
          <div className="h-11 w-96 max-w-full bg-slate-800/70 rounded-full animate-pulse mb-8" />
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 bg-[#0F172A] border border-white/[0.08] rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className={`min-h-screen bg-[#020617] flex items-center justify-center px-4 ${NAVBAR_CLEARANCE}`} style={gridStyle}>
        <div className="bg-[#0F172A] border border-white/[0.08] rounded-2xl p-10 text-center max-w-md w-full shadow-xl">
          <div className="bg-red-500/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-[#F8FAFC] mb-2">Something went wrong</h2>
          <p className="text-[#94A3B8] mb-6">{error}</p>
          <button
            onClick={fetchBookings}
            className="inline-flex items-center gap-2 text-slate-950 font-semibold px-6 py-3 rounded-xl transition-all hover:scale-[1.03]"
            style={{ background: ACCENT, boxShadow: `0 8px 24px -8px ${ACCENT}66` }}
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#020617] relative ${NAVBAR_CLEARANCE}`}>
      <div className="absolute inset-0" style={gridStyle} aria-hidden="true" />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 h-[320px] w-[640px] rounded-full opacity-[0.12] blur-[100px] pointer-events-none"
        style={{ background: `radial-gradient(closest-side, ${ACCENT}, transparent)` }}
        aria-hidden="true"
      />

      <div className="relative max-w-6xl mx-auto px-4 py-8 pb-20">
        <h1 className="text-3xl md:text-4xl font-bold text-[#F8FAFC] tracking-tight mb-6">
          My bookings
        </h1>

        {/* Sliding pill filters — same feel as the navbar */}
        <div className="mb-8">
          <SlidingTabs tabs={FILTERS} active={filter} onChange={setFilter} />
        </div>

        {filteredBookings.length === 0 ? (
          <div className="bg-[#0F172A]/70 backdrop-blur rounded-2xl border border-white/[0.08] shadow-xl p-12 text-center">
            <div className="bg-white/[0.04] h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-slate-600" />
            </div>
            <h2 className="text-xl font-semibold text-[#F8FAFC] mb-2">
              {filter === 'all' ? 'No bookings yet' : `No ${filter} bookings`}
            </h2>
            <p className="text-[#94A3B8] mb-6">
              {filter === 'all'
                ? 'Start by booking a charging station'
                : 'No bookings match this filter'}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 text-slate-950 rounded-xl font-semibold transition-all hover:scale-[1.03]"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)`,
                  boxShadow: `0 10px 28px -10px ${ACCENT}80`,
                }}
              >
                Browse charging stations
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-[#0F172A]/80 backdrop-blur rounded-2xl border border-white/[0.08] shadow-xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.15] hover:shadow-2xl"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-[#F8FAFC] mb-2">
                        {booking.station?.name || 'Charging Station'}
                      </h3>
                      <div className="flex items-center text-[#94A3B8]">
                        <MapPin className="h-4 w-4 mr-2" style={{ color: ACCENT }} />
                        <span className="text-sm">
                          {booking.station?.location || 'Location not available'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(booking.status)}
                      {booking.totalCost && (
                        <p className="text-lg font-bold" style={{ color: ACCENT }}>
                          ₹{booking.totalCost}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5" style={{ color: ACCENT }} />
                      <div>
                        <p className="text-xs text-[#94A3B8]">Date</p>
                        <p className="font-semibold text-[#F8FAFC]">
                          {formatDate(booking.startTime || booking.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5" style={{ color: ACCENT }} />
                      <div>
                        <p className="text-xs text-[#94A3B8]">Time</p>
                        <p className="font-semibold text-[#F8FAFC]">
                          {extractTime(booking.startTime)} -{' '}
                          {calculateEndTime(booking.startTime, booking.duration)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5" style={{ color: ACCENT }} />
                      <div>
                        <p className="text-xs text-[#94A3B8]">Duration</p>
                        <p className="font-semibold text-[#F8FAFC]">{booking.duration} minutes</p>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Information */}
                  {(booking.vehicleInfo?.licensePlate ||
                    booking.vehicleInfo?.vehicleType ||
                    booking.vehicleInfo?.vehicleModel ||
                    booking.vehicleInfo?.batteryCapacity) && (
                    <div className="mb-4">
                      <h4 className="font-medium text-[#F8FAFC] mb-2 text-sm">Vehicle information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-[#94A3B8]">
                        {booking.vehicleInfo?.licensePlate && (
                          <p>
                            <span className="font-medium text-[#F8FAFC]">License plate:</span>{' '}
                            {booking.vehicleInfo.licensePlate}
                          </p>
                        )}
                        {booking.vehicleInfo?.vehicleType && (
                          <p>
                            <span className="font-medium text-[#F8FAFC]">Vehicle type:</span>{' '}
                            {booking.vehicleInfo.vehicleType}
                          </p>
                        )}
                        {booking.vehicleInfo?.vehicleModel && (
                          <p>
                            <span className="font-medium text-[#F8FAFC]">Model:</span>{' '}
                            {booking.vehicleInfo.vehicleModel}
                          </p>
                        )}
                        {booking.vehicleInfo?.batteryCapacity && (
                          <p>
                            <span className="font-medium text-[#F8FAFC]">Battery:</span>{' '}
                            {booking.vehicleInfo.batteryCapacity}kWh
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-white/[0.06] flex-wrap">
                    {booking.station?._id && (
                      <button
                        onClick={() => navigate(`/stations/${booking.station._id}`)}
                        className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[#F8FAFC] rounded-xl transition-all hover:scale-[1.03] text-sm font-medium"
                      >
                        View station
                      </button>
                    )}

                    {booking.status === 'pending' && (
                      <button
                        onClick={() => setCancelTarget(booking)}
                        disabled={cancellingId === booking._id}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl transition-all hover:scale-[1.03] text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2"
                      >
                        {cancellingId === booking._id && (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        )}
                        {cancellingId === booking._id ? 'Cancelling…' : 'Cancel booking'}
                      </button>
                    )}

                    {booking.status === 'completed' && !booking.reviewed && (
                      <button
                        onClick={() => setReviewingBooking(booking)}
                        className="px-4 py-2 text-slate-950 rounded-xl transition-all hover:scale-[1.03] text-sm font-semibold"
                        style={{
                          background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)`,
                          boxShadow: `0 8px 20px -8px ${ACCENT}70`,
                        }}
                      >
                        Write review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════ CANCEL CONFIRMATION MODAL (replaces window.confirm) ══════ */}
      {cancelTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCancelTarget(null);
          }}
        >
          <div className="bg-[#0F172A] border border-white/[0.08] rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="bg-red-500/10 h-12 w-12 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-[#F8FAFC] mb-1">Cancel this booking?</h2>
            <p className="text-[#94A3B8] text-sm mb-6">
              Your booking at{' '}
              <span className="font-medium text-[#F8FAFC]">
                {cancelTarget.station?.name || 'this station'}
              </span>{' '}
              will be cancelled.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/[0.08] text-[#94A3B8] font-medium hover:bg-white/[0.04] hover:text-[#F8FAFC] transition-colors"
              >
                Keep booking
              </button>
              <button
                onClick={confirmCancelBooking}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition-all hover:scale-[1.02]"
              >
                Yes, cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════ REVIEW MODAL ══════ */}
      {reviewingBooking && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setReviewingBooking(null);
              setReviewData({ rating: 5, comment: '' });
            }
          }}
        >
          <div className="bg-[#0F172A] border border-white/[0.08] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-[#F8FAFC] mb-1">Write a review</h2>
            <p className="text-[#94A3B8] mb-5">{reviewingBooking.station?.name}</p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-2">Rating</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewData({ ...reviewData, rating: star })}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= reviewData.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-2">Comment</label>
                <textarea
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                  rows="4"
                  required
                  className="w-full bg-white/[0.04] border border-white/[0.08] text-[#F8FAFC] placeholder:text-slate-500 px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00E5A8]/40 focus:border-[#00E5A8]/60 resize-none"
                  placeholder="Share your experience…"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setReviewingBooking(null);
                    setReviewData({ rating: 5, comment: '' });
                  }}
                  className="flex-1 px-4 py-2.5 border border-white/[0.08] text-[#94A3B8] rounded-xl hover:bg-white/[0.04] hover:text-[#F8FAFC] transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 text-slate-950 rounded-xl font-semibold transition-all hover:scale-[1.02]"
                  style={{
                    background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)`,
                    boxShadow: `0 8px 20px -8px ${ACCENT}70`,
                  }}
                >
                  Submit review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════ TOAST (replaces every alert) ══════ */}
      {toast && (
        <div className="fixed top-24 right-4 z-[60] max-w-sm w-full">
          <div
            className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl ${
              toast.type === 'success'
                ? 'bg-[#00E5A8]/10 border-[#00E5A8]/30'
                : 'bg-red-500/10 border-red-500/30 text-red-200'
            }`}
            style={toast.type === 'success' ? { color: ACCENT } : undefined}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" style={{ color: ACCENT }} />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-red-400" />
            )}
            <p className="text-sm flex-1">{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              aria-label="Dismiss"
              className="p-0.5 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;