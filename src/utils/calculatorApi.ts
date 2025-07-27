import { PrintingJob, CostBreakdown } from '../models/PrintingJob';
import axios from 'axios';

// Create an axios instance with auth token
const API_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to authenticated requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Calculator API service
const calculatorApi = {
  // Calculate total cost for a printing job
  calculateTotalCost: async (job: PrintingJob): Promise<CostBreakdown> => {
    try {
      const response = await api.post<CostBreakdown>('/calculate', job);
      return response.data;
    } catch (error) {
      console.error('Error calculating cost:', error);
      throw error;
    }
  },

  // These functions have been moved to formatters.ts and implemented locally
  // We only need the main calculation functionality from the backend
};

export default calculatorApi;
