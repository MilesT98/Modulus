import requests
import sys
import json
from datetime import datetime

class ModulusDefenceAPITester:
    def __init__(self, base_url="https://18c71e40-871f-400a-803e-bcd99f9538fe.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

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
            
            result = {
                "test_name": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success
            }
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.text:
                    try:
                        result["response"] = response.json()
                    except:
                        result["response"] = response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    try:
                        result["error"] = response.json()
                    except:
                        result["error"] = response.text
            
            self.test_results.append(result)
            return success, response.json() if success and response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                "test_name": name,
                "endpoint": endpoint,
                "method": method,
                "success": False,
                "error": str(e)
            })
            return False, {}

    def test_health_check(self):
        """Test API health check endpoint"""
        return self.run_test(
            "API Health Check",
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

    def test_get_user_profile(self):
        """Test getting user profile"""
        return self.run_test(
            "Get User Profile",
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
            "Get Opportunities" + (f" with filters: {params}" if params else ""),
            "GET",
            "opportunities",
            200,
            params=params
        )

    def test_get_dashboard_stats(self):
        """Test getting dashboard stats"""
        return self.run_test(
            "Get Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )

    def test_upgrade_tier(self, tier):
        """Test upgrading user tier"""
        return self.run_test(
            f"Upgrade to {tier.upper()} Tier",
            "POST",
            "users/upgrade",
            200,
            params={"tier": tier}
        )

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        print("="*50)
        
        if self.tests_passed < self.tests_run:
            print("\nFailed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"- {result['test_name']} ({result['method']} /api/{result['endpoint']})")
                    if "error" in result:
                        print(f"  Error: {result['error']}")
        
        return self.tests_passed == self.tests_run

def main():
    # Setup
    tester = ModulusDefenceAPITester()
    
    # Test data
    test_email = "testuser@defencecompany.com"
    test_password = "testpass123"
    test_company = "Test Defence Systems Ltd"
    test_full_name = "Test User"
    
    # Run tests
    print("\n🚀 Starting Modulus Defence API Tests\n")
    
    # 1. Test health check
    tester.test_health_check()
    
    # 2. Test registration
    # First try to login, if it fails, register a new user
    if not tester.test_login(test_email, test_password):
        print("Login failed, attempting to register...")
        if not tester.test_register(test_email, test_password, test_company, test_full_name):
            print("❌ Registration failed, stopping tests")
            tester.print_summary()
            return 1
    
    # 3. Test user profile
    tester.test_get_user_profile()
    
    # 4. Test getting opportunities (no filters)
    success, opportunities_response = tester.test_get_opportunities()
    
    # 5. Test getting opportunities with filters
    if success:
        tester.test_get_opportunities(search="AI")
        tester.test_get_opportunities(funding_body="DSTL")
        tester.test_get_opportunities(tech_area="Cybersecurity")
    
    # 6. Test dashboard stats
    tester.test_get_dashboard_stats()
    
    # 7. Test tier upgrade (from FREE to PRO)
    if tester.user_data and tester.user_data.get('tier') == 'free':
        tester.test_upgrade_tier('pro')
        
        # Verify tier upgrade by getting user profile again
        success, profile_response = tester.test_get_user_profile()
        if success and profile_response.get('tier') == 'pro':
            print("✅ Tier upgrade verification successful")
        else:
            print("❌ Tier upgrade verification failed")
    
    # Print summary
    success = tester.print_summary()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
