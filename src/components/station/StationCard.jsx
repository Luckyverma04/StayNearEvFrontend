import React from 'react';
import { MapPin, Edit, Trash2, Zap, Star } from 'lucide-react';

const ACCENT = '#00E5A8';

const StationCard = ({ station, canManage, isOwn, onEdit, onDelete, onViewDetails }) => {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002';

  // Handles both Cloudinary URLs and old local paths
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads/')) {
      const filename = imagePath.replace('/uploads/', '');
      return `${API_BASE}/uploads/${filename}`;
    }
    return `${API_BASE}/uploads/${imagePath}`;
  };

  const imageUrl = station.images?.[0] ? getImageUrl(station.images[0]) : null;
  const averageRating = station.averageRating || 0;
  const totalReviews = station.reviews?.length || 0;
  const price = station.pricePerUnit || station.pricePerKwh;

  // Station kisne banaya — populate hua ho to object, warna sirf id
  const ownerName =
    typeof station.createdBy === 'object' && station.createdBy !== null
      ? station.createdBy.name || station.createdBy.email
      : null;

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < Math.floor(rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-slate-700'
          }`}
        />
      );
    }
    return stars;
  };

  return (
    <div className="bg-[#0F172A] rounded-2xl overflow-hidden border border-white/[0.08] shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:border-[#00E5A8]/40 hover:shadow-[#00E5A8]/10 group">
      {/* ── Image — full preview, no cut ── */}
      <div
        className="relative aspect-[16/9] overflow-hidden cursor-pointer bg-[#020617]"
        onClick={() => onViewDetails && onViewDetails(station._id)}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={station.name}
            className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
              const placeholder = e.target.parentElement.querySelector('.image-placeholder');
              if (placeholder) placeholder.style.display = 'flex';
            }}
          />
        ) : null}

        <div
          className={`image-placeholder w-full h-full items-center justify-center text-slate-700 ${
            imageUrl ? 'hidden' : 'flex'
          }`}
        >
          <Zap className="h-10 w-10" />
        </div>

        {/* Apna station hone par badge */}
        {isOwn && (
          <span
            className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-950"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)` }}
          >
            Your station
          </span>
        )}
      </div>

      {/* ── Body: name → stars → address → price → buttons ── */}
      <div className="p-4">
        {/* Station name */}
        <h3
          className="text-base font-bold text-[#F8FAFC] mb-1.5 line-clamp-1 cursor-pointer transition-colors group-hover:text-[#00E5A8]"
          onClick={() => onViewDetails && onViewDetails(station._id)}
        >
          {station.name}
        </h3>

        {/* Star rating */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex items-center gap-0.5">{renderStars(averageRating)}</div>
          <span className="text-xs font-semibold text-[#F8FAFC]">
            {averageRating.toFixed(1)}
          </span>
          <span className="text-xs text-[#94A3B8]">({totalReviews})</span>
        </div>

        {/* Address */}
        <div className="flex items-center text-[#94A3B8] mb-2.5">
          <MapPin className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" style={{ color: ACCENT }} />
          <span className="text-xs line-clamp-1">{station.location}</span>
        </div>

        {/* Charger type chips */}
        {station.chargerTypes?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {station.chargerTypes.slice(0, 2).map((type, idx) => (
              <span
                key={idx}
                className="bg-[#00E5A8]/10 text-[11px] px-2 py-0.5 rounded-md font-medium border border-[#00E5A8]/20"
                style={{ color: ACCENT }}
              >
                {type}
              </span>
            ))}
            {station.chargerTypes.length > 2 && (
              <span className="text-[11px] text-slate-500 self-center">
                +{station.chargerTypes.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Price row */}
        <div className="flex items-baseline gap-1 mb-3.5 pb-3.5 border-b border-white/[0.06]">
          <span className="text-lg font-bold text-[#F8FAFC]">₹{price}</span>
          <span className="text-xs text-[#94A3B8]">/kWh</span>
          {ownerName && (
            <span className="ml-auto text-[11px] text-slate-500 line-clamp-1">
              by {ownerName}
            </span>
          )}
        </div>

        {/* Buttons */}
        {!canManage ? (
          <button
            onClick={() => onViewDetails(station._id)}
            className="w-full px-3 py-2.5 text-slate-950 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)`,
              boxShadow: `0 8px 20px -8px ${ACCENT}70`,
            }}
          >
            View & Book
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(station)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-[#F8FAFC] border border-white/[0.08] rounded-xl transition-all duration-200 hover:scale-[1.03] text-sm font-medium"
            >
              <Edit className="h-3.5 w-3.5" /> Edit
            </button>
            <button
              onClick={() => onDelete(station._id)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl transition-all duration-200 hover:scale-[1.03] text-sm font-medium"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StationCard;