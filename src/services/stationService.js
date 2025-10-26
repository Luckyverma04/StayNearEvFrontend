import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const stationService = {
  // ============================================
  // STATION CRUD OPERATIONS
  // ============================================

  // ✅ Create Station
  createStation: async (formData) => {
    try {
      console.log("🚀 Creating station with FormData");
      const response = await axios.post(`${API_URL}/stations`, formData, {
        headers: {
          ...getAuthHeader(),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Create station error:', error.response?.data || error);
      throw error;
    }
  },

  // ✅ Get all Stations
  getAllStations: async () => {
    try {
      const response = await axios.get(`${API_URL}/stations`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Get stations error:', error);
      throw error;
    }
  },

  // ✅ Get single Station
  getStationById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/stations/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get station error:', error);
      throw error;
    }
  },

  // ✅ Update Station
  updateStation: async (id, formData) => {
    try {
      console.log("🔄 Updating station:", id);
      const response = await axios.put(`${API_URL}/stations/${id}`, formData, {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Update station error:", error.response?.data || error);
      throw error;
    }
  },

  // ✅ Delete Station
  deleteStation: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/stations/${id}`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Delete station error:', error);
      throw error;
    }
  },

  // ============================================
  // REVIEW & RATING OPERATIONS
  // ============================================

  // ✅ Add a review
  addReview: async (stationId, reviewData) => {
    try {
      console.log("⭐ Adding review to station:", stationId);
      const response = await axios.post(
        `${API_URL}/stations/${stationId}/reviews`,
        reviewData,
        {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Add review error:', error.response?.data || error);
      throw error;
    }
  },

  // ✅ Get all reviews for a station
  getStationReviews: async (stationId) => {
    try {
      const response = await axios.get(`${API_URL}/stations/${stationId}/reviews`);
      return response.data;
    } catch (error) {
      console.error('Get reviews error:', error);
      throw error;
    }
  },

  // ✅ Update a review
  updateReview: async (stationId, reviewId, reviewData) => {
    try {
      console.log("✏️ Updating review:", reviewId);
      const response = await axios.put(
        `${API_URL}/stations/${stationId}/reviews/${reviewId}`,
        reviewData,
        {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Update review error:', error.response?.data || error);
      throw error;
    }
  },

  // ✅ Delete a review
  deleteReview: async (stationId, reviewId) => {
    try {
      console.log("🗑️ Deleting review:", reviewId);
      const response = await axios.delete(
        `${API_URL}/stations/${stationId}/reviews/${reviewId}`,
        {
          headers: getAuthHeader(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Delete review error:', error.response?.data || error);
      throw error;
    }
  },
};
