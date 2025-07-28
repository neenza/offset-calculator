from fastapi import Depends, FastAPI, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
import secrets
import redis
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Security settings from environment
SECRET_KEY = os.getenv("SECRET_KEY", "05497ee3693ed49e3992530fc47ab37a50b9c1d4ffaba5099a7b28dc479aff11")
REFRESH_SECRET_KEY = os.getenv("REFRESH_SECRET_KEY", "a8c4e6b2d1f3a9c8e5b7d4f1a3c6e9b2d5f8a1c4e7b0d3f6a9c2e5b8d1f4a7c0")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1  # Short-lived for security
REFRESH_TOKEN_EXPIRE_DAYS = 30

# Cookie settings from environment
COOKIE_DOMAIN = os.getenv("COOKIE_DOMAIN", None)
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax")
COOKIE_PATH = "/"

# Redis connection
def create_redis_connection():
    """Create Redis connection with error handling"""
    try:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        redis_db = int(os.getenv("REDIS_DB", "0"))
        redis_password = os.getenv("REDIS_PASSWORD", None)
        
        if redis_password:
            redis_client = redis.from_url(
                redis_url,
                password=redis_password,
                db=redis_db,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
        else:
            redis_client = redis.from_url(
                redis_url,
                db=redis_db,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
        
        # Test connection
        redis_client.ping()
        print("✅ Redis connection successful")
        return redis_client
        
    except redis.ConnectionError as e:
        print(f"❌ Redis connection failed: {e}")
        print("📋 Falling back to in-memory storage")
        return None
    except Exception as e:
        print(f"❌ Redis setup error: {e}")
        print("📋 Falling back to in-memory storage")
        return None

# Initialize Redis client
redis_client = create_redis_connection()

# Fallback in-memory storage if Redis fails
fallback_sessions = {}  # session_id -> {username, refresh_token, expires_at}

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Custom OAuth2 scheme that reads from cookies
class OAuth2PasswordBearerCookie(OAuth2PasswordBearer):
    async def __call__(self, request: Request) -> Optional[str]:
        # First try to get token from Authorization header
        authorization = request.headers.get("Authorization")
        if authorization and authorization.startswith("Bearer "):
            return authorization.split(" ")[1]
        
        # If not found in header, try to get from cookie
        token = request.cookies.get("access_token")
        if not token:
            if self.auto_error:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Not authenticated",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            else:
                return None
        return token

oauth2_scheme = OAuth2PasswordBearerCookie(tokenUrl="token")

# User model
class User(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = None

class UserInDB(User):
    hashed_password: str

# Token models
class LoginResponse(BaseModel):
    success: bool
    message: str
    user: dict

class TokenResponse(BaseModel):
    success: bool
    message: str

class RefreshTokenRequest(BaseModel):
    # We'll get refresh token from cookie, not request body
    pass

class UserRegistration(BaseModel):
    username: str
    email: str
    full_name: str
    password: str

class TokenData(BaseModel):
    username: Optional[str] = None

# User database functions using Redis
def create_user_in_redis(username: str, email: str, full_name: str, hashed_password: str, disabled: bool = False) -> bool:
    """Create a new user in Redis database"""
    user_data = {
        "username": username,
        "email": email,
        "full_name": full_name,
        "hashed_password": hashed_password,
        "disabled": disabled,
        "created_at": datetime.utcnow().isoformat()
    }
    
    try:
        if redis_client:
            key = f"user:{username}"
            
            # Check if user already exists with correct data type
            try:
                if redis_client.exists(key):
                    # Try to get existing data to verify it's the right type
                    existing_data = redis_client.get(key)
                    if existing_data:
                        # User already exists with valid data
                        return False
            except redis.ResponseError as e:
                if "WRONGTYPE" in str(e):
                    print(f"🧹 Cleaning up user key with wrong type: {key}")
                    cleanup_redis_key(key)
                else:
                    raise e
            
            # Store user data in Redis
            redis_client.set(key, json.dumps(user_data))
            print(f"✅ User created in Redis: {username}")
            return True
        else:
            print("❌ Redis not available, cannot create user")
            return False
    except Exception as e:
        print(f"❌ Error creating user in Redis: {e}")
        return False

def cleanup_redis_key(key: str) -> bool:
    """Clean up a Redis key that might have the wrong data type"""
    try:
        if redis_client:
            # Check if key exists and what type it is
            key_type = redis_client.type(key)
            if key_type != "string" and key_type != "none":
                print(f"🧹 Cleaning up key '{key}' with wrong type: {key_type}")
                redis_client.delete(key)
                return True
        return False
    except Exception as e:
        print(f"❌ Error cleaning up key '{key}': {e}")
        return False

def get_user_from_redis(username: str) -> Optional[dict]:
    """Get user data from Redis database"""
    try:
        if redis_client:
            key = f"user:{username}"
            
            # First, try to get the data
            try:
                user_data = redis_client.get(key)
                if user_data:
                    return json.loads(user_data)
            except redis.ResponseError as e:
                if "WRONGTYPE" in str(e):
                    print(f"🧹 Wrong data type for key '{key}', cleaning up...")
                    cleanup_redis_key(key)
                    return None
                else:
                    raise e
                    
        return None
    except Exception as e:
        print(f"❌ Error getting user from Redis: {e}")
        return None

def update_user_in_redis(username: str, user_data: dict) -> bool:
    """Update user data in Redis database"""
    try:
        if redis_client:
            key = f"user:{username}"
            
            # Check if key exists and clean up if wrong type
            try:
                if redis_client.exists(key):
                    # Verify we can read it as string
                    redis_client.get(key)
            except redis.ResponseError as e:
                if "WRONGTYPE" in str(e):
                    print(f"🧹 Cleaning up user key with wrong type: {key}")
                    cleanup_redis_key(key)
                else:
                    raise e
            
            user_data["updated_at"] = datetime.utcnow().isoformat()
            redis_client.set(key, json.dumps(user_data))
            print(f"✅ User updated in Redis: {username}")
            return True
        return False
    except Exception as e:
        print(f"❌ Error updating user in Redis: {e}")
        return False

def delete_user_from_redis(username: str) -> bool:
    """Delete user from Redis database"""
    try:
        if redis_client:
            result = redis_client.delete(f"user:{username}")
            if result:
                print(f"✅ User deleted from Redis: {username}")
                return True
        return False
    except Exception as e:
        print(f"❌ Error deleting user from Redis: {e}")
        return False

def cleanup_all_user_keys():
    """Clean up all user keys that might have wrong data types"""
    if not redis_client:
        return
        
    try:
        # Find all user keys
        user_keys = redis_client.keys("user:*")
        cleaned_count = 0
        
        for key in user_keys:
            try:
                # Try to get the value as string
                value = redis_client.get(key)
                if value:
                    # Try to parse as JSON to verify it's valid
                    json.loads(value)
            except (redis.ResponseError, json.JSONDecodeError) as e:
                print(f"🧹 Cleaning up invalid user key: {key}")
                redis_client.delete(key)
                cleaned_count += 1
        
        if cleaned_count > 0:
            print(f"✅ Cleaned up {cleaned_count} invalid user keys")
        else:
            print("✅ All user keys are valid")
            
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")

def initialize_default_users():
    """Initialize default users in Redis if they don't exist"""
    # First, clean up any invalid keys
    cleanup_all_user_keys()
    
    default_users = [
        {
            "username": "admin",
            "email": "admin@example.com",
            "full_name": "Admin User",
            "password": "admin123",
            "disabled": False
        },
        {
            "username": "user1",
            "email": "user1@example.com",
            "full_name": "User One", 
            "password": "user123",
            "disabled": False
        }
    ]
    
    for user in default_users:
        if not get_user_from_redis(user["username"]):
            hashed_password = pwd_context.hash(user["password"])
            create_user_in_redis(
                username=user["username"],
                email=user["email"],
                full_name=user["full_name"],
                hashed_password=hashed_password,
                disabled=user["disabled"]
            )

# Initialize default users when the module loads
if redis_client:
    initialize_default_users()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(username: str):
    """Get user from Redis database"""
    user_data = get_user_from_redis(username)
    if user_data:
        return UserInDB(**user_data)
    return None

def authenticate_user(username: str, password: str):
    """Authenticate user against Redis database"""
    user = get_user(username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_refresh_token_from_cookie(request: Request) -> Optional[str]:
    """Get refresh token from httpOnly cookie"""
    return request.cookies.get("refresh_token")

def create_session(username: str) -> str:
    """Create a new session with server-side refresh token storage"""
    session_id = secrets.token_urlsafe(32)
    refresh_token = create_refresh_token(data={"sub": username})
    expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    session_data = {
        "username": username,
        "refresh_token": refresh_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.utcnow().isoformat()
    }
    
    try:
        if redis_client:
            # Store in Redis with automatic expiration
            redis_client.setex(
                f"session:{session_id}",
                REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,  # TTL in seconds
                json.dumps(session_data)
            )
            print(f"✅ Session stored in Redis: {session_id}")
        else:
            # Fallback to in-memory storage
            fallback_sessions[session_id] = session_data
            print(f"📋 Session stored in memory: {session_id}")
    except Exception as e:
        print(f"❌ Redis error, using fallback: {e}")
        fallback_sessions[session_id] = session_data
    
    return session_id

def get_session(session_id: str) -> Optional[dict]:
    """Get session data from server-side storage"""
    try:
        if redis_client:
            # Try Redis first
            session_data = redis_client.get(f"session:{session_id}")
            if session_data:
                session = json.loads(session_data)
                # Check if session has expired
                expires_at = datetime.fromisoformat(session["expires_at"])
                if datetime.utcnow() > expires_at:
                    redis_client.delete(f"session:{session_id}")
                    return None
                return session
        else:
            # Use fallback storage
            if session_id not in fallback_sessions:
                return None
            
            session = fallback_sessions[session_id]
            expires_at = datetime.fromisoformat(session["expires_at"])
            if datetime.utcnow() > expires_at:
                del fallback_sessions[session_id]
                return None
            return session
    except Exception as e:
        print(f"❌ Error getting session: {e}")
        # Try fallback
        if session_id in fallback_sessions:
            session = fallback_sessions[session_id]
            expires_at = datetime.fromisoformat(session["expires_at"])
            if datetime.utcnow() > expires_at:
                del fallback_sessions[session_id]
                return None
            return session
    
    return None

def refresh_session(session_id: str) -> Optional[str]:
    """Refresh a session and return new session ID"""
    session = get_session(session_id)
    if not session:
        return None
    
    # Delete old session
    delete_session(session_id)
    
    # Create new session
    return create_session(session["username"])

def delete_session(session_id: str) -> None:
    """Delete a session (logout)"""
    try:
        if redis_client:
            redis_client.delete(f"session:{session_id}")
            print(f"✅ Session deleted from Redis: {session_id}")
        else:
            if session_id in fallback_sessions:
                del fallback_sessions[session_id]
                print(f"📋 Session deleted from memory: {session_id}")
    except Exception as e:
        print(f"❌ Error deleting session: {e}")
        # Try fallback
        if session_id in fallback_sessions:
            del fallback_sessions[session_id]

def get_session_from_cookie(request: Request) -> Optional[str]:
    """Get session ID from httpOnly cookie"""
    return request.cookies.get("session_id")

def verify_refresh_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        token_type: str = payload.get("type")
        if username is None or token_type != "refresh":
            return None
        return username
    except JWTError:
        return None

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        token_type: str = payload.get("type")
        if username is None or token_type != "access":
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Add these routes to your main.py
def setup_auth_routes(app):
    @app.post("/token", response_model=LoginResponse)
    async def login_for_access_token(
        response: Response, 
        form_data: OAuth2PasswordRequestForm = Depends()
    ):
        user = authenticate_user(form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        
        # Create server-side session (refresh token stored server-side)
        session_id = create_session(user.username)
        
        # Set secure httpOnly cookies - NO TOKENS VISIBLE TO CLIENT
        # Only access token (short-lived) in cookie
        response.set_cookie(
            key="access_token",
            value=access_token,
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            httponly=True,
            secure=COOKIE_SECURE,
            samesite=COOKIE_SAMESITE,
            domain=COOKIE_DOMAIN,
            path=COOKIE_PATH
        )
        
        # Session ID only (refresh token stored server-side)
        response.set_cookie(
            key="session_id",
            value=session_id,
            max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
            httponly=True,
            secure=COOKIE_SECURE,
            samesite=COOKIE_SAMESITE,
            domain=COOKIE_DOMAIN,
            path=COOKIE_PATH
        )
        
        # Return success response WITHOUT tokens
        return {
            "success": True,
            "message": "Login successful",
            "user": {
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name
            }
        }
    
    @app.post("/refresh", response_model=TokenResponse)
    async def refresh_access_token(
        request: Request,
        response: Response
    ):
        # Get session ID from httpOnly cookie
        session_id = get_session_from_cookie(request)
        if not session_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        # Get session data from server-side storage
        session = get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired session",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        username = session["username"]
        user = get_user(username)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        new_access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        
        # Refresh the session (rotate session ID for security)
        new_session_id = refresh_session(session_id)
        if not new_session_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to refresh session",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Set new secure httpOnly cookies - NO TOKENS VISIBLE
        response.set_cookie(
            key="access_token",
            value=new_access_token,
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            httponly=True,
            secure=COOKIE_SECURE,
            samesite=COOKIE_SAMESITE,
            domain=COOKIE_DOMAIN,
            path=COOKIE_PATH
        )
        
        # New session ID (refresh token stays server-side)
        response.set_cookie(
            key="session_id",
            value=new_session_id,
            max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
            httponly=True,
            secure=COOKIE_SECURE,
            samesite=COOKIE_SAMESITE,
            domain=COOKIE_DOMAIN,
            path=COOKIE_PATH
        )
        
        return {
            "success": True,
            "message": "Token refreshed successfully"
        }
    
    @app.post("/logout", response_model=TokenResponse)
    async def logout(request: Request, response: Response):
        # Get session ID from cookie and delete server-side session
        session_id = get_session_from_cookie(request)
        if session_id:
            delete_session(session_id)
        
        # Clear httpOnly cookies
        response.delete_cookie(
            key="access_token",
            httponly=True,
            secure=COOKIE_SECURE,
            samesite=COOKIE_SAMESITE,
            domain=COOKIE_DOMAIN,
            path=COOKIE_PATH
        )
        response.delete_cookie(
            key="session_id",
            httponly=True,
            secure=COOKIE_SECURE,
            samesite=COOKIE_SAMESITE,
            domain=COOKIE_DOMAIN,
            path=COOKIE_PATH
        )
        
        return {
            "success": True,
            "message": "Logout successful"
        }
    
    @app.post("/register", response_model=LoginResponse)
    async def register_user(user_data: UserRegistration):
        """Register a new user"""
        # Check if user already exists
        if get_user_from_redis(user_data.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )
        
        # Hash the password
        hashed_password = get_password_hash(user_data.password)
        
        # Create user in Redis
        success = create_user_in_redis(
            username=user_data.username,
            email=user_data.email,
            full_name=user_data.full_name,
            hashed_password=hashed_password,
            disabled=False
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )
        
        return {
            "success": True,
            "message": "User registered successfully",
            "user": {
                "username": user_data.username,
                "email": user_data.email,
                "full_name": user_data.full_name
            }
        }
    
    @app.get("/users/me", response_model=User)
    async def read_users_me(current_user: User = Depends(get_current_active_user)):
        return current_user
