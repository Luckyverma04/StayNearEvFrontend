import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, BatteryCharging, ArrowLeft, Star, Zap, Car, Clock, MessageSquare } from 'lucide-react';
import { stationService } from '../services/stationService';
import { useAuth } from '../context/AuthContext';
import ReviewForm from '../components/common/ReviewForm';
import ReviewList from '../components/common/ReviewList';
import LoadingSpinner from '../components/common/LoadingSpinner';

const StationDetailPage = () => {
  const { user } = useAuth();
  const { id: stationId } = useParams();
  const navigate = useNavigate();

  const [station, setStation] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Station editing states
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    location: '',
    description: '',
    pricePerUnit: '',
    chargerTypes: '',
  });

  useEffect(() => {
    if (stationId) {
      fetchStationDetails();
      fetchReviews();
    }
  }, [stationId]);

  const fetchStationDetails = async () => {
    try {
      setLoading(true);
      const response = await stationService.getStationById(stationId);
      console.log('📡 Station API Response:', response); // Debug log
      
      // Handle different response structures
      const stationData = response.data?.station || response.station || response.data || response;
      setStation(stationData);
    } catch (err) {
      console.error('Error fetching station:', err);
      setError('Failed to load station details');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await stationService.getStationReviews(stationId);
      const reviewsData = response.data?.reviews || response.reviews || [];
      setReviews(reviewsData);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  // Calculate average rating from reviews
  const calculateAverageRating = () => {
    if (!reviews || reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const average = totalRating / reviews.length;
    return Math.round(average * 10) / 10;
  };

  // Get price
  const getPrice = () => {
    if (!station) return '₹16';
    if (station.pricePerUnit !== undefined && station.pricePerUnit !== null) {
      return `₹${station.pricePerUnit}`;
    }
    return '₹16';
  };

  // Get station host ID
  const getStationHostId = () => {
    if (!station) return undefined;
    const hostId = station.host?._id || station.host || station.hostId || station.hostID;
    return hostId;
  };

  // Get host display name - IMPROVED VERSION
  const getHostDisplayName = () => {
    if (!station || !station.host) return 'Unknown Host';
    
    const host = station.host;
    
    // Check various possible name fields
    if (host.name) return host.name;
    if (host.username) return host.username;
    if (host.fullName) return host.fullName;
    if (host.firstName && host.lastName) return `${host.firstName} ${host.lastName}`;
    if (host.email) return host.email;
    if (typeof host === 'string') return host; // In case host is just an ID string
    
    return 'Host';
  };

  // Pre-fill station edit form data
  useEffect(() => {
    if (station) {
      setEditFormData({
        name: station.name || '',
        location: station.location || '',
        description: station.description || '',
        pricePerUnit: station.pricePerUnit || station.pricePerKwh || station.price || '16',
        chargerTypes: Array.isArray(station.chargerTypes) ? station.chargerTypes.join(', ') : station.chargerTypes || '',
      });
    }
  }, [station]);

  const handleSubmitReview = async (reviewData) => {
    if (!user) {
      alert('Please login to submit a review');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingReview) {
        await stationService.updateReview(stationId, editingReview._id, reviewData);
      } else {
        await stationService.addReview(stationId, reviewData);
      }
      await fetchReviews();
      await fetchStationDetails();
      setShowReviewForm(false);
      setEditingReview(null);
    } catch (err) {
      console.error('Error submitting review:', err);
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      setIsDeleting(true);
      await stationService.deleteReview(stationId, reviewId);
      await fetchReviews();
      await fetchStationDetails();
    } catch (err) {
      console.error('Error deleting review:', err);
      alert(err.response?.data?.message || 'Failed to delete review');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelReview = () => {
    setShowReviewForm(false);
    setEditingReview(null);
  };

  const handleUpdateStation = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        ...editFormData,
        chargerTypes: editFormData.chargerTypes.split(',').map(t => t.trim()).filter(t => t !== '')
      };
      await stationService.updateStation(station._id, updateData);
      await fetchStationDetails();
      setShowEditForm(false);
      alert('Station updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update station');
    }
  };

  const canManageStation = user && (
    user.role === 'admin' || 
    (user.role === 'host' && station?.host?._id === user._id)
  );

  const userReview = reviews.find(review => review.user?._id === user?._id);
  const canWriteReview = user && (user.role === 'customer' || user.role === 'admin');

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) return <LoadingSpinner message="Loading station details..." />;
  if (error) return <div className="text-center text-red-600 py-8">{error}</div>;
  if (!station) return <div className="text-center py-8">Charging station not found</div>;

  const averageRating = calculateAverageRating();
  const totalReviews = reviews.length;
  const stationHostId = getStationHostId();
  const hostDisplayName = getHostDisplayName();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        Back to Stations
      </button>

      {/* Station Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{station.name}</h1>

          {canManageStation && (
            <button
              onClick={() => setShowEditForm(true)}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Edit Station
            </button>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center text-gray-600 mb-4">
          <MapPin className="h-5 w-5 mr-2" />
          <span className="text-lg">{station.location}</span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-3">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < Math.floor(averageRating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-lg font-semibold">{averageRating.toFixed(1)}</span>
          <span className="text-gray-600">({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})</span>
        </div>
      </div>

      {/* Station Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Description */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">About this charging station</h2>
            <p className="text-gray-700 leading-relaxed">{station.description}</p>
          </div>

          {/* Charger Types */}
          {station.chargerTypes?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Available Charger Types</h2>
              <div className="flex flex-wrap gap-2">
                {station.chargerTypes.map((type, idx) => (
                  <span
                    key={idx}
                    className="bg-green-100 text-green-800 px-3 py-2 rounded-lg font-medium flex items-center gap-2"
                  >
                    <Zap className="h-4 w-4" />
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Host Info - FIXED VERSION */}
         {station.host && (
  <div className="mb-8 p-4 bg-gray-50 rounded-lg">
    <h2 className="text-xl font-semibold mb-2">Managed by</h2>
    <p className="text-gray-700 font-medium">{hostDisplayName}</p>
  </div>
)}

          {/* Reviews Section */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Customer Reviews</h2>
              
              {/* ADMIN: Can always add/edit reviews */}
              {user?.role === 'admin' && !showReviewForm && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  {userReview ? 'Edit Your Review' : 'Add Review & Rating'}
                </button>
              )}

              {/* CUSTOMER: Can add review if no review exists */}
              {user?.role === 'customer' && !showReviewForm && !userReview && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Add Review & Rating
                </button>
              )}

              {/* CUSTOMER: Can edit their existing review */}
              {user?.role === 'customer' && !showReviewForm && userReview && (
                <button
                  onClick={() => handleEditReview(userReview)}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Edit Your Review
                </button>
              )}

              {/* HOST: Can add review if no review exists */}
              {user?.role === 'host' && !showReviewForm && !userReview && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Add Review & Rating
                </button>
              )}

              {/* HOST: Can edit their existing review */}
              {user?.role === 'host' && !showReviewForm && userReview && (
                <button
                  onClick={() => handleEditReview(userReview)}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Edit Your Review
                </button>
              )}

              {/* LOGIN PROMPT for non-logged in users */}
              {!user && (
                <button
                  onClick={() => alert('Please login to write a review')}
                  className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed flex items-center gap-2"
                  disabled
                >
                  <MessageSquare className="h-4 w-4" />
                  Login to Add Review
                </button>
              )}
            </div>

            {/* REVIEW FORM */}
            {showReviewForm && (
              <div className="mb-6">
                <ReviewForm
                  stationId={stationId}
                  existingReview={editingReview || userReview}
                  onSubmit={handleSubmitReview}
                  onCancel={handleCancelReview}
                  isSubmitting={isSubmitting}
                />
              </div>
            )}

            {/* REVIEW LIST */}
            <ReviewList
              reviews={reviews}
              onEdit={handleEditReview}
              onDelete={handleDeleteReview}
              currentUserId={user?._id || user?.id}
              currentUserRole={user?.role}
              stationHostId={stationHostId}
              user={user}
            />
          </div>
        </div>

        {/* Booking Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-baseline gap-2 mb-6">
              <BatteryCharging className="h-6 w-6 text-green-600" />
              <span className="text-3xl font-bold text-gray-900">
                {getPrice()}
              </span>
              <span className="text-gray-600">/kWh</span>
            </div>

            <button className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors mb-4 flex items-center justify-center gap-2">
              <Zap className="h-5 w-5" />
              Book Charging Slot
            </button>

            <p className="text-center text-sm text-gray-600 mb-4">
              Reserve your charging time slot
            </p>

            <div className="space-y-3 mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Car className="h-4 w-4" />
                <span>EV Charging</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>24/7 Available</span>
              </div>
              
              {totalReviews > 0 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-gray-700">Overall Rating</span>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{averageRating.toFixed(1)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Station Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Edit Charging Station</h2>
            <form onSubmit={handleUpdateStation}>
              <input type="text" placeholder="Station Name" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} className="w-full mb-3 border p-2 rounded" />
              <input type="text" placeholder="Location" value={editFormData.location} onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })} className="w-full mb-3 border p-2 rounded" />
              <textarea placeholder="Description" value={editFormData.description} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} className="w-full mb-3 border p-2 rounded" />
              <input type="number" placeholder="Price per kWh" value={editFormData.pricePerUnit} onChange={(e) => setEditFormData({ ...editFormData, pricePerUnit: e.target.value })} className="w-full mb-3 border p-2 rounded" />
              <input type="text" placeholder="Charger Types (comma separated)" value={editFormData.chargerTypes} onChange={(e) => setEditFormData({ ...editFormData, chargerTypes: e.target.value })} className="w-full mb-4 border p-2 rounded" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowEditForm(false)} className="px-4 py-2 bg-gray-300 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StationDetailPage;