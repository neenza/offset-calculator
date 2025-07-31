import axios from 'axios';
import { refreshAccessToken, logout } from './authService';
import { authEventManager } from './authEventManager';

// Create a base API instance
const api = axios.create({
  baseURL: 'https://backend-offset-calc.onrender.com/',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: Include cookies in requests
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
        // Retry the original request (cookies will be included automatically)
        return api(originalRequest);
      }
      
      // If refresh failed, log out the user
      await logout();
      authEventManager.handleAuthFailure();
      console.error('Authentication failed. Please log in again.');
    }
    
    // Handle server errors (500)
    if (error.response && error.response.status >= 500) {
      console.error('Server error. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);

export default api;
