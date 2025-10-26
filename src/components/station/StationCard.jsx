import React from 'react';
import { MapPin, DollarSign, Edit, Trash2, Zap, Star } from 'lucide-react';

const StationCard = ({ station, canManage, onEdit, onDelete, onViewDetails }) => {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002';

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/placeholder-station.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    return `${API_BASE}/${cleanPath}`;
  };

  const imageUrl = station.images?.[0] 
    ? getImageUrl(station.images[0])
    : '/placeholder-station.jpg';

  const averageRating = station.averageRating || 0;
  const totalReviews = station.totalReviews || 0;

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-3 w-3 ${
            i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      );
    }
    return stars;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 group">
      {/* Image - Smaller height */}
      <div 
        className="relative h-40 overflow-hidden cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50" 
        onClick={() => onViewDetails && onViewDetails(station._id)}
      >
        <img
          src={imageUrl}
          alt={station.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/placeholder-station.jpg';
          }}
        />
        {station.images?.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-medium">
            +{station.images.length - 1} photos
          </div>
        )}
        
        {/* FIXED: Average Rating Badge instead of Charging Icon */}
        {averageRating > 0 ? (
          <div className="absolute top-2 left-2 bg-yellow-500 text-white px-3 py-1 rounded-lg shadow-lg flex items-center gap-1">
            <Star className="h-3 w-3 fill-white" />
            <span className="text-sm font-bold">{averageRating.toFixed(1)}</span>
          </div>
        ) : (
          <div className="absolute top-2 left-2 bg-gray-500 text-white px-3 py-1 rounded-lg shadow-lg flex items-center gap-1">
            <Star className="h-3 w-3 fill-white" />
            <span className="text-sm font-bold">0.0</span>
          </div>
        )}

        {/* Charging Icon - Moved to right side */}
        <div className="absolute top-2 right-2 bg-blue-600 text-white p-2 rounded-lg shadow-lg">
          <Zap className="h-4 w-4" />
        </div>
      </div>

      <div className="p-4">
        {/* Station Name */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
          {station.name}
        </h3>

        {/* Rating Details */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-0.5">
            {renderStars(averageRating)}
          </div>
          <span className="text-xs font-semibold text-gray-900">
            {averageRating.toFixed(1)}
          </span>
          <span className="text-xs text-gray-500">
            ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
          </span>
        </div>

        {/* Location */}
        <div className="flex items-start text-gray-600 mb-3">
          <MapPin className="h-4 w-4 mr-1.5 mt-0.5 flex-shrink-0" />
          <span className="text-sm line-clamp-2">{station.location}</span>
        </div>

        {/* Description */}
        {station.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {station.description}
          </p>
        )}

        {/* Charger Types */}
        {station.chargerTypes?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {station.chargerTypes.slice(0, 2).map((type, idx) => (
              <span
                key={idx}
                className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-md font-medium border border-green-200"
              >
                {type}
              </span>
            ))}
            {station.chargerTypes.length > 2 && (
              <span className="text-xs text-gray-500 self-center">
                +{station.chargerTypes.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center text-gray-900 font-bold text-base mb-3">
          <DollarSign className="h-4 w-4" />
          <span>₹{station.pricePerUnit || station.pricePerKwh}</span>
          <span className="text-xs text-gray-600 font-normal ml-1">/kWh</span>
        </div>

        {/* Host Info */}
        {station.host && (
          <div className="text-xs text-gray-500 mb-3 pb-3 border-b border-gray-100">
            Hosted by: {station.host.name || station.host.email}
          </div>
        )}

        {/* View Details Button or Action Buttons */}
        {!canManage ? (
          <button
            onClick={() => onViewDetails(station._id)}
            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            View Details & Book
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(station)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
            <button
              onClick={() => onDelete(station._id)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StationCard;