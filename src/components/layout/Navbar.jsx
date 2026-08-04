import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Zap, LogOut, Menu, X, Home, Plus, Crown, Shield, Battery,
  Calendar, Settings, LayoutDashboard, BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ACCENT = '#00E5A8';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);

  const userRole = user?.role?.toLowerCase() || 'customer';
  const currentPage = location.pathname;

  /* ── Sliding indicator ─────────────────────────────────────────
     One glowing pill slides behind the links. It rests on the
     active link and glides to whichever link you hover.        */
  const navRef = useRef(null);
  const linkRefs = useRef({});
  const hoverTimerRef = useRef(null); // hover-dwell → auto navigate
  const [indicator, setIndicator] = useState({ left: 0, width: 0, opacity: 0 });
  const [hoveredPath, setHoveredPath] = useState(null);

  /* How long the pill must rest on a link before that page auto-opens.
     Matches the pill's slide duration so it feels like "pill lands → page opens". */
  const HOVER_OPEN_DELAY = 450;

  const getRoleBadge = (role) => {
    const badges = {
      admin: {
        icon: <Crown className="h-3 w-3" />,
        gradient: 'linear-gradient(135deg, #a855f7, #6366f1)',
        label: 'ADMIN',
      },
      host: {
        icon: <Shield className="h-3 w-3" />,
        gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
        label: 'HOST',
      },
      customer: {
        icon: <Battery className="h-3 w-3" />,
        gradient: `linear-gradient(135deg, ${ACCENT}, #06D6A0)`,
        label: 'CUSTOMER',
      },
    };
    return badges[role?.toLowerCase()] || badges.customer;
  };

  const badge = getRoleBadge(userRole);

  const isActiveRoute = (path) =>
    currentPage === path || currentPage.startsWith(path + '/');

  /* Build nav links for the current role — same logic, one place */
  const navLinks = [];
  if (user) {
    navLinks.push({ path: '/', label: 'Home', icon: Home, active: currentPage === '/' });

    if (userRole === 'admin') {
      navLinks.push({
        path: '/admin/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        active: isActiveRoute('/admin/dashboard'),
      });
      navLinks.push({
        path: '/admin/bookings',
        label: 'All Bookings',
        icon: BookOpen,
        active: isActiveRoute('/admin/bookings'),
      });
    }

    if (userRole === 'customer') {
      navLinks.push({
        path: '/my-bookings',
        label: 'My Bookings',
        icon: Calendar,
        active: isActiveRoute('/my-bookings'),
      });
    }

    if (userRole === 'host') {
      navLinks.push({
        path: '/host/bookings',
        label: 'Manage Bookings',
        icon: Settings,
        active: isActiveRoute('/host/bookings'),
      });
    }
  }

  /* Move the pill to a given link's position */
  const moveIndicatorTo = useCallback((path) => {
    const el = linkRefs.current[path];
    const nav = navRef.current;
    if (!el || !nav) return;
    const navRect = nav.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    setIndicator({
      left: rect.left - navRect.left,
      width: rect.width,
      opacity: 1,
    });
  }, []);

  /* The pill follows hover; when nothing is hovered it rests on the active link */
  const targetPath =
    hoveredPath || navLinks.find((l) => l.active)?.path || null;

  useEffect(() => {
    if (targetPath) {
      moveIndicatorTo(targetPath);
    } else {
      setIndicator((ind) => ({ ...ind, opacity: 0 }));
    }
  }, [targetPath, moveIndicatorTo, user, userRole, currentPage]);

  /* Recalculate on window resize so the pill stays aligned */
  useEffect(() => {
    const onResize = () => targetPath && moveIndicatorTo(targetPath);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [targetPath, moveIndicatorTo]);

  const go = (path) => {
    navigate(path);
    setShowMenu(false);
  };

  /* Hover a link → pill slides there → after it settles, the page opens
     automatically. Moving to another link cancels and restarts the timer. */
  const handleLinkEnter = (link) => {
    setHoveredPath(link.path);
    clearTimeout(hoverTimerRef.current);
    if (!link.active) {
      hoverTimerRef.current = setTimeout(() => {
        navigate(link.path);
      }, HOVER_OPEN_DELAY);
    }
  };

  /* Leaving the nav cancels any pending auto-open */
  const handleNavLeave = () => {
    setHoveredPath(null);
    clearTimeout(hoverTimerRef.current);
  };

  /* Safety: clear pending timer if the navbar unmounts */
  useEffect(() => {
    return () => clearTimeout(hoverTimerRef.current);
  }, []);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-[#020617]/85 backdrop-blur-xl border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button onClick={() => go('/')} className="flex items-center gap-2.5 group">
            <div
              className="p-2 rounded-xl transition-shadow"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)`,
                boxShadow: `0 8px 20px -8px ${ACCENT}60`,
              }}
            >
              <Zap className="h-5 w-5 text-slate-950" />
            </div>
            <div className="hidden sm:block text-left">
              <span
                className="text-lg text-[#F8FAFC]"
                style={{ fontWeight: 700, letterSpacing: '0.5px' }}
              >
                StayNear<span style={{ color: ACCENT }}>Ev</span>
              </span>
              <div className="text-[10px] text-[#94A3B8] -mt-0.5 uppercase" style={{ letterSpacing: '1.5px' }}>
                Charge your journey
              </div>
            </div>
          </button>

          {/* Desktop: links with SLIDING pill indicator */}
          {user && (
            <div
              ref={navRef}
              onMouseLeave={handleNavLeave}
              className="hidden md:flex relative items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-full p-1"
            >
              {/* The sliding pill — glides smoothly behind whichever link is hovered/active */}
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
              {navLinks.map((link) => {
                const highlighted =
                  hoveredPath === link.path || (!hoveredPath && link.active);
                return (
                  <button
                    key={link.path}
                    ref={(el) => (linkRefs.current[link.path] = el)}
                    onClick={() => go(link.path)}
                    onMouseEnter={() => handleLinkEnter(link)}
                    className={`relative z-10 flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-300 ${
                      highlighted ? 'text-slate-950' : 'text-[#94A3B8]'
                    }`}
                  >
                    <link.icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Desktop: right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {(userRole === 'host' || userRole === 'admin') && (
                  <button
                    onClick={() => go('/stations/create')}
                    className="flex items-center gap-1.5 px-4 py-2 text-slate-950 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.05] hover:shadow-xl"
                    style={{
                      background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)`,
                      boxShadow: `0 8px 24px -8px ${ACCENT}70`,
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Station</span>
                  </button>
                )}

                <div className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04]">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-950 font-bold text-sm"
                    style={{ background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)` }}
                  >
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-semibold text-[#F8FAFC] leading-tight">
                      {user.name}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 px-2 py-px text-white text-[10px] font-bold rounded-full"
                      style={{ background: badge.gradient, letterSpacing: '0.5px' }}
                    >
                      {badge.icon}
                      {badge.label}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    aria-label="Logout"
                    title="Logout"
                    className="ml-1 p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 hover:scale-110"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <span className="text-[#94A3B8] text-sm font-medium">
                Please login to continue
              </span>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Toggle menu"
            className="md:hidden p-2 rounded-lg text-slate-300 hover:bg-white/[0.06] transition-colors"
          >
            {showMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu — slides down smoothly */}
      <div
        className="md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-out bg-[#020617]/95 backdrop-blur-xl border-t border-white/[0.08]"
        style={{ maxHeight: showMenu ? 520 : 0, opacity: showMenu ? 1 : 0 }}
      >
        <div className="px-4 py-4 space-y-2">
          {user && (
            <>
              <div className="flex items-center gap-3 p-3 bg-white/[0.04] rounded-xl border border-white/[0.08] mb-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-slate-950 font-bold"
                  style={{ background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)` }}
                >
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#F8FAFC] truncate">{user.name}</p>
                  <p className="text-xs text-[#94A3B8] truncate">{user.email}</p>
                  <span
                    className="inline-flex items-center gap-1 mt-1 px-2 py-px text-white text-[10px] font-bold rounded-full"
                    style={{ background: badge.gradient, letterSpacing: '0.5px' }}
                  >
                    {badge.icon}
                    {badge.label}
                  </span>
                </div>
              </div>

              {navLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => go(link.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl font-medium transition-colors ${
                    link.active ? 'text-slate-950' : 'text-slate-300 hover:bg-white/[0.06]'
                  }`}
                  style={
                    link.active
                      ? { background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)` }
                      : undefined
                  }
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </button>
              ))}

              {(userRole === 'host' || userRole === 'admin') && (
                <button
                  onClick={() => go('/stations/create')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-slate-950 rounded-xl font-semibold"
                  style={{
                    background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)`,
                    boxShadow: `0 8px 24px -8px ${ACCENT}70`,
                  }}
                >
                  <Plus className="h-5 w-5" />
                  Add Charging Station
                </button>
              )}

              <button
                onClick={() => {
                  logout();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl font-medium"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </>
          )}
          {!user && (
            <p className="text-[#94A3B8] text-sm font-medium text-center py-2">
              Please login to continue
            </p>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;