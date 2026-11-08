import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/layout/Navbar";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import EditStationPage from "./pages/EditStationPage";
import StationDetailPage from "./pages/StationDetailPage";
import LoadingSpinner from "./components/common/LoadingSpinner";
import CreateStationPage from "./pages/CreateStationPage";
import MyBookingsPage from './pages/MyBookingPage';
import MyStationBookingsPage from './pages/MyStationBookingsPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';
import ProfilePage from './pages/ProfilePage';

/* Login chahiye wale pages ke liye guard.
   Guest aaya to login par bhejo, aur login ke baad wapas yahi page khule. */
const RequireAuth = ({ children, role }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner message="Loading application..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar login/signup pages par khud hide ho jata hai */}
      <Navbar />

      <Routes>
        {/* ✅ PUBLIC - bina login ke bhi dashboard aur stations dikhenge */}
        <Route path="/" element={<HomePage />} />
        <Route path="/stations/:id" element={<StationDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />

        {/* 🔐 PROTECTED - station list karna / booking ke liye login zaroori */}
        <Route path="/stations/create" element={<RequireAuth><CreateStationPage /></RequireAuth>} />
        <Route path="/stations/edit/:id" element={<RequireAuth><EditStationPage /></RequireAuth>} />
        <Route path="/my-bookings" element={<RequireAuth><MyBookingsPage /></RequireAuth>} />
        <Route path="/my-station-bookings" element={<RequireAuth><MyStationBookingsPage /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />

        {/* 👑 ADMIN */}
        <Route path="/admin/dashboard" element={<RequireAuth role="admin"><AdminDashboard /></RequireAuth>} />
        <Route path="/admin/bookings" element={<RequireAuth role="admin"><AdminBookingsPage /></RequireAuth>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;