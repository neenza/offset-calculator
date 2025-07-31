import api from './api';

// Types for database operations
export interface ClientData {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  status: 'active' | 'inactive' | 'pending';
  clientType: 'individual' | 'business' | 'enterprise';
  creditLimit: number;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
  totalOrders?: number;
  totalRevenue?: number;
  lastOrderDate?: string;
}

export interface DatabaseAnalytics {
  clients: {
    total: number;
    active: number;
    inactive: number;
  };
  revenue: {
    total: number;
    total_orders: number;
    avg_order_value: number;
  };
  projects: {
    total: number;
    active: number;
    completed: number;
  };
  quotes: {
    total: number;
    pending: number;
    processed: number;
  };
}

// Client Management API
export const clientsApi = {
  // Get all clients with optional filtering
  getClients: async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    status?: string;
    clientType?: string;
  }): Promise<ClientData[]> => {
    const response = await api.get('/api/database/clients', { params });
    return response.data.map(transformClientData);
  },

  // Get a specific client by ID
  getClient: async (clientId: string): Promise<ClientData> => {
    const response = await api.get(`/api/database/clients/${clientId}`);
    return transformClientData(response.data);
  },

  // Create a new client
  createClient: async (clientData: Omit<ClientData, '_id' | 'createdAt' | 'updatedAt' | 'totalOrders' | 'totalRevenue'>): Promise<ClientData> => {
    const transformedData = transformClientDataForAPI(clientData as ClientData);
    const response = await api.post('/api/database/clients', transformedData);
    return transformClientData(response.data);
  },

  // Update an existing client
  updateClient: async (clientId: string, clientData: Partial<ClientData>): Promise<ClientData> => {
    const transformedData = transformClientDataForAPI(clientData as ClientData);
    const response = await api.put(`/api/database/clients/${clientId}`, transformedData);
    return transformClientData(response.data);
  },

  // Delete a client
  deleteClient: async (clientId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/api/database/clients/${clientId}`);
    return response.data;
  }
};

// Analytics API
export const analyticsApi = {
  // Get overview analytics
  getOverview: async (): Promise<DatabaseAnalytics> => {
    const response = await api.get('/api/database/analytics/overview');
    return response.data;
  },

  // Get revenue trend
  getRevenueTrend: async (months: number = 12): Promise<any> => {
    const response = await api.get('/api/database/analytics/revenue-trend', {
      params: { months }
    });
    return response.data;
  },

  // Get client analytics
  getClientAnalytics: async (): Promise<any> => {
    const response = await api.get('/api/database/analytics/clients');
    return response.data;
  }
};

// Database Health API
export const databaseApi = {
  // Check database health
  checkHealth: async (): Promise<{ status: string; message: string }> => {
    const response = await api.get('/api/database/health');
    return response.data;
  },

  // Get database statistics
  getStats: async (): Promise<any> => {
    const response = await api.get('/api/database/stats');
    return response.data;
  }
};

// Projects API (placeholder for future implementation)
export const projectsApi = {
  getProjects: async (params?: any): Promise<any[]> => {
    // TODO: Implement when projects routes are available
    return [];
  },

  createProject: async (projectData: any): Promise<any> => {
    // TODO: Implement when projects routes are available
    return projectData;
  }
};

// Quotes API (placeholder for future implementation)
export const quotesApi = {
  getQuotes: async (params?: any): Promise<any[]> => {
    // TODO: Implement when quotes routes are available
    return [];
  },

  createQuote: async (quoteData: any): Promise<any> => {
    // TODO: Implement when quotes routes are available
    return quoteData;
  }
};

// Utility function to transform client data for API
export const transformClientDataForAPI = (clientData: ClientData) => {
  return {
    name: clientData.name,
    email: clientData.email,
    phone: clientData.phone,
    company: clientData.company,
    address: {
      street: clientData.address,
      city: clientData.city,
      state: clientData.state,
      zip_code: clientData.zipCode,
      country: 'USA'
    },
    status: clientData.status,
    client_type: clientData.clientType,
    credit_limit: clientData.creditLimit,
    notes: clientData.notes
  };
};

// Export/Import API
export const dataManagementApi = {
  // Export clients data
  exportClients: async (format: 'csv' | 'json' | 'excel' = 'csv'): Promise<any> => {
    const response = await api.get('/api/database/clients/export', {
      params: { format }
    });
    return response.data;
  },

  // Import clients data
  importClients: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/api/database/clients/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

// Utility functions for data transformation
export const transformClientData = (client: any): ClientData => {
  return {
    _id: client.id || client._id,
    name: client.name || '',
    email: client.email || '',
    phone: client.phone || '',
    company: client.company || '',
    address: client.address?.street || '',
    city: client.address?.city || '',
    state: client.address?.state || '',
    zipCode: client.address?.zip_code || '',
    status: client.status || 'active',
    clientType: client.client_type || 'individual',
    creditLimit: client.credit_limit || 0,
    notes: client.notes || '',
    createdAt: client.created_at,
    updatedAt: client.updated_at,
    totalOrders: client.total_orders || 0,
    totalRevenue: client.total_revenue || 0,
    lastOrderDate: client.last_order_date
  };
};
