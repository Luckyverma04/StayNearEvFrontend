import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/layout/Navbar";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import EditStationPage from "./pages/EditStationPage";
import StationDetailPage from "./pages/StationDetailPage"; // ✅ ADDED IMPORT
import LoadingSpinner from "./components/common/LoadingSpinner";
import CreateStationPage from "./pages/CreateStationPage";
import MyBookingsPage from './pages/MyBookingPage';
import HostBookingsPage from './pages/HostBookingPage';
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
      <Navbar />
      <Routes>
        {!user ? (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            {/* ✅ All station routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/stations/:id" element={<StationDetailPage />} /> {/* ✅ ADDED ROUTE */}
            <Route path="/stations/edit/:id" element={<EditStationPage />} />
            <Route path="/stations/create" element={<CreateStationPage />} />
            <Route path="/my-bookings" element={<MyBookingsPage />} />
            <Route path="/host/bookings" element={<HostBookingsPage />} />
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