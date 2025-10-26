import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { stationService } from "../services/stationService";
import { useAuth } from "../context/AuthContext";
import StationCard from "../components/station/StationCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { Zap, MapPin, Search } from "lucide-react";

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const response = await stationService.getAllStations();
      
      let stationsData = [];
      if (response.data && Array.isArray(response.data.stations)) {
        stationsData = response.data.stations;
      } else if (response.data && Array.isArray(response.data)) {
        stationsData = response.data;
      } else if (Array.isArray(response.stations)) {
        stationsData = response.stations;
      } else if (Array.isArray(response)) {
        stationsData = response;
      }
      
      setStations(stationsData);
    } catch (err) {
      console.error("Error fetching stations:", err);
      setError("Failed to load charging stations");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (stationId) => {
    navigate(`/stations/${stationId}`);
  };

  const handleEdit = (station) => {
    navigate(`/stations/edit/${station._id}`);
  };

  const handleDelete = async (stationId) => {
    if (!window.confirm("Are you sure you want to delete this charging station?")) return;

    try {
      await stationService.deleteStation(stationId);
      await fetchStations();
    } catch (err) {
      console.error("Error deleting station:", err);
      alert("Failed to delete station");
    }
  };

  // Filter stations based on search
  const filteredStations = stations.filter(station =>
    station.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    station.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner message="Loading charging stations..." />;
  if (error) return <div className="text-center text-red-600 py-8">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <Zap className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              {user?.role === 'admin' ? 'All Charging Stations' : 'Find EV Charging Stations'}
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {user?.role === 'admin' 
              ? 'Manage all charging stations in the system' 
              : 'Discover and book electric vehicle charging points near you'
            }
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by station name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Stations</p>
                <p className="text-2xl font-bold text-gray-900">{stations.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Available Now</p>
                <p className="text-2xl font-bold text-gray-900">{stations.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Station List */}
        {filteredStations.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <Zap className="h-20 w-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-xl mb-2">
              {searchTerm ? 'No stations found matching your search' : 'No charging stations available'}
            </p>
            <p className="text-gray-400 text-sm">
              {searchTerm ? 'Try a different search term' : 'Check back later for new stations'}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredStations.length}</span> charging {filteredStations.length === 1 ? 'station' : 'stations'}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStations.map((station) => {
                const canManage = user && (
                  user.role === "admin" || 
                  (user.role === "host" && station.host?._id === user._id) ||
                  (user.role === "host" && station.host === user._id)
                );

                return (
                  <StationCard
                    key={station._id}
                    station={station}
                    canManage={canManage}
                    userRole={user?.role}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onViewDetails={handleViewDetails}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;