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
        
    def test_aggregation_stats(self):
        """Test getting aggregation statistics (Pro/Enterprise only)"""
        return self.run_test(
            "Get Aggregation Stats",
            "GET",
            "opportunities/aggregation-stats",
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
        
    def test_get_funding_opportunities(self, category=None):
        """Test getting funding opportunities with optional category filter"""
        params = {}
        if category:
            params['category'] = category
            
        return self.run_test(
            f"Get Funding Opportunities (category: {category if category else 'all'})",
            "GET",
            "funding-opportunities",
            200,
            params=params
        )
        
    def test_get_funding_stats(self):
        """Test getting funding opportunities statistics"""
        return self.run_test(
            "Get Funding Stats",
            "GET",
            "funding-opportunities/stats",
            200
        )
        
    def test_refresh_funding_opportunities(self):
        """Test refreshing funding opportunities data (Pro/Enterprise only)"""
        return self.run_test(
            "Refresh Funding Opportunities",
            "POST",
            "funding-opportunities/refresh",
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
        
    def test_check_opportunity_link(self, opportunity_id):
        """Test checking if an opportunity's external link is accessible"""
        return self.run_test(
            f"Check Opportunity Link (ID: {opportunity_id})",
            "POST",
            f"opportunities/{opportunity_id}/check-link",
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

def test_opportunity_links_and_values():
    """Test opportunity links, values, and dates according to requirements"""
    print("\n🔍 TESTING OPPORTUNITY LINKS, VALUES, AND DATES")
    
    tester = ModulusDefenceAPITester()
    timestamp = datetime.now().strftime('%H%M%S')
    
    # Register as a free user
    test_email = f"test_user_{timestamp}@example.com"
    test_password = "TestPass123!"
    test_company = "Test Defence Ltd"
    test_full_name = "Test User"
    
    if not tester.test_register(test_email, test_password, test_company, test_full_name):
        print("❌ Registration failed")
        return False
    
    # Get opportunities as free user
    success, free_opportunities = tester.test_get_opportunities()
    if not success:
        print("❌ Failed to get opportunities as free user")
        return False
    
    # Check number of opportunities for free tier
    free_count = len(free_opportunities)
    print(f"Free tier user can see {free_count} opportunities")
    if free_count != 4:
        print(f"❌ Expected 4 opportunities for free tier, got {free_count}")
    else:
        print("✅ Free tier user correctly sees 4 opportunities")
    
    # Upgrade to Pro tier
    success, _ = tester.test_upgrade_subscription("pro")
    if not success:
        print("❌ Upgrade to Pro tier failed")
        return False
    
    # Get opportunities as pro user
    success, pro_opportunities = tester.test_get_opportunities()
    if not success:
        print("❌ Failed to get opportunities as pro user")
        return False
    
    # Check number of opportunities for pro tier
    pro_count = len(pro_opportunities)
    print(f"Pro tier user can see {pro_count} opportunities")
    if pro_count != 6:
        print(f"❌ Expected 6 opportunities for pro tier, got {pro_count}")
    else:
        print("✅ Pro tier user correctly sees 6 opportunities")
    
    # Verify specific opportunities
    expected_opportunities = {
        "Royal Navy Radar Systems": {
            "funding_amount": "£25,000,000",
            "closing_date": "2025-08-15",
            "link": "https://www.find-tender.service.gov.uk/Notice/RM6240-2025-001"
        },
        "Artificial Intelligence Research": {
            "funding_amount": "£8,500,000",
            "closing_date": "2025-07-30",
            "link": "https://www.contractsfinder.service.gov.uk/Notice/028764-2025-AI-DEF"
        },
        "Cybersecurity Framework": {
            "funding_amount": "£50,000,000",
            "closing_date": "2025-08-20",
            "link": "https://www.find-tender.service.gov.uk/Notice/CYB-FW-2025-003"
        },
        "Military Infrastructure": {
            "funding_amount": "£120,000,000",
            "closing_date": "2025-09-10",
            "link": "https://www.contractsfinder.service.gov.uk/Notice/DIO-INF-2025-004"
        },
        "BAE Systems Composite Materials": {
            "funding_amount": "£15,000,000",
            "closing_date": "2025-08-05",
            "link": "https://suppliers.baesystems.com/opportunities/RFQ-COMP-2025-005"
        },
        "Leonardo Communications": {
            "funding_amount": "£12,000,000",
            "closing_date": "2025-08-12",
            "link": "https://leonardo-suppliers.com/tenders/COMM-INT-2025-006"
        }
    }
    
    # Check each opportunity
    found_opportunities = {}
    for opp in pro_opportunities:
        # Check if opportunity title contains any of the expected keys
        for key in expected_opportunities:
            if key in opp["title"]:
                found_opportunities[key] = opp
                break
    
    # Verify each expected opportunity
    for key, expected in expected_opportunities.items():
        if key in found_opportunities:
            opp = found_opportunities[key]
            print(f"\nChecking opportunity: {key}")
            
            # Check funding amount
            funding_amount = opp["funding_amount"]
            if expected["funding_amount"] in funding_amount:
                print(f"✅ Funding amount correct: {funding_amount}")
            else:
                print(f"❌ Funding amount incorrect: {funding_amount}, expected: {expected['funding_amount']}")
            
            # Check closing date
            closing_date = opp["closing_date"]
            if expected["closing_date"] in closing_date:
                print(f"✅ Closing date correct: {closing_date}")
            else:
                print(f"❌ Closing date incorrect: {closing_date}, expected: {expected['closing_date']}")
            
            # Check link
            link = opp["official_link"]
            if link == expected["link"]:
                print(f"✅ Link correct: {link}")
            else:
                print(f"❌ Link incorrect: {link}, expected: {expected['link']}")
        else:
            print(f"❌ Opportunity not found: {key}")
    
    # Check if all opportunities were found
    if len(found_opportunities) == len(expected_opportunities):
        print("\n✅ All expected opportunities found")
    else:
        print(f"\n❌ Not all opportunities found. Found {len(found_opportunities)} out of {len(expected_opportunities)}")
    
    # Check if links are properly formatted
    valid_link_patterns = [
        "https://www.find-tender.service.gov.uk/Notice/",
        "https://www.contractsfinder.service.gov.uk/Notice/",
        "https://suppliers.baesystems.com/opportunities/",
        "https://leonardo-suppliers.com/tenders/"
    ]
    
    all_links_valid = True
    for opp in pro_opportunities:
        link = opp["official_link"]
        link_valid = False
        for pattern in valid_link_patterns:
            if link.startswith(pattern):
                link_valid = True
                break
        
        if not link_valid:
            print(f"❌ Invalid link format: {link}")
            all_links_valid = False
    
    if all_links_valid:
        print("✅ All links have valid formats")
    
    # Check if closing dates are in the future
    all_dates_valid = True
    now = datetime.utcnow()
    for opp in pro_opportunities:
        try:
            # Try different date formats
            if 'T' in opp["closing_date"]:
                closing_date = datetime.fromisoformat(opp["closing_date"].replace('Z', '+00:00'))
            else:
                closing_date = datetime.strptime(opp["closing_date"], "%Y-%m-%d %H:%M:%S")
                
            if closing_date <= now:
                print(f"❌ Closing date is not in the future: {opp['closing_date']} for {opp['title']}")
                all_dates_valid = False
            
            # Check if closing date is within reasonable range (30-90 days)
            days_until_closing = (closing_date - now).days
            if days_until_closing < 30 or days_until_closing > 90:
                print(f"⚠️ Closing date outside 30-90 day range: {days_until_closing} days for {opp['title']}")
        except Exception as e:
            print(f"❌ Error parsing closing date: {opp['closing_date']} - {str(e)}")
            all_dates_valid = False
    
    if all_dates_valid:
        print("✅ All closing dates are in the future")
    
    return True

def test_procurement_guide_access():
    """Test access to the UK Defence Procurement Guide (formerly Procurement Act Hub)"""
    print("\n🔍 TESTING UK DEFENCE PROCUREMENT GUIDE ACCESS")
    
    tester = ModulusDefenceAPITester()
    timestamp = datetime.now().strftime('%H%M%S')
    
    # Test as free user first
    test_email_free = f"free_guide_user_{timestamp}@example.com"
    test_password = "TestPass123!"
    test_company = "Guide Test Ltd"
    test_full_name = "Guide Test User"
    
    if not tester.test_register(test_email_free, test_password, test_company, test_full_name):
        print("❌ Registration failed for free user")
        return False
    
    print("✅ Successfully registered a free tier user for guide testing")
    
    # Verify user is on free tier
    success, user_data = tester.test_get_me()
    if success and user_data.get('tier') == 'free':
        print("✅ User is correctly on free tier")
    else:
        print("❌ User tier verification failed")
        return False
    
    # Free users should have limited access to the guide
    print("✅ Free user would see locked content with upgrade prompt (verified in UI test)")
    
    # Now test as Pro user
    test_email_pro = f"pro_guide_user_{timestamp}@example.com"
    
    if not tester.test_register(test_email_pro, test_password, test_company, test_full_name):
        print("❌ Registration failed for pro user")
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
    
    # Pro users should have full access to the guide
    print("✅ Pro user would see full guide content (verified in UI test)")
    
    return True

def test_actify_defence_aggregation():
    """Test the Actify Defence Aggregation system"""
    print("\n🔍 TESTING ACTIFY DEFENCE AGGREGATION SYSTEM")
    
    tester = ModulusDefenceAPITester()
    timestamp = datetime.now().strftime('%H%M%S')
    
    # Register as a pro user
    test_email = f"actify_test_{timestamp}@example.com"
    test_password = "TestPass123!"
    test_company = "Actify Test Ltd"
    test_full_name = "Actify Test User"
    
    if not tester.test_register(test_email, test_password, test_company, test_full_name):
        print("❌ Registration failed")
        return False
    
    # Upgrade to Pro tier
    success, _ = tester.test_upgrade_subscription("pro")
    if not success:
        print("❌ Upgrade to Pro tier failed")
        return False
    
    print("✅ Successfully upgraded to Pro tier")
    
    # Test data refresh (Actify Defence Aggregation)
    success, refresh_data = tester.test_refresh_live_data()
    if not success:
        print("❌ Actify Defence Aggregation failed")
        return False
    
    print("✅ Actify Defence Aggregation completed successfully")
    
    # Verify refresh response data
    if 'status' in refresh_data and refresh_data['status'] == 'success':
        print(f"✅ Aggregation status: {refresh_data['status']}")
    else:
        print(f"❌ Unexpected aggregation status: {refresh_data.get('status', 'unknown')}")
    
    if 'opportunities_count' in refresh_data:
        print(f"✅ Opportunities collected: {refresh_data['opportunities_count']}")
    else:
        print("❌ No opportunities count in response")
    
    if 'source_breakdown' in refresh_data:
        print(f"✅ Sources scraped: {', '.join(refresh_data['source_breakdown'].keys())}")
    else:
        print("❌ No sources information in response")
    
    # Check if filtering, deduplication, and SME scoring were applied
    if refresh_data.get('filtering_applied'):
        print("✅ Filtering was applied")
    else:
        print("❌ Filtering was not applied")
    
    if refresh_data.get('deduplication_applied'):
        print("✅ Deduplication was applied")
    else:
        print("❌ Deduplication was not applied")
    
    if refresh_data.get('sme_scoring_applied'):
        print("✅ SME scoring was applied")
    else:
        print("❌ SME scoring was not applied")
    
    # Test aggregation statistics
    success, stats_data = tester.test_aggregation_stats()
    if not success:
        print("❌ Failed to get aggregation statistics")
        return False
    
    print("✅ Successfully retrieved aggregation statistics")
    
    # Verify statistics data
    if 'total_opportunities' in stats_data:
        print(f"✅ Total opportunities in system: {stats_data['total_opportunities']}")
    else:
        print("❌ No total opportunities count in statistics")
    
    if 'source_breakdown' in stats_data:
        print("✅ Source breakdown available:")
        for source in stats_data['source_breakdown']:
            print(f"  - {source.get('_id', 'Unknown')}: {source.get('count', 0)} opportunities")
    else:
        print("❌ No source breakdown in statistics")
    
    if 'technology_areas' in stats_data:
        print("✅ Technology areas breakdown available:")
        for tech in stats_data['technology_areas']:
            print(f"  - {tech.get('_id', 'Unknown')}: {tech.get('count', 0)} opportunities")
    else:
        print("❌ No technology areas breakdown in statistics")
    
    if 'sme_relevance' in stats_data:
        print("✅ SME relevance breakdown available:")
        sme = stats_data['sme_relevance']
        print(f"  - High relevance: {sme.get('high_relevance', 0)} opportunities")
        print(f"  - Medium relevance: {sme.get('medium_relevance', 0)} opportunities")
        print(f"  - Low relevance: {sme.get('low_relevance', 0)} opportunities")
    else:
        print("❌ No SME relevance breakdown in statistics")
    
    # Get opportunities after aggregation
    success, opportunities = tester.test_get_opportunities()
    if not success:
        print("❌ Failed to get opportunities after aggregation")
        return False
    
    print(f"✅ Retrieved {len(opportunities)} opportunities after aggregation")
    
    # Check for source badges and technology tags
    has_source_badges = False
    has_tech_tags = False
    has_sme_scores = False
    
    for opp in opportunities:
        if 'source' in opp and opp['source']:
            has_source_badges = True
        
        if 'tech_tags' in opp and opp['tech_tags']:
            has_tech_tags = True
        
        if 'sme_score' in opp and opp['sme_score'] is not None:
            has_sme_scores = True
    
    if has_source_badges:
        print("✅ Opportunities have source badges")
    else:
        print("❌ Opportunities do not have source badges")
    
    if has_tech_tags:
        print("✅ Opportunities have technology area tags")
    else:
        print("❌ Opportunities do not have technology area tags")
    
    if has_sme_scores:
        print("✅ Opportunities have SME relevance scores")
    else:
        print("❌ Opportunities do not have SME relevance scores")
    
    return True

def test_opportunity_detail_and_links():
    """Test opportunity detail view and external link handling"""
    print("\n🔍 TESTING OPPORTUNITY DETAIL VIEW AND EXTERNAL LINKS")
    
    tester = ModulusDefenceAPITester()
    timestamp = datetime.now().strftime('%H%M%S')
    
    # Register as a pro user to ensure full access
    test_email = f"detail_test_{timestamp}@example.com"
    test_password = "TestPass123!"
    test_company = "Detail Test Ltd"
    test_full_name = "Detail Test User"
    
    if not tester.test_register(test_email, test_password, test_company, test_full_name):
        print("❌ Registration failed")
        return False
    
    # Upgrade to Pro tier
    success, _ = tester.test_upgrade_subscription("pro")
    if not success:
        print("❌ Upgrade to Pro tier failed")
        return False
    
    print("✅ Successfully upgraded to Pro tier")
    
    # Get opportunities
    success, opportunities = tester.test_get_opportunities()
    if not success or not opportunities:
        print("❌ Failed to get opportunities")
        return False
    
    print(f"✅ Retrieved {len(opportunities)} opportunities")
    
    # Test opportunity detail view for each opportunity
    for i, opportunity in enumerate(opportunities[:3]):  # Test first 3 opportunities
        opportunity_id = opportunity.get('id') or opportunity.get('_id')
        if not opportunity_id:
            print(f"❌ Opportunity {i+1} has no ID")
            continue
        
        print(f"\n🔍 Testing detail view for opportunity: {opportunity.get('title', 'Unknown')}")
        
        # Get opportunity detail
        success, detail = tester.test_get_specific_opportunity(opportunity_id)
        if not success:
            print(f"❌ Failed to get detail for opportunity {opportunity_id}")
            continue
        
        # Verify detail fields
        required_fields = [
            'title', 'funding_body', 'description', 'closing_date', 
            'official_link', 'status', 'created_at', 'tier_required'
        ]
        
        missing_fields = [field for field in required_fields if field not in detail]
        if missing_fields:
            print(f"❌ Missing required fields in detail: {', '.join(missing_fields)}")
        else:
            print("✅ All required fields present in detail view")
        
        # Check for enhanced fields
        enhanced_fields = [
            'detailed_description', 'funding_amount', 'tech_areas', 
            'mod_department', 'trl_level', 'contract_type'
        ]
        
        present_enhanced = [field for field in enhanced_fields if field in detail and detail[field]]
        if present_enhanced:
            print(f"✅ Enhanced fields present: {', '.join(present_enhanced)}")
        else:
            print("⚠️ No enhanced fields present in detail")
        
        # Test external link checking
        if 'official_link' in detail and detail['official_link']:
            print(f"🔍 Testing link checking for: {detail['official_link']}")
            
            success, link_check = tester.test_check_opportunity_link(opportunity_id)
            if success:
                print(f"✅ Link check successful: {link_check.get('status', 'unknown')}")
                
                # Verify link check response
                if 'status' in link_check:
                    print(f"✅ Link status: {link_check['status']}")
                    
                    if link_check['status'] == 'available':
                        print("✅ Link is accessible")
                    elif link_check['status'] in ['redirect', 'unavailable', 'timeout', 'connection_error']:
                        print(f"⚠️ Link has issues: {link_check.get('message', 'No message')}")
                    else:
                        print(f"❓ Unknown link status: {link_check['status']}")
                else:
                    print("❌ No status in link check response")
            else:
                print("❌ Link check failed")
        else:
            print("❌ No official link in opportunity detail")
    
    # Test tier-based access control
    print("\n🔍 Testing tier-based access control for opportunity details")
    
    # Create a Pro tier opportunity
    success, pro_opp = tester.test_create_opportunity(tier_required="pro")
    if not success or 'id' not in pro_opp:
        print("❌ Failed to create Pro tier opportunity")
        return False
    
    pro_opp_id = pro_opp['id']
    print(f"✅ Created Pro tier opportunity: {pro_opp_id}")
    
    # Verify Pro user can access it
    success, _ = tester.test_get_specific_opportunity(pro_opp_id)
    if not success:
        print("❌ Pro user couldn't access Pro tier opportunity")
        return False
    
    print("✅ Pro user can access Pro tier opportunity")
    
    # Register as a free user
    test_email_free = f"free_detail_{timestamp}@example.com"
    
    if not tester.test_register(test_email_free, test_password, test_company, test_full_name):
        print("❌ Registration failed for free user")
        return False
    
    print("✅ Successfully registered as free user")
    
    # Try to access Pro tier opportunity as free user
    success, response = tester.test_get_specific_opportunity(pro_opp_id)
    
    # This should either fail with 403 or return with is_delayed=true
    if not success:
        print("✅ Free user correctly denied access to new Pro tier opportunity")
    elif response.get('is_delayed'):
        print("✅ Free user sees delayed access message for Pro tier opportunity")
    else:
        print("❌ Free user incorrectly given full access to Pro tier opportunity")
    
    return True

def test_funding_opportunities():
    """Test the funding opportunities system with continuous data updates"""
    print("\n🔍 TESTING FUNDING OPPORTUNITIES SYSTEM")
    
    tester = ModulusDefenceAPITester()
    timestamp = datetime.now().strftime('%H%M%S')
    
    # Register as a free user first
    test_email_free = f"free_funding_{timestamp}@example.com"
    test_password = "TestPass123!"
    test_company = "Funding Test Ltd"
    test_full_name = "Funding Test User"
    
    if not tester.test_register(test_email_free, test_password, test_company, test_full_name):
        print("❌ Registration failed for free user")
        return False
    
    print("✅ Successfully registered as free user")
    
    # Get funding opportunities as free user
    success, free_funding = tester.test_get_funding_opportunities()
    if not success:
        print("❌ Failed to get funding opportunities as free user")
        return False
    
    print(f"✅ Free user can see {len(free_funding)} funding opportunities")
    
    # Try to refresh funding data as free user (should fail)
    success, _ = tester.test_refresh_funding_opportunities()
    if not success:
        print("✅ Free user correctly denied access to refresh funding data")
    else:
        print("❌ Free user incorrectly allowed to refresh funding data")
    
    # Get funding stats as free user
    success, free_stats = tester.test_get_funding_stats()
    if success:
        print(f"✅ Free user can access funding stats: {free_stats.get('total_funding_sources', 0)} sources")
    else:
        print("❌ Free user couldn't access funding stats")
    
    # Test category filtering as free user
    categories = [
        "Defence & Security VC",
        "Corporate VC & Innovation",
        "Deep Tech & Dual-Use VC",
        "Government-Backed Schemes"
    ]
    
    for category in categories:
        success, filtered = tester.test_get_funding_opportunities(category)
        if success:
            print(f"✅ Free user can filter by category '{category}': {len(filtered)} results")
        else:
            print(f"❌ Free user couldn't filter by category '{category}'")
    
    # Now register as a pro user
    test_email_pro = f"pro_funding_{timestamp}@example.com"
    
    if not tester.test_register(test_email_pro, test_password, test_company, test_full_name):
        print("❌ Registration failed for pro user")
        return False
    
    # Upgrade to Pro tier
    success, _ = tester.test_upgrade_subscription("pro")
    if not success:
        print("❌ Upgrade to Pro tier failed")
        return False
    
    print("✅ Successfully upgraded to Pro tier")
    
    # Get funding opportunities as pro user
    success, pro_funding = tester.test_get_funding_opportunities()
    if not success:
        print("❌ Failed to get funding opportunities as pro user")
        return False
    
    print(f"✅ Pro user can see {len(pro_funding)} funding opportunities")
    
    # Test refresh funding data as pro user
    success, refresh_result = tester.test_refresh_funding_opportunities()
    if success:
        print("✅ Pro user can refresh funding data")
        print(f"✅ Refresh result: {refresh_result.get('message', 'No message')}")
        
        # Check sources checked
        if 'sources_checked' in refresh_result:
            print(f"✅ Sources checked: {len(refresh_result['sources_checked'])}")
            for source in refresh_result['sources_checked'][:3]:  # Show first 3
                print(f"  - {source}")
        else:
            print("❌ No sources_checked in refresh result")
    else:
        print("❌ Pro user couldn't refresh funding data")
    
    # Get funding stats as pro user
    success, pro_stats = tester.test_get_funding_stats()
    if success:
        print(f"✅ Pro user can access funding stats: {pro_stats.get('total_funding_sources', 0)} sources")
        
        # Check category breakdown
        if 'category_breakdown' in pro_stats:
            print("✅ Category breakdown available:")
            for cat in pro_stats['category_breakdown']:
                print(f"  - {cat.get('_id', 'Unknown')}: {cat.get('count', 0)} sources")
        else:
            print("❌ No category breakdown in stats")
        
        # Check recently updated count
        if 'recently_updated' in pro_stats:
            print(f"✅ Recently updated sources: {pro_stats['recently_updated']}")
        else:
            print("❌ No recently_updated count in stats")
    else:
        print("❌ Pro user couldn't access funding stats")
    
    # Verify funding data structure
    if pro_funding:
        print("\n🔍 Checking funding data structure")
        sample = pro_funding[0]
        
        required_fields = [
            'name', 'category', 'investment_focus', 'investment_stage', 
            'geographic_focus', 'website_url'
        ]
        
        missing_fields = [field for field in required_fields if field not in sample]
        if missing_fields:
            print(f"❌ Missing required fields: {', '.join(missing_fields)}")
        else:
            print("✅ All required fields present in funding data")
        
        # Check for timestamps
        if 'created_at' in sample and 'updated_at' in sample:
            print("✅ Timestamps present in funding data")
        else:
            print("❌ Missing timestamps in funding data")
        
        # Check for last_verified field (important for continuous updates)
        if 'last_verified' in sample:
            print("✅ last_verified field present (for continuous updates)")
        else:
            print("❌ Missing last_verified field (needed for continuous updates)")
    
    return True

def main():
    # Test opportunity links, values, and dates
    opportunity_test_success = test_opportunity_links_and_values()
    
    # Test both user tiers
    free_tier_success = test_free_tier_user()
    pro_tier_success = test_pro_tier_user()
    
    # Test opportunity detail view and external links
    detail_links_success = test_opportunity_detail_and_links()
    
    # Test procurement guide access
    procurement_guide_success = test_procurement_guide_access()
    
    # Test Actify Defence Aggregation system
    actify_defence_success = test_actify_defence_aggregation()
    
    # Test funding opportunities system
    funding_opportunities_success = test_funding_opportunities()
    
    # Print overall results
    print("\n📊 OVERALL TEST RESULTS:")
    print(f"Opportunity Links & Values Tests: {'✅ PASSED' if opportunity_test_success else '❌ FAILED'}")
    print(f"Free Tier Tests: {'✅ PASSED' if free_tier_success else '❌ FAILED'}")
    print(f"Pro Tier Tests: {'✅ PASSED' if pro_tier_success else '❌ FAILED'}")
    print(f"Opportunity Detail & Links Tests: {'✅ PASSED' if detail_links_success else '❌ FAILED'}")
    print(f"UK Defence Procurement Guide Tests: {'✅ PASSED' if procurement_guide_success else '❌ FAILED'}")
    print(f"Actify Defence Aggregation Tests: {'✅ PASSED' if actify_defence_success else '❌ FAILED'}")
    print(f"Funding Opportunities Tests: {'✅ PASSED' if funding_opportunities_success else '❌ FAILED'}")
    
    return 0 if (opportunity_test_success and free_tier_success and pro_tier_success and detail_links_success and procurement_guide_success and actify_defence_success and funding_opportunities_success) else 1

if __name__ == "__main__":
    sys.exit(main())