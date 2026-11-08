import React, { useState } from 'react';
import { MapPin, Edit, Trash2, Zap, Star, ImageOff, Navigation } from 'lucide-react';
import { formatDistance } from '../../utils/geo';
import { useTilt } from '../../hooks/useTilt';

const ACCENT = '#22D3EE';

const StationCard = ({ station, canManage, isOwn, onEdit, onDelete, onViewDetails, distanceKm }) => {
  const tilt = useTilt();
  // Uploads server root par hain (/uploads), /api ke andar nahi — isliye /api hata do
  const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3002').replace(/\/+$/, '').replace(/\/api$/, '');

  /* Image fail hone par state se fallback — pehle DOM ko direct
     chhed rahe the, jo React re-render pe reset ho jata tha aur
     browser ka broken-image icon dikhne lagta tha. */
  const [imgFailed, setImgFailed] = useState(false);

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

  const rawImage = station.images?.[0];
  const imageUrl = rawImage ? getImageUrl(rawImage) : null;
  const showImage = Boolean(imageUrl) && !imgFailed;

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
    <div
      ref={tilt.ref}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
      className="snev-tilt relative bg-[#0E1130] rounded-2xl overflow-hidden border border-white/[0.08] shadow-xl transition-[box-shadow,border-color] duration-300 sm:hover:shadow-2xl hover:border-[#22D3EE]/40 hover:shadow-[#22D3EE]/15 group"
    >
      <span className="snev-glare" aria-hidden="true" />
      {/* ── Image — full preview, no cut ── */}
      <div
        className="relative aspect-[16/9] overflow-hidden cursor-pointer bg-[#05061A]"
        onClick={() => onViewDetails && onViewDetails(station._id)}
      >
        {showImage ? (
          <img
            src={imageUrl}
            alt={station.name}
            loading="lazy"
            className="w-full h-full object-cover sm:group-hover:scale-[1.06] transition-transform duration-500"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-slate-700">
            {imgFailed ? (
              <>
                <ImageOff className="h-8 w-8" />
                <span className="text-[10px] text-slate-600">Image unavailable</span>
              </>
            ) : (
              <Zap className="h-10 w-10" />
            )}
          </div>
        )}

        {/* Apna station hone par badge */}
        {isOwn && (
          <span
            className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-950"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, #8B5CF6)` }}
          >
            Your station
          </span>
        )}
      </div>

      {/* ── Body: name → stars → address → price → buttons ── */}
      <div className="p-4">
        {/* Station name */}
        <h3
          className="text-base font-bold text-[#F8FAFC] mb-1.5 line-clamp-1 cursor-pointer transition-colors group-hover:text-[#22D3EE]"
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
        {station.isDemo && (
          <span className="inline-block mb-2 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Demo · testing only
          </span>
        )}
        <div className="flex items-center text-[#94A3B8] mb-2.5">
          <MapPin className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" style={{ color: ACCENT }} />
          <span className="text-xs line-clamp-1">{station.location}</span>
          {distanceKm != null && (
            <span className="ml-auto pl-2 inline-flex items-center gap-1 text-[11px] font-semibold text-sky-300 shrink-0">
              <Navigation className="h-3 w-3" />
              {formatDistance(distanceKm)}
            </span>
          )}
        </div>

        {/* Charger type chips */}
        {station.chargerTypes?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {station.chargerTypes.slice(0, 2).map((type, idx) => (
              <span
                key={idx}
                className="bg-[#22D3EE]/10 text-[11px] px-2 py-0.5 rounded-md font-medium border border-[#22D3EE]/20"
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
          <span className="text-lg font-bold text-[#F8FAFC]">
            {price != null ? `₹${price}` : 'Price on request'}
          </span>
          {price != null && <span className="text-xs text-[#94A3B8]">/kWh</span>}
          {ownerName && !isOwn && (
            <span className="ml-auto text-[11px] text-slate-500 line-clamp-1 max-w-[45%]">
              by {ownerName}
            </span>
          )}
        </div>

        {/* Buttons */}
        {!canManage ? (
          <button
            onClick={() => onViewDetails(station._id)}
            className="w-full px-3 py-2.5 text-slate-950 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.98] sm:hover:scale-[1.02]"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, #8B5CF6)`,
              boxShadow: `0 8px 20px -8px ${ACCENT}70`,
            }}
          >
            View & Book
          </button>
        ) : (
          <div className="space-y-2">
            {/* Owner ko bhi booking page ka rasta chahiye */}
            <button
              onClick={() => onViewDetails(station._id)}
              className="w-full px-3 py-2.5 text-slate-950 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.98] sm:hover:scale-[1.02]"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, #8B5CF6)`,
                boxShadow: `0 8px 20px -8px ${ACCENT}70`,
              }}
            >
              View details
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(station)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-[#F8FAFC] border border-white/[0.08] rounded-xl transition-all duration-200 active:scale-95 sm:hover:scale-[1.03] text-sm font-medium"
              >
                <Edit className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                onClick={() => onDelete(station._id)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl transition-all duration-200 active:scale-95 sm:hover:scale-[1.03] text-sm font-medium"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StationCard;