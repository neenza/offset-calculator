import { PrintingJob, CostBreakdown } from '../models/PrintingJob';
import api from './api'; // Use the centralized API instance with refresh token logic

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
