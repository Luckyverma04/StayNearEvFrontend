import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Zap, LogOut, Menu, X, Home, Plus, Crown, Shield, Battery, Calendar, Settings, LayoutDashboard, Users, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);

  // ✅ Get role from user object
  const userRole = user?.role?.toLowerCase() || 'customer';
  
  // ✅ Get current page from location
  const currentPage = location.pathname;

  // ✅ Debug log
  console.log('🔍 Navbar Debug:', {
    user: user,
    role: user?.role,
    userRole: userRole,
    currentPage: currentPage
  });

  const getRoleBadge = (role) => {
    const badges = {
      admin: {
        icon: <Crown className="h-3 w-3" />,
        bg: 'bg-purple-600',
        label: 'ADMIN'
      },
      host: {
        icon: <Shield className="h-3 w-3" />,
        bg: 'bg-blue-600',
        label: 'HOST'
      },
      customer: {
        icon: <Battery className="h-3 w-3" />,
        bg: 'bg-green-600',
        label: 'CUSTOMER'
      }
    };
    return badges[role?.toLowerCase()] || badges.customer;
  };

  const badge = getRoleBadge(userRole);

  const isActiveRoute = (path) => {
    return currentPage === path || currentPage.startsWith(path + '/');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="bg-blue-600 p-2 rounded-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-gray-900">StayNearEv</span>
              <div className="text-xs text-gray-500 -mt-1">Charge Your Journey</div>
            </div>
          </button>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-3">
            {user && (
              <>
                {/* Home Button */}
                <button
                  onClick={() => navigate('/')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === '/'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </button>

                {/* Admin Dashboard Button - Only for Admin */}
                {userRole === 'admin' && (
                  <>
                    <button
                      onClick={() => navigate('/admin/dashboard')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        isActiveRoute('/admin/dashboard')
                          ? 'bg-purple-600 text-white'
                          : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200'
                      }`}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboard</span>
                    </button>

                    {/* ✅ NEW: All Bookings Button - Only for Admin */}
                    <button
                      onClick={() => navigate('/admin/all-bookings')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        isActiveRoute('/admin/all-bookings')
                          ? 'bg-purple-600 text-white'
                          : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200'
                      }`}
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>All Bookings</span>
                    </button>

                    {/* ✅ NEW: Manage Hosts Button - Only for Admin */}
                    <button
                      onClick={() => navigate('/admin/hosts')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        isActiveRoute('/admin/hosts')
                          ? 'bg-purple-600 text-white'
                          : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200'
                      }`}
                    >
                      <Users className="h-4 w-4" />
                      <span>Manage Hosts</span>
                    </button>
                  </>
                )}

                {/* My Bookings - For Customers */}
                {userRole === 'customer' && (
                  <button
                    onClick={() => navigate('/my-bookings')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      isActiveRoute('/my-bookings')
                        ? 'bg-green-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Calendar className="h-4 w-4" />
                    <span>My Bookings</span>
                  </button>
                )}

                {/* Manage Bookings - For Hosts */}
                {userRole === 'host' && (
                  <>
                    <button
                      onClick={() => navigate('/host/bookings')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        isActiveRoute('/host/bookings')
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Manage Bookings</span>
                    </button>

                    {/* Add Station Button */}
                    <button
                      onClick={() => navigate('/stations/create')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Station</span>
                    </button>
                  </>
                )}

                {/* User Profile */}
                <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900">
                      {user.name}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${badge.bg} text-white text-xs font-semibold rounded`}>
                      {badge.icon}
                      {badge.label}
                    </span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            )}

            {!user && (
              <div className="text-gray-600 font-medium">
                Please login to continue
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {showMenu ? (
              <X className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMenu && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-4 space-y-3">
            {user && (
              <>
                {/* User Info Card */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-600">{user.email}</p>
                    <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 ${badge.bg} text-white text-xs font-semibold rounded`}>
                      {badge.icon}
                      {badge.label}
                    </span>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <button
                  onClick={() => {
                    navigate('/');
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  <Home className="h-5 w-5" />
                  Home
                </button>

                {/* Admin Dashboard Button - Mobile - Only for Admin */}
                {userRole === 'admin' && (
                  <>
                    <button
                      onClick={() => {
                        navigate('/admin/dashboard');
                        setShowMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg font-medium transition-colors ${
                        isActiveRoute('/admin/dashboard')
                          ? 'bg-purple-600 text-white'
                          : 'text-purple-700 bg-purple-50 border border-purple-200'
                      }`}
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      Admin Dashboard
                    </button>

                    {/* ✅ NEW: All Bookings Button - Mobile - Only for Admin */}
                    <button
                      onClick={() => {
                        navigate('/admin/all-bookings');
                        setShowMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg font-medium transition-colors ${
                        isActiveRoute('/admin/all-bookings')
                          ? 'bg-purple-600 text-white'
                          : 'text-purple-700 bg-purple-50 border border-purple-200'
                      }`}
                    >
                      <BookOpen className="h-5 w-5" />
                      All Bookings
                    </button>

                    {/* ✅ NEW: Manage Hosts Button - Mobile - Only for Admin */}
                    <button
                      onClick={() => {
                        navigate('/admin/hosts');
                        setShowMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg font-medium transition-colors ${
                        isActiveRoute('/admin/hosts')
                          ? 'bg-purple-600 text-white'
                          : 'text-purple-700 bg-purple-50 border border-purple-200'
                      }`}
                    >
                      <Users className="h-5 w-5" />
                      Manage Hosts
                    </button>
                  </>
                )}

                {/* My Bookings - For Customers */}
                {userRole === 'customer' && (
                  <button
                    onClick={() => {
                      navigate('/my-bookings');
                      setShowMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg font-medium transition-colors ${
                      isActiveRoute('/my-bookings')
                        ? 'bg-green-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Calendar className="h-5 w-5" />
                    My Bookings
                  </button>
                )}

                {/* Manage Bookings - For Hosts */}
                {userRole === 'host' && (
                  <>
                    <button
                      onClick={() => {
                        navigate('/host/bookings');
                        setShowMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg font-medium transition-colors ${
                        isActiveRoute('/host/bookings')
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Settings className="h-5 w-5" />
                      Manage Bookings
                    </button>

                    <button
                      onClick={() => {
                        navigate('/stations/create');
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium"
                    >
                      <Plus className="h-5 w-5" />
                      Add Charging Station
                    </button>
                  </>
                )}

                {/* Logout Button */}
                <button
                  onClick={() => {
                    logout();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-red-600 text-white rounded-lg font-medium"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;