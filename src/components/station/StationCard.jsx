import React from 'react';
import { MapPin, DollarSign, Edit, Trash2, Zap, Star } from 'lucide-react';

const StationCard = ({ station, canManage, onEdit, onDelete, onViewDetails }) => {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002';

  // ✅ FIXED: Handle both Cloudinary URLs and old local paths
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If it's already a full Cloudinary URL, use it directly
    if (imagePath.startsWith('http')) return imagePath;
    
    // If it's an old local path (starts with /uploads/), try to construct URL
    // but note: these won't work in production due to ephemeral storage
    if (imagePath.startsWith('/uploads/')) {
      const filename = imagePath.replace('/uploads/', '');
      return `${API_BASE}/uploads/${filename}`;
    }
    
    // If it's just a filename, construct URL
    return `${API_BASE}/uploads/${imagePath}`;
  };

  const imageUrl = station.images?.[0] ? getImageUrl(station.images[0]) : null;

  // ✅ Debug: Check what URLs are being generated
  React.useEffect(() => {
    if (station.images?.[0]) {
      console.log('🖼️ Image Debug:', {
        stationName: station.name,
        imagePath: station.images[0],
        generatedUrl: getImageUrl(station.images[0]),
        isCloudinary: station.images[0]?.includes('cloudinary')
      });
    }
  }, [station]);

  const averageRating = station.averageRating || 0;
  const totalReviews = station.reviews?.length || 0;

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-3 w-3 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      );
    }
    return stars;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 group">
      <div 
        className="relative h-40 overflow-hidden cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50" 
        onClick={() => onViewDetails && onViewDetails(station._id)}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={station.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { 
              e.target.onerror = null; 
              e.target.style.display = 'none';
              // Show placeholder when image fails to load
              const placeholder = e.target.parentElement.querySelector('.image-placeholder');
              if (placeholder) placeholder.style.display = 'flex';
            }}
          />
        ) : null}
        
        {/* Always render placeholder, show when no image or image fails */}
        <div 
          className={`image-placeholder w-full h-full flex items-center justify-center text-gray-400 text-sm ${imageUrl ? 'hidden' : 'flex'}`}
        >
          No Image Available
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{station.name}</h3>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-0.5">{renderStars(averageRating)}</div>
          <span className="text-xs font-semibold text-gray-900">{averageRating.toFixed(1)}</span>
          <span className="text-xs text-gray-500">({totalReviews} reviews)</span>
        </div>

        <div className="flex items-start text-gray-600 mb-3">
          <MapPin className="h-4 w-4 mr-1.5 mt-0.5 flex-shrink-0" />
          <span className="text-sm line-clamp-2">{station.location}</span>
        </div>

        {station.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{station.description}</p>
        )}

        {station.chargerTypes?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {station.chargerTypes.slice(0, 2).map((type, idx) => (
              <span key={idx} className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-md font-medium border border-green-200">{type}</span>
            ))}
            {station.chargerTypes.length > 2 && (
              <span className="text-xs text-gray-500 self-center">+{station.chargerTypes.length - 2}</span>
            )}
          </div>
        )}

        <div className="flex items-center text-gray-900 font-bold text-base mb-3">
          <DollarSign className="h-4 w-4" />
          <span>₹{station.pricePerUnit || station.pricePerKwh}</span>
          <span className="text-xs text-gray-600 font-normal ml-1">/kWh</span>
        </div>

        {station.host && (
          <div className="text-xs text-gray-500 mb-3 pb-3 border-b border-gray-100">
            Hosted by: {station.host.name || station.host.email}
          </div>
        )}

        {!canManage ? (
          <button
            onClick={() => onViewDetails(station._id)}
            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            View Details & Book
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => onEdit(station)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              <Edit className="h-4 w-4" /> Edit
            </button>
            <button onClick={() => onDelete(station._id)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StationCard;