import api from './api';

export const bookingService = {
  async createBooking(bookingData) {
    const response = await api.post('/api/bookings/create', bookingData);
    return response.data;
  },

  async getAvailableSlots(stationId, date) {
    const response = await api.get('/api/bookings/available-slots', {
      params: { stationId, date },
    });
    return response.data;
  },

  async getUserBookings() {
    const response = await api.get('/api/bookings/my-bookings');
    return response.data;
  },

  async getBookingById(bookingId) {
    const response = await api.get(`/api/bookings/${bookingId}`);
    return response.data;
  },

  async cancelBooking(bookingId) {
    const response = await api.put(`/api/bookings/${bookingId}/cancel`);
    return response.data;
  },

  async addBookingReview(bookingId, reviewData) {
    const response = await api.put(`/api/bookings/${bookingId}/review`, reviewData);
    return response.data;
  },

  async updateBookingStatus(bookingId, status) {
    const response = await api.put(`/api/bookings/${bookingId}/status`, { status });
    return response.data;
  },

  async getStationBookings() {
    const response = await api.get('/api/bookings/host/my-station-bookings');
    return response.data;
  },
};

export default bookingService;
