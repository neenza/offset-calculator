import axios from 'axios';
import { getToken, refreshAccessToken, logout } from './authService';
import { authEventManager } from './authEventManager';

// Create a base API instance
const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to authenticated requests
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle common errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle unauthorized errors (401) with token refresh
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshSuccess = await refreshAccessToken();
      if (refreshSuccess) {
        // Retry the original request with the new token
        const newToken = getToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      }
      
      // If refresh failed, log out the user
      logout();
      authEventManager.handleAuthFailure();
      console.error('Authentication failed. Please log in again.');
      
      // You can emit an event or redirect to login page here
      // For example: window.dispatchEvent(new CustomEvent('auth-expired'));
    }
    
    // Handle server errors (500)
    if (error.response && error.response.status >= 500) {
      console.error('Server error. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);

export default api;
