# Offset Printing Calculator Backend

This FastAPI backend implements the calculation logic for the Offset Printing Calculator application with Redis-based user authentication.

## Setup Instructions

1. Install required packages:
   ```
   pip install -r requirements.txt
   ```

2. Configure Redis connection in `.env` file:
   ```
   REDIS_URL=your_redis_url
   REDIS_USERNAME=your_redis_username
   REDIS_PASSWORD=your_redis_password
   REDIS_DB=0
   REDIS_SSL=true
   ```

3. Generate secure secret keys for JWT authentication:
   ```
   python generate_key.py
   ```
   
   Update the SECRET_KEY and REFRESH_SECRET_KEY in `.env` file with the generated keys.

4. Test the Redis connection and authentication system:
   ```
   python test_redis_auth.py
   ```

5. Start the server:
   ```
   python run_server.py
   ```
   
   The API will be available at http://localhost:8000

## Authentication System

The backend now uses Redis database for user storage instead of in-memory fake users. Features include:

- **Redis-based user storage**: Users are stored in Redis with automatic initialization of default users
- **Secure password hashing**: Using bcrypt for password security  
- **JWT tokens with httpOnly cookies**: Access tokens are short-lived, refresh tokens stored server-side
- **Session management**: Server-side session storage in Redis with automatic cleanup
- **User registration**: New users can register via the `/register` endpoint
- **Fallback support**: Falls back to in-memory storage if Redis is unavailable

### Default Users

The system automatically creates these default users in Redis:
- Username: `admin`, Password: `admin123`
- Username: `user1`, Password: `user123`

## API Endpoints

### Authentication
- `POST /token`: Login and get authentication tokens
- `POST /refresh`: Refresh access token using session
- `POST /logout`: Logout and clear session
- `POST /register`: Register a new user
- `GET /users/me`: Get current user info

### Application
- `GET /`: API home
- `POST /calculate`: Calculate costs for a printing job (requires authentication)

## Frontend Integration

Update your frontend API calls to include registration functionality:

```typescript
// Register new user
export const register = async (username: string, email: string, fullName: string, password: string) => {
  const response = await api.post('/register', {
    username,
    email,
    full_name: fullName,
    password
  });
  return response.data;
};

// Login remains the same but now uses Redis users
export const login = async (username: string, password: string) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  
  const response = await api.post('/token', formData);
  return response.data;
};
```

## Database Schema

Users are stored in Redis with the following structure:
```json
{
  "username": "string",
  "email": "string", 
  "full_name": "string",
  "hashed_password": "string",
  "disabled": false,
  "created_at": "ISO datetime",
  "updated_at": "ISO datetime"
}
```

Sessions are stored with:
```json
{
  "username": "string",
  "refresh_token": "JWT token",
  "expires_at": "ISO datetime",
  "created_at": "ISO datetime"
}
```
