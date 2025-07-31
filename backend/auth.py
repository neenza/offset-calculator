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

# Debug: Print security settings being loaded
print(f"🔍 Loading security settings:")
print(f"   ENFORCE_SINGLE_DEVICE = {os.getenv('ENFORCE_SINGLE_DEVICE', 'not_set')}")
print(f"   SESSION_FINGERPRINTING = {os.getenv('SESSION_FINGERPRINTING', 'not_set')}")

# Security settings from environment
SECRET_KEY = os.getenv("SECRET_KEY", "05497ee3693ed49e3992530fc47ab37a50b9c1d4ffaba5099a7b28dc479aff11")
REFRESH_SECRET_KEY = os.getenv("REFRESH_SECRET_KEY", "a8c4e6b2d1f3a9c8e5b7d4f1a3c6e9b2d5f8a1c4e7b0d3f6a9c2e5b8d1f4a7c0")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1  # Short-lived for security
REFRESH_TOKEN_EXPIRE_DAYS = 30

# Cookie settings from environment
COOKIE_DOMAIN = os.getenv("COOKIE_DOMAIN", None)
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "none")
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

def cleanup_all_sessions():
    """Clean up all sessions to remove fingerprint data that might cause issues"""
    if not redis_client:
        # Clear fallback sessions too
        fallback_sessions.clear()
        print("📋 Cleared all fallback sessions")
        return
        
    try:
        # Find all session keys
        session_keys = redis_client.keys("session:*")
        user_session_keys = redis_client.keys("user_session:*")
        
        # Delete all sessions
        all_keys = session_keys + user_session_keys
        if all_keys:
            redis_client.delete(*all_keys)
            print(f"🧹 Cleaned up {len(all_keys)} session keys from Redis")
        else:
            print("✅ No sessions to clean up")
            
        # Clear fallback sessions too
        fallback_sessions.clear()
        print("📋 Cleared all fallback sessions")
            
    except Exception as e:
        print(f"❌ Error during session cleanup: {e}")

# Security functions for session hijacking prevention
def validate_session_integrity(request: Request, session_id: str, session_data: dict) -> bool:
    """Validate session integrity to prevent token sharing"""
    try:
        # Get client information for fingerprinting
        user_agent = request.headers.get("user-agent", "")
        client_ip = request.client.host if request.client else ""
        
        # Check if session has stored fingerprint
        stored_fingerprint = session_data.get("fingerprint", {})
        
        # Create current fingerprint
        current_fingerprint = {
            "user_agent": user_agent,
            "ip": client_ip
        }
        
        # If no stored fingerprint, this is the first validation - store it
        if not stored_fingerprint:
            print(f"🔍 First time fingerprinting for session: {session_id[:8]}...")
            session_data["fingerprint"] = current_fingerprint
            # Update session in Redis
            if redis_client:
                redis_client.setex(
                    f"session:{session_id}",
                    REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
                    json.dumps(session_data)
                )
            else:
                # Update fallback storage
                if session_id in fallback_sessions:
                    fallback_sessions[session_id] = session_data
            return True
        
        # Validate fingerprint matches
        if (stored_fingerprint.get("user_agent") != current_fingerprint["user_agent"] or
            stored_fingerprint.get("ip") != current_fingerprint["ip"]):
            print(f"⚠️ Session fingerprint mismatch for session: {session_id[:8]}...")
            print(f"   Stored IP: {stored_fingerprint.get('ip')} vs Current IP: {client_ip}")
            print(f"   Stored UA: {stored_fingerprint.get('user_agent', '')[:50]}... vs Current UA: {user_agent[:50]}...")
            return False
            
        print(f"✅ Session fingerprint validated for session: {session_id[:8]}...")
        return True
        
    except Exception as e:
        print(f"❌ Error validating session integrity: {e}")
        return False

