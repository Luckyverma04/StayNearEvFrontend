import api from './api';
export const bookingService = {
  // ✅ Create Booking
  async createBooking(bookingData) {
    const response = await api.post('/bookings/create', bookingData);
    return response.data;
  },

  // ✅ Get Available Slots
  async getAvailableSlots(stationId, date) {
    const response = await api.get('/bookings/available-slots', {
      params: { stationId, date },
    });
    return response.data;
  },

  // ✅ Get User Bookings
  async getUserBookings() {
    const response = await api.get('/bookings/my-bookings');
    return response.data;
  },

  // ✅ Get Booking by ID
  async getBookingById(bookingId) {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
  },

  // ✅ Cancel Booking
  async cancelBooking(bookingId) {
    const response = await api.put(`/bookings/${bookingId}/cancel`);
    return response.data;
  },

  // ✅ Add Review for Booking
  async addBookingReview(bookingId, reviewData) {
    const response = await api.put(`/bookings/${bookingId}/review`, reviewData);
    return response.data;
  },

  // ✅ Host: Update Booking Status
  async updateBookingStatus(bookingId, status) {
    const response = await api.put(`/bookings/${bookingId}/status`, { status });
    return response.data;
  },

  // ✅ Host: Get Bookings for their Stations
  async getStationBookings() {
    const response = await api.get('/bookings/host/my-station-bookings');
    return response.data;
  },
};

export default bookingService;
