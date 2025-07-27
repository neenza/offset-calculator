# JWT Auto-Refresh Authentication System

This application implements a robust JWT authentication system with automatic token refresh capabilities. The system is designed to provide seamless user experience while maintaining security best practices.

## Features

### Backend Authentication (FastAPI)
- **JWT Token Authentication**: Uses access tokens (15 minutes) and refresh tokens (30 days)
- **Secure Token Management**: Separate secret keys for access and refresh tokens
- **User Authentication**: Demo users with bcrypt password hashing
- **Token Refresh Endpoint**: Automatic token renewal without re-authentication

### Frontend Authentication (React/TypeScript)
- **Automatic Token Refresh**: Proactive token renewal before expiration
- **401 Error Handling**: Automatic retry with refreshed tokens
- **Authentication Context**: Centralized state management for user authentication
- **Protected Routes**: Route-level authentication enforcement
- **Persistent Sessions**: Tokens stored in localStorage with auto-initialization

## Authentication Flow

### 1. Login Process
1. User submits credentials via `LoginForm`
2. Frontend sends POST request to `/token` endpoint
3. Backend validates credentials and returns access + refresh tokens
4. Frontend stores tokens and schedules automatic refresh
5. User is redirected to protected content

### 2. Token Refresh Process
1. **Proactive Refresh**: Tokens are refreshed 5 minutes before expiration
2. **Reactive Refresh**: 401 responses trigger immediate token refresh
3. **Queue Management**: Multiple concurrent requests wait for single refresh operation
4. **Fallback Handling**: Failed refresh attempts result in automatic logout

### 3. Request Interceptors
- **Request Interceptor**: Automatically adds Bearer token to all API requests
- **Response Interceptor**: Handles 401 errors with token refresh and request retry
- **Error Handling**: Graceful fallback for authentication failures

## Demo Credentials

The system includes demo accounts for testing:

- **Admin Account**
  - Username: `admin`
  - Password: `admin123`

- **User Account**
  - Username: `user1`
  - Password: `user123`

## Key Components

### Backend Components
- `auth.py` - Authentication logic and route handlers
- `main.py` - FastAPI application with auth integration

### Frontend Components
- `authService.ts` - Core authentication service with token management
- `AuthContext.tsx` - React context for authentication state
- `ProtectedRoute.tsx` - Component for protecting routes
- `LoginForm.tsx` - User login interface
- `api.ts` - Axios configuration with auth interceptors

## API Endpoints

### Authentication Endpoints
- `POST /token` - Login and get access/refresh tokens
- `POST /refresh` - Refresh access token using refresh token
- `GET /users/me` - Get current user information (protected)

### Protected Endpoints
- `POST /calculate` - Printing cost calculation (requires authentication)

## Token Management

### Access Tokens
- **Lifespan**: 15 minutes
- **Usage**: Authenticate API requests
- **Storage**: localStorage (client-side)
- **Refresh**: Automatic before expiration

### Refresh Tokens
- **Lifespan**: 30 days
- **Usage**: Obtain new access tokens
- **Storage**: localStorage (client-side)
- **Security**: Separate secret key, single-use rotation

## Security Features

1. **Separate Token Types**: Access and refresh tokens use different secrets
2. **Short-lived Access Tokens**: Minimize exposure window (15 minutes)
3. **Automatic Refresh**: Seamless user experience without re-authentication
4. **Request Queuing**: Prevents multiple concurrent refresh requests
5. **Error Handling**: Graceful degradation on authentication failures

## Usage

### Starting the Application

1. **Backend**:
   ```bash
   cd backend
   python run_server.py
   ```

2. **Frontend**:
   ```bash
   npm install
   npm run dev
   ```

### Authentication Flow
1. Navigate to the application
2. You'll be prompted to log in with the demo credentials
3. Once authenticated, you can access all protected features
4. Tokens will refresh automatically in the background
5. Use the logout button or wait 30 days for session expiration

### Development Notes
- Tokens are stored in localStorage for persistence across browser sessions
- The authentication state is managed globally via React Context
- All API requests automatically include authentication headers
- 401 responses trigger automatic token refresh and request retry

## Production Considerations

When deploying to production:

1. **Environment Variables**: Move secret keys to environment variables
2. **HTTPS**: Use secure connections for token transmission
3. **Database**: Replace fake user database with real user management
4. **CORS**: Configure appropriate CORS settings for your domain
5. **Token Storage**: Consider using httpOnly cookies for enhanced security
6. **Rate Limiting**: Implement rate limiting for authentication endpoints
7. **Monitoring**: Add logging and monitoring for authentication events

## Troubleshooting

### Common Issues
- **Token Expired**: Automatic refresh should handle this transparently
- **Network Errors**: Check backend server is running on port 8000
- **CORS Issues**: Ensure frontend URL is allowed in backend CORS settings
- **Login Failed**: Verify credentials match demo accounts

### Debug Tips
- Check browser console for authentication errors
- Monitor Network tab for token refresh requests
- Verify localStorage contains auth tokens
- Check backend logs for authentication attempts
