import api from './api';

export const stationService = {
  async createStation(formData) {
    const response = await api.post('/api/stations', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getAllStations() {
    const response = await api.get('/api/stations');
    return response.data;
  },

  async getStationById(id) {
    const response = await api.get(`/api/stations/${id}`);
    return response.data;
  },

  async updateStation(id, formData) {
    const response = await api.put(`/api/stations/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async deleteStation(id) {
    const response = await api.delete(`/api/stations/${id}`);
    return response.data;
  },

  async addReview(stationId, reviewData) {
    const response = await api.post(`/api/stations/${stationId}/reviews`, reviewData);
    return response.data;
  },

  async getStationReviews(stationId) {
    const response = await api.get(`/api/stations/${stationId}/reviews`);
    return response.data;
  },

  async updateReview(stationId, reviewId, reviewData) {
    const response = await api.put(`/api/stations/${stationId}/reviews/${reviewId}`, reviewData);
    return response.data;
  },

  async deleteReview(stationId, reviewId) {
    const response = await api.delete(`/api/stations/${stationId}/reviews/${reviewId}`);
    return response.data;
  },
};

export default stationService;
