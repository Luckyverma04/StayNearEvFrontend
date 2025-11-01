import api from './api';

export const authService = {
  // ✅ Login user
  async login(email, password) {
    const response = await api.post('/api/users/login', { email, password });
    return response.data;
  },

  // ✅ Signup user
  async signup(userData) {
    const response = await api.post('/api/users/signup', userData);
    return response.data;
  },

  // ✅ Verify email
  async verifyEmail(token) {
    const response = await api.post('/api/users/verify-email', { token });
    return response.data;
  },

  // ✅ Get profile
  async getProfile() {
    const response = await api.get('/api/users/profile');
    return response.data;
  },

  // ✅ Logout
  logout() {
    localStorage.removeItem('token');
  },
};

export default authService;
