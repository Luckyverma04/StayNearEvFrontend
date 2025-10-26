import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      fetchProfile(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (authToken) => {
    try {
      const response = await authService.getProfile();
      console.log('Auth Profile Response:', response); // Debug log
      
      if (response.success) {
        // Backend returns { success, data: { user } }
        const userData = response.data.user || response.data;
        console.log('Setting user data:', userData); // Debug log
        setUser(userData);
      } else {
        // Token is invalid, clear it
        console.warn('Invalid token, logging out...');
        logout();
      }
    } catch (error) {
      // Only log error if it's not a 401 (which is expected when not logged in)
      if (error.response?.status !== 401) {
        console.error('Failed to fetch profile:', error);
      }
      // Clear invalid token
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      console.log('Login Response:', response); // Debug log
      
      if (response.success) {
        // Backend returns { success, data: { token, user } }
        const { token, user } = response.data;
        setToken(token);
        setUser(user);
        localStorage.setItem('token', token);
      }
      return response;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please try again.'
      };
    }
  };

  const signup = async (userData) => {
    try {
      return await authService.signup(userData);
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Signup failed. Please try again.'
      };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};