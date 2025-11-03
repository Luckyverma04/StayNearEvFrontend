import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/layout/Navbar";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import EditStationPage from "./pages/EditStationPage";
import StationDetailPage from "./pages/StationDetailPage";
import LoadingSpinner from "./components/common/LoadingSpinner";
import CreateStationPage from "./pages/CreateStationPage";
import MyBookingsPage from './pages/MyBookingPage';
import HostBookingsPage from './pages/HostBookingPage';
import EmailVerification from './components/auth/EmailVerification';
import AdminDashboard from './pages/admin/AdminDashboard';
const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner message="Loading application..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Don't show navbar on login and email verification pages */}
      {user && <Navbar />}
      
      <Routes>
        {/* ✅ PUBLIC ROUTES - Available to everyone */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        
        {!user ? (
          /* If not logged in, redirect to login */
          <Route path="*" element={<Navigate to="/login" replace />} />
        ) : (
          /* ✅ PROTECTED ROUTES - Only for logged-in users */
          <>
            <Route path="/" element={<HomePage />} />
            <Route path="/stations/:id" element={<StationDetailPage />} />
            <Route path="/stations/edit/:id" element={<EditStationPage />} />
            <Route path="/stations/create" element={<CreateStationPage />} />
            <Route path="/my-bookings" element={<MyBookingsPage />} />
            <Route path="/host/bookings" element={<HostBookingsPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
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