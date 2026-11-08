import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, MapPin, User, Car, CheckCircle, XCircle,
  RefreshCw, AlertTriangle, X, Zap, IndianRupee,
} from 'lucide-react';
import api from '../services/api';

const ACCENT = '#22D3EE';
const NAVBAR_CLEARANCE = 'pt-28';

const gridStyle = {
  backgroundImage:
    'linear-gradient(rgba(148,163,184,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.025) 1px, transparent 1px)',
  backgroundSize: '48px 48px',
};

const STATUS_STYLES = {
  pending: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-300', label: 'Pending' },
  confirmed: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-300', label: 'Confirmed' },
  active: { bg: 'bg-[#22D3EE]/10', border: 'border-[#22D3EE]/30', text: 'text-[#22D3EE]', label: 'Active' },
  completed: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-300', label: 'Completed' },
  cancelled: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-300', label: 'Cancelled' },
  'no-show': { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-300', label: 'No show' },
};

// Har status se aage kya ho sakta hai
const NEXT_ACTIONS = {
  pending: [
    { status: 'confirmed', label: 'Accept', tone: 'accent' },
    { status: 'cancelled', label: 'Reject', tone: 'danger' },
  ],
  confirmed: [
    { status: 'active', label: 'Start charging', tone: 'accent' },
    { status: 'cancelled', label: 'Cancel', tone: 'danger' },
  ],
  active: [
    { status: 'completed', label: 'Mark completed', tone: 'accent' },
  ],
  completed: [],
  cancelled: [],
};

const MyStationBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { booking, status, label }
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/bookings/my-station-bookings');
      const d = res.data?.data;
      setBookings(Array.isArray(d) ? d : Array.isArray(d?.bookings) ? d.bookings : []);
    } catch (err) {
      console.error('Fetch station bookings error:', err);
      setError(err.response?.data?.message || 'Could not load bookings for your stations.');
    } finally {
      setLoading(false);
    }
  };

  const applyStatus = async () => {
    if (!confirmAction) return;
    const { booking, status } = confirmAction;

    try {
      setUpdatingId(booking._id);
      setConfirmAction(null);

      const res = await api.put(`/bookings/${booking._id}/status`, { status });

      if (res.data?.success) {
        setBookings((prev) =>
          prev.map((b) => (b._id === booking._id ? { ...b, status } : b))
        );
        setToast({ type: 'success', message: `Booking ${status}.` });
      } else {
        setToast({ type: 'error', message: res.data?.message || 'Update failed.' });
      }
    } catch (err) {
      console.error('Update status error:', err);
      setToast({
        type: 'error',
        message: err.response?.data?.message || 'Could not update this booking.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Pending (action chahiye) sabse upar, phir aane wali (paas wali pehle), phir baaki (nayi pehle)
  const PRIORITY = { pending: 0, confirmed: 1, active: 1, completed: 2, cancelled: 3, 'no-show': 3 };
  const filtered = (filter === 'all' ? bookings : bookings.filter((b) => b.status === filter))
    .slice()
    .sort((a, b) => {
      const pa = PRIORITY[a.status] ?? 2;
      const pb = PRIORITY[b.status] ?? 2;
      if (pa !== pb) return pa - pb;
      const da = new Date(a.startTime) - new Date(b.startTime);
      return pa <= 1 ? da : -da;
    });

  /* Owner summary */
  const nowTs = Date.now();
  const todayKey = new Date().toDateString();
  const summary = {
    pending: bookings.filter((b) => b.status === 'pending').length,
    today: bookings.filter(
      (b) => !['cancelled', 'no-show'].includes(b.status) && new Date(b.startTime).toDateString() === todayKey
    ).length,
    upcoming: bookings.filter((b) => b.status === 'confirmed' && new Date(b.startTime).getTime() > nowTs).length,
    earned: bookings
      .filter((b) => b.status === 'completed')
      .reduce((sum, b) => sum + (Number(b.finalCost ?? b.totalCost) || 0), 0),
  };

  const counts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    active: bookings.filter((b) => b.status === 'active').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
  };

  const tabs = [
    { key: 'all', label: `All (${counts.all})` },
    { key: 'pending', label: `Pending (${counts.pending})` },
    { key: 'confirmed', label: `Confirmed (${counts.confirmed})` },
    { key: 'active', label: `Active (${counts.active})` },
    { key: 'completed', label: `Completed (${counts.completed})` },
  ];

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const fmtTime = (d) =>
    d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

  /* ── Loading ── */
  if (loading) {
    return (
      <div className={`min-h-screen bg-[#05061A] ${NAVBAR_CLEARANCE}`} style={gridStyle}>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="h-10 w-80 bg-slate-800 rounded-lg animate-pulse mb-3" />
          <div className="h-5 w-64 bg-slate-800/70 rounded animate-pulse mb-8" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 bg-[#0E1130] border border-white/[0.08] rounded-2xl animate-pulse mb-4" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#05061A] relative ${NAVBAR_CLEARANCE}`}>
      <div className="absolute inset-0" style={gridStyle} aria-hidden="true" />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 h-[320px] w-[640px] rounded-full opacity-[0.12] blur-[100px] pointer-events-none"
        style={{ background: `radial-gradient(closest-side, ${ACCENT}, transparent)` }}
        aria-hidden="true"
      />

      <div className="relative max-w-5xl mx-auto px-4 py-8 pb-20">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#F8FAFC] tracking-tight flex items-center gap-3">
              <span
                className="p-2.5 rounded-xl inline-flex"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, #8B5CF6)`,
                  boxShadow: `0 8px 20px -8px ${ACCENT}60`,
                }}
              >
                <Zap className="h-7 w-7 text-slate-950" />
              </span>
              Station bookings
            </h1>
            <p className="text-[#94A3B8] mt-2">
              Requests on the stations you added — accept, cancel or complete them.
            </p>
          </div>

          <button
            onClick={fetchBookings}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.04] text-[#94A3B8] text-sm font-medium hover:text-[#F8FAFC] hover:bg-white/[0.06] transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            {
              key: 'pending',
              label: 'Needs your action',
              value: summary.pending,
              hint: summary.pending ? 'Tap to review' : 'All caught up',
              tone: summary.pending ? 'text-amber-300 border-amber-500/40 bg-amber-500/10' : 'text-[#94A3B8] border-white/[0.08] bg-white/[0.03]',
            },
            { key: 'today', label: 'Today', value: summary.today, hint: 'bookings', tone: 'text-[#F8FAFC] border-white/[0.08] bg-white/[0.03]' },
            { key: 'confirmed', label: 'Upcoming', value: summary.upcoming, hint: 'confirmed', tone: 'text-sky-300 border-white/[0.08] bg-white/[0.03]' },
            {
              key: 'completed',
              label: 'Earned',
              value: `₹${Math.round(summary.earned).toLocaleString('en-IN')}`,
              hint: 'from completed',
              tone: 'text-cyan-300 border-white/[0.08] bg-white/[0.03]',
            },
          ].map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => c.key !== 'today' && setFilter(c.key)}
              className={`text-left p-4 rounded-2xl border transition-all hover:-translate-y-0.5 ${c.tone}`}
            >
              <p className="text-xs font-medium text-[#94A3B8]">{c.label}</p>
              <p className="text-2xl font-bold mt-1">{c.value}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{c.hint}</p>
            </button>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                filter === tab.key
                  ? 'text-slate-950 border-transparent'
                  : 'text-[#94A3B8] bg-white/[0.03] border-white/[0.08] hover:text-[#F8FAFC] hover:border-white/20'
              }`}
              style={
                filter === tab.key
                  ? { background: ACCENT, boxShadow: `0 8px 20px -8px ${ACCENT}80` }
                  : undefined
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl mb-6 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-5 w-5" />
              {error}
            </span>
            <button onClick={fetchBookings} className="text-sm font-medium hover:underline underline-offset-4">
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-[#0E1130]/70 backdrop-blur rounded-2xl border border-white/[0.08] shadow-xl">
            <div className="bg-white/[0.04] h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-5">
              <Calendar className="h-10 w-10 text-slate-600" />
            </div>
            <p className="text-[#F8FAFC] text-xl font-semibold mb-2">
              {bookings.length === 0 ? 'No bookings yet' : 'Nothing in this filter'}
            </p>
            <p className="text-[#94A3B8] text-sm">
              {bookings.length === 0
                ? "When someone books one of your stations, it'll show up here."
                : 'Try a different status filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((b) => {
              const style = STATUS_STYLES[b.status] || STATUS_STYLES.pending;
              const actions = NEXT_ACTIONS[b.status] || [];
              const busy = updatingId === b._id;

              return (
                <div
                  key={b._id}
                  className="bg-[#0E1130]/80 backdrop-blur rounded-2xl border border-white/[0.08] shadow-xl p-5 transition-colors hover:border-white/[0.15]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-11 w-11 rounded-full flex items-center justify-center text-slate-950 font-bold shrink-0"
                        style={{ background: `linear-gradient(135deg, ${ACCENT}, #8B5CF6)` }}
                      >
                        {b.user?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[#F8FAFC] font-semibold truncate">
                          {b.user?.name || 'Unknown user'}
                        </p>
                        <p className="text-xs text-[#94A3B8] truncate">{b.user?.email}</p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${style.bg} ${style.border} ${style.text}`}
                    >
                      {style.label}
                    </span>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <Detail icon={<MapPin className="h-4 w-4" />} label="Station" value={b.station?.name} />
                    <Detail
                      icon={<Calendar className="h-4 w-4" />}
                      label="Date"
                      value={fmtDate(b.startTime)}
                    />
                    <Detail
                      icon={<Clock className="h-4 w-4" />}
                      label="Time"
                      value={`${fmtTime(b.startTime)} – ${fmtTime(b.endTime)} (${b.duration} min)`}
                    />
                    <Detail
                      icon={<Car className="h-4 w-4" />}
                      label="Vehicle"
                      value={
                        b.vehicleInfo
                          ? `${b.vehicleInfo.vehicleType}${b.vehicleInfo.licensePlate ? ' · ' + b.vehicleInfo.licensePlate : ''}`
                          : '—'
                      }
                    />
                    <Detail
                      icon={<IndianRupee className="h-4 w-4" />}
                      label="Amount"
                      value={b.totalCost ? `₹${Number(b.totalCost).toFixed(2)}` : '—'}
                    />
                    <Detail
                      icon={<User className="h-4 w-4" />}
                      label="Booking ID"
                      value={b._id.slice(-8)}
                    />
                  </div>

                  {/* Actions */}
                  {actions.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-white/[0.06]">
                      {actions.map((a) => (
                        <button
                          key={a.status}
                          onClick={() => setConfirmAction({ booking: b, status: a.status, label: a.label })}
                          disabled={busy}
                          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed ${
                            a.tone === 'danger'
                              ? 'bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20'
                              : 'text-slate-950'
                          }`}
                          style={
                            a.tone === 'accent'
                              ? {
                                  background: `linear-gradient(135deg, ${ACCENT}, #8B5CF6)`,
                                  boxShadow: `0 8px 20px -8px ${ACCENT}70`,
                                }
                              : undefined
                          }
                        >
                          {busy ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : a.tone === 'danger' ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          {a.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#94A3B8] pt-3 border-t border-white/[0.06]">
                      No action needed for this booking.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm modal */}
      {confirmAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmAction(null);
          }}
        >
          <div className="bg-[#0E1130] border border-white/[0.08] rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div
              className={`h-12 w-12 rounded-full flex items-center justify-center mb-4 ${
                confirmAction.status === 'cancelled' ? 'bg-red-500/10' : 'bg-[#22D3EE]/10'
              }`}
            >
              {confirmAction.status === 'cancelled' ? (
                <XCircle className="h-6 w-6 text-red-400" />
              ) : (
                <CheckCircle className="h-6 w-6" style={{ color: ACCENT }} />
              )}
            </div>
            <h2 className="text-lg font-bold text-[#F8FAFC] mb-1">
              {confirmAction.label} this booking?
            </h2>
            <p className="text-[#94A3B8] text-sm mb-6">
              <span className="font-medium text-[#F8FAFC]">{confirmAction.booking.user?.name}</span>'s
              booking at{' '}
              <span className="font-medium text-[#F8FAFC]">{confirmAction.booking.station?.name}</span>{' '}
              will be marked as <span className="font-medium text-[#F8FAFC]">{confirmAction.status}</span>.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/[0.08] text-[#94A3B8] font-medium hover:bg-white/[0.04] hover:text-[#F8FAFC] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={applyStatus}
                className={`flex-1 px-4 py-2.5 rounded-xl font-semibold transition-all hover:scale-[1.02] ${
                  confirmAction.status === 'cancelled'
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'text-slate-950'
                }`}
                style={
                  confirmAction.status !== 'cancelled'
                    ? {
                        background: `linear-gradient(135deg, ${ACCENT}, #8B5CF6)`,
                        boxShadow: `0 8px 20px -8px ${ACCENT}70`,
                      }
                    : undefined
                }
              >
                {confirmAction.label}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-24 right-4 z-[60] max-w-sm w-full">
          <div
            className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl ${
              toast.type === 'success'
                ? 'bg-[#22D3EE]/10 border-[#22D3EE]/30'
                : 'bg-red-500/10 border-red-500/30 text-red-200'
            }`}
            style={toast.type === 'success' ? { color: ACCENT } : undefined}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: ACCENT }} />
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

const Detail = ({ icon, label, value }) => (
  <div className="flex items-start gap-2.5">
    <span className="text-slate-500 mt-0.5 shrink-0">{icon}</span>
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-slate-500 font-medium">{label}</p>
      <p className="text-sm text-[#F8FAFC] truncate">{value || '—'}</p>
    </div>
  </div>
);

export default MyStationBookingsPage;