"""
ULTIMATE DEFENCE OPPORTUNITY COLLECTOR
Complete implementation for ALL defence opportunity sources using APIs, web scraping, and browser automation.
"""

import asyncio
import aiohttp
import re
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
import json
import time

class UltimateDefenceCollector:
    def __init__(self):
        self.session_headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
        
        # CONTRACT-SPECIFIC keywords (high priority)
        self.contract_keywords = [
            'tender', 'contract', 'invitation to tender', 'itt', 'request for proposal', 'rfp',
            'quotation', 'framework agreement', 'award notice', 'procurement',
            'call for competition', 'supply', 'provision of', 'delivery of',
            'maintenance contract', 'service contract', 'supply contract',
            'works contract', 'goods contract', 'equipment supply'
        ]
        
        # INNOVATION/NON-CONTRACT keywords (exclude/deprioritize)
        self.innovation_keywords = [
            'expression of interest', 'eoi', 'call for innovation', 'get in touch',
            'pitch', 'accelerator', 'competition', 'challenge', 'grant',
            'innovation call', 'themed competition', 'defence innovation',
            'showcase', 'demonstration', 'pilot study', 'feasibility study',
            'research call', 'innovation funding', 'startup', 'sme innovation'
        ]
        
        # Defence filtering keywords (must still be defence-related)
        self.defence_keywords = [
            'defence', 'defense', 'military', 'mod', 'ministry of defence',
            'army', 'navy', 'air force', 'raf', 'royal navy', 'dstl',
            'weapons', 'ammunition', 'security clearance', 'classified',
            'surveillance', 'intelligence', 'cybersecurity', 'radar'
        ]
        
        # Exclusion keywords (immediate rejection)
        self.exclusion_keywords = [
            'utilities', 'water', 'gas', 'electricity', 'transport',
            'healthcare', 'education', 'social services', 'housing',
            'facilities management', 'cleaning', 'catering'
        ]

    async def collect_all_defence_opportunities(self) -> List[Dict]:
        """
        Master collection from ALL defence sources
        """
        print("🚀 ULTIMATE DEFENCE OPPORTUNITY COLLECTION STARTING...")
        print("📊 Sources: Contracts Finder API, DASA, Find a Tender, CCS, DSP, Primes")
        
        all_opportunities = []
        
        # Phase 1: API and Direct Access (Fast)
        print("\n📡 PHASE 1: API & Direct Access...")
        phase1_opportunities = await self._collect_phase1()
        all_opportunities.extend(phase1_opportunities)
        
        # Phase 2: Browser Automation (Comprehensive)
        print("\n🤖 PHASE 2: Browser Automation...")
        phase2_opportunities = await self._collect_phase2()
        all_opportunities.extend(phase2_opportunities)
        
        # Remove duplicates
        unique_opportunities = self._remove_duplicates(all_opportunities)
        
        print(f"\n🎯 ULTIMATE COLLECTION COMPLETE:")
        print(f"   📊 Raw opportunities: {len(all_opportunities)}")
        print(f"   📊 Unique opportunities: {len(unique_opportunities)}")
        
        return unique_opportunities

    async def _collect_phase1(self) -> List[Dict]:
        """Phase 1: Contracts Finder API + DASA Direct Scraping"""
        opportunities = []
        
        connector = aiohttp.TCPConnector(limit=20)
        timeout = aiohttp.ClientTimeout(total=30)
        
        async with aiohttp.ClientSession(
            connector=connector, timeout=timeout, headers=self.session_headers
        ) as session:
            
            # 1. Contracts Finder API
            print("🔗 Collecting from Contracts Finder API...")
            cf_opportunities = await self._collect_contracts_finder_api(session)
            opportunities.extend(cf_opportunities)
            
            # 2. DASA Direct Scraping
            print("🛡️ Collecting from DASA...")
            dasa_opportunities = await self._collect_dasa_direct(session)
            opportunities.extend(dasa_opportunities)
        
        return opportunities

    async def _collect_phase2(self) -> List[Dict]:
        """Phase 2: Browser Automation for Complex Sites"""
        opportunities = []
        
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                )
                
                # 3. Find a Tender (Browser Automation)
                print("📋 Collecting from Find a Tender...")
                fts_opportunities = await self._collect_find_tender_browser(context)
                opportunities.extend(fts_opportunities)
                
                # 4. CCS Frameworks (Browser Automation)
                print("👑 Collecting from CCS Frameworks...")
                ccs_opportunities = await self._collect_ccs_frameworks_browser(context)
                opportunities.extend(ccs_opportunities)
                
                # 5. Defence Sourcing Portal (Browser Automation)
                print("🛡️ Collecting from Defence Sourcing Portal...")
                dsp_opportunities = await self._collect_defence_sourcing_portal(context)
                opportunities.extend(dsp_opportunities)
                
                # 6. Primes' Supplier Portals (Browser Automation)
                print("🏭 Collecting from Prime Contractors...")
                primes_opportunities = await self._collect_primes_browser(context)
                opportunities.extend(primes_opportunities)
                
                await browser.close()
                
        except Exception as e:
            print(f"❌ Browser automation error: {e}")
        
        return opportunities

    # =================== PHASE 1 IMPLEMENTATIONS ===================

    async def _collect_contracts_finder_api(self, session: aiohttp.ClientSession) -> List[Dict]:
        """Contracts Finder API - Maximum Coverage"""
        opportunities = []
        
        # Contracts Finder API endpoints
        api_base = "https://www.contractsfinder.service.gov.uk/api"
        
        # Defence-specific search terms for API
        defence_searches = [
            'defence', 'ministry of defence', 'mod', 'dstl', 'dasa',
            'army', 'navy', 'air force', 'military equipment',
            'security clearance', 'defence technology', 'weapons',
            'cybersecurity', 'surveillance', 'intelligence'
        ]
        
        for search_term in defence_searches:
            try:
                # API search with pagination
                for page in range(1, 6):  # First 5 pages per search
                    params = {
                        'searchTerm': search_term,
                        'page': page,
                        'limit': 100,  # Maximum per page
                        'stage': 'all'
                    }
                    
                    api_url = f"{api_base}/notices/search"
                    
                    async with session.get(api_url, params=params) as response:
                        if response.status == 200:
                            data = await response.json()
                            
                            if 'notices' in data:
                                for notice in data['notices']:
                                    try:
                                        title = notice.get('title', '')
                                        description = notice.get('description', '')
                                        
                                        if not self._is_defence_opportunity(title, description, 'Contracts Finder'):
                                            continue
                                        
                                        opportunity = {
                                            'id': f"cf_api_{notice.get('id', hash(title))}",
                                            'title': title[:200],
                                            'funding_body': 'UK Government (Contracts Finder)',
                                            'description': description[:500],
                                            'detailed_description': description,
                                            'closing_date': self._parse_date(notice.get('closingDate')) or (datetime.now() + timedelta(days=30)),
                                            'funding_amount': notice.get('value', 'TBD'),
                                            'tech_areas': self._extract_tech_areas(title + ' ' + description),
                                            'contract_type': notice.get('noticeType', 'Government Contract'),
                                            'official_link': notice.get('url', f"https://www.contractsfinder.service.gov.uk/notice/{notice.get('id')}"),
                                            'status': 'active',
                                            'created_at': datetime.utcnow(),
                                            'tier_required': 'free',
                                            'source': 'contracts_finder_api'
                                        }
                                        
                                        opportunities.append(opportunity)
                                        
                                    except Exception as e:
                                        continue
                            
                            # Break if no more results
                            if len(data.get('notices', [])) < 100:
                                break
                        else:
                            print(f"API error for {search_term}: {response.status}")
                            break
                    
                    await asyncio.sleep(0.5)  # Rate limiting
                    
            except Exception as e:
                print(f"Error with API search '{search_term}': {e}")
                continue
        
        print(f"✅ Contracts Finder API: {len(opportunities)} opportunities")
        return opportunities

    async def _collect_dasa_direct(self, session: aiohttp.ClientSession) -> List[Dict]:
        """DASA Direct Scraping - CONTRACTS ONLY (not innovation calls)"""
        opportunities = []
        
        # Focus on DASA contract opportunities, not innovation calls
        dasa_contract_urls = [
            'https://www.gov.uk/government/organisations/defence-and-security-accelerator/about/procurement',
            'https://www.contractsfinder.service.gov.uk/Search?searchTerm=defence%20and%20security%20accelerator',
            'https://www.find-tender.service.gov.uk/Search?keywords=dasa'
        ]
        
        for url in dasa_contract_urls:
            try:
                async with session.get(url) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'html.parser')
                        
                        # Look for CONTRACT-specific elements, not innovation calls
                        contract_elements = []
                        
                        # Focus on contract/tender selectors
                        contract_selectors = [
                            'a[href*="tender"]', 'a[href*="contract"]',
                            'div[class*="contract"]', 'div[class*="tender"]',
                            'a[href*="procurement"]', 'div[class*="procurement"]'
                        ]
                        
                        for selector in contract_selectors:
                            elements = soup.select(selector)
                            contract_elements.extend(elements)
                        
                        for element in contract_elements[:15]:  # Reduced to focus on quality
                            try:
                                if element.name == 'a':
                                    title = element.get_text(strip=True)
                                    link = element.get('href', '')
                                else:
                                    title_elem = element.find('a')
                                    title = title_elem.get_text(strip=True) if title_elem else ''
                                    link_elem = element.find('a', href=True)
                                    link = link_elem['href'] if link_elem else ''
                                
                                if len(title) < 10:
                                    continue
                                
                                # Get more description context
                                desc_elem = element.find_next('p') or element.find('p')
                                description = desc_elem.get_text(strip=True) if desc_elem else title
                                
                                # STRICT CONTRACT FILTERING - even for DASA
                                if not self._is_defence_opportunity(title, description, 'DASA Contract'):
                                    continue
                                
                                opportunity = {
                                    'id': f"dasa_contract_{hash(title + url)}",
                                    'title': title[:200],
                                    'funding_body': 'Defence & Security Accelerator (DASA)',
                                    'description': description[:500],
                                    'detailed_description': description,
                                    'closing_date': datetime.now() + timedelta(days=45),
                                    'funding_amount': 'TBD',
                                    'tech_areas': self._extract_tech_areas(title + ' ' + description),
                                    'contract_type': 'Defence Contract',
                                    'official_link': link if link.startswith('http') else f"https://www.gov.uk{link}",
                                    'status': 'active',
                                    'created_at': datetime.utcnow(),
                                    'tier_required': 'free',
                                    'source': 'dasa_contracts'
                                }
                                
                                opportunities.append(opportunity)
                                
                            except Exception as e:
                                continue
                
                await asyncio.sleep(1)
                
            except Exception as e:
                print(f"Error with DASA contract URL {url}: {e}")
                continue
        
        print(f"✅ DASA Contracts (filtered): {len(opportunities)} opportunities")
        return opportunities

    # =================== PHASE 2 BROWSER AUTOMATION ===================

    async def _collect_find_tender_browser(self, context) -> List[Dict]:
        """Find a Tender - Browser Automation for Complete Coverage"""
        opportunities = []
        
        try:
            page = await context.new_page()
            
            # Navigate to Find a Tender
            await page.goto('https://www.find-tender.service.gov.uk/Search', wait_until='networkidle')
            
            # Defence search terms
            defence_searches = ['defence', 'security', 'military', 'MOD']
            
            for search_term in defence_searches:
                try:
                    # Fill search form
                    await page.fill('input[name="keywords"]', search_term)
                    
                    # Select defence sector if available
                    try:
                        await page.select_option('select[name="sector"]', 'defence-and-security')
                    except:
                        pass
                    
                    # Submit search
                    await page.click('button[type="submit"], input[type="submit"]')
                    await page.wait_for_timeout(3000)
                    
                    # Extract results
                    tender_elements = await page.query_selector_all('div[class*="tender"], div[class*="notice"], article[class*="opportunity"]')
                    
                    for element in tender_elements[:20]:
                        try:
                            title = await element.text_content()
                            
                            if not title or len(title.strip()) < 10:
                                continue
                            
                            # Get link if available
                            link_element = await element.query_selector('a')
                            link = await link_element.get_attribute('href') if link_element else ''
                            
                            if self._is_defence_opportunity(title, '', 'Find a Tender'):
                                opportunity = {
                                    'id': f"fts_browser_{hash(title + search_term)}",
                                    'title': title.strip()[:200],
                                    'funding_body': 'UK Government (Find a Tender)',
                                    'description': f'Government tender: {title.strip()}',
                                    'detailed_description': f'Government tender from Find a Tender: {title.strip()}',
                                    'closing_date': datetime.now() + timedelta(days=45),
                                    'funding_amount': 'TBD',
                                    'tech_areas': self._extract_tech_areas(title),
                                    'contract_type': 'Government Tender',
                                    'official_link': f"https://www.find-tender.service.gov.uk{link}" if link.startswith('/') else link,
                                    'status': 'active',
                                    'created_at': datetime.utcnow(),
                                    'tier_required': 'free',
                                    'source': 'find_tender_browser'
                                }
                                
                                opportunities.append(opportunity)
                                
                        except Exception as e:
                            continue
                    
                    await page.wait_for_timeout(2000)
                    
                except Exception as e:
                    print(f"Error searching Find a Tender for '{search_term}': {e}")
                    continue
            
            await page.close()
            
        except Exception as e:
            print(f"Error with Find a Tender browser: {e}")
        
        print(f"✅ Find a Tender Browser: {len(opportunities)} opportunities")
        return opportunities

    async def _collect_ccs_frameworks_browser(self, context) -> List[Dict]:
        """Crown Commercial Service Frameworks - Browser Automation"""
        opportunities = []
        
        try:
            page = await context.new_page()
            
            # Navigate to CCS agreements
            await page.goto('https://www.crowncommercial.gov.uk/agreements', wait_until='networkidle')
            
            # Look for framework agreements
            framework_elements = await page.query_selector_all('div[class*="framework"], div[class*="agreement"], a[href*="framework"]')
            
            for element in framework_elements[:30]:
                try:
                    title = await element.text_content()
                    
                    if not title or len(title.strip()) < 10:
                        continue
                    
                    # Get link
                    link = await element.get_attribute('href') if element.tag_name == 'a' else ''
                    if not link:
                        link_element = await element.query_selector('a')
                        link = await link_element.get_attribute('href') if link_element else ''
                    
                    # Check if defence-related
                    if self._is_defence_opportunity(title, '', 'Crown Commercial Service'):
                        opportunity = {
                            'id': f"ccs_browser_{hash(title)}",
                            'title': title.strip()[:200],
                            'funding_body': 'Crown Commercial Service',
                            'description': f'Government framework: {title.strip()}',
                            'detailed_description': f'Crown Commercial Service framework: {title.strip()}',
                            'closing_date': datetime.now() + timedelta(days=365),  # Frameworks are long-term
                            'funding_amount': 'Framework Agreement',
                            'tech_areas': self._extract_tech_areas(title),
                            'contract_type': 'Government Framework',
                            'official_link': f"https://www.crowncommercial.gov.uk{link}" if link.startswith('/') else link,
                            'status': 'active',
                            'created_at': datetime.utcnow(),
                            'tier_required': 'free',
                            'source': 'ccs_frameworks_browser'
                        }
                        
                        opportunities.append(opportunity)
                        
                except Exception as e:
                    continue
            
            await page.close()
            
        except Exception as e:
            print(f"Error with CCS Frameworks browser: {e}")
        
        print(f"✅ CCS Frameworks Browser: {len(opportunities)} opportunities")
        return opportunities

    async def _collect_defence_sourcing_portal(self, context) -> List[Dict]:
        """Defence Sourcing Portal (DSP) - Browser Automation"""
        opportunities = []
        
        try:
            page = await context.new_page()
            
            # Try multiple potential DSP URLs
            dsp_urls = [
                'https://www.gov.uk/guidance/defence-sourcing-portal',
                'https://defencesourcingportal.mod.uk',
                'https://www.contracts.mod.uk',
                'https://supplier.defence.gov.uk'
            ]
            
            for url in dsp_urls:
                try:
                    await page.goto(url, wait_until='networkidle', timeout=30000)
                    
                    # Look for opportunity elements
                    opportunity_elements = await page.query_selector_all(
                        'div[class*="opportunity"], div[class*="contract"], div[class*="tender"], a[href*="opportunity"]'
                    )
                    
                    for element in opportunity_elements[:20]:
                        try:
                            title = await element.text_content()
                            
                            if not title or len(title.strip()) < 10:
                                continue
                            
                            # Get link
                            link = await element.get_attribute('href') if element.tag_name == 'a' else ''
                            if not link:
                                link_element = await element.query_selector('a')
                                link = await link_element.get_attribute('href') if link_element else ''
                            
                            # All DSP content is defence by nature
                            opportunity = {
                                'id': f"dsp_browser_{hash(title + url)}",
                                'title': title.strip()[:200],
                                'funding_body': 'Defence Sourcing Portal (MOD)',
                                'description': f'Defence sourcing opportunity: {title.strip()}',
                                'detailed_description': f'Defence Sourcing Portal opportunity: {title.strip()}',
                                'closing_date': datetime.now() + timedelta(days=30),
                                'funding_amount': 'TBD',
                                'tech_areas': self._extract_tech_areas(title),
                                'contract_type': 'Defence Contract',
                                'official_link': link if link.startswith('http') else f"{url.rstrip('/')}/{link.lstrip('/')}" if link else url,
                                'status': 'active',
                                'created_at': datetime.utcnow(),
                                'tier_required': 'free',
                                'source': 'defence_sourcing_portal'
                            }
                            
                            opportunities.append(opportunity)
                            
                        except Exception as e:
                            continue
                    
                    # Break if we found content
                    if opportunities:
                        break
                        
                except Exception as e:
                    print(f"Could not access DSP URL {url}: {e}")
                    continue
            
            await page.close()
            
        except Exception as e:
            print(f"Error with Defence Sourcing Portal: {e}")
        
        print(f"✅ Defence Sourcing Portal: {len(opportunities)} opportunities")
        return opportunities

    async def _collect_primes_browser(self, context) -> List[Dict]:
        """Prime Contractors - Browser Automation for Public Supplier Pages"""
        opportunities = []
        
        # Prime contractor supplier portals
        primes = {
            'BAE Systems': 'https://www.baesystems.com/en/our-company/supplier-information',
            'Lockheed Martin': 'https://www.lockheedmartin.com/en-us/suppliers.html',
            'Airbus': 'https://www.airbus.com/en/suppliers',
            'RTX (Raytheon)': 'https://www.rtx.com/Suppliers',
            'Thales': 'https://www.thalesgroup.com/en/group/suppliers',
            'Leonardo UK': 'https://uk.leonardocompany.com/en/suppliers'
        }
        
        for prime_name, url in primes.items():
            try:
                page = await context.new_page()
                await page.goto(url, wait_until='networkidle', timeout=30000)
                
                # Look for supplier opportunities
                opportunity_elements = await page.query_selector_all(
                    'div[class*="opportunity"], div[class*="tender"], a[href*="opportunity"], a[href*="tender"], div[class*="supplier"]'
                )
                
                for element in opportunity_elements[:15]:
                    try:
                        title = await element.text_content()
                        
                        if not title or len(title.strip()) < 10:
                            continue
                        
                        # Get link
                        link = await element.get_attribute('href') if element.tag_name == 'a' else ''
                        if not link:
                            link_element = await element.query_selector('a')
                            link = await link_element.get_attribute('href') if link_element else ''
                        
                        # Prime contractor opportunities are defence by nature
                        opportunity = {
                            'id': f"prime_{prime_name.lower().replace(' ', '_')}_{hash(title)}",
                            'title': title.strip()[:200],
                            'funding_body': f'{prime_name} (Prime Contractor)',
                            'description': f'Supplier opportunity with {prime_name}: {title.strip()}',
                            'detailed_description': f'Prime contractor supplier opportunity from {prime_name}: {title.strip()}',
                            'closing_date': datetime.now() + timedelta(days=90),
                            'funding_amount': 'Prime Contract Opportunity',
                            'tech_areas': self._extract_tech_areas(title),
                            'contract_type': 'Prime Contractor Opportunity',
                            'official_link': link if link.startswith('http') else f"{url.split('/')[0]}//{url.split('/')[2]}{link}" if link else url,
                            'status': 'active',
                            'created_at': datetime.utcnow(),
                            'tier_required': 'pro',  # Prime opportunities for Pro tier
                            'source': f'prime_{prime_name.lower().replace(" ", "_")}'
                        }
                        
                        opportunities.append(opportunity)
                        
                    except Exception as e:
                        continue
                
                await page.close()
                await asyncio.sleep(2)  # Rate limiting between primes
                
            except Exception as e:
                print(f"Error with {prime_name}: {e}")
                continue
        
        print(f"✅ Prime Contractors Browser: {len(opportunities)} opportunities")
        return opportunities

    # =================== UTILITY METHODS ===================

    def _is_defence_opportunity(self, title: str, description: str, source: str) -> bool:
        """
        ENHANCED: Check if opportunity is a DEFENCE CONTRACT (not just innovation call)
        """
        text = f"{title} {description} {source}".lower()
        
        # IMMEDIATE REJECTION for exclusions
        for exclusion in self.exclusion_keywords:
            if exclusion in text:
                return False
        
        # IMMEDIATE REJECTION for innovation/non-contract keywords
        for innovation_word in self.innovation_keywords:
            if innovation_word in text:
                print(f"❌ Rejected innovation call: {title[:60]}...")
                return False
        
        # Must be defence-related
        is_defence = any(keyword in text for keyword in self.defence_keywords)
        if not is_defence:
            return False
        
        # Must have contract indicators
        is_contract = any(keyword in text for keyword in self.contract_keywords)
        
        # Additional contract indicators
        contract_indicators = [
            'contract value', 'tender value', 'estimated value',
            'supply of', 'provision of', 'delivery of', 'maintenance of',
            'cpv code', 'contract notice', 'award notice',
            'closing date', 'submission deadline', 'tender deadline',
            'framework', 'dynamic purchasing system', 'lots'
        ]
        
        has_contract_indicators = any(indicator in text for indicator in contract_indicators)
        
        # Score-based approach for contract likelihood
        contract_score = 0
        
        if is_contract:
            contract_score += 10
        if has_contract_indicators:
            contract_score += 5
        
        # Look for value patterns (actual contract values, not funding ranges)
        value_patterns = [
            r'contract value[:\s]*£[\d,]+',
            r'estimated value[:\s]*£[\d,]+',
            r'total value[:\s]*£[\d,]+',
            r'£[\d,]+(?:\.\d{2})?\s*(?:per|total|contract)',
        ]
        
        for pattern in value_patterns:
            if re.search(pattern, text):
                contract_score += 3
        
        # Require minimum score for acceptance
        is_likely_contract = contract_score >= 10
        
        if is_likely_contract:
            print(f"✅ Accepted contract: {title[:60]}... (Score: {contract_score})")
        else:
            print(f"❌ Rejected non-contract: {title[:60]}... (Score: {contract_score})")
        
        return is_likely_contract

    def _extract_tech_areas(self, text: str) -> List[str]:
        """Extract technology areas from text"""
        tech_areas = []
        text_lower = text.lower()
        
        tech_mapping = {
            'artificial intelligence': ['ai', 'artificial intelligence', 'machine learning'],
            'cybersecurity': ['cyber', 'cybersecurity', 'cyber security'],
            'quantum technologies': ['quantum'],
            'robotics & autonomous systems': ['robotics', 'autonomous', 'unmanned'],
            'aerospace': ['aerospace', 'aviation', 'aircraft'],
            'maritime defence': ['maritime', 'naval', 'submarine'],
            'sensors & signal processing': ['sensors', 'radar', 'surveillance'],
            'communications': ['communications', 'radio', 'satellite'],
            'advanced materials': ['materials', 'armour', 'protection'],
            'space technologies': ['space', 'satellite', 'orbital']
        }
        
        for tech_area, keywords in tech_mapping.items():
            if any(keyword in text_lower for keyword in keywords):
                tech_areas.append(tech_area)
        
        return tech_areas if tech_areas else ['Defence Technology']

    def _parse_date(self, date_string: str) -> Optional[datetime]:
        """Parse various date formats"""
        if not date_string:
            return None
        
        try:
            # Try common formats
            for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y', '%Y-%m-%dT%H:%M:%S']:
                try:
                    return datetime.strptime(date_string[:10], fmt[:10])
                except ValueError:
                    continue
        except Exception:
            pass
        
        return None

    def _remove_duplicates(self, opportunities: List[Dict]) -> List[Dict]:
        """Remove duplicate opportunities based on title similarity"""
        unique_opportunities = []
        seen_titles = set()
        
        for opp in opportunities:
            title_normalized = re.sub(r'[^\w\s]', '', opp['title'].lower()).strip()
            title_words = set(title_normalized.split())
            
            is_duplicate = False
            for seen_title in seen_titles:
                seen_words = set(seen_title.split())
                
                # Check for high similarity (>80% word overlap)
                if len(title_words & seen_words) / max(len(title_words), len(seen_words), 1) > 0.8:
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                seen_titles.add(title_normalized)
                unique_opportunities.append(opp)
        
        return unique_opportunities
