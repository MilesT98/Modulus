
import requests
import sys
import time
from datetime import datetime, timedelta

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
        
    def test_refresh_live_data(self):
        """Test refreshing live data (Pro/Enterprise only)"""
        return self.run_test(
            "Refresh Live Data",
            "POST",
            "data/refresh",
            200
        )
        
    def test_get_data_sources(self):
        """Test getting data sources information"""
        return self.run_test(
            "Get Data Sources",
            "GET",
            "data/sources",
            200
        )
        
    def test_create_opportunity(self, tier_required="free"):
        """Test creating a new opportunity"""
        data = {
            "title": f"Test Opportunity {datetime.now().strftime('%H%M%S')}",
            "funding_body": "Test Funding Body",
            "description": "This is a test opportunity created by automated tests",
            "detailed_description": "Detailed description for the test opportunity",
            "closing_date": (datetime.utcnow() + timedelta(days=30)).isoformat(),
            "funding_amount": "£1M - £2M",
            "tech_areas": ["Testing", "Automation"],
            "mod_department": "Test Department",
            "trl_level": "TRL 4-6",
            "contract_type": "Test Contract",
            "official_link": "https://example.com/test",
            "tier_required": tier_required
        }
        
        return self.run_test(
            f"Create Opportunity (tier: {tier_required})",
            "POST",
            "opportunities",
            200,
            data=data
        )
        
    def test_get_specific_opportunity(self, opportunity_id):
        """Test getting a specific opportunity by ID"""
        return self.run_test(
            f"Get Specific Opportunity (ID: {opportunity_id})",
            "GET",
            f"opportunities/{opportunity_id}",
            200
        )
        
    def test_update_alert_preferences(self):
        """Test updating alert preferences"""
        data = {
            "keywords": ["test", "defence", "automation"],
            "tech_areas": ["AI", "Cybersecurity"],
            "funding_bodies": ["DSTL", "MOD"],
            "min_funding": 500000,
            "max_funding": 5000000
        }
        
        return self.run_test(
            "Update Alert Preferences",
            "PUT",
            "users/alert-preferences",
            200,
            data=data
        )
        
    def test_get_alert_preferences(self):
        """Test getting alert preferences"""
        return self.run_test(
            "Get Alert Preferences",
            "GET",
            "users/alert-preferences",
            200
        )

def test_free_tier_user():
    """Test the free tier user journey"""
    print("\n🔍 TESTING FREE TIER USER JOURNEY")
    
    tester = ModulusDefenceAPITester()
    timestamp = datetime.now().strftime('%H%M%S')
    test_email = f"free_user_{timestamp}@example.com"
    test_password = "TestPass123!"
    test_company = "Free Tier Defence Ltd"
    test_full_name = "Free Tier User"
    
    # Register a new free tier user
    if not tester.test_register(test_email, test_password, test_company, test_full_name):
        print("❌ Free tier registration failed")
        return False
        
    print("✅ Successfully registered a free tier user")
    
    # Verify user is on free tier
    success, user_data = tester.test_get_me()
    if success and user_data.get('tier') == 'free':
        print("✅ User is correctly on free tier")
    else:
        print("❌ User tier verification failed")
        return False
        
    # Test getting opportunities (should show free tier opportunities)
    success, opportunities = tester.test_get_opportunities()
    if success:
        # Check if any Pro opportunities are delayed for free users
        has_delayed = False
        for opp in opportunities:
            if opp.get('is_delayed', False):
                has_delayed = True
                print(f"✅ Found delayed Pro opportunity: {opp.get('title')}")
                break
                
        if not has_delayed:
            print("⚠️ No delayed Pro opportunities found, but this might be expected")
    
    # Try to refresh live data (should fail for free tier)
    success, _ = tester.test_refresh_live_data()
    if not success:
        print("✅ Correctly prevented free tier user from refreshing live data")
    else:
        print("❌ Free tier user was able to refresh live data (should be restricted)")
        
    # Get dashboard stats (should show limited stats for free tier)
    success, stats = tester.test_get_dashboard_stats()
    if success:
        print(f"✅ Dashboard stats for free tier: {stats.get('total_opportunities')} opportunities")
        
    print(f"\n📊 Free Tier Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return tester.tests_passed == tester.tests_run

def test_pro_tier_user():
    """Test the pro tier user journey"""
    print("\n🔍 TESTING PRO TIER USER JOURNEY")
    
    tester = ModulusDefenceAPITester()
    timestamp = datetime.now().strftime('%H%M%S')
    test_email = f"pro_user_{timestamp}@example.com"
    test_password = "TestPass123!"
    test_company = "Pro Tier Defence Ltd"
    test_full_name = "Pro Tier User"
    
    # Register a new user and upgrade to Pro
    if not tester.test_register(test_email, test_password, test_company, test_full_name):
        print("❌ Pro tier registration failed")
        return False
        
    # Upgrade to Pro tier
    success, _ = tester.test_upgrade_subscription("pro")
    if not success:
        print("❌ Upgrade to Pro tier failed")
        return False
        
    print("✅ Successfully upgraded to Pro tier")
    
    # Verify user is on Pro tier
    success, user_data = tester.test_get_me()
    if success and user_data.get('tier') == 'pro':
        print("✅ User is correctly on Pro tier")
    else:
        print("❌ User tier verification failed")
        return False
        
    # Test getting opportunities (should show all opportunities without delay)
    success, opportunities = tester.test_get_opportunities()
    if success:
        # Check that Pro opportunities are not delayed
        for opp in opportunities:
            if opp.get('tier_required') == 'pro' and opp.get('is_delayed', False):
                print(f"❌ Pro opportunity is delayed for Pro user: {opp.get('title')}")
                return False
                
        print("✅ Pro opportunities are not delayed for Pro users")
    
    # Test advanced filters
    success, filtered_opps = tester.test_get_opportunities(tech_area="Cybersecurity")
    if success:
        print(f"✅ Advanced filtering works for Pro users: found {len(filtered_opps)} opportunities")
    
    # Test refreshing live data (should work for Pro tier)
    success, _ = tester.test_refresh_live_data()
    if success:
        print("✅ Pro tier user can refresh live data")
    else:
        print("❌ Pro tier user couldn't refresh live data")
        
    # Get data sources
    success, sources = tester.test_get_data_sources()
    if success:
        print(f"✅ Pro tier user can access data sources: {len(sources.get('sources', []))} sources available")
        
    # Create a Pro tier opportunity
    success, opp_data = tester.test_create_opportunity(tier_required="pro")
    if success and 'id' in opp_data:
        print(f"✅ Pro tier user created a Pro opportunity: {opp_data.get('id')}")
        
        # Test getting the created opportunity
        tester.test_get_specific_opportunity(opp_data.get('id'))
        
    print(f"\n📊 Pro Tier Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return tester.tests_passed == tester.tests_run

def main():
    # Test both user tiers
    free_tier_success = test_free_tier_user()
    pro_tier_success = test_pro_tier_user()
    
    # Print overall results
    print("\n📊 OVERALL TEST RESULTS:")
    print(f"Free Tier Tests: {'✅ PASSED' if free_tier_success else '❌ FAILED'}")
    print(f"Pro Tier Tests: {'✅ PASSED' if pro_tier_success else '❌ FAILED'}")
    
    return 0 if free_tier_success and pro_tier_success else 1

if __name__ == "__main__":
    sys.exit(main())
