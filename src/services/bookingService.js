import api from './api';

export const bookingService = {
  async createBooking(bookingData) {
    const response = await api.post('/bookings/create', bookingData);
    return response.data;
  },

  async getAvailableSlots(stationId, date) {
    const response = await api.get('/bookings/available-slots', {
      params: { stationId, date },
    });
    return response.data;
  },

  async getUserBookings() {
    const response = await api.get('/bookings/my-bookings');
    return response.data;
  },

  async getBookingById(bookingId) {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
  },

  async cancelBooking(bookingId) {
    const response = await api.put(`/bookings/${bookingId}/cancel`);
    return response.data;
  },

  async addBookingReview(bookingId, reviewData) {
    const response = await api.put(`/bookings/${bookingId}/review`, reviewData);
    return response.data;
  },

  async updateBookingStatus(bookingId, status) {
    const response = await api.put(`/bookings/${bookingId}/status`, { status });
    return response.data;
  },

  async getStationBookings() {
    const response = await api.get('/bookings/host/my-station-bookings');
    return response.data;
  },
};

export default bookingService;
