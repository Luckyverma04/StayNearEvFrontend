import api from './api';

export const stationService = {
  // ✅ Create Station - FIXED
  async createStation(formData) {
    try {
      console.log("🚀 Creating station with FormData");
      const response = await api.post('/api/stations', formData, { // Added /api
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('Create station error:', error.response?.data || error);
      throw error;
    }
  },

  // ✅ Get all Stations - FIXED
  async getAllStations() {
    try {
      const response = await api.get('/api/stations'); // Added /api
      return response.data;
    } catch (error) {
      console.error('Get stations error:', error.response?.data || error);
      throw error;
    }
  },

  // ✅ Get single Station - FIXED
  async getStationById(id) {
    try {
      const response = await api.get(`/api/stations/${id}`); // Added /api
      return response.data;
    } catch (error) {
      console.error('Get station error:', error.response?.data || error);
      throw error;
    }
  },

  // ✅ Update Station - FIXED
  async updateStation(id, formData) {
    try {
      console.log("🔄 Updating station:", id);
      const response = await api.put(`/api/stations/${id}`, formData, { // Added /api
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error("Update station error:", error.response?.data || error);
      throw error;
    }
  },

  // ✅ Delete Station - FIXED
  async deleteStation(id) {
    try {
      const response = await api.delete(`/api/stations/${id}`); // Added /api
      return response.data;
    } catch (error) {
      console.error('Delete station error:', error.response?.data || error);
      throw error;
    }
  },

  // ✅ Add Review - FIXED
  async addReview(stationId, reviewData) {
    try {
      const response = await api.post(
        `/api/stations/${stationId}/reviews`, // Added /api
        reviewData
      );
      return response.data;
    } catch (error) {
      console.error('Add review error:', error.response?.data || error);
      throw error;
    }
  },

  // ✅ Get Station Reviews - FIXED
  async getStationReviews(stationId) {
    try {
      const response = await api.get(`/api/stations/${stationId}/reviews`); // Added /api
      return response.data;
    } catch (error) {
      console.error('Get reviews error:', error.response?.data || error);
      throw error;
    }
  },

  // ✅ Update Review - FIXED
  async updateReview(stationId, reviewId, reviewData) {
    try {
      const response = await api.put(
        `/api/stations/${stationId}/reviews/${reviewId}`, // Added /api
        reviewData
      );
      return response.data;
    } catch (error) {
      console.error('Update review error:', error.response?.data || error);
      throw error;
    }
  },

  // ✅ Delete Review - FIXED
  async deleteReview(stationId, reviewId) {
    try {
      const response = await api.delete(
        `/api/stations/${stationId}/reviews/${reviewId}` // Added /api
      );
      return response.data;
    } catch (error) {
      console.error('Delete review error:', error.response?.data || error);
      throw error;
    }
  },
};

export default stationService;