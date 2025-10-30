import api from './api';

export const bookingService = {
  // Create a new booking
  createBooking: async (bookingData) => {
    try {
      const response = await api.post('/bookings/create', bookingData);
      return response.data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  // Get available time slots for a station
  getAvailableSlots: async (stationId, date) => {
    try {
      const response = await api.get('/bookings/available-slots', {
        params: { stationId, date }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching available slots:', error);
      throw error;
    }
  },

  // Get all bookings for current user
  getUserBookings: async () => {
    try {
      const response = await api.get('/bookings/my-bookings');
      return response.data;
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      throw error;
    }
  },

  // Get a specific booking by ID
  getBookingById: async (bookingId) => {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching booking:', error);
      throw error;
    }
  },

  // Cancel a booking
  cancelBooking: async (bookingId) => {
    try {
      const response = await api.put(`/bookings/${bookingId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  },

  // Add review to a booking
  addBookingReview: async (bookingId, reviewData) => {
    try {
      const response = await api.put(`/bookings/${bookingId}/review`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Error adding booking review:', error);
      throw error;
    }
  },

  // Host: Update booking status (confirm/reject/complete)
  updateBookingStatus: async (bookingId, status) => {
    try {
      const response = await api.put(`/bookings/${bookingId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  },

  // Host: Get all bookings for their stations
  getStationBookings: async () => {
    try {
      const response = await api.get('/bookings/host/my-station-bookings');
      return response.data;
    } catch (error) {
      console.error('Error fetching station bookings:', error);
      throw error;
    }
  }
};

export default bookingService;