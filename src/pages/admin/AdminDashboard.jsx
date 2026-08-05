import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Shield, CheckCircle, Clock, Mail, User, AlertCircle, Search,
  RefreshCw, X, CheckCircle2, AlertTriangle, Crown,
} from 'lucide-react';
import authService from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

/* ─── Design tokens (same as the rest of the site) ─── */
const ACCENT = '#00E5A8';
const NAVBAR_CLEARANCE = 'pt-28'; // fixed navbar — content must clear it

const gridStyle = {
  backgroundImage:
    'linear-gradient(rgba(148,163,184,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.025) 1px, transparent 1px)',
  backgroundSize: '48px 48px',
};

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
  }, [target, moveTo, tabs]);

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
        const highlighted = hovered === tab.key || (!hovered && active === tab.key);
        return (
          <button
            key={tab.key}
            ref={(el) => (tabRefs.current[tab.key] = el)}
            onClick={() => onChange(tab.key)}
            onMouseEnter={() => setHovered(tab.key)}
            className={`relative z-10 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-300 ${
              highlighted ? 'text-slate-950' : 'text-[#94A3B8]'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, verified, unverified
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyingId, setVerifyingId] = useState(null);
  const [verifyTarget, setVerifyTarget] = useState(null); // user pending confirm
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (type, message) => setToast({ type, message });

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await authService.getAllUsers();

      if (result.success) {
        setUsers(result.data || []);
      } else {
        setError(result.message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Verify user — confirmed from the modal
  const confirmVerifyUser = async () => {
    if (!verifyTarget) return;
    const userId = verifyTarget._id;

    try {
      setVerifyingId(userId);
      setVerifyTarget(null);

      const result = await authService.verifyUserByAdmin(userId);

      if (result.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u._id === userId
              ? { ...u, isEmailVerified: true, verifiedByAdmin: true }
              : u
          )
        );
        showToast('success', 'User verified successfully.');
      } else {
        showToast('error', result.message || 'Failed to verify user.');
      }
    } catch (err) {
      console.error('Error verifying user:', err);
      showToast('error', err.response?.data?.message || 'Failed to verify user.');
    } finally {
      setVerifyingId(null);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'verified'
        ? u.isEmailVerified
        : filter === 'unverified'
        ? !u.isEmailVerified
        : true;

    const matchesSearch =
      searchQuery === ''
        ? true
        : u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Stats
  const stats = {
    total: users.length,
    verified: users.filter((u) => u.isEmailVerified).length,
    unverified: users.filter((u) => !u.isEmailVerified).length,
    admins: users.filter((u) => u.role === 'admin').length,
  };

  const filterTabs = [
    { key: 'all', label: `All (${stats.total})` },
    { key: 'verified', label: `Verified (${stats.verified})` },
    { key: 'unverified', label: `Unverified (${stats.unverified})` },
  ];

  /* ── Access denied ── */
  if (user?.role?.toLowerCase() !== 'admin') {
    return (
      <div className={`min-h-screen bg-[#020617] flex items-center justify-center px-4 ${NAVBAR_CLEARANCE}`} style={gridStyle}>
        <div className="bg-[#0F172A] border border-white/[0.08] rounded-2xl p-10 text-center max-w-md w-full shadow-xl">
          <div className="bg-red-500/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-[#F8FAFC] mb-2">Access denied</h2>
          <p className="text-[#94A3B8]">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className={`min-h-screen bg-[#020617] ${NAVBAR_CLEARANCE}`} style={gridStyle}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-10 w-72 bg-slate-800 rounded-lg animate-pulse mb-2" />
          <div className="h-5 w-52 bg-slate-800/70 rounded animate-pulse mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-[#0F172A] border border-white/[0.08] rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="h-16 bg-[#0F172A] border border-white/[0.08] rounded-2xl animate-pulse mb-6" />
          <div className="h-96 bg-[#0F172A] border border-white/[0.08] rounded-2xl animate-pulse" />
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

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#F8FAFC] tracking-tight flex items-center gap-3">
              <span
                className="p-2.5 rounded-xl inline-flex"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)`,
                  boxShadow: `0 8px 20px -8px ${ACCENT}60`,
                }}
              >
                <Shield className="h-7 w-7 text-slate-950" />
              </span>
              Admin dashboard
            </h1>
            <p className="text-[#94A3B8] mt-2">Manage users and email verification</p>
          </div>

          <button
            onClick={fetchUsers}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.04] text-[#94A3B8] text-sm font-medium hover:text-[#F8FAFC] hover:bg-white/[0.06] transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total users" value={stats.total} icon={<User className="h-6 w-6 text-blue-400" />} iconBg="bg-blue-500/10" />
          <StatCard
            label="Email verified"
            value={stats.verified}
            icon={<CheckCircle className="h-6 w-6" style={{ color: ACCENT }} />}
            iconBg="bg-[#00E5A8]/10"
            accent
          />
          <StatCard label="Pending verification" value={stats.unverified} icon={<Clock className="h-6 w-6 text-yellow-400" />} iconBg="bg-yellow-500/10" />
          <StatCard label="Admins" value={stats.admins} icon={<Crown className="h-6 w-6 text-violet-400" />} iconBg="bg-violet-500/10" />
        </div>

        {/* Search + sliding pill filters */}
        <div className="bg-[#0F172A]/80 backdrop-blur p-4 rounded-2xl shadow-xl border border-white/[0.08] mb-6">
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-10 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[#F8FAFC] placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00E5A8]/30 focus:border-[#00E5A8]/60 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] rounded-full transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <SlidingTabs tabs={filterTabs} active={filter} onChange={setFilter} />
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl mb-6 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-5 w-5" />
              {error}
            </span>
            <button
              onClick={fetchUsers}
              className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline underline-offset-4"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-[#0F172A]/80 backdrop-blur rounded-2xl shadow-xl border border-white/[0.08] overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-14">
              <div className="bg-white/[0.04] h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-semibold text-[#F8FAFC] mb-2">No users found</h3>
              <p className="text-[#94A3B8] text-sm">
                {searchQuery ? 'Try adjusting your search' : 'No users registered yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/[0.03] border-b border-white/[0.06]">
                  <tr>
                    {['User', 'Email', 'Role', 'Email status', 'Joined', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3.5 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className="h-10 w-10 rounded-full flex items-center justify-center text-slate-950 font-bold"
                            style={{ background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)` }}
                          >
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-[#F8FAFC]">{u.name}</div>
                            <div className="text-xs text-slate-500">ID: {u._id.slice(-6)}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#F8FAFC]">{u.email}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {u.role === 'admin' ? (
                          <span
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full text-white"
                            style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}
                          >
                            <Crown className="h-3 w-3" />
                            ADMIN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full border border-white/[0.08] bg-white/[0.04] text-[#94A3B8]">
                            CUSTOMER
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {u.isEmailVerified ? (
                          <StatusPill
                            accent
                            icon={<CheckCircle className="h-3 w-3" />}
                            label={u.verifiedByAdmin ? 'Verified by admin' : 'Verified'}
                          />
                        ) : (
                          <StatusPill tone="yellow" icon={<Clock className="h-3 w-3" />} label="Pending" />
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-[#94A3B8]">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {!u.isEmailVerified ? (
                          <button
                            onClick={() => setVerifyTarget(u)}
                            disabled={verifyingId === u._id}
                            className="inline-flex items-center gap-2 px-4 py-2 text-slate-950 text-sm font-semibold rounded-xl transition-all hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)`,
                              boxShadow: `0 8px 20px -8px ${ACCENT}70`,
                            }}
                          >
                            {verifyingId === u._id ? (
                              <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Verifying…
                              </>
                            ) : (
                              <>
                                <Mail className="h-4 w-4" />
                                Verify email
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-sm text-[#94A3B8] font-medium">No action needed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-[#94A3B8]">
          Showing <span className="font-semibold text-[#F8FAFC]">{filteredUsers.length}</span> of{' '}
          <span className="font-semibold text-[#F8FAFC]">{users.length}</span> users
        </div>
      </div>

      {/* ══════ VERIFY CONFIRMATION MODAL ══════ */}
      {verifyTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setVerifyTarget(null);
          }}
        >
          <div className="bg-[#0F172A] border border-white/[0.08] rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="bg-[#00E5A8]/10 h-12 w-12 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-6 w-6" style={{ color: ACCENT }} />
            </div>
            <h2 className="text-lg font-bold text-[#F8FAFC] mb-1">Verify this user?</h2>
            <p className="text-[#94A3B8] text-sm mb-6">
              <span className="font-medium text-[#F8FAFC]">{verifyTarget.name}</span> ({verifyTarget.email})
              will be marked as email verified and can log in without an OTP.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setVerifyTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/[0.08] text-[#94A3B8] font-medium hover:bg-white/[0.04] hover:text-[#F8FAFC] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmVerifyUser}
                className="flex-1 px-4 py-2.5 rounded-xl text-slate-950 font-semibold transition-all hover:scale-[1.02]"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)`,
                  boxShadow: `0 8px 20px -8px ${ACCENT}70`,
                }}
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════ TOAST ══════ */}
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

/* ── Dark glass stat card ── */
const StatCard = ({ label, value, icon, iconBg, accent = false }) => (
  <div
    className={`bg-[#0F172A]/80 backdrop-blur p-5 rounded-2xl shadow-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
      accent ? 'border-[#00E5A8]/30 hover:border-[#00E5A8]/50' : 'border-white/[0.08] hover:border-white/[0.15]'
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[#94A3B8] text-sm font-medium">{label}</p>
        <p className="text-3xl font-bold text-[#F8FAFC] mt-1 tabular-nums">{value}</p>
      </div>
      <div className={`${iconBg} p-3 rounded-xl`}>{icon}</div>
    </div>
  </div>
);

/* ── Status pill ── */
const StatusPill = ({ icon, label, tone, accent = false }) => {
  const tones = {
    yellow: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
    orange: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full border ${
        accent ? 'bg-[#00E5A8]/10 border-[#00E5A8]/30' : tones[tone]
      }`}
      style={accent ? { color: ACCENT } : undefined}
    >
      {icon}
      {label}
    </span>
  );
};

export default AdminDashboard;