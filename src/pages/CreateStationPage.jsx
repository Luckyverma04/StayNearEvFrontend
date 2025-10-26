import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { stationService } from "../services/stationService";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/common/LoadingSpinner";

const CreateStationPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
    pricePerUnit: "",
    chargerTypes: "",
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // ✅ Check if user has permission to create stations
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== "host" && user.role !== "admin") {
        setAccessDenied(true);
      }
    }
  }, [user, authLoading]);

  // ✅ Handle text input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Handle file upload
  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files));
  };

  // ✅ Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user || (user.role !== "host" && user.role !== "admin")) {
      alert("Access denied. Only hosts and admins can create stations.");
      return;
    }

    try {
      setLoading(true);

      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "chargerTypes") {
          // Convert comma-separated string to array
          const typesArray = value.split(",").map((t) => t.trim()).filter(t => t !== "");
          form.append(key, JSON.stringify(typesArray));
        } else {
          form.append(key, value);
        }
      });
      
      // Append images
      images.forEach((img) => form.append("images", img));

      const response = await stationService.createStation(form);
      
      if (response.success) {
        alert("✅ Station created successfully!");
        navigate("/");
      } else {
        alert("❌ Failed to create station: " + (response.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Error creating station:", err);
      alert("❌ Failed to create station: " + (err.response?.data?.message || "Please try again"));
    } finally {
      setLoading(false);
    }
  };

  // ✅ Show loading while checking auth
  if (authLoading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  // ✅ Show access denied message
  if (accessDenied || !user) {
    return (
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-md mt-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-4">
          {!user ? "Please login to create charging stations." : "You need to be a host or admin to create charging stations."}
        </p>
        <div className="flex gap-4 justify-center">
          {!user && (
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Login
            </button>
          )}
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-md mt-8">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Add New Charging Station ⚡
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Station Name *
          </label>
          <input
            type="text"
            name="name"
            placeholder="Enter station name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location *
          </label>
          <input
            type="text"
            name="location"
            placeholder="Enter station location"
            value={formData.location}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            name="description"
            placeholder="Describe your charging station"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            required
            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price per Unit (₹ per kWh) *
          </label>
          <input
            type="number"
            name="pricePerUnit"
            placeholder="Enter price per kWh"
            value={formData.pricePerUnit}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Charger Types
          </label>
          <input
            type="text"
            name="chargerTypes"
            placeholder="e.g., Type2, CCS, CHAdeMO (comma separated)"
            value={formData.chargerTypes}
            onChange={handleChange}
            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Separate multiple charger types with commas
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Station Images
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            You can select multiple images
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
        >
          {loading ? "Creating Station..." : "Create Charging Station"}
        </button>
      </form>
    </div>
  );
};

export default CreateStationPage;