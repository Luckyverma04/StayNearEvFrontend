import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Zap, LogOut, Menu, X, Home, Plus, Crown, Battery,
  Calendar, LayoutDashboard, BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ACCENT = '#00E5A8';

/* Ek hi jagah se route control — HomePage mein bhi yahi path use hota hai */
const ADD_STATION_PATH = '/stations/create';

/* In pages par navbar bilkul render nahi hoga.
   Apne actual auth routes yahan add/remove kar lena. */
const AUTH_ROUTES = ['/login', '/verify-otp', '/signup', '/register', '/forgot-password', '/reset-password'];

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);

  const currentPage = location.pathname;

  /* Sirf tabhi logged-in maano jab asli user data ho.
     Sirf `user &&` kaafi nahi — AuthContext kabhi kabhi {} de deta hai,
     aur empty object JS mein truthy hota hai. Isi wajah se login page
     par bhi Add Station button dikh raha tha. */
  const isLoggedIn = Boolean(user?._id || user?.id || user?.email);

  const userRole = user?.role?.toLowerCase() || 'customer';

  /* ── Sliding indicator ─────────────────────────────────────────
     One glowing pill slides behind the links. It rests on the
     active link and glides to whichever link you hover.        */
  const navRef = useRef(null);
  const linkRefs = useRef({});
  const hoverTimerRef = useRef(null); // hover-dwell → auto navigate
  const [indicator, setIndicator] = useState({ left: 0, width: 0, opacity: 0 });
  const [hoveredPath, setHoveredPath] = useState(null);
  /* Sirf asli mouse wale device pe hover-open chalega.
     Touch screen pe tap se bhi mouseenter fire hota hai, jisse
     galat page khul jata tha — isliye ye check zaroori hai. */
  const [hasRealMouse, setHasRealMouse] = useState(false);

  const HOVER_OPEN_DELAY = 450;

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const apply = (e) => setHasRealMouse(e.matches);
    apply(mq);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const getRoleBadge = (role) => {
    const badges = {
      admin: {
        icon: <Crown className="h-3 w-3" />,
        gradient: 'linear-gradient(135deg, #a855f7, #6366f1)',
        label: 'ADMIN',
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

  /* Build nav links for the current role */
  const navLinks = [{ path: '/', label: 'Home', icon: Home, active: currentPage === '/' }];
  if (isLoggedIn) {

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

    // My Bookings sabko — admin bhi book kar sakta hai
    navLinks.push({
      path: '/my-bookings',
      label: 'My Bookings',
      icon: Calendar,
      active: isActiveRoute('/my-bookings'),
    });

    // Apni stations par aayi bookings
    navLinks.push({
      path: '/my-station-bookings',
      label: 'Station Bookings',
      icon: BookOpen,
      active: isActiveRoute('/my-station-bookings'),
    });
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

  const targetPath = hoveredPath || navLinks.find((l) => l.active)?.path || null;

  useEffect(() => {
    if (targetPath) {
      moveIndicatorTo(targetPath);
    } else {
      setIndicator((ind) => ({ ...ind, opacity: 0 }));
    }
  }, [targetPath, moveIndicatorTo, isLoggedIn, userRole, currentPage]);

  useEffect(() => {
    const onResize = () => targetPath && moveIndicatorTo(targetPath);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [targetPath, moveIndicatorTo]);

  /* Menu khula ho to background scroll lock */
  useEffect(() => {
    document.body.style.overflow = showMenu ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showMenu]);

  /* Route badalne par menu apne aap band */
  useEffect(() => {
    setShowMenu(false);
  }, [currentPage]);

  /* Pending hover timer clear on unmount */
  useEffect(() => {
    return () => clearTimeout(hoverTimerRef.current);
  }, []);

  /* Login / signup jaise pages par navbar hi mat dikhao.
     Ye hooks ke BAAD hona chahiye, warna React hook order tootega. */
  if (AUTH_ROUTES.includes(currentPage)) return null;

  const go = (path) => {
    navigate(path);
    setShowMenu(false);
  };

  /* Hover-dwell wapas — par sirf mouse wale device pe */
  const handleLinkEnter = (link) => {
    setHoveredPath(link.path);
    clearTimeout(hoverTimerRef.current);
    if (hasRealMouse && !link.active) {
      hoverTimerRef.current = setTimeout(() => {
        navigate(link.path);
      }, HOVER_OPEN_DELAY);
    }
  };

  const handleNavLeave = () => {
    setHoveredPath(null);
    clearTimeout(hoverTimerRef.current);
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-[#020617]/85 backdrop-blur-xl border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button onClick={() => go('/')} className="flex items-center gap-2.5 group shrink-0">
            <div
              className="p-2 rounded-xl transition-shadow"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)`,
                boxShadow: `0 8px 20px -8px ${ACCENT}60`,
              }}
            >
              <Zap className="h-5 w-5 text-slate-950" />
            </div>
            <div className="text-left">
              <span
                className="text-base sm:text-lg text-[#F8FAFC]"
                style={{ fontWeight: 700, letterSpacing: '0.5px' }}
              >
                StayNear<span style={{ color: ACCENT }}>Ev</span>
              </span>
              <div
                className="hidden sm:block text-[10px] text-[#94A3B8] -mt-0.5 uppercase"
                style={{ letterSpacing: '1.5px' }}
              >
                Charge your journey
              </div>
            </div>
          </button>

          {/* Desktop: links with SLIDING pill indicator */}
          {navLinks.length > 0 && (
            <div
              ref={navRef}
              onMouseLeave={handleNavLeave}
              className="hidden md:flex relative items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-full p-1"
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
              {navLinks.map((link) => {
                const highlighted =
                  hoveredPath === link.path || (!hoveredPath && link.active);
                return (
                  <button
                    key={link.path}
                    ref={(el) => (linkRefs.current[link.path] = el)}
                    onClick={() => go(link.path)}
                    onMouseEnter={() => handleLinkEnter(link)}
                    className={`relative z-10 flex items-center gap-2 px-3 lg:px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-300 whitespace-nowrap ${
                      highlighted ? 'text-slate-950' : 'text-[#94A3B8]'
                    }`}
                  >
                    <link.icon className="h-4 w-4 shrink-0" />
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Desktop: right side */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                {/* Har logged-in user station add kar sakta hai */}
                <button
                  onClick={() => go(ADD_STATION_PATH)}
                  className="flex items-center gap-1.5 px-4 py-2 text-slate-950 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.05] hover:shadow-xl"
                  style={{
                    background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)`,
                    boxShadow: `0 8px 24px -8px ${ACCENT}70`,
                  }}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden lg:inline">Add Station</span>
                  <span className="lg:hidden">Add</span>
                </button>

                <div className="flex items-center gap-2.5 pl-1.5 pr-2 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04]">
                  {/* Naam / photo par click → Profile */}
                  <button
                    type="button"
                    onClick={() => go('/profile')}
                    title="My profile"
                    className={`flex items-center gap-2.5 pl-1.5 pr-1 py-0.5 rounded-lg transition-colors hover:bg-white/[0.06] ${
                      isActiveRoute('/profile') ? 'bg-white/[0.06]' : ''
                    }`}
                  >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-[#00E5A8]/40"
                    />
                  ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-950 font-bold text-sm shrink-0"
                    style={{ background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)` }}
                  >
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  )}
                  <div className="hidden lg:flex flex-col items-start">
                    <span className="text-sm font-semibold text-[#F8FAFC] leading-tight max-w-[140px] truncate">
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
                  </button>
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
              <>
              {/* Guest bhi "Add Station" dabaa sake — route guard login par bhejega */}
              <button
                onClick={() => go(ADD_STATION_PATH)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm text-[#F8FAFC] border border-white/[0.12] hover:bg-white/[0.06] transition-colors"
              >
                <Plus className="h-4 w-4" />
                List your station
              </button>
              <button
                onClick={() => go('/login')}
                className="px-5 py-2 text-slate-950 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.05]"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)` }}
              >
                Login
              </button>
              </>
            )}
          </div>

          {/* Mobile: quick add + menu button (sirf logged-in user ko) */}
          <div className="flex items-center gap-1.5 md:hidden">
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => go(ADD_STATION_PATH)}
                  aria-label="Add station"
                  className="p-2 rounded-lg text-slate-950 transition-transform active:scale-90"
                  style={{ background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)` }}
                >
                  <Plus className="h-5 w-5" strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  aria-label="Toggle menu"
                  aria-expanded={showMenu}
                  className="p-2 rounded-lg text-slate-300 hover:bg-white/[0.06] transition-colors"
                >
                  {showMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </>
            ) : (
              <button
                onClick={() => go('/login')}
                className="px-4 py-2 text-slate-950 rounded-lg font-semibold text-sm transition-transform active:scale-95"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)` }}
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu — height ab viewport se bandhi hai, fixed 520px nahi.
          Pehle Add Station aur Logout 520px ke neeche clip ho rahe the. */}
      {isLoggedIn && (
        <div
          className="md:hidden transition-[max-height,opacity] duration-300 ease-out bg-[#020617]/95 backdrop-blur-xl border-t border-white/[0.08]"
          style={{
            maxHeight: showMenu ? 'calc(100vh - 4rem)' : 0,
            opacity: showMenu ? 1 : 0,
            overflowY: showMenu ? 'auto' : 'hidden',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div
            className="px-4 py-4 space-y-2"
            style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
          >
            <button
              type="button"
              onClick={() => go('/profile')}
              className="w-full text-left flex items-center gap-3 p-3 bg-white/[0.04] rounded-xl border border-white/[0.08] mb-3 active:scale-[0.99] transition-transform"
            >
              {user.avatar ? (
                <img src={user.avatar} alt="" referrerPolicy="no-referrer" className="w-11 h-11 rounded-full object-cover shrink-0" />
              ) : (
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-slate-950 font-bold shrink-0"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)` }}
              >
                {user.name?.charAt(0).toUpperCase()}
              </div>
              )}
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
              <span className="text-xs font-semibold shrink-0" style={{ color: ACCENT }}>Profile ›</span>
            </button>

            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => go(link.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl font-medium transition-colors active:scale-[0.98] ${
                  link.active ? 'text-slate-950' : 'text-slate-300 hover:bg-white/[0.06]'
                }`}
                style={
                  link.active
                    ? { background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)` }
                    : undefined
                }
              >
                <link.icon className="h-5 w-5 shrink-0" />
                {link.label}
              </button>
            ))}

            <div className="pt-2 border-t border-white/[0.08] space-y-2">
              <button
                onClick={() => go(ADD_STATION_PATH)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-slate-950 rounded-xl font-semibold transition-transform active:scale-[0.98]"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)`,
                  boxShadow: `0 8px 24px -8px ${ACCENT}70`,
                }}
              >
                <Plus className="h-5 w-5 shrink-0" />
                Add Charging Station
              </button>

              <button
                onClick={() => {
                  logout();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl font-medium transition-transform active:scale-[0.98]"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;