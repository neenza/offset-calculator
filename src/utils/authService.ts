// authService.ts - Service to manage authentication with httpOnly cookies

import axios from 'axios';
import { authEventManager } from './authEventManager';

// Base URL for the API - adjust if needed
const API_URL = 'http://localhost:8000';

// Type definitions for authentication
export interface User {
  username: string;
  email?: string;
  full_name?: string;
  disabled?: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: {
    username: string;
    email?: string;
    full_name?: string;
  };
}

export interface TokenResponse {
  success: boolean;
  message: string;
}

// Token refresh state management
let isRefreshing = false;
let refreshSubscribers: Array<(success: boolean) => void> = [];

// Queue for failed requests during token refresh
const addSubscriber = (callback: (success: boolean) => void) => {
  refreshSubscribers.push(callback);
};

const notifySubscribers = (success: boolean) => {
  refreshSubscribers.forEach(callback => callback(success));
  refreshSubscribers = [];
};

// Create API instance with automatic cookie management
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: Include cookies in requests
});

// Handle token refresh on 401 responses
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

// Refresh the access token
export const refreshAccessToken = async (): Promise<boolean> => {
  // If already refreshing, return a promise that resolves when refresh completes
  if (isRefreshing) {
    return new Promise((resolve) => {
      addSubscriber((success: boolean) => {
        resolve(success);
      });
    });
  }

  isRefreshing = true;

  try {
    const response = await axios.post<TokenResponse>(
      `${API_URL}/refresh`,
      {},
      { withCredentials: true }
    );
    
    // Notify all waiting requests about success
    notifySubscribers(true);
    
    isRefreshing = false;
    return response.data.success;
  } catch (error) {
    console.error('Token refresh failed:', error);
    
    // Notify subscribers about the failure
    notifySubscribers(false);
    
    isRefreshing = false;
    return false;
  }
};

// Check if user is authenticated by trying to get user data
export const isLoggedIn = async (): Promise<boolean> => {
  try {
    await api.get('/users/me');
    return true;
  } catch (error) {
    return false;
  }
};

// Login function
export const login = async (credentials: LoginCredentials): Promise<boolean> => {
  try {
    // FastAPI expects form data for OAuth2 password flow
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await axios.post<AuthResponse>(
      `${API_URL}/token`, 
      formData,
      { withCredentials: true }
    );
    
    if (response.data.success && response.data.message === 'Login successful') {
      authEventManager.handleLogin();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  }
};

// Logout function - calls backend to clear httpOnly cookies
export const logout = async (): Promise<void> => {
  try {
    await axios.post(`${API_URL}/logout`, {}, { withCredentials: true });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    authEventManager.handleLogout();
  }
};

// Get user information
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await api.get<User>('/users/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

// Initialize auth state on app startup
export const initializeAuth = async (): Promise<void> => {
  try {
    // Try to get current user to check if already authenticated
    const user = await getCurrentUser();
    if (user) {
      authEventManager.handleLogin();
    }
  } catch (error) {
    // User not authenticated, this is normal on first visit
    console.log('User not authenticated on startup');
  }
};

// Legacy functions for backward compatibility (not used with httpOnly cookies)
export const getToken = (): string | null => {
  return null; // Can't access httpOnly cookies from JavaScript
};

export const getRefreshToken = (): string | null => {
  return null; // Can't access httpOnly cookies from JavaScript
};

export const isTokenExpired = (): boolean => {
  return false; // Server handles token validation
};

export const ensureValidToken = async (): Promise<boolean> => {
  return true; // Server handles token validation
};

export const scheduleTokenRefresh = (): void => {
  // Not needed with httpOnly cookies - server handles everything
};
