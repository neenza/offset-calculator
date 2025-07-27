// authService.ts - Service to manage authentication with the FastAPI backend

import axios from 'axios';

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
  token_type: string;
}

// Get the stored token
export const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Check if the user is logged in
export const isLoggedIn = (): boolean => {
  return !!getToken();
};

// Set the token in localStorage
const setToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

// Remove the token from localStorage
export const logout = (): void => {
  localStorage.removeItem('auth_token');
};

// Create an axios instance with the token
const api = axios.create({
  baseURL: API_URL,
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
    
    // Store the token
    setToken(response.data.access_token);
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
    // If token is invalid or expired, log the user out
    logout();
    return null;
  }
};
