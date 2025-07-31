"""
Test script for database API endpoints
Run this after starting the backend server to test MongoDB integration
"""
import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword"

def test_database_api():
    """Test the database API endpoints"""
    
    print("🧪 Testing Database API Endpoints")
    print("=" * 50)
    
    # First, we need to authenticate
    print("1. Testing Authentication...")
    
    # Register a test user
    register_data = {
        "username": "testuser",
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "full_name": "Test User"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
        if response.status_code == 201:
            print("  ✅ User registration successful")
        elif response.status_code == 400 and "already registered" in response.text:
            print("  ℹ️ User already exists, proceeding with login")
        else:
            print(f"  ❌ Registration failed: {response.text}")
    except requests.exceptions.ConnectionError:
        print("  ❌ Cannot connect to backend server. Make sure it's running on port 8000")
        return
    
    # Login to get access token
    login_data = {
        "username": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data.get("access_token")
            print("  ✅ Login successful")
        else:
            print(f"  ❌ Login failed: {response.text}")
            return
    except Exception as e:
        print(f"  ❌ Login error: {e}")
        return
    
    # Set up headers for authenticated requests
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    print("\n2. Testing Database Health Check...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/database/health", headers=headers)
        if response.status_code == 200:
            print("  ✅ Database health check passed")
        else:
            print(f"  ❌ Database health check failed: {response.text}")
    except Exception as e:
        print(f"  ⚠️ Database health check error: {e}")
    
    print("\n3. Testing Client Management...")
    
    # Create a test client
    client_data = {
        "name": "Test Client",
        "email": "testclient@example.com",
        "phone": "+1-555-0199",
        "company": "Test Company",
        "address": "123 Test Street",
        "city": "Test City",
        "state": "TS",
        "zip_code": "12345",
        "status": "active",
        "client_type": "business",
        "credit_limit": 5000,
        "notes": "This is a test client created by the API test script"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/database/clients", json=client_data, headers=headers)
        if response.status_code == 201:
            created_client = response.json()
            client_id = created_client.get("id")
            print("  ✅ Client creation successful")
            print(f"     Client ID: {client_id}")
        else:
            print(f"  ❌ Client creation failed: {response.text}")
            return
    except Exception as e:
        print(f"  ❌ Client creation error: {e}")
        return
    
    # Get all clients
    try:
        response = requests.get(f"{BASE_URL}/api/database/clients", headers=headers)
        if response.status_code == 200:
            clients = response.json()
            print(f"  ✅ Retrieved {len(clients)} clients")
        else:
            print(f"  ❌ Failed to retrieve clients: {response.text}")
    except Exception as e:
        print(f"  ❌ Error retrieving clients: {e}")
    
    # Get specific client
    try:
        response = requests.get(f"{BASE_URL}/api/database/clients/{client_id}", headers=headers)
        if response.status_code == 200:
            client = response.json()
            print(f"  ✅ Retrieved client: {client.get('name')}")
        else:
            print(f"  ❌ Failed to retrieve specific client: {response.text}")
    except Exception as e:
        print(f"  ❌ Error retrieving specific client: {e}")
    
    # Update client
    update_data = {
        "notes": f"Updated at {datetime.now().isoformat()}"
    }
    
    try:
        response = requests.put(f"{BASE_URL}/api/database/clients/{client_id}", json=update_data, headers=headers)
        if response.status_code == 200:
            print("  ✅ Client update successful")
        else:
            print(f"  ❌ Client update failed: {response.text}")
    except Exception as e:
        print(f"  ❌ Client update error: {e}")
    
    print("\n4. Testing Analytics...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/database/analytics/overview", headers=headers)
        if response.status_code == 200:
            analytics = response.json()
            print("  ✅ Analytics retrieval successful")
            print(f"     Total clients: {analytics.get('clients', {}).get('total', 0)}")
        else:
            print(f"  ❌ Analytics retrieval failed: {response.text}")
    except Exception as e:
        print(f"  ❌ Analytics error: {e}")
    
    print("\n5. Testing Search...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/database/clients?search=Test", headers=headers)
        if response.status_code == 200:
            search_results = response.json()
            print(f"  ✅ Search successful, found {len(search_results)} results")
        else:
            print(f"  ❌ Search failed: {response.text}")
    except Exception as e:
        print(f"  ❌ Search error: {e}")
    
    # Clean up - delete test client
    print("\n6. Cleaning up test data...")
    
    try:
        response = requests.delete(f"{BASE_URL}/api/database/clients/{client_id}", headers=headers)
        if response.status_code == 200:
            print("  ✅ Test client deleted successfully")
        else:
            print(f"  ⚠️ Failed to delete test client: {response.text}")
    except Exception as e:
        print(f"  ⚠️ Error deleting test client: {e}")
    
    print("\n🎉 Database API testing completed!")
    print("\n💡 If all tests passed, your MongoDB integration is working correctly.")
    print("💡 You can now use the database features in the frontend application.")

if __name__ == "__main__":
    test_database_api()
