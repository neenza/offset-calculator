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

  // Convert millimeters to inches
  mmToInch: async (mm: number): Promise<number> => {
    try {
      const response = await api.get<{ mm: number; inch: number }>(`/utils/mm-to-inch/${mm}`);
      return response.data.inch;
    } catch (error) {
      console.error('Error converting mm to inches:', error);
      // Fallback to local calculation if API fails
      return mm / 25.4;
    }
  },

  // Format measurement based on the unit preference
  formatMeasurement: async (value: number, unit: 'mm' | 'inch'): Promise<string> => {
    try {
      const response = await api.get<{ formatted: string }>('/utils/format-measurement', {
        params: { value, unit }
      });
      return response.data.formatted;
    } catch (error) {
      console.error('Error formatting measurement:', error);
      // Fallback to local formatting if API fails
      if (unit === 'inch') {
        const inches = value / 25.4;
        return `${inches.toFixed(2)}`;
      }
      return `${value}mm`;
    }
  },

  // Format sheet size description based on the unit preference
  formatSheetSizeDescription: async (width: number, height: number, unit: 'mm' | 'inch'): Promise<string> => {
    try {
      const response = await api.get<{ formatted: string }>('/utils/format-sheet-size', {
        params: { width, height, unit }
      });
      return response.data.formatted;
    } catch (error) {
      console.error('Error formatting sheet size:', error);
      // Fallback to local formatting if API fails
      if (unit === 'inch') {
        return `${(width / 25.4).toFixed(2)}" × ${(height / 25.4).toFixed(2)}"`;
      }
      return `${width}mm × ${height}mm`;
    }
  },

  // Format currency amount
  formatCurrency: async (amount: number): Promise<string> => {
    try {
      const response = await api.get<{ formatted: string }>(`/utils/format-currency/${amount}`);
      return response.data.formatted;
    } catch (error) {
      console.error('Error formatting currency:', error);
      // Fallback to local formatting if API fails
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(amount);
    }
  }
};

export default calculatorApi;
