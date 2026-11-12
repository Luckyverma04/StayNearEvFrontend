import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { stationService } from "../services/stationService";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/common/LoadingSpinner";
import LocationPicker from "../components/map/LocationPicker";
import { hasCoords } from "../utils/geo";
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
  const [, setStation] = useState(null);
  const [pin, setPin] = useState(null); // { lat, lng }
  const [hadPin, setHadPin] = useState(false);

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

      if (hasCoords(stationData)) {
        setPin({ lat: Number(stationData.latitude), lng: Number(stationData.longitude) });
        setHadPin(true);
      }

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

      // Map pin — naya/badla hua bhejo, ya hataya ho to clear karo
      if (pin) {
        form.append("latitude", String(pin.lat));
        form.append("longitude", String(pin.lng));
      } else if (hadPin) {
        form.append("clearLocation", "true");
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
  if (error) return <div className="text-center text-red-400 py-8">{error}</div>;

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-[#05061A] pt-28 pb-16 px-4">
      <div className="max-w-3xl mx-auto bg-[#0E1130] border border-white/[0.08] p-6 rounded-2xl shadow-xl text-center">
        <h1 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h1>
        <p className="text-[#94A3B8] mb-6">
          You can only edit stations that you created.
        </p>

        <div className="flex gap-2 justify-center">
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-[#8B5CF6] text-white rounded-lg hover:bg-[#7C3AED]"
          >
            Back to Home
          </button>
          <button
            onClick={() => navigate("/stations/create")}
            className="px-4 py-2 bg-[#22D3EE] text-slate-950 font-semibold rounded-lg hover:bg-[#67E8F9]"
          >
            Create New Station
          </button>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05061A] pt-28 pb-16 px-4">
    <div className="max-w-3xl mx-auto bg-[#0E1130] border border-white/[0.08] p-6 rounded-2xl shadow-xl">
      <h1 className="text-2xl font-bold mb-6 text-center text-[#F8FAFC]">
        Edit Charging Station ⚡
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Station Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full border border-white/[0.12] px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/60 focus:border-[#22D3EE]/60 bg-[#05061A]/60 text-[#F8FAFC] placeholder:text-slate-500 [color-scheme:dark]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Location *
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            className="w-full border border-white/[0.12] px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/60 focus:border-[#22D3EE]/60 bg-[#05061A]/60 text-[#F8FAFC] placeholder:text-slate-500 [color-scheme:dark]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Pin on map
          </label>
          <div className="rounded-xl bg-[#0E1130] p-3">
            <LocationPicker value={pin} onChange={setPin} height={280} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            required
            className="w-full border border-white/[0.12] px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/60 focus:border-[#22D3EE]/60 bg-[#05061A]/60 text-[#F8FAFC] placeholder:text-slate-500 [color-scheme:dark]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
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
            className="w-full border border-white/[0.12] px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/60 focus:border-[#22D3EE]/60 bg-[#05061A]/60 text-[#F8FAFC] placeholder:text-slate-500 [color-scheme:dark]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Charger Types
          </label>
          <input
            type="text"
            name="chargerTypes"
            value={formData.chargerTypes}
            onChange={handleChange}
            placeholder="e.g., Type2, CCS, CHAdeMO"
            className="w-full border border-white/[0.12] px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/60 focus:border-[#22D3EE]/60 bg-[#05061A]/60 text-[#F8FAFC] placeholder:text-slate-500 [color-scheme:dark]"
          />
        </div>

        {/* Existing Images Display with Delete Option */}
        {existingImages.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Current Images ({existingImages.length})
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {existingImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={getImageUrl(image)}
                    alt={`Station ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-white/[0.08]"
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
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Add New Images
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="w-full border border-white/[0.12] px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/60 focus:border-[#22D3EE]/60 bg-[#05061A]/60 text-[#F8FAFC] [color-scheme:dark] file:mr-3 file:rounded-md file:border-0 file:bg-[#22D3EE]/15 file:px-3 file:py-1 file:text-[#22D3EE] file:font-medium"
          />
          {images.length > 0 && (
            <p className="text-sm text-emerald-400 mt-1">
              {images.length} new image(s) selected
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#22D3EE] text-slate-950 font-semibold py-3 rounded-lg hover:bg-[#67E8F9] disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Updating Station..." : "Update Station"}
        </button>
      </form>
    </div>
    </div>
  );
};

export default EditStationPage;