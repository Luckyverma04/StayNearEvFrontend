import React from "react";
import { Star, Edit, Trash2 } from "lucide-react";

const ReviewList = ({ 
  reviews = [], 
  onEdit, 
  onDelete, 
  user, 
  stationHostId,
  currentUserId,    // Add this prop
  currentUserRole   // Add this prop
}) => {
  
  // Use the explicit props instead of nested user object
  const effectiveUserId = currentUserId || user?._id || user?.id;
  const effectiveUserRole = currentUserRole || user?.role;

  if (!reviews.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-lg">No reviews yet.</p>
        <p className="text-gray-400 text-sm mt-2">Be the first to share your experience!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Customer Reviews</h3>

      {reviews.map((review) => {
        // Enhanced debugging with correct props
        console.log('=== REVIEW DEBUG INFO ===');
        console.log('Review ID:', review._id);
        console.log('Review User ID:', review.user?._id || review.userId);
        console.log('Current User ID:', effectiveUserId);
        console.log('Current User Role:', effectiveUserRole);
        console.log('Station Host ID:', stationHostId);
        console.log('Review User Object:', review.user);

        // Determine who can manage this review with correct IDs
        const isReviewOwner = effectiveUserId && (effectiveUserId === (review.user?._id || review.userId));
        const isAdmin = effectiveUserRole === 'admin';
        const isStationHost = effectiveUserRole === 'host' && stationHostId && (effectiveUserId === stationHostId);
        
        const canEdit = isReviewOwner || isAdmin;
        const canDelete = isReviewOwner || isAdmin || isStationHost;

        console.log('Permissions - Owner:', isReviewOwner, 'Admin:', isAdmin, 'Host:', isStationHost);
        console.log('Can Edit:', canEdit, 'Can Delete:', canDelete);
        console.log('========================');

        return (
          <div
            key={review._id}
            className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Review Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">
                    {review.user?.name?.charAt(0) || review.user?.email?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {review.user?.name || review.user?.email || 'Anonymous User'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Star Rating */}
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {review.rating}.0
                </span>
              </div>
            </div>

            {/* Review Comment */}
            <p className="text-gray-700 leading-relaxed mb-4">{review.comment}</p>

            {/* Action Buttons - Role Based */}
            {(canEdit || canDelete) && (
              <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                <div className="flex gap-3">
                  {/* Edit Button - Owner & Admin */}
                  {canEdit && (
                    <button
                      onClick={() => onEdit(review)}
                      className="flex items-center gap-2 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                  )}

                  {/* Delete Button - Owner, Admin & Host */}
                  {canDelete && (
                    <button
                      onClick={() => onDelete(review._id)}
                      className="flex items-center gap-2 px-3 py-1 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ReviewList;