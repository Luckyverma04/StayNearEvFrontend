import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, User, Zap, CheckCircle, XCircle,
  AlertCircle, RefreshCw, Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
      {/* the sliding pill */}
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

const AdminBookingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAllBookings();
    }
  }, [user]);

  const fetchAllBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      const response = await fetch(
        'https://staynearevbackend.onrender.com/api/bookings/admin/bookings',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setBookings(data.data || []);
      } else {
        setError(data.message || 'Failed to load bookings');
      }
    } catch (err) {
      console.error('Error fetching all bookings:', err);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
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
      const date = new Date(dateString);
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

  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  /* ── Access denied ── */
  if (!user || user.role !== 'admin') {
    return (
      <div className={`min-h-screen bg-[#020617] flex items-center justify-center px-4 ${NAVBAR_CLEARANCE}`} style={gridStyle}>
        <div className="bg-[#0F172A] border border-white/[0.08] rounded-2xl p-10 text-center max-w-md w-full shadow-xl">
          <div className="bg-red-500/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] mb-3">Access denied</h1>
          <p className="text-[#94A3B8] mb-6">Only admins can view this page.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 text-slate-950 font-semibold rounded-xl transition-all hover:scale-[1.03]"
            style={{ background: ACCENT, boxShadow: `0 8px 24px -8px ${ACCENT}66` }}
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className={`min-h-screen bg-[#020617] ${NAVBAR_CLEARANCE}`} style={gridStyle}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="h-10 w-72 bg-slate-800 rounded-lg animate-pulse mb-8" />
          <div className="h-16 bg-[#0F172A] border border-white/[0.08] rounded-2xl animate-pulse mb-6" />
          <div className="h-11 w-96 max-w-full bg-slate-800/70 rounded-full animate-pulse mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-52 bg-[#0F172A] border border-white/[0.08] rounded-2xl animate-pulse" />
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
            onClick={fetchAllBookings}
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

      <div className="relative max-w-7xl mx-auto px-4 py-8 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <h1 className="text-3xl md:text-4xl font-bold text-[#F8FAFC] tracking-tight">
            All bookings
          </h1>
          <button
            onClick={fetchAllBookings}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[#F8FAFC] rounded-xl transition-all hover:scale-[1.03] text-sm font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="bg-[#0F172A]/80 backdrop-blur rounded-2xl shadow-xl p-5 border border-white/[0.08] mb-6">
          <p className="text-[#94A3B8]">
            Showing <span className="font-bold" style={{ color: ACCENT }}>{filteredBookings.length}</span> of{' '}
            <span className="font-bold text-[#F8FAFC]">{bookings.length}</span> total bookings from all stations
          </p>
        </div>

        {/* Sliding pill filters — same feel as the navbar */}
        <div className="mb-8">
          <SlidingTabs tabs={FILTERS} active={filter} onChange={setFilter} />
        </div>

        {/* Bookings */}
        {filteredBookings.length === 0 ? (
          <div className="bg-[#0F172A]/70 backdrop-blur rounded-2xl border border-white/[0.08] shadow-xl p-12 text-center">
            <div className="bg-white/[0.04] h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-slate-600" />
            </div>
            <h2 className="text-xl font-semibold text-[#F8FAFC] mb-2">
              {filter === 'all' ? 'No bookings found' : `No ${filter} bookings`}
            </h2>
            <p className="text-[#94A3B8]">No bookings match your current filter</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-[#0F172A]/80 backdrop-blur rounded-2xl border border-white/[0.08] shadow-xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.15] hover:shadow-2xl"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-[#F8FAFC] mb-2">
                        {booking.station?.name || 'Station'}
                      </h3>
                      <div className="flex items-center text-[#94A3B8]">
                        <MapPin className="h-4 w-4 mr-2" style={{ color: ACCENT }} />
                        <span className="text-sm">
                          {booking.station?.location || 'Location not available'}
                        </span>
                      </div>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>

                  {/* Customer */}
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-5 w-5 text-[#94A3B8]" />
                      <p className="font-semibold text-[#F8FAFC]">
                        {booking.user?.name || booking.user?.email || 'Customer'}
                      </p>
                    </div>
                    {booking.user?.email && (
                      <p className="text-sm text-[#94A3B8] ml-7">{booking.user.email}</p>
                    )}
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5" style={{ color: ACCENT }} />
                      <div>
                        <p className="text-xs text-[#94A3B8]">Date</p>
                        <p className="font-semibold text-[#F8FAFC]">
                          {formatDate(booking.startTime)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5" style={{ color: ACCENT }} />
                      <div>
                        <p className="text-xs text-[#94A3B8]">Time</p>
                        <p className="font-semibold text-[#F8FAFC]">
                          {extractTime(booking.startTime)}
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

                  {/* Host */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-[#94A3B8]">Station host:</span>
                    <span className="text-[#F8FAFC] font-medium">
                      {booking.station?.host?.name || 'Host information not available'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBookingsPage;