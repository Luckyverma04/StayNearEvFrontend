import api from './api';

export const authService = {
  async login(email, password) {
    const response = await api.post('/users/login', { email, password });
    return response.data;
  },

  // Google se mila ID token backend ko bhejo
  async googleLogin(credential) {
    const response = await api.post('/users/google', { credential });
    return response.data;
  },

  async signup(userData) {
    const response = await api.post('/users/signup', userData);
    return response.data;
  },

  async verifyOtp(email, otp) {
    const response = await api.post('/users/verify-otp', { email, otp });
    return response.data;
  },

  async resendOtp(email) {
    const response = await api.post('/users/resend-otp', { email });
    return response.data;
  },

  async getProfile() {
    const response = await api.get('/users/profile');
    return response.data;
  },

  // ---- Admin ----
  async getAllUsers() {
    const response = await api.get('/users/all');
    return response.data;
  },

  async getPendingUsers() {
    const response = await api.get('/users/pending');
    return response.data;
  },

  async verifyUserByAdmin(userId) {
    const response = await api.patch(`/users/verify/${userId}`);
    return response.data;
  },

  async deleteUser(userId) {
    const response = await api.delete(`/users/delete/${userId}`);
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
  },
};

export default authService;