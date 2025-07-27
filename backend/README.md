# Offset Printing Calculator Backend

This FastAPI backend implements the calculation logic for the Offset Printing Calculator application.

## Setup Instructions

1. Install required packages:
   ```
   pip install -r requirements.txt
   ```

2. Generate a secure secret key for JWT authentication:
   ```
   python generate_key.py
   ```
   
   Update the SECRET_KEY in auth.py with the generated key.

3. Start the server:
   ```
   python run_server.py
   ```
   
   The API will be available at http://localhost:8000

## API Endpoints

- `GET /`: API home
- `POST /token`: Get authentication token
- `GET /users/me`: Get current user info
- `POST /calculate`: Calculate costs for a printing job
- `GET /utils/mm-to-inch/{mm}`: Convert mm to inches
- `GET /utils/format-measurement`: Format a measurement
- `GET /utils/format-sheet-size`: Format a sheet size
- `GET /utils/format-currency/{amount}`: Format currency

## Frontend Integration

To integrate with your React frontend, update your API calls to use the backend:

```typescript
// src/api/calculatorApi.ts
import axios from 'axios';
import { PrintingJob, CostBreakdown } from '../models/PrintingJob';

// Create an axios instance
const api = axios.create({
  baseURL: 'http://localhost:8000',
});

// Add token to authenticated requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login function
export const login = async (username: string, password: string) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  
  const response = await api.post('/token', formData);
  localStorage.setItem('auth_token', response.data.access_token);
  return response.data;
};

// Logout function
export const logout = () => {
  localStorage.removeItem('auth_token');
};

// Calculate printing costs
export const calculateCosts = async (job: PrintingJob): Promise<CostBreakdown> => {
  const response = await api.post('/calculate', job);
  return response.data;
};
```

Then update your frontend components to use these functions instead of the local calculations.

## Authentication

Default users for testing:
- Username: admin, Password: admin123
- Username: user1, Password: user123
