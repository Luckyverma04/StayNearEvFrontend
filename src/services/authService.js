import api from './api';

export const authService = {
  async login(email, password) {
    const response = await api.post('/users/login', { email, password });
    return response.data;
  },

  async signup(userData) {
    const response = await api.post('/users/signup', userData);
    return response.data;
  },

  async getProfile() {
    const response = await api.get('/users/profile');
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
  }
};
