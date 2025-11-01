import api from './api';

export const authService = {
  // ✅ Login user - FIXED
  async login(email, password) {
    const response = await api.post('/api/users/login', { email, password }); // Added /api
    return response.data;
  },

  // ✅ Signup user - FIXED
  async signup(userData) {
    const response = await api.post('/api/users/signup', userData); // Added /api
    return response.data;
  },

  // ✅ Verify email - FIXED
  async verifyEmail(token) {
    const response = await api.post('/api/users/verify-email', { token }); // Added /api
    return response.data;
  },

  // ✅ Get profile (requires token) - FIXED
  async getProfile() {
    const response = await api.get('/api/users/profile'); // Added /api
    return response.data;
  },

  // ✅ Logout user
  logout() {
    localStorage.removeItem('token');
  },
};

export default authService;