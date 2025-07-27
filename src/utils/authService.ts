// authService.ts - Service to manage authentication with the FastAPI backend

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
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Token refresh state management
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// Queue for failed requests during token refresh
const addSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const notifySubscribers = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

// Get the stored token
export const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Get the stored refresh token
export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

// Check if the user is logged in
export const isLoggedIn = (): boolean => {
  return !!getToken();
};

// Check if token is expired (basic check based on timestamp)
export const isTokenExpired = (): boolean => {
  const token = getToken();
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

// Set the token in localStorage
const setToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

// Set the refresh token in localStorage
const setRefreshToken = (token: string): void => {
  localStorage.setItem('refresh_token', token);
};

// Remove the tokens from localStorage
export const logout = (): void => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  isRefreshing = false;
  refreshSubscribers = [];
  authEventManager.handleLogout();
};

// Refresh the access token with improved error handling and queue management
export const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    logout();
    return false;
  }

  // If already refreshing, return a promise that resolves when refresh completes
  if (isRefreshing) {
    return new Promise((resolve) => {
      addSubscriber((token: string) => {
        resolve(!!token);
      });
    });
  }

  isRefreshing = true;

  try {
    const response = await axios.post<AuthResponse>(
      `${API_URL}/refresh`,
      { refresh_token: refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Store the new tokens
    setToken(response.data.access_token);
    setRefreshToken(response.data.refresh_token);
    
    // Notify all waiting requests
    notifySubscribers(response.data.access_token);
    
    isRefreshing = false;
    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    
    // If refresh fails, log the user out
    logout();
    authEventManager.handleAuthFailure();
    
    // Notify subscribers about the failure
    notifySubscribers('');
    
    isRefreshing = false;
    return false;
  }
};

// Proactive token refresh - check token expiry and refresh if needed
export const ensureValidToken = async (): Promise<boolean> => {
  if (!isLoggedIn()) return false;
  
  if (isTokenExpired()) {
    return await refreshAccessToken();
  }
  
  return true;
};

// Auto refresh token when it's close to expiring (within 5 minutes)
export const scheduleTokenRefresh = (): void => {
  const token = getToken();
  if (!token) return;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = payload.exp - currentTime;
    
    // If token expires in less than 5 minutes, refresh now
    if (timeUntilExpiry <= 300) { // 5 minutes
      refreshAccessToken();
      return;
    }
    
    // Schedule refresh 5 minutes before expiry
    const refreshIn = (timeUntilExpiry - 300) * 1000; // Convert to milliseconds
    
    setTimeout(() => {
      refreshAccessToken();
    }, refreshIn);
  } catch (error) {
    console.error('Error scheduling token refresh:', error);
  }
};

// Create API instance with automatic token management
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to authenticated requests and handle token refresh
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401 responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
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
      
      // If refresh failed, redirect to login or handle as needed
      authEventManager.handleAuthFailure();
      console.error('Authentication failed. Please log in again.');
    }
    
    return Promise.reject(error);
  }
);

// Login function
export const login = async (credentials: LoginCredentials): Promise<boolean> => {
  try {
    // FastAPI expects a form data for OAuth2 password flow
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await axios.post<AuthResponse>(
      `${API_URL}/token`, 
      formData
    );
    
    // Store the tokens
    setToken(response.data.access_token);
    setRefreshToken(response.data.refresh_token);
    
    // Schedule automatic token refresh
    scheduleTokenRefresh();
    
    authEventManager.handleLogin();
    return true;
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  }
};

// Get user information
export const getCurrentUser = async (): Promise<User | null> => {
  if (!isLoggedIn()) return null;
  
  try {
    const response = await api.get<User>('/users/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

// Initialize auth state on app startup
export const initializeAuth = (): void => {
  if (isLoggedIn() && !isTokenExpired()) {
    scheduleTokenRefresh();
    authEventManager.handleLogin();
  } else if (isLoggedIn() && isTokenExpired()) {
    // Try to refresh the token if it's expired
    refreshAccessToken().then((success) => {
      if (success) {
        scheduleTokenRefresh();
        authEventManager.handleLogin();
      }
    });
  }
};