def terminate_all_user_sessions(username: str) -> None:
    """Terminate all active sessions for a user (single-device enforcement)"""
    try:
        if redis_client:
            # Find all sessions for this user
            user_sessions = redis_client.keys("session:*")
            terminated_count = 0
            
            for session_key in user_sessions:
                try:
                    session_data = redis_client.get(session_key)
                    if session_data:
                        session = json.loads(session_data)
                        if session.get("username") == username:
                            redis_client.delete(session_key)
                            terminated_count += 1
                except Exception as e:
                    print(f"Error checking session {session_key}: {e}")
            
            # Clear user session tracking
            redis_client.delete(f"user_session:{username}")
            
            if terminated_count > 0:
                print(f"🔄 Terminated {terminated_count} existing sessions for user: {username}")
        else:
            # Fallback: terminate from memory
            sessions_to_delete = []
            for session_id, session_data in fallback_sessions.items():
                if session_data.get("username") == username:
                    sessions_to_delete.append(session_id)
            
            for session_id in sessions_to_delete:
                del fallback_sessions[session_id]
                
            if sessions_to_delete:
                print(f"🔄 Terminated {len(sessions_to_delete)} existing sessions for user: {username}")
                
    except Exception as e:
        print(f"❌ Error terminating user sessions: {e}")

def is_user_session_valid(username: str, session_id: str) -> bool:
    """Check if the session is the user's current valid session"""
    try:
        if redis_client:
            current_session = redis_client.get(f"user_session:{username}")
            return current_session == session_id
        else:
            # For fallback, we assume it's valid if it exists
            return session_id in fallback_sessions
    except Exception as e:
        print(f"❌ Error validating user session: {e}")
        return False

def force_logout_response(response: Response):
    """Helper function to clear all authentication cookies"""
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

def initialize_default_users():
    """Initialize default users in Redis if they don't exist"""
    # First, clean up any invalid keys
    cleanup_all_user_keys()
    
    # Clean up sessions to remove any fingerprint data causing issues
    print("🧹 Cleaning up sessions to prevent authentication issues...")
    cleanup_all_sessions()
    
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

def create_session(username: str, request: Request = None) -> str:
    """Create a new session with server-side refresh token storage"""
    
    # OPTIONAL: Enforce single device login
    if os.getenv("ENFORCE_SINGLE_DEVICE", "false").lower() == "true":
        terminate_all_user_sessions(username)
    
    session_id = secrets.token_urlsafe(32)
    refresh_token = create_refresh_token(data={"sub": username})
    expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    # Enhanced session data with fingerprinting
    session_data = {
        "username": username,
        "refresh_token": refresh_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.utcnow().isoformat(),
        "fingerprint": {}
    }
    
    # Add fingerprinting if request is available
    if request and os.getenv("SESSION_FINGERPRINTING", "false").lower() == "true":
        session_data["fingerprint"] = {
            "user_agent": request.headers.get("user-agent", ""),
            "ip": request.client.host if request.client else ""
        }
    
    try:
        if redis_client:
            # Store session
            redis_client.setex(
                f"session:{session_id}",
                REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,  # TTL in seconds
                json.dumps(session_data)
            )
            
            # Track user's active session for single-device enforcement
            if os.getenv("ENFORCE_SINGLE_DEVICE", "false").lower() == "true":
                redis_client.set(f"user_session:{username}", session_id, ex=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600)
            
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

