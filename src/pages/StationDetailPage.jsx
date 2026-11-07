import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  MapPin, BatteryCharging, ArrowLeft, Star, Zap, Car, Clock,
  MessageSquare, CheckCircle2, AlertTriangle, X, RefreshCw,
} from 'lucide-react';
import { stationService } from '../services/stationService';
import { useAuth } from '../context/AuthContext';
import ReviewForm from '../components/common/ReviewForm';
import ReviewList from '../components/common/ReviewList';
import BookingModal from '../components/common/BookingModel';

/* ─── Design tokens ─── */
const ACCENT = '#00E5A8';
const NAVBAR_CLEARANCE = 'pt-28';

const gridStyle = {
  backgroundImage:
    'linear-gradient(rgba(148,163,184,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.025) 1px, transparent 1px)',
  backgroundSize: '48px 48px',
};

const StationDetailPage = () => {
  const { user } = useAuth();
  const { id: stationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002';

  const [station, setStation] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [toast, setToast] = useState(null);

  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [deletingReview, setDeletingReview] = useState(false);

  const [showBookingModal, setShowBookingModal] = useState(false);

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

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (type, message) => setToast({ type, message });

  const fetchStationDetails = async () => {
    try {
      setLoading(true);
      const response = await stationService.getStationById(stationId);
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

  /* Resolve image URL — same logic as StationCard */
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads/')) {
      return `${API_BASE}/uploads/${imagePath.replace('/uploads/', '')}`;
    }
    return `${API_BASE}/uploads/${imagePath}`;
  };

  const heroImage = station?.images?.[0] ? getImageUrl(station.images[0]) : null;

  const calculateAverageRating = () => {
    if (!reviews || reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((totalRating / reviews.length) * 10) / 10;
  };

  const getPrice = () => {
    if (!station) return '₹16';
    if (station.pricePerUnit !== undefined && station.pricePerUnit !== null) {
      return `₹${station.pricePerUnit}`;
    }
    return '₹16';
  };

  /* Station kisne banaya — id nikalo (populate hua ho ya na hua ho) */
  const getStationOwnerId = () => {
    if (!station || !station.createdBy) return undefined;
    return station.createdBy._id || station.createdBy;
  };

  const getOwnerDisplayName = () => {
    const owner = station?.createdBy;
    if (!owner) return null;
    if (typeof owner === 'string') return null; // sirf id hai, naam nahi
    return owner.name || owner.email || 'Station owner';
  };

  useEffect(() => {
    if (station) {
      setEditFormData({
        name: station.name || '',
        location: station.location || '',
        description: station.description || '',
        pricePerUnit: station.pricePerUnit || station.pricePerKwh || station.price || '16',
        chargerTypes: Array.isArray(station.chargerTypes)
          ? station.chargerTypes.join(', ')
          : station.chargerTypes || '',
      });
    }
  }, [station]);

  const handleSubmitReview = async (reviewData) => {
    if (!user) {
      showToast('error', 'Please login to submit a review.');
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
      showToast('success', editingReview ? 'Review updated.' : 'Review added. Thanks!');
    } catch (err) {
      console.error('Error submitting review:', err);
      showToast('error', err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setShowReviewForm(true);
  };

  const confirmDeleteReview = async () => {
    if (!reviewToDelete) return;
    try {
      setDeletingReview(true);
      await stationService.deleteReview(stationId, reviewToDelete);
      setReviewToDelete(null);
      await fetchReviews();
      await fetchStationDetails();
      showToast('success', 'Review deleted.');
    } catch (err) {
      console.error('Error deleting review:', err);
      setReviewToDelete(null);
      showToast('error', err.response?.data?.message || 'Failed to delete review.');
    } finally {
      setDeletingReview(false);
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
        chargerTypes: editFormData.chargerTypes
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t !== ''),
      };
      await stationService.updateStation(station._id, updateData);
      await fetchStationDetails();
      setShowEditForm(false);
      showToast('success', 'Station updated successfully.');
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to update station.');
    }
  };

  const handleBookingSuccess = () => {
    showToast('success', 'Booking created! Check "My Bookings" for details.');
    fetchStationDetails();
  };

  const handleBookNow = () => {
    if (!user) {
      // Login ke baad wapas isi station par aa jaye
      navigate('/login', { state: { from: location } });
      return;
    }
    if (isOwnStation) {
      showToast('error', "You can't book your own station.");
      return;
    }
    setShowBookingModal(true);
  };

  const ownerId = getStationOwnerId();
  const currentUserId = user?._id || user?.id;

  /* Apna khud ka station? */
  const isOwnStation =
    !!user && !!ownerId && ownerId.toString() === String(currentUserId);

  /* Edit kaun kar sakta hai — admin ya jisne banaya */
  const canManageStation = !!user && (user.role === 'admin' || isOwnStation);

  const userReview = reviews.find((review) => review.user?._id === user?._id);

  const handleBack = () => navigate(-1);

  /* ────────────────────────────── Loading ────────────────────────────── */
  if (loading) {
    return (
      <div className={`min-h-screen bg-[#020617] ${NAVBAR_CLEARANCE}`} style={gridStyle}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="h-5 w-36 bg-slate-800 rounded animate-pulse mb-8" />
          <div className="h-10 w-72 bg-slate-800 rounded-lg animate-pulse mb-4" />
          <div className="h-5 w-52 bg-slate-800/70 rounded animate-pulse mb-10" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-32 bg-[#0F172A] border border-white/[0.08] rounded-2xl animate-pulse" />
              <div className="h-24 bg-[#0F172A] border border-white/[0.08] rounded-2xl animate-pulse" />
              <div className="h-48 bg-[#0F172A] border border-white/[0.08] rounded-2xl animate-pulse" />
            </div>
            <div className="h-80 bg-[#0F172A] border border-white/[0.08] rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────── Error ─────────────────────────────── */
  if (error || !station) {
    return (
      <div className={`min-h-screen bg-[#020617] flex items-center justify-center px-4 ${NAVBAR_CLEARANCE}`} style={gridStyle}>
        <div className="bg-[#0F172A] border border-white/[0.08] rounded-2xl p-10 text-center max-w-md w-full shadow-xl">
          <div className="bg-red-500/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-[#F8FAFC] mb-2">
            {error ? 'Something went wrong' : 'Station not found'}
          </h2>
          <p className="text-[#94A3B8] mb-6">
            {error || "This charging station doesn't exist or was removed."}
          </p>
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-slate-950 font-semibold px-6 py-3 rounded-xl transition-all hover:scale-[1.03]"
            style={{ background: ACCENT, boxShadow: `0 8px 24px -8px ${ACCENT}66` }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to stations
          </button>
        </div>
      </div>
    );
  }

  const averageRating = calculateAverageRating();
  const totalReviews = reviews.length;
  const ownerDisplayName = getOwnerDisplayName();

  return (
    <div className={`min-h-screen bg-[#020617] relative ${NAVBAR_CLEARANCE}`}>
      <style>{`
        @keyframes heroBgIn {
          from { opacity: 0; transform: scale(1.15); }
          to   { opacity: 1; transform: scale(1.05); }
        }
      `}</style>

      {/* ══════ STATION IMAGE AS BLURRED HERO BACKGROUND ══════ */}
      {heroImage && (
        <div className="absolute inset-x-0 top-0 h-[560px] overflow-hidden pointer-events-none" aria-hidden="true">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${heroImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              animation: 'heroBgIn 0.8s ease both',
              filter: 'blur(8px)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(2,6,23,0.85) 0%, rgba(15,23,42,0.65) 40%, rgba(2,6,23,0.92) 80%, #020617 100%)',
              backdropFilter: 'blur(4px)',
            }}
          />
        </div>
      )}

      <div className="absolute inset-0" style={gridStyle} aria-hidden="true" />

      {!heroImage && (
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-[360px] w-[700px] rounded-full opacity-[0.14] blur-[100px] pointer-events-none"
          style={{ background: `radial-gradient(closest-side, ${ACCENT}, transparent)` }}
          aria-hidden="true"
        />
      )}

      <div className="relative max-w-6xl mx-auto px-4 py-8">
        {/* Back */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-[#94A3B8] hover:text-[#F8FAFC] mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to stations
        </button>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl md:text-5xl font-bold text-[#F8FAFC] tracking-tight drop-shadow-lg">
                {station.name}
              </h1>
              {isOwnStation && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold text-slate-950"
                  style={{ background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)` }}
                >
                  Your station
                </span>
              )}
            </div>
            {canManageStation && (
              <button
                onClick={() => setShowEditForm(true)}
                className="px-4 py-2 bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur border border-white/[0.1] text-[#F8FAFC] rounded-xl transition-all hover:scale-[1.03] text-sm font-medium"
              >
                Edit station
              </button>
            )}
          </div>

          <div className="flex items-center text-[#94A3B8] mb-3">
            <MapPin className="h-5 w-5 mr-2" style={{ color: ACCENT }} />
            <span className="text-lg">{station.location}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.floor(averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-slate-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-lg font-semibold text-[#F8FAFC]">{averageRating.toFixed(1)}</span>
            <span className="text-[#94A3B8]">
              ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Description */}
            {station.description && (
              <div className="mb-8 bg-[#0F172A]/70 backdrop-blur border border-white/[0.08] rounded-2xl p-6 shadow-xl">
                <h2 className="text-xl font-semibold text-[#F8FAFC] mb-3">
                  About this charging station
                </h2>
                <p className="text-[#94A3B8] leading-relaxed">{station.description}</p>
              </div>
            )}

            {/* Charger Types */}
            {station.chargerTypes?.length > 0 && (
              <div className="mb-8 bg-[#0F172A]/70 backdrop-blur border border-white/[0.08] rounded-2xl p-6 shadow-xl">
                <h2 className="text-xl font-semibold text-[#F8FAFC] mb-3">Available charger types</h2>
                <div className="flex flex-wrap gap-2">
                  {station.chargerTypes.map((type, idx) => (
                    <span
                      key={idx}
                      className="bg-[#00E5A8]/10 border border-[#00E5A8]/20 px-3 py-2 rounded-lg font-medium flex items-center gap-2 text-sm"
                      style={{ color: ACCENT }}
                    >
                      <Zap className="h-4 w-4" />
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Owner */}
            {ownerDisplayName && (
              <div className="mb-10 p-5 bg-[#0F172A]/70 backdrop-blur border border-white/[0.08] rounded-2xl shadow-xl">
                <h2 className="text-sm font-medium text-[#94A3B8] mb-1">Managed by</h2>
                <p className="text-[#F8FAFC] font-semibold">{ownerDisplayName}</p>
              </div>
            )}

            {/* Reviews */}
            <div>
              <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                <h2 className="text-2xl font-bold text-[#F8FAFC]">Customer reviews</h2>

                {/* Apne station par review nahi likh sakte */}
                {user && !isOwnStation && !showReviewForm && (
                  <button
                    onClick={() =>
                      userReview ? handleEditReview(userReview) : setShowReviewForm(true)
                    }
                    className="px-4 py-2 text-slate-950 rounded-xl transition-all hover:scale-[1.03] flex items-center gap-2 text-sm font-semibold"
                    style={{
                      background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)`,
                      boxShadow: `0 8px 20px -8px ${ACCENT}70`,
                    }}
                  >
                    <MessageSquare className="h-4 w-4" />
                    {userReview ? 'Edit your review' : 'Add review'}
                  </button>
                )}

                {user && isOwnStation && (
                  <span className="text-sm text-[#94A3B8]">
                    You can't review your own station
                  </span>
                )}

                {!user && (
                  <button
                    onClick={() => navigate('/login', { state: { from: location } })}
                    className="px-4 py-2 bg-white/[0.05] border border-white/[0.08] text-[#94A3B8] rounded-xl hover:bg-white/[0.1] hover:text-[#F8FAFC] transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Login to add a review
                  </button>
                )}
              </div>

              {showReviewForm && !isOwnStation && (
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

              <ReviewList
                reviews={reviews}
                onEdit={handleEditReview}
                onDelete={(reviewId) => setReviewToDelete(reviewId)}
                currentUserId={currentUserId}
                currentUserRole={user?.role}
                stationHostId={ownerId}
                user={user}
              />
            </div>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-[#0F172A]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl">
              <div className="flex items-baseline gap-2 mb-6">
                <BatteryCharging className="h-6 w-6" style={{ color: ACCENT }} />
                <span className="text-3xl font-bold text-[#F8FAFC]">{getPrice()}</span>
                <span className="text-[#94A3B8]">/kWh</span>
              </div>

              {isOwnStation ? (
                <>
                  <button
                    disabled
                    className="w-full py-3 rounded-xl font-semibold mb-4 flex items-center justify-center gap-2 bg-white/[0.04] border border-white/[0.08] text-slate-500 cursor-not-allowed"
                  >
                    <Zap className="h-5 w-5" />
                    Your own station
                  </button>
                  <p className="text-center text-sm text-[#94A3B8] mb-4">
                    You can't book a station you added. Check{' '}
                    <button
                      onClick={() => navigate('/my-station-bookings')}
                      className="font-medium hover:underline underline-offset-4"
                      style={{ color: ACCENT }}
                    >
                      Station Bookings
                    </button>{' '}
                    to manage requests.
                  </p>
                </>
              ) : (
                <>
                  <button
                    onClick={handleBookNow}
                    className="w-full text-slate-950 py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] mb-4 flex items-center justify-center gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)`,
                      boxShadow: `0 10px 28px -10px ${ACCENT}80`,
                    }}
                  >
                    <Zap className="h-5 w-5" />
                    Book charging slot
                  </button>

                  <p className="text-center text-sm text-[#94A3B8] mb-4">
                    Reserve your charging time slot
                  </p>
                </>
              )}

              <div className="space-y-3 mt-6 pt-6 border-t border-white/[0.06]">
                <div className="flex items-center gap-3 text-sm text-[#94A3B8]">
                  <Car className="h-4 w-4 text-slate-500" />
                  <span>EV charging</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#94A3B8]">
                  <Clock className="h-4 w-4 text-slate-500" />
                  <span>24/7 available</span>
                </div>

                {totalReviews > 0 && (
                  <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                    <span className="text-[#94A3B8]">Overall rating</span>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-[#F8FAFC]">{averageRating.toFixed(1)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════ EDIT STATION MODAL ══════ */}
      {showEditForm && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEditForm(false);
          }}
        >
          <div className="bg-[#0F172A] border border-white/[0.08] p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-[#F8FAFC] mb-5">Edit charging station</h2>
            <form onSubmit={handleUpdateStation}>
              <input
                type="text"
                placeholder="Station name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="w-full mb-3 bg-white/[0.04] border border-white/[0.08] text-[#F8FAFC] placeholder:text-slate-500 p-3 rounded-xl focus:ring-2 focus:ring-[#00E5A8]/40 focus:border-[#00E5A8]/60 outline-none"
              />
              <input
                type="text"
                placeholder="Location"
                value={editFormData.location}
                onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                className="w-full mb-3 bg-white/[0.04] border border-white/[0.08] text-[#F8FAFC] placeholder:text-slate-500 p-3 rounded-xl focus:ring-2 focus:ring-[#00E5A8]/40 focus:border-[#00E5A8]/60 outline-none"
              />
              <textarea
                placeholder="Description"
                rows={3}
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                className="w-full mb-3 bg-white/[0.04] border border-white/[0.08] text-[#F8FAFC] placeholder:text-slate-500 p-3 rounded-xl focus:ring-2 focus:ring-[#00E5A8]/40 focus:border-[#00E5A8]/60 outline-none resize-none"
              />
              <input
                type="number"
                placeholder="Price per kWh"
                value={editFormData.pricePerUnit}
                onChange={(e) => setEditFormData({ ...editFormData, pricePerUnit: e.target.value })}
                className="w-full mb-3 bg-white/[0.04] border border-white/[0.08] text-[#F8FAFC] placeholder:text-slate-500 p-3 rounded-xl focus:ring-2 focus:ring-[#00E5A8]/40 focus:border-[#00E5A8]/60 outline-none"
              />
              <input
                type="text"
                placeholder="Charger types (comma separated)"
                value={editFormData.chargerTypes}
                onChange={(e) => setEditFormData({ ...editFormData, chargerTypes: e.target.value })}
                className="w-full mb-5 bg-white/[0.04] border border-white/[0.08] text-[#F8FAFC] placeholder:text-slate-500 p-3 rounded-xl focus:ring-2 focus:ring-[#00E5A8]/40 focus:border-[#00E5A8]/60 outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="px-4 py-2.5 border border-white/[0.08] text-[#94A3B8] rounded-xl hover:bg-white/[0.04] hover:text-[#F8FAFC] transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 text-slate-950 rounded-xl font-semibold transition-all hover:scale-[1.02]"
                  style={{
                    background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)`,
                    boxShadow: `0 8px 20px -8px ${ACCENT}70`,
                  }}
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════ DELETE REVIEW MODAL ══════ */}
      {reviewToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deletingReview) setReviewToDelete(null);
          }}
        >
          <div className="bg-[#0F172A] border border-white/[0.08] rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="bg-red-500/10 h-12 w-12 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-[#F8FAFC] mb-1">Delete this review?</h2>
            <p className="text-[#94A3B8] text-sm mb-6">This can't be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setReviewToDelete(null)}
                disabled={deletingReview}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/[0.08] text-[#94A3B8] font-medium hover:bg-white/[0.04] hover:text-[#F8FAFC] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteReview}
                disabled={deletingReview}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition-all hover:scale-[1.02] disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {deletingReview && <RefreshCw className="h-4 w-4 animate-spin" />}
                {deletingReview ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════ TOAST ══════ */}
      {toast && (
        <div className="fixed top-24 right-4 z-[60] max-w-sm w-full">
          <div
            className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl ${
              toast.type === 'success'
                ? 'bg-[#00E5A8]/10 border-[#00E5A8]/30'
                : 'bg-red-500/10 border-red-500/30 text-red-200'
            }`}
            style={toast.type === 'success' ? { color: ACCENT } : undefined}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" style={{ color: ACCENT }} />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-red-400" />
            )}
            <p className="text-sm flex-1">{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              aria-label="Dismiss"
              className="p-0.5 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        station={station}
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onSuccess={handleBookingSuccess}
      />
    </div>
  );
};

export default StationDetailPage;