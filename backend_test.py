
import requests
import sys
import time
from datetime import datetime

class ModulusDefenceAPITester:
    def __init__(self, base_url="https://18c71e40-871f-400a-803e-bcd99f9538fe.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_data = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.json()}")
                except:
                    print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )

    def test_register(self, email, password, company_name, full_name):
        """Test user registration"""
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": email,
                "password": password,
                "company_name": company_name,
                "full_name": full_name
            }
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response['user']
            return True
        return False

    def test_login(self, email, password):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response['user']
            return True
        return False

    def test_get_me(self):
        """Test getting current user profile"""
        return self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )

    def test_get_opportunities(self, search=None, funding_body=None, tech_area=None):
        """Test getting opportunities with optional filters"""
        params = {}
        if search:
            params['search'] = search
        if funding_body:
            params['funding_body'] = funding_body
        if tech_area:
            params['tech_area'] = tech_area
            
        return self.run_test(
            f"Get Opportunities (filters: {params})",
            "GET",
            "opportunities",
            200,
            params=params
        )

    def test_get_dashboard_stats(self):
        """Test getting dashboard statistics"""
        return self.run_test(
            "Get Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )

    def test_upgrade_subscription(self, tier):
        """Test upgrading subscription"""
        return self.run_test(
            f"Upgrade to {tier}",
            "POST",
            "users/upgrade",
            200,
            params={"tier": tier}
        )

def main():
    # Setup
    tester = ModulusDefenceAPITester()
    timestamp = datetime.now().strftime('%H%M%S')
    test_email = f"test_user_{timestamp}@example.com"
    test_password = "TestPass123!"
    test_company = "Test Defence Ltd"
    test_full_name = "Test User"

    # Test root endpoint
    tester.test_root_endpoint()

    # Test registration
    if not tester.test_register(test_email, test_password, test_company, test_full_name):
        print("❌ Registration failed, trying login with same credentials...")
        if not tester.test_login(test_email, test_password):
            print("❌ Login also failed, creating a new user...")
            test_email = f"test_user_{int(timestamp) + 1}@example.com"
            if not tester.test_register(test_email, test_password, test_company, test_full_name):
                print("❌ All authentication attempts failed, stopping tests")
                return 1
    
    # Test user profile
    tester.test_get_me()
    
    # Test getting opportunities
    tester.test_get_opportunities()
    
    # Test search functionality
    tester.test_get_opportunities(search="artificial intelligence")
    
    # Test filtering by funding body
    tester.test_get_opportunities(funding_body="DSTL")
    
    # Test filtering by tech area
    tester.test_get_opportunities(tech_area="Cybersecurity")
    
    # Test dashboard stats
    tester.test_get_dashboard_stats()
    
    # Test upgrading to Pro
    tester.test_upgrade_subscription("pro")
    
    # Test upgrading to Enterprise
    tester.test_upgrade_subscription("enterprise")
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