def refresh_session(session_id: str, request: Request = None) -> Optional[str]:
    """Refresh a session and return new session ID"""
    session = get_session(session_id)
    if not session:
        return None
    
    # Delete old session
    delete_session(session_id)
    
    # Create new session with request context for fingerprinting
    return create_session(session["username"], request)

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
        request: Request,
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
        # Pass request for fingerprinting and single-device enforcement
        session_id = create_session(user.username, request)
        
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
        print(f"🔄 Refresh request received")
        
        # Get session ID from httpOnly cookie
        session_id = get_session_from_cookie(request)
        if not session_id:
            print(f"❌ No session ID found in cookies")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        print(f"🔍 Processing refresh for session: {session_id[:8]}...")
        
        # Get session data from server-side storage
        session = get_session(session_id)
        if not session:
            print(f"🚫 Invalid session attempted: {session_id[:8]}...")
            force_logout_response(response)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired session - please login again",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        username = session["username"]
        print(f"🔍 Session found for user: {username}")
        
        # Check if this is the user's current valid session (single-device enforcement)
        single_device_enabled = os.getenv("ENFORCE_SINGLE_DEVICE", "false").lower() == "true"
        print(f"🔒 Single device enforcement: {single_device_enabled}")
        
        if single_device_enabled:
            if not is_user_session_valid(username, session_id):
                print(f"🚫 Session invalidated by newer login: {session_id[:8]}...")
                delete_session(session_id)
                force_logout_response(response)
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Session invalidated by login from another device",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        
        # Validate session integrity (prevents token sharing)
        fingerprinting_enabled = os.getenv("SESSION_FINGERPRINTING", "false").lower() == "true"
        print(f"🔒 Session fingerprinting: {fingerprinting_enabled}")
        
        if fingerprinting_enabled:
            if not validate_session_integrity(request, session_id, session):
                print(f"🚫 Session integrity check failed: {session_id[:8]}...")
                delete_session(session_id)
                force_logout_response(response)
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Session security violation detected - please login again",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        
        user = get_user(username)
        if not user:
            print(f"🚫 User not found for session: {session_id[:8]}...")
            delete_session(session_id)
            force_logout_response(response)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        print(f"✅ User validation passed for: {username}")
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        new_access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        
        print(f"🔄 Refreshing session...")
        
        # Refresh the session (rotate session ID for security)
        new_session_id = refresh_session(session_id, request)
        if not new_session_id:
            print(f"❌ Failed to refresh session")
            force_logout_response(response)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to refresh session",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        print(f"✅ Session refreshed successfully: {new_session_id[:8]}...")
        
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
        
        print(f"✅ Refresh completed successfully for user: {username}")
        
        return {
            "success": True,
            "message": "Token refreshed successfully"
        }
    
    @app.post("/logout", response_model=TokenResponse)
    async def logout(request: Request, response: Response):
        # Get session ID from cookie and delete server-side session
        session_id = get_session_from_cookie(request)
        if session_id:
            # Get session data to find username for cleanup
            session = get_session(session_id)
            if session:
                username = session.get("username")
                # If single-device enforcement is enabled, clear user session tracking
                if (username and 
                    os.getenv("ENFORCE_SINGLE_DEVICE", "false").lower() == "true" and 
                    redis_client):
                    try:
                        redis_client.delete(f"user_session:{username}")
                        print(f"🔄 Cleared user session tracking for: {username}")
                    except Exception as e:
                        print(f"❌ Error clearing user session tracking: {e}")
            
            delete_session(session_id)
        
        # Clear httpOnly cookies
        force_logout_response(response)
        
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
    
    @app.get("/session/status")
    async def get_session_status(request: Request):
        """Get current session status and security information"""
        session_id = get_session_from_cookie(request)
        if not session_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No active session",
            )
        
        session = get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid session",
            )
        
        # Get security settings
        single_device_enabled = os.getenv("ENFORCE_SINGLE_DEVICE", "false").lower() == "true"
        fingerprinting_enabled = os.getenv("SESSION_FINGERPRINTING", "false").lower() == "true"
        
        # Get session info
        created_at = session.get("created_at")
        expires_at = session.get("expires_at")
        fingerprint = session.get("fingerprint", {})
        
        return {
            "success": True,
            "session_id": session_id[:8] + "...",  # Only show first 8 chars for security
            "username": session.get("username"),
            "created_at": created_at,
            "expires_at": expires_at,
            "security_features": {
                "single_device_enforcement": single_device_enabled,
                "session_fingerprinting": fingerprinting_enabled,
                "fingerprint_stored": bool(fingerprint)
            },
            "client_info": {
                "current_ip": request.client.host if request.client else "unknown",
                "current_user_agent": request.headers.get("user-agent", "unknown")[:50] + "..." if len(request.headers.get("user-agent", "")) > 50 else request.headers.get("user-agent", "unknown")
            }
        }
