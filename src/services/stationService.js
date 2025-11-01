import api from './api';

export const stationService = {
  async createStation(formData) {
    const response = await api.post('/stations', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getAllStations() {
    const response = await api.get('/stations');
    return response.data;
  },

  async getStationById(id) {
    const response = await api.get(`/stations/${id}`);
    return response.data;
  },

  async updateStation(id, formData) {
    const response = await api.put(`/stations/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async deleteStation(id) {
    const response = await api.delete(`/stations/${id}`);
    return response.data;
  },

  async addReview(stationId, reviewData) {
    const response = await api.post(`/stations/${stationId}/reviews`, reviewData);
    return response.data;
  },

  async getStationReviews(stationId) {
    const response = await api.get(`/stations/${stationId}/reviews`);
    return response.data;
  },

  async updateReview(stationId, reviewId, reviewData) {
    const response = await api.put(`/stations/${stationId}/reviews/${reviewId}`, reviewData);
    return response.data;
  },

  async deleteReview(stationId, reviewId) {
    const response = await api.delete(`/stations/${stationId}/reviews/${reviewId}`);
    return response.data;
  },
};

export default stationService;
