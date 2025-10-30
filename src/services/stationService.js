import api from './api';
export const stationService = {
  // ✅ Create Station
  async createStation(formData) {
    try {
      console.log("🚀 Creating station with FormData");
      const response = await api.post('/stations', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('Create station error:', error.response?.data || error);
      throw error;
    }
  },

  // ✅ Get all Stations
  async getAllStations() {
    try {
      const response = await api.get('/stations');
      return response.data;
    } catch (error) {
      console.error('Get stations error:', error.response?.data || error);
      throw error;
    }
  },

  // ✅ Get single Station
  async getStationById(id) {
    try {
      const response = await api.get(`/stations/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get station error:', error.response?.data || error);
      throw error;
    }
  },

  // ✅ Update Station
  async updateStation(id, formData) {
    try {
      console.log("🔄 Updating station:", id);
      const response = await api.put(`/stations/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error("Update station error:", error.response?.data || error);
      throw error;
    }
  },

  // ✅ Delete Station
  async deleteStation(id) {
    try {
      const response = await api.delete(`/stations/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete station error:', error.response?.data || error);
      throw error;
    }
  },

  // ✅ Add Review
  async addReview(stationId, reviewData) {
    try {
      const response = await api.post(
        `/stations/${stationId}/reviews`,
        reviewData
      );
      return response.data;
    } catch (error) {
      console.error('Add review error:', error.response?.data || error);
      throw error;
    }
  },

  // ✅ Get Station Reviews
  async getStationReviews(stationId) {
    try {
      const response = await api.get(`/stations/${stationId}/reviews`);
      return response.data;
    } catch (error) {
      console.error('Get reviews error:', error.response?.data || error);
      throw error;
    }
  },

  // ✅ Update Review
  async updateReview(stationId, reviewId, reviewData) {
    try {
      const response = await api.put(
        `/stations/${stationId}/reviews/${reviewId}`,
        reviewData
      );
      return response.data;
    } catch (error) {
      console.error('Update review error:', error.response?.data || error);
      throw error;
    }
  },

  // ✅ Delete Review
  async deleteReview(stationId, reviewId) {
    try {
      const response = await api.delete(
        `/stations/${stationId}/reviews/${reviewId}`
      );
      return response.data;
    } catch (error) {
      console.error('Delete review error:', error.response?.data || error);
      throw error;
    }
  },
};

export default stationService;
