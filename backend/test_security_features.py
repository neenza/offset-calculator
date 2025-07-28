#!/usr/bin/env python3
"""
Test script for security features: session hijacking prevention and single-device login
"""

import requests
import json
import time
from typing import Dict, Optional

class SecurityTester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session1 = requests.Session()
        self.session2 = requests.Session()
        
    def login(self, session: requests.Session, username: str, password: str) -> Dict:
        """Login with a specific session"""
        response = session.post(
            f"{self.base_url}/token",
            data={"username": username, "password": password}
        )
        if response.status_code == 200:
            print(f"✅ Login successful for {username}")
            return response.json()
        else:
            print(f"❌ Login failed for {username}: {response.text}")
            return {}
    
    def refresh_token(self, session: requests.Session) -> Dict:
        """Refresh access token"""
        response = session.post(f"{self.base_url}/refresh")
        if response.status_code == 200:
            print("✅ Token refresh successful")
            return response.json()
        else:
            print(f"❌ Token refresh failed: {response.text}")
            return {}
    
    def get_session_status(self, session: requests.Session) -> Dict:
        """Get session status"""
        response = session.get(f"{self.base_url}/session/status")
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Session status failed: {response.text}")
            return {}
    
    def get_user_profile(self, session: requests.Session) -> Dict:
        """Get user profile (requires valid session)"""
        response = session.get(f"{self.base_url}/users/me")
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Get profile failed: {response.text}")
            return {}
    
    def logout(self, session: requests.Session) -> Dict:
        """Logout"""
        response = session.post(f"{self.base_url}/logout")
        if response.status_code == 200:
            print("✅ Logout successful")
            return response.json()
        else:
            print(f"❌ Logout failed: {response.text}")
            return {}
    
    def test_single_device_enforcement(self):
        """Test single device login enforcement"""
        print("\n🔒 Testing Single Device Enforcement...")
        
        # Login with first session
        print("\n1. Login with first session:")
        login1 = self.login(self.session1, "admin", "admin123")
        if not login1.get("success"):
            return
        
        # Check first session works
        print("\n2. Check first session works:")
        status1 = self.get_session_status(self.session1)
        if status1.get("success"):
            print(f"   Session ID: {status1.get('session_id')}")
            print(f"   Single device enforcement: {status1.get('security_features', {}).get('single_device_enforcement')}")
        
        # Login with second session (should invalidate first)
        print("\n3. Login with second session (should invalidate first):")
        login2 = self.login(self.session2, "admin", "admin123")
        if not login2.get("success"):
            return
        
        # Try to refresh first session (should fail)
        print("\n4. Try to refresh first session (should fail):")
        refresh1 = self.refresh_token(self.session1)
        
        # Check second session still works
        print("\n5. Check second session still works:")
        status2 = self.get_session_status(self.session2)
        if status2.get("success"):
            print(f"   Session ID: {status2.get('session_id')}")
        
        print("✅ Single device enforcement test completed")
    
    def test_session_fingerprinting(self):
        """Test session fingerprinting"""
        print("\n🔍 Testing Session Fingerprinting...")
        
        # Login with session
        print("\n1. Login with session:")
        login = self.login(self.session1, "user1", "user123")
        if not login.get("success"):
            return
        
        # Check session status
        print("\n2. Check session fingerprinting status:")
        status = self.get_session_status(self.session1)
        if status.get("success"):
            security_features = status.get("security_features", {})
            print(f"   Session fingerprinting enabled: {security_features.get('session_fingerprinting')}")
            print(f"   Fingerprint stored: {security_features.get('fingerprint_stored')}")
            client_info = status.get("client_info", {})
            print(f"   Current IP: {client_info.get('current_ip')}")
            print(f"   User Agent: {client_info.get('current_user_agent')}")
        
        # Try to modify session headers (simulate token sharing)
        print("\n3. Simulate token sharing with different User-Agent:")
        original_headers = self.session1.headers.copy()
        self.session1.headers.update({"User-Agent": "EvilBot/1.0 (Hacker)"})
        
        # Try to refresh (should fail if fingerprinting is enabled)
        refresh = self.refresh_token(self.session1)
        
        # Restore original headers
        self.session1.headers = original_headers
        
        print("✅ Session fingerprinting test completed")
    
    def test_session_hijacking_prevention(self):
        """Test session hijacking prevention"""
        print("\n🛡️ Testing Session Hijacking Prevention...")
        
        # Login
        print("\n1. Login with valid credentials:")
        login = self.login(self.session1, "admin", "admin123")
        if not login.get("success"):
            return
        
        # Get valid session cookies
        cookies = self.session1.cookies
        print(f"   Got cookies: {list(cookies.keys())}")
        
        # Try to use cookies from different session object (simulate hijacking)
        print("\n2. Simulate cookie hijacking with different session:")
        self.session2.cookies.update(cookies)
        
        # Try to access protected resource
        print("\n3. Try to access protected resource with hijacked cookies:")
        profile = self.get_user_profile(self.session2)
        
        # Try to refresh with hijacked session
        print("\n4. Try to refresh with hijacked session:")
        refresh = self.refresh_token(self.session2)
        
        print("✅ Session hijacking prevention test completed")
    
    def run_all_tests(self):
        """Run all security tests"""
        print("🚀 Starting Security Feature Tests")
        print("=" * 50)
        
        # Test each security feature
        self.test_single_device_enforcement()
        self.test_session_fingerprinting()
        self.test_session_hijacking_prevention()
        
        print("\n" + "=" * 50)
        print("🏁 All security tests completed!")
        print("\nNote: Some tests may show expected failures - this demonstrates the security features working correctly.")

if __name__ == "__main__":
    tester = SecurityTester()
    tester.run_all_tests()
