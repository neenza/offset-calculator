#!/usr/bin/env python3
"""
Test script to verify Redis-based authentication system
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from auth import (
    create_redis_connection,
    create_user_in_redis,
    get_user_from_redis,
    authenticate_user,
    get_user,
    delete_user_from_redis
)

def test_redis_connection():
    """Test Redis connection"""
    print("🔧 Testing Redis connection...")
    redis_client = create_redis_connection()
    if redis_client:
        print("✅ Redis connection successful")
        return True
    else:
        print("❌ Redis connection failed")
        return False

def test_user_operations():
    """Test user CRUD operations"""
    print("\n🔧 Testing user operations...")
    
    # Test user creation
    print("Creating test user...")
    success = create_user_in_redis(
        username="testuser",
        email="test@example.com", 
        full_name="Test User",
        hashed_password="$2b$12$test_hashed_password",
        disabled=False
    )
    
    if success:
        print("✅ User creation successful")
    else:
        print("❌ User creation failed")
        return False
    
    # Test user retrieval
    print("Retrieving test user...")
    user_data = get_user_from_redis("testuser")
    if user_data:
        print(f"✅ User retrieval successful: {user_data['username']}")
    else:
        print("❌ User retrieval failed")
        return False
    
    # Test user authentication functions
    print("Testing authentication functions...")
    user = get_user("testuser")
    if user:
        print(f"✅ get_user() successful: {user.username}")
    else:
        print("❌ get_user() failed")
        return False
    
    # Cleanup - delete test user
    print("Cleaning up test user...")
    deleted = delete_user_from_redis("testuser")
    if deleted:
        print("✅ User cleanup successful")
    else:
        print("❌ User cleanup failed")
    
    return True

def test_default_users():
    """Test that default users are available"""
    print("\n🔧 Testing default users...")
    
    default_users = ["admin", "user1"]
    for username in default_users:
        user = get_user(username)
        if user:
            print(f"✅ Default user '{username}' available")
        else:
            print(f"❌ Default user '{username}' not found")
            return False
    
    return True

def main():
    """Run all tests"""
    print("🚀 Starting Redis Authentication System Tests")
    print("=" * 50)
    
    # Test Redis connection
    if not test_redis_connection():
        print("❌ Redis connection test failed - cannot continue")
        return False
    
    # Test user operations
    if not test_user_operations():
        print("❌ User operations test failed")
        return False
    
    # Test default users
    if not test_default_users():
        print("❌ Default users test failed")
        return False
    
    print("\n" + "=" * 50)
    print("🎉 All tests passed! Redis authentication system is working correctly.")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
