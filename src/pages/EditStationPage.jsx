import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { stationService } from "../services/stationService";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { Trash2 } from "lucide-react";

const EditStationPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
    pricePerUnit: "",
    chargerTypes: "",
  });
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [station, setStation] = useState(null);

  // Uploads server root par hain (/uploads), /api ke andar nahi — isliye /api hata do
  const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3002').replace(/\/+$/, '').replace(/\/api$/, '');

  useEffect(() => {
    if (id) {
      fetchStation();
    }
  }, [id]);

  const fetchStation = async () => {
    try {
      setLoading(true);

      const response = await stationService.getStationById(id);

      // Handle different API response structures
      let stationData = null;

      if (response.data && response.data.station) {
        stationData = response.data.station;
      } else if (response.data) {
        stationData = response.data;
      } else if (response.station) {
        stationData = response.station;
      } else {
        stationData = response;
      }

      setStation(stationData);

      if (!stationData) {
        setError("Station not found");
        return;
      }

      const canEdit = checkEditPermission(stationData, user);

      if (!canEdit) {
        setAccessDenied(true);
        return;
      }

      // Pre-fill form data properly
      setFormData({
        name: stationData.name || "",
        location: stationData.location || "",
        description: stationData.description || "",
        pricePerUnit: stationData.pricePerUnit || stationData.pricePerKwh || "",
        chargerTypes: Array.isArray(stationData.chargerTypes)
          ? stationData.chargerTypes.join(", ")
          : (stationData.chargerTypes || ""),
      });

      setExistingImages(stationData.images || []);

    } catch (err) {
      console.error("❌ Error fetching station:", err);
      setError("Failed to load station details: " + (err.message || "Please try again"));
    } finally {
      setLoading(false);
    }
  };

  // ✅ Admin sab edit kar sakta hai, baaki sirf apna banaya hua station
  const checkEditPermission = (stationData, user) => {
    if (!user) return false;

    if (user.role === "admin") return true;

    if (!stationData.createdBy) return false;

    const ownerId =
      stationData.createdBy._id?.toString() || stationData.createdBy.toString();
    const userId = user._id?.toString() || user.id?.toString();

    return ownerId === userId;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files));
  };

  const handleDeleteExistingImage = (imageIndex) => {
    const imageToDelete = existingImages[imageIndex];
    setImagesToDelete([...imagesToDelete, imageToDelete]);
    setExistingImages(existingImages.filter((_, index) => index !== imageIndex));
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/placeholder-station.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    return `${API_BASE}/${cleanPath}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      const form = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (key === "chargerTypes") {
          const typesArray = value.split(",").map((t) => t.trim()).filter(t => t !== "");
          form.append(key, JSON.stringify(typesArray));
        } else {
          form.append(key, value);
        }
      });

      if (imagesToDelete.length > 0) {
        form.append("imagesToDelete", JSON.stringify(imagesToDelete));
      }

      images.forEach((img) => form.append("images", img));

      await stationService.updateStation(id, form);
      alert("✅ Station updated successfully!");
      navigate("/");
    } catch (err) {
      console.error("❌ Error updating station:", err);
      alert("❌ Failed to update station: " + (err.response?.data?.message || "Please try again"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading station details..." />;
  if (error) return <div className="text-center text-red-600 py-8">{error}</div>;

  if (accessDenied) {
    return (
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-md mt-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You can only edit stations that you created.
        </p>

        <div className="flex gap-2 justify-center">
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Home
          </button>
          <button
            onClick={() => navigate("/stations/create")}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Create New Station
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-md mt-8">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Edit Charging Station ⚡
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Station Name *
          </label>
          <input
            type="text"
            name="name"
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
            value={formData.chargerTypes}
            onChange={handleChange}
            placeholder="e.g., Type2, CCS, CHAdeMO"
            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Existing Images Display with Delete Option */}
        {existingImages.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Images ({existingImages.length})
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {existingImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={getImageUrl(image)}
                    alt={`Station ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteExistingImage(index)}
                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Images Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add New Images
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {images.length > 0 && (
            <p className="text-sm text-green-600 mt-1">
              {images.length} new image(s) selected
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
        >
          {submitting ? "Updating Station..." : "Update Station"}
        </button>
      </form>
    </div>
  );
};

export default EditStationPage;