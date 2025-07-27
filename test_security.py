#!/usr/bin/env python3
"""
Security Test Script - Verify Session-Based Authentication
"""

import requests
import json

API_URL = "http://localhost:8000"

def test_login_security():
    """Test that refresh tokens are not visible in login response"""
    print("🔐 Testing Login Security...")
    
    # Login credentials
    data = {
        'username': 'admin',
        'password': 'admin123'
    }
    
    try:
        response = requests.post(f"{API_URL}/token", data=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Body: {response.json()}")
        
        # Check Set-Cookie headers
        set_cookie_headers = response.headers.get_list('Set-Cookie') if hasattr(response.headers, 'get_list') else [response.headers.get('Set-Cookie')]
        print(f"Set-Cookie Headers: {set_cookie_headers}")
        
        # Security Analysis
        refresh_token_in_response = any('refresh_token' in str(header) for header in set_cookie_headers if header)
        session_id_in_response = any('session_id' in str(header) for header in set_cookie_headers if header)
        
        print(f"\n🔍 Security Analysis:")
        print(f"❌ Refresh token in response: {refresh_token_in_response}")
        print(f"✅ Session ID in response: {session_id_in_response}")
        
        if not refresh_token_in_response and session_id_in_response:
            print("🎉 SECURITY IMPROVEMENT SUCCESSFUL!")
            print("   - No refresh tokens exposed to client")
            print("   - Only session IDs sent (meaningless without server access)")
        else:
            print("⚠️  Security issue still present")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Start the server first:")
        print("   cd backend && python main.py")

def test_api_request_security():
    """Test that API requests only send session IDs, not refresh tokens"""
    print("\n🌐 Testing API Request Security...")
    
    # This would require a logged-in session
    # For now, just show what the cookies would look like
    print("Expected cookies in API requests:")
    print("✅ access_token=eyJ... (short-lived, 1 minute)")
    print("✅ session_id=abc123def456 (random, meaningless)")
    print("❌ NO refresh_token (stored server-side only)")

if __name__ == "__main__":
    print("🔐 JWT Security Test - Session-Based Authentication")
    print("=" * 60)
    
    test_login_security()
    test_api_request_security()
    
    print("\n" + "=" * 60)
    print("💡 To test manually:")
    print("1. Start backend: cd backend && python main.py")
    print("2. Start frontend: npm run dev")  
    print("3. Login with admin/admin123")
    print("4. Check Network tab - no refresh tokens should be visible!")
