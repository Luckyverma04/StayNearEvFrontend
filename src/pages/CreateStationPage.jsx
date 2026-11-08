import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { stationService } from "../services/stationService";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/common/LoadingSpinner";
import LocationPicker from "../components/map/LocationPicker";
import { Zap, MapPin, IndianRupee, ImagePlus, Lock } from "lucide-react";

/* Same clearance as the other pages — your navbar is fixed */
const NAVBAR_CLEARANCE = "pt-32";

const gridStyle = {
  backgroundImage:
    "linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)",
  backgroundSize: "44px 44px",
};

const inputClass =
  "w-full bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all";

const labelClass = "block text-sm font-medium text-slate-300 mb-1.5";

const CreateStationPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // "Is this your charger? List it" se aaye to form pehle se bhara ho
  const fromPublic = params.get("from") === "public";
  const ALLOWED_TYPES = ["Type 2", "CCS2", "CHAdeMO", "GB/T", "Tesla Supercharger", "Bharat AC001", "Bharat DC001"];

  const [formData, setFormData] = useState(() => ({
    name: (params.get("name") || "").slice(0, 120),
    location: (params.get("location") || "").slice(0, 200),
    description: "",
    pricePerUnit: "",
    chargerTypes: (params.get("types") || "")
      .split(",")
      .map((t) => t.trim())
      .filter((t) => ALLOWED_TYPES.includes(t)),
  }));
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pin, setPin] = useState(() => {
    const lat = Number(params.get("lat"));
    const lng = Number(params.get("lng"));
    return params.get("lat") && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
      ? { lat, lng }
      : null;
  }); // { lat, lng } — map par station ki jagah

  // ✅ Handle text input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Handle file upload
  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files));
  };

  // ✅ Submit form — koi bhi logged-in user station bana sakta hai
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("Please login to create a station.");
      return;
    }

    try {
      setLoading(true);

      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "chargerTypes") {
          // If it's already an array (from checkboxes), use it directly
          if (Array.isArray(value)) {
            form.append(key, JSON.stringify(value));
          } else {
            // If it's a string (from dropdown), convert to array
            const typesArray = value.split(",").map((t) => t.trim()).filter((t) => t !== "");
            form.append(key, JSON.stringify(typesArray));
          }
        } else {
          form.append(key, value);
        }
      });

      // Map pin
      if (pin) {
        form.append("latitude", String(pin.lat));
        form.append("longitude", String(pin.lng));
      }

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
    return (
      <div className={`min-h-screen bg-slate-950 ${NAVBAR_CLEARANCE}`} style={gridStyle}>
        <LoadingSpinner message="Checking authentication..." />
      </div>
    );
  }

  // ✅ Sirf logged out user ko roko
  if (!user) {
    return (
      <div
        className={`min-h-screen bg-slate-950 flex items-center justify-center px-4 ${NAVBAR_CLEARANCE}`}
        style={gridStyle}
      >
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center max-w-md w-full">
          <div className="bg-red-500/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Login required</h1>
          <p className="text-slate-400 mb-6">
            Please login to add a charging station.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-5 py-2.5 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl transition-colors font-medium"
            >
              Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-950 relative ${NAVBAR_CLEARANCE} pb-16`}>
      <div className="absolute inset-0" style={gridStyle} aria-hidden="true" />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 h-[360px] w-[700px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(closest-side, #10b981, transparent)" }}
        aria-hidden="true"
      />

      <div className="relative max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-emerald-300 text-sm font-medium px-4 py-1.5 rounded-full mb-5 backdrop-blur-sm">
            <Zap className="h-4 w-4" />
            New station
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
            Add a charging station
          </h1>
          <p className="text-slate-400">
            Fill in the details below to list your station on the network.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-6 md:p-8 rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {fromPublic && (
              <div className="mb-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-sm text-emerald-100">
                <p className="font-semibold text-emerald-300 mb-1">⚡ Listing your charger</p>
                We've filled in the name, address, map pin and charger types we found. Please check them, add your
                price and a short description, then save. Once listed, drivers can book it on StayNearEV.
              </div>
            )}

            <div>
              <label className={labelClass}>
                Station name <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                placeholder="e.g. GreenCharge Hub, MG Road"
                value={formData.name}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Location <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  name="location"
                  placeholder="Enter station location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Pin on map <span className="text-slate-500 font-normal">(recommended)</span>
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Drivers use this to find your station and see how far it is.
              </p>
              <LocationPicker
                value={pin}
                onChange={setPin}
                onAddressFound={(addr) =>
                  !formData.location &&
                  setFormData((f) => ({ ...f, location: addr.split(",").slice(0, 3).join(",").trim() }))
                }
              />
            </div>

            <div>
              <label className={labelClass}>
                Description <span className="text-emerald-400">*</span>
              </label>
              <textarea
                name="description"
                placeholder="Describe your charging station — parking, amenities, access hours…"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                required
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label className={labelClass}>
                Price per unit (₹ per kWh) <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  type="number"
                  name="pricePerUnit"
                  placeholder="Enter price per kWh"
                  value={formData.pricePerUnit}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>

            <div>
              <label className={`${labelClass} mb-2`}>
                Charger types <span className="text-emerald-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-slate-700 bg-slate-800/50 rounded-xl p-4">
                {[
                  { value: "Type 2", label: "Type 2 (AC)" },
                  { value: "CCS2", label: "CCS2 (DC Fast)" },
                  { value: "CHAdeMO", label: "CHAdeMO" },
                  { value: "GB/T", label: "GB/T" },
                  { value: "Tesla Supercharger", label: "Tesla Supercharger" },
                  { value: "Bharat AC001", label: "Bharat AC001" },
                  { value: "Bharat DC001", label: "Bharat DC001" },
                ].map((charger) => (
                  <label
                    key={charger.value}
                    className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      formData.chargerTypes.includes(charger.value)
                        ? "bg-emerald-500/10 border border-emerald-500/30"
                        : "border border-transparent hover:bg-slate-800"
                    }`}
                  >
                    <input
                      type="checkbox"
                      value={charger.value}
                      checked={formData.chargerTypes.includes(charger.value)}
                      onChange={(e) => {
                        const { value, checked } = e.target;
                        let updatedTypes = [...formData.chargerTypes];
                        if (checked) {
                          updatedTypes.push(value);
                        } else {
                          updatedTypes = updatedTypes.filter((type) => type !== value);
                        }
                        setFormData({
                          ...formData,
                          chargerTypes: updatedTypes,
                        });
                      }}
                      className="rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                    />
                    <span
                      className={`text-sm ${
                        formData.chargerTypes.includes(charger.value)
                          ? "text-emerald-300 font-medium"
                          : "text-slate-300"
                      }`}
                    >
                      {charger.label}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Select all available charger types at this station
              </p>
            </div>

            <div>
              <label className={labelClass}>Station images</label>
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-700 hover:border-emerald-500/50 bg-slate-800/40 rounded-xl px-4 py-8 cursor-pointer transition-colors">
                <ImagePlus className="h-8 w-8 text-slate-500" />
                <span className="text-sm text-slate-400">
                  {images.length > 0
                    ? `${images.length} ${images.length === 1 ? "image" : "images"} selected`
                    : "Click to upload images"}
                </span>
                <span className="text-xs text-slate-600">You can select multiple images</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              {images.length > 0 && (
                <p className="text-xs text-emerald-400 mt-1.5">
                  {images.map((img) => img.name).join(", ")}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3.5 rounded-xl disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors font-semibold text-base inline-flex items-center justify-center gap-2"
            >
              <Zap className="h-5 w-5" />
              {loading ? "Creating station…" : "Create charging station"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateStationPage;