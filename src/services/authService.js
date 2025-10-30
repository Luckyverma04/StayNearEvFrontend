import api from './api';

export const authService = {
  // ✅ Login user
  async login(email, password) {
    const response = await api.post('/users/login', { email, password });
    return response.data;
  },

  // ✅ Signup user
  async signup(userData) {
    const response = await api.post('/users/signup', userData);
    return response.data;
  },

  // ✅ Verify email
  async verifyEmail(token) {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  },

  // ✅ Get profile (requires token)
  async getProfile() {
    const response = await api.get('/users/profile');
    return response.data;
  },

  // ✅ Logout user
  logout() {
    localStorage.removeItem('token');
  },
};

export default authService;