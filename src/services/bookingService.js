import api from './api';

export const bookingService = {
  // ✅ Create Booking - FIXED
  async createBooking(bookingData) {
    const response = await api.post('/api/bookings/create', bookingData); // Added /api
    return response.data;
  },

  // ✅ Get Available Slots - FIXED
  async getAvailableSlots(stationId, date) {
    const response = await api.get('/api/bookings/available-slots', { // Added /api
      params: { stationId, date },
    });
    return response.data;
  },

  // ✅ Get User Bookings - FIXED
  async getUserBookings() {
    const response = await api.get('/api/bookings/my-bookings'); // Added /api
    return response.data;
  },

  // ✅ Get Booking by ID - FIXED
  async getBookingById(bookingId) {
    const response = await api.get(`/api/bookings/${bookingId}`); // Added /api
    return response.data;
  },

  // ✅ Cancel Booking - FIXED
  async cancelBooking(bookingId) {
    const response = await api.put(`/api/bookings/${bookingId}/cancel`); // Added /api
    return response.data;
  },

  // ✅ Add Review for Booking - FIXED
  async addBookingReview(bookingId, reviewData) {
    const response = await api.put(`/api/bookings/${bookingId}/review`, reviewData); // Added /api
    return response.data;
  },

  // ✅ Host: Update Booking Status - FIXED
  async updateBookingStatus(bookingId, status) {
    const response = await api.put(`/api/bookings/${bookingId}/status`, { status }); // Added /api
    return response.data;
  },

  // ✅ Host: Get Bookings for their Stations - FIXED
  async getStationBookings() {
    const response = await api.get('/api/bookings/host/my-station-bookings'); // Added /api
    return response.data;
  },
};

export default bookingService;