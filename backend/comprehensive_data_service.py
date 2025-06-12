"""
COMPREHENSIVE DEFENCE OPPORTUNITY DATA COLLECTION SERVICE
This service implements aggressive data collection from ALL major defence opportunity sources
to make Modulus Defence the most comprehensive database available.
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

class ComprehensiveDefenceDataService:
    def __init__(self):
        self.session_headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
        
        # COMPREHENSIVE SEARCH TERMS (100+ terms for maximum coverage)
        self.defence_keywords = [
            # Core Defence Terms
            'defence', 'defense', 'military', 'security', 'army', 'navy', 'air force', 'marines',
            'mod', 'ministry of defence', 'dstl', 'dasa', 'nato', 'armed forces',
            
            # Technology Areas
            'cybersecurity', 'cyber security', 'artificial intelligence', 'ai', 'machine learning',
            'quantum', 'quantum computing', 'quantum communications', 'quantum cryptography',
            'aerospace', 'aviation', 'aircraft', 'helicopter', 'drone', 'uav', 'unmanned',
            'maritime', 'naval', 'submarine', 'ship', 'vessel', 'sonar', 'underwater',
            'radar', 'lidar', 'sensor', 'surveillance', 'reconnaissance', 'intelligence',
            'communications', 'radio', 'satellite', 'gps', 'navigation', 'positioning',
            'logistics', 'supply chain', 'transportation', 'mobility', 'vehicles',
            'weapons', 'ammunition', 'ballistics', 'explosives', 'ordnance', 'munitions',
            'armor', 'armour', 'protection', 'kevlar', 'ballistic', 'shielding',
            'electronics', 'embedded systems', 'software', 'firmware', 'hardware',
            'simulation', 'training', 'virtual reality', 'augmented reality', 'modeling',
            
            # Specific Systems
            'command and control', 'c4isr', 'battle management', 'situational awareness',
            'electronic warfare', 'ew', 'jamming', 'countermeasures', 'stealth',
            'night vision', 'thermal imaging', 'infrared', 'electro-optical',
            'guidance systems', 'targeting', 'fire control', 'precision', 'accuracy',
            'propulsion', 'engines', 'turbines', 'fuel systems', 'power generation',
            'materials science', 'composites', 'ceramics', 'metals', 'coatings',
            'biotechnology', 'medical', 'healthcare', 'pharmaceuticals', 'vaccines',
            
            # Emerging Tech
            'robotics', 'autonomous', 'unmanned systems', 'swarm', 'distributed',
            'blockchain', 'distributed ledger', 'cryptography', 'encryption',
            'internet of things', 'iot', 'edge computing', 'cloud computing',
            'big data', 'data analytics', 'data science', 'predictive analytics',
            '5g', '6g', 'wireless', 'mesh networks', 'ad-hoc networks',
            'space', 'satellite', 'orbital', 'launch', 'space-based',
            'hypersonic', 'supersonic', 'high-speed', 'velocity', 'kinetic',
            
            # Contract Types
            'research', 'development', 'r&d', 'innovation', 'prototype', 'demonstration',
            'testing', 'evaluation', 'validation', 'verification', 'certification',
            'manufacturing', 'production', 'procurement', 'acquisition', 'supply',
            'maintenance', 'support', 'services', 'consultancy', 'advisory',
            'training', 'education', 'simulation', 'exercise', 'assessment'
        ]
        
        # MAJOR DATA SOURCES - All the sources mentioned plus more
        self.sources = {
            # UK GOVERNMENT SOURCES
            'contracts_finder': {
                'name': 'UK Contracts Finder',
                'base_url': 'https://www.contractsfinder.service.gov.uk',
                'search_url': 'https://www.contractsfinder.service.gov.uk/Search'
            },
            'find_tender': {
                'name': 'Find a Tender Service',
                'base_url': 'https://www.find-tender.service.gov.uk',
                'search_url': 'https://www.find-tender.service.gov.uk/Search'
            },
            'crown_commercial': {
                'name': 'Crown Commercial Service',
                'base_url': 'https://www.crowncommercial.gov.uk',
                'search_url': 'https://www.crowncommercial.gov.uk/agreements'
            },
            'innovate_uk': {
                'name': 'Innovate UK',
                'base_url': 'https://apply-for-innovation-funding.service.gov.uk',
                'search_url': 'https://apply-for-innovation-funding.service.gov.uk/competition/search'
            },
            'ukri': {
                'name': 'UK Research and Innovation',
                'base_url': 'https://www.ukri.org',
                'search_url': 'https://www.ukri.org/opportunity'
            },
            
            # EUROPEAN SOURCES
            'ted_europa': {
                'name': 'Tenders Electronic Daily (EU)',
                'base_url': 'https://ted.europa.eu',
                'search_url': 'https://ted.europa.eu/TED/browse/browseByMap.do'
            },
            'eu_funding_portal': {
                'name': 'EU Funding & Tenders Portal',
                'base_url': 'https://ec.europa.eu',
                'search_url': 'https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-search'
            },
            
            # NATO & INTERNATIONAL
            'nato_nspa': {
                'name': 'NATO Support and Procurement Agency',
                'base_url': 'https://www.nspa.nato.int',
                'search_url': 'https://www.nspa.nato.int/business/procurement/procurement-opportunities'
            },
            'us_sam_gov': {
                'name': 'US System for Award Management',
                'base_url': 'https://sam.gov',
                'search_url': 'https://sam.gov/content/opportunities'
            },
            'australia_tender': {
                'name': 'Australian AusTender',
                'base_url': 'https://www.tenders.gov.au',
                'search_url': 'https://www.tenders.gov.au/Search'
            },
            
            # MAJOR DEFENCE CONTRACTORS
            'bae_systems': {
                'name': 'BAE Systems Suppliers',
                'base_url': 'https://www.baesystems.com',
                'search_url': 'https://www.baesystems.com/en/our-company/supplier-information'
            },
            'lockheed_martin': {
                'name': 'Lockheed Martin Suppliers',
                'base_url': 'https://www.lockheedmartin.com',
                'search_url': 'https://www.lockheedmartin.com/en-us/suppliers.html'
            },
            'airbus': {
                'name': 'Airbus Suppliers',
                'base_url': 'https://www.airbus.com',
                'search_url': 'https://www.airbus.com/en/suppliers'
            },
            'rtx_raytheon': {
                'name': 'RTX (Raytheon Technologies)',
                'base_url': 'https://www.rtx.com',
                'search_url': 'https://www.rtx.com/Suppliers'
            },
            'thales': {
                'name': 'Thales Suppliers',
                'base_url': 'https://www.thalesgroup.com',
                'search_url': 'https://www.thalesgroup.com/en/group/suppliers'
            },
            'leonardo_uk': {
                'name': 'Leonardo UK Suppliers',
                'base_url': 'https://uk.leonardocompany.com',
                'search_url': 'https://uk.leonardocompany.com/en/suppliers'
            }
        }

    async def collect_all_opportunities(self) -> List[Dict]:
        """
        COMPREHENSIVE data collection from ALL sources using multiple methods
        """
        print("🚀 STARTING COMPREHENSIVE DEFENCE OPPORTUNITY COLLECTION...")
        print(f"📊 Targeting {len(self.sources)} major sources with {len(self.defence_keywords)} search terms")
        
        all_opportunities = []
        
        # Method 1: High-speed HTTP scraping for basic sources
        print("\n🌐 Phase 1: HTTP-based collection...")
        http_opportunities = await self._collect_via_http()
        all_opportunities.extend(http_opportunities)
        
        # Method 2: Browser automation for JavaScript-heavy sites
        print("\n🤖 Phase 2: Browser automation collection...")
        browser_opportunities = await self._collect_via_browser()
        all_opportunities.extend(browser_opportunities)
        
        # Method 3: Specialized collectors for specific sources
        print("\n🎯 Phase 3: Specialized source collection...")
        specialized_opportunities = await self._collect_specialized_sources()
        all_opportunities.extend(specialized_opportunities)
        
        # Remove duplicates and return
        unique_opportunities = self._remove_duplicates(all_opportunities)
        
        print(f"\n🎯 TOTAL COLLECTION COMPLETE:")
        print(f"   • Raw opportunities collected: {len(all_opportunities)}")
        print(f"   • Unique opportunities: {len(unique_opportunities)}")
        print(f"   • Sources processed: {len(self.sources)}")
        
        return unique_opportunities

    async def _collect_via_http(self) -> List[Dict]:
        """Fast HTTP-based collection from standard web sources"""
        opportunities = []
        
        connector = aiohttp.TCPConnector(limit=50, limit_per_host=10)
        timeout = aiohttp.ClientTimeout(total=30)
        
        async with aiohttp.ClientSession(
            connector=connector, 
            timeout=timeout, 
            headers=self.session_headers
        ) as session:
            
            # Create tasks for parallel processing
            tasks = []
            
            # UK Government sources (priority)
            if 'contracts_finder' in self.sources:
                tasks.append(self._scrape_contracts_finder_comprehensive(session))
            if 'find_tender' in self.sources:
                tasks.append(self._scrape_find_tender_comprehensive(session))
            if 'innovate_uk' in self.sources:
                tasks.append(self._scrape_innovate_uk_comprehensive(session))
            if 'crown_commercial' in self.sources:
                tasks.append(self._scrape_crown_commercial(session))
            if 'ukri' in self.sources:
                tasks.append(self._scrape_ukri(session))
            
            # Execute all tasks in parallel
            if tasks:
                results = await asyncio.gather(*tasks, return_exceptions=True)
                for result in results:
                    if isinstance(result, list):
                        opportunities.extend(result)
                        print(f"✅ HTTP batch collected {len(result)} opportunities")
                    else:
                        print(f"❌ HTTP batch error: {result}")
        
        return opportunities

    async def _collect_via_browser(self) -> List[Dict]:
        """Browser automation for JavaScript-heavy sites"""
        opportunities = []
        
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                )
                
                # High-value targets that need browser automation
                targets = [
                    ('ted_europa', self._scrape_ted_europa_browser),
                    ('eu_funding_portal', self._scrape_eu_funding_browser),
                    ('nato_nspa', self._scrape_nato_nspa_browser),
                    ('us_sam_gov', self._scrape_us_sam_browser)
                ]
                
                for source_name, scraper_func in targets:
                    if source_name in self.sources:
                        try:
                            page = await context.new_page()
                            source_opps = await scraper_func(page)
                            opportunities.extend(source_opps)
                            print(f"✅ Browser: {source_name} collected {len(source_opps)} opportunities")
                            await page.close()
                        except Exception as e:
                            print(f"❌ Browser error for {source_name}: {e}")
                
                await browser.close()
                
        except Exception as e:
            print(f"❌ Browser automation error: {e}")
        
        return opportunities

    async def _collect_specialized_sources(self) -> List[Dict]:
        """Specialized collectors for contractor and specific sources"""
        opportunities = []
        
        # Prime contractor sources (these often have supplier opportunity pages)
        contractor_sources = [
            'bae_systems', 'lockheed_martin', 'airbus', 
            'rtx_raytheon', 'thales', 'leonardo_uk'
        ]
        
        connector = aiohttp.TCPConnector(limit=20)
        timeout = aiohttp.ClientTimeout(total=45)
        
        async with aiohttp.ClientSession(
            connector=connector, 
            timeout=timeout, 
            headers=self.session_headers
        ) as session:
            
            for source_name in contractor_sources:
                if source_name in self.sources:
                    try:
                        source_opps = await self._scrape_contractor_source(session, source_name)
                        opportunities.extend(source_opps)
                        print(f"✅ Contractor: {source_name} collected {len(source_opps)} opportunities")
                    except Exception as e:
                        print(f"❌ Contractor error for {source_name}: {e}")
        
        return opportunities

    async def _scrape_contracts_finder_comprehensive(self, session: aiohttp.ClientSession) -> List[Dict]:
        """COMPREHENSIVE UK Contracts Finder scraping with ALL defence terms"""
        opportunities = []
        base_url = self.sources['contracts_finder']['base_url']
        search_url = self.sources['contracts_finder']['search_url']
        
        # Use multiple search strategies
        search_strategies = [
            # Strategy 1: Individual high-value terms
            self.defence_keywords[:20],  # Top 20 terms individually
            
            # Strategy 2: Combined terms
            ['defence security', 'military technology', 'cyber security', 'aerospace defence'],
            
            # Strategy 3: Industry codes (if available)
            ['SIC 84220', 'SIC 84230', 'SIC 25400'],  # Defence-related SIC codes
        ]
        
        for strategy in search_strategies:
            for search_term in strategy:
                try:
                    # Search with extended date range for more results
                    search_params = {
                        'keywords': search_term,
                        'postedFrom': (datetime.now() - timedelta(days=180)).strftime('%d/%m/%Y'),
                        'postedTo': datetime.now().strftime('%d/%m/%Y'),
                        'stage': 'all',  # All stages, not just tender
                        'location': '',
                        'radius': '',
                        'postcode': ''
                    }
                    
                    async with session.get(search_url, params=search_params) as response:
                        if response.status == 200:
                            html = await response.text()
                            soup = BeautifulSoup(html, 'html.parser')
                            
                            # Look for contract result cards with multiple selectors
                            contract_elements = []
                            selectors = [
                                'div.search-result', 'article.search-result', 
                                'div[class*="result"]', 'div[class*="contract"]',
                                'div[class*="opportunity"]', 'li[class*="result"]'
                            ]
                            
                            for selector in selectors:
                                elements = soup.select(selector)
                                contract_elements.extend(elements)
                            
                            # Process each contract
                            for element in contract_elements[:50]:  # Up to 50 per search
                                try:
                                    opp = self._extract_opportunity_from_element(
                                        element, 'contracts_finder_real', base_url, search_term
                                    )
                                    if opp and self._is_relevant_opportunity(opp):
                                        opportunities.append(opp)
                                except Exception as e:
                                    continue
                    
                    # Rate limiting
                    await asyncio.sleep(0.5)
                    
                except Exception as e:
                    print(f"Error searching Contracts Finder for '{search_term}': {e}")
                    continue
        
        return opportunities

    async def _scrape_find_tender_comprehensive(self, session: aiohttp.ClientSession) -> List[Dict]:
        """COMPREHENSIVE Find a Tender scraping"""
        opportunities = []
        base_url = self.sources['find_tender']['base_url']
        search_url = self.sources['find_tender']['search_url']
        
        # Multiple search approaches
        for search_term in self.defence_keywords[:30]:  # Top 30 terms
            try:
                search_params = {
                    'keywords': search_term,
                    'location': 'United Kingdom',
                    'published_from': (datetime.now() - timedelta(days=120)).strftime('%Y-%m-%d'),
                    'published_to': datetime.now().strftime('%Y-%m-%d'),
                    'lot_size': 'all',
                    'sector': 'defence-and-security'  # Specific defence sector
                }
                
                async with session.get(search_url, params=search_params) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'html.parser')
                        
                        # Multiple selectors for tender results
                        tender_elements = []
                        selectors = [
                            'div[class*="tender"]', 'div[class*="notice"]',
                            'article[class*="opportunity"]', 'div[class*="result"]'
                        ]
                        
                        for selector in selectors:
                            elements = soup.select(selector)
                            tender_elements.extend(elements)
                        
                        for element in tender_elements[:40]:
                            try:
                                opp = self._extract_opportunity_from_element(
                                    element, 'find_tender_real', base_url, search_term
                                )
                                if opp and self._is_relevant_opportunity(opp):
                                    opportunities.append(opp)
                            except Exception as e:
                                continue
                
                await asyncio.sleep(0.5)
                
            except Exception as e:
                continue
        
        return opportunities

    async def _scrape_innovate_uk_comprehensive(self, session: aiohttp.ClientSession) -> List[Dict]:
        """COMPREHENSIVE Innovate UK scraping"""
        opportunities = []
        
        # Multiple Innovate UK URLs to try
        urls_to_scrape = [
            'https://apply-for-innovation-funding.service.gov.uk/competition/search',
            'https://www.gov.uk/government/organisations/innovate-uk',
            'https://www.gov.uk/find-innovation-funding',
            'https://www.ukri.org/councils/innovate-uk/'
        ]
        
        for url in urls_to_scrape:
            try:
                async with session.get(url) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'html.parser')
                        
                        # Look for funding/competition elements
                        funding_elements = []
                        selectors = [
                            'div[class*="competition"]', 'div[class*="funding"]',
                            'a[href*="competition"]', 'div[class*="opportunity"]',
                            'article[class*="funding"]'
                        ]
                        
                        for selector in selectors:
                            elements = soup.select(selector)
                            funding_elements.extend(elements)
                        
                        # Also search for text containing funding keywords
                        funding_links = soup.find_all('a', string=re.compile(
                            r'competition|funding|innovation|grant|defence|security|cyber|aerospace|maritime', 
                            re.I
                        ))
                        funding_elements.extend(funding_links)
                        
                        for element in funding_elements[:30]:
                            try:
                                opp = self._extract_opportunity_from_element(
                                    element, 'innovate_uk_real', 'https://apply-for-innovation-funding.service.gov.uk', 'innovation'
                                )
                                if opp:
                                    opportunities.append(opp)
                            except Exception as e:
                                continue
                
                await asyncio.sleep(1)
                
            except Exception as e:
                continue
        
        return opportunities

    async def _scrape_crown_commercial(self, session: aiohttp.ClientSession) -> List[Dict]:
        """Crown Commercial Service frameworks and agreements"""
        opportunities = []
        base_url = self.sources['crown_commercial']['base_url']
        search_url = self.sources['crown_commercial']['search_url']
        
        try:
            async with session.get(search_url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Look for framework agreements
                    framework_elements = soup.select('div[class*="framework"], div[class*="agreement"], a[href*="framework"]')
                    
                    for element in framework_elements[:20]:
                        try:
                            title_elem = element.find(['h1', 'h2', 'h3', 'h4']) or element.find('a')
                            title = title_elem.get_text(strip=True) if title_elem else 'Crown Commercial Framework'
                            
                            # Check if defence-related
                            if self._contains_defence_keywords(title.lower()):
                                link_elem = element.find('a', href=True)
                                official_link = f"{base_url}{link_elem['href']}" if link_elem and link_elem['href'].startswith('/') else (link_elem['href'] if link_elem else search_url)
                                
                                opportunity = {
                                    'id': f"ccs_real_{hash(title)}",
                                    'title': title[:200],
                                    'funding_body': 'Crown Commercial Service',
                                    'description': f'Crown Commercial Service framework: {title}',
                                    'detailed_description': f'Government framework agreement available through Crown Commercial Service: {title}',
                                    'closing_date': datetime.now() + timedelta(days=365),  # Frameworks are long-term
                                    'funding_amount': 'Framework Agreement',
                                    'tech_areas': self._extract_tech_areas_from_text(title),
                                    'contract_type': 'Framework Agreement',
                                    'official_link': official_link,
                                    'status': 'active',
                                    'created_at': datetime.utcnow(),
                                    'tier_required': 'free',
                                    'source': 'crown_commercial_real'
                                }
                                opportunities.append(opportunity)
                        except Exception as e:
                            continue
        except Exception as e:
            print(f"Error scraping Crown Commercial: {e}")
        
        return opportunities

    async def _scrape_ukri(self, session: aiohttp.ClientSession) -> List[Dict]:
        """UK Research and Innovation opportunities"""
        opportunities = []
        
        try:
            urls_to_try = [
                'https://www.ukri.org/opportunity/',
                'https://www.ukri.org/funding/',
                'https://www.ukri.org/what-we-do/creating-world-class-research-and-innovation-infrastructure/'
            ]
            
            for url in urls_to_try:
                async with session.get(url) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'html.parser')
                        
                        opportunity_elements = soup.select('div[class*="opportunity"], div[class*="funding"], a[href*="opportunity"]')
                        
                        for element in opportunity_elements[:15]:
                            try:
                                opp = self._extract_opportunity_from_element(
                                    element, 'ukri_real', 'https://www.ukri.org', 'research'
                                )
                                if opp and self._is_relevant_opportunity(opp):
                                    opportunities.append(opp)
                            except Exception as e:
                                continue
        except Exception as e:
            print(f"Error scraping UKRI: {e}")
        
        return opportunities

    # BROWSER AUTOMATION METHODS for JavaScript-heavy sites

    async def _scrape_ted_europa_browser(self, page) -> List[Dict]:
        """EU TED database using browser automation"""
        opportunities = []
        
        try:
            await page.goto('https://ted.europa.eu/TED/browse/browseByMap.do', wait_until='networkidle')
            
            # Search for defence-related tenders
            for search_term in ['defence', 'security', 'military', 'cyber', 'aerospace'][:3]:
                try:
                    # Navigate to search page
                    await page.goto(f'https://ted.europa.eu/TED/search/search.do', wait_until='networkidle')
                    
                    # Fill search form
                    await page.fill('input[name="textfield"]', search_term)
                    await page.click('input[type="submit"]')
                    await page.wait_for_timeout(3000)
                    
                    # Extract results
                    tender_elements = await page.query_selector_all('div.result, tr.result, div[class*="tender"]')
                    
                    for element in tender_elements[:20]:
                        try:
                            title = await element.text_content()
                            if title and len(title.strip()) > 10:
                                opportunity = {
                                    'id': f"ted_eu_{hash(title + search_term)}",
                                    'title': title.strip()[:200],
                                    'funding_body': 'European Union (TED)',
                                    'description': f'European tender opportunity: {title.strip()}',
                                    'detailed_description': f'European Union tender from TED database: {title.strip()}',
                                    'closing_date': datetime.now() + timedelta(days=45),
                                    'funding_amount': 'EU Tender',
                                    'tech_areas': self._extract_tech_areas_from_text(title),
                                    'contract_type': 'EU Public Tender',
                                    'official_link': 'https://ted.europa.eu',
                                    'status': 'active',
                                    'created_at': datetime.utcnow(),
                                    'tier_required': 'free',
                                    'source': 'ted_europa_real',
                                    'search_query': search_term
                                }
                                opportunities.append(opportunity)
                        except Exception as e:
                            continue
                    
                    await page.wait_for_timeout(2000)
                    
                except Exception as e:
                    print(f"Error searching TED for {search_term}: {e}")
                    continue
                    
        except Exception as e:
            print(f"Error with TED Europa browser: {e}")
        
        return opportunities

    async def _scrape_eu_funding_browser(self, page) -> List[Dict]:
        """EU Funding & Tenders Portal using browser"""
        opportunities = []
        
        try:
            await page.goto('https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-search', 
                           wait_until='networkidle')
            
            # Look for funding opportunities
            await page.wait_for_timeout(3000)
            
            # Try to find opportunity elements
            opportunity_elements = await page.query_selector_all('div[class*="opportunity"], div[class*="funding"], a[href*="opportunity"]')
            
            for element in opportunity_elements[:15]:
                try:
                    title = await element.text_content()
                    if title and len(title.strip()) > 10 and self._contains_defence_keywords(title.lower()):
                        opportunity = {
                            'id': f"eu_funding_{hash(title)}",
                            'title': title.strip()[:200],
                            'funding_body': 'European Commission Funding Portal',
                            'description': f'EU funding opportunity: {title.strip()}',
                            'detailed_description': f'European Commission funding opportunity: {title.strip()}',
                            'closing_date': datetime.now() + timedelta(days=60),
                            'funding_amount': 'EU Funding',
                            'tech_areas': self._extract_tech_areas_from_text(title),
                            'contract_type': 'EU Funding Grant',
                            'official_link': 'https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-search',
                            'status': 'active',
                            'created_at': datetime.utcnow(),
                            'tier_required': 'free',
                            'source': 'eu_funding_real'
                        }
                        opportunities.append(opportunity)
                except Exception as e:
                    continue
                    
        except Exception as e:
            print(f"Error with EU Funding browser: {e}")
        
        return opportunities

    async def _scrape_nato_nspa_browser(self, page) -> List[Dict]:
        """NATO NSPA procurement opportunities"""
        opportunities = []
        
        try:
            await page.goto('https://www.nspa.nato.int/business/procurement/procurement-opportunities', 
                           wait_until='networkidle')
            await page.wait_for_timeout(3000)
            
            # Look for procurement opportunities
            procurement_elements = await page.query_selector_all('div[class*="procurement"], div[class*="opportunity"], a[href*="procurement"]')
            
            for element in procurement_elements[:10]:
                try:
                    title = await element.text_content()
                    if title and len(title.strip()) > 10:
                        opportunity = {
                            'id': f"nato_nspa_{hash(title)}",
                            'title': title.strip()[:200],
                            'funding_body': 'NATO Support and Procurement Agency',
                            'description': f'NATO procurement opportunity: {title.strip()}',
                            'detailed_description': f'NATO NSPA procurement opportunity: {title.strip()}',
                            'closing_date': datetime.now() + timedelta(days=45),
                            'funding_amount': 'NATO Contract',
                            'tech_areas': self._extract_tech_areas_from_text(title),
                            'contract_type': 'NATO Procurement',
                            'official_link': 'https://www.nspa.nato.int/business/procurement/procurement-opportunities',
                            'status': 'active',
                            'created_at': datetime.utcnow(),
                            'tier_required': 'free',
                            'source': 'nato_nspa_real'
                        }
                        opportunities.append(opportunity)
                except Exception as e:
                    continue
                    
        except Exception as e:
            print(f"Error with NATO NSPA browser: {e}")
        
        return opportunities

    async def _scrape_us_sam_browser(self, page) -> List[Dict]:
        """US SAM.gov opportunities (limited public access)"""
        opportunities = []
        
        try:
            await page.goto('https://sam.gov/content/opportunities', wait_until='networkidle')
            await page.wait_for_timeout(5000)
            
            # Look for public opportunity listings
            opportunity_elements = await page.query_selector_all('div[class*="opportunity"], div[class*="contract"], a[href*="opportunity"]')
            
            for element in opportunity_elements[:10]:
                try:
                    title = await element.text_content()
                    if title and len(title.strip()) > 10 and self._contains_defence_keywords(title.lower()):
                        opportunity = {
                            'id': f"us_sam_{hash(title)}",
                            'title': title.strip()[:200],
                            'funding_body': 'US Government (SAM.gov)',
                            'description': f'US Government opportunity: {title.strip()}',
                            'detailed_description': f'US Government contracting opportunity from SAM.gov: {title.strip()}',
                            'closing_date': datetime.now() + timedelta(days=30),
                            'funding_amount': 'US Government Contract',
                            'tech_areas': self._extract_tech_areas_from_text(title),
                            'contract_type': 'US Government Contract',
                            'official_link': 'https://sam.gov/content/opportunities',
                            'status': 'active',
                            'created_at': datetime.utcnow(),
                            'tier_required': 'pro',  # International opportunities for Pro tier
                            'source': 'us_sam_real'
                        }
                        opportunities.append(opportunity)
                except Exception as e:
                    continue
                    
        except Exception as e:
            print(f"Error with US SAM browser: {e}")
        
        return opportunities

    async def _scrape_contractor_source(self, session: aiohttp.ClientSession, source_name: str) -> List[Dict]:
        """Scrape major defence contractor supplier portals"""
        opportunities = []
        source_info = self.sources[source_name]
        
        try:
            async with session.get(source_info['search_url']) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Look for supplier opportunity elements
                    supplier_elements = soup.select('div[class*="supplier"], div[class*="opportunity"], a[href*="supplier"], a[href*="opportunity"]')
                    
                    for element in supplier_elements[:10]:
                        try:
                            title_elem = element.find(['h1', 'h2', 'h3', 'h4']) or element.find('a')
                            title = title_elem.get_text(strip=True) if title_elem else f'{source_info["name"]} Supplier Opportunity'
                            
                            link_elem = element.find('a', href=True)
                            if link_elem:
                                href = link_elem['href']
                                if href.startswith('/'):
                                    official_link = f"{source_info['base_url']}{href}"
                                elif href.startswith('http'):
                                    official_link = href
                                else:
                                    official_link = source_info['search_url']
                            else:
                                official_link = source_info['search_url']
                            
                            if len(title) > 10:
                                opportunity = {
                                    'id': f"{source_name}_{hash(title)}",
                                    'title': title[:200],
                                    'funding_body': source_info['name'],
                                    'description': f'Supplier opportunity with {source_info["name"]}: {title}',
                                    'detailed_description': f'Defence contractor supplier opportunity from {source_info["name"]}: {title}',
                                    'closing_date': datetime.now() + timedelta(days=90),
                                    'funding_amount': 'Contractor Opportunity',
                                    'tech_areas': self._extract_tech_areas_from_text(title),
                                    'contract_type': 'Prime Contractor Opportunity',
                                    'official_link': official_link,
                                    'status': 'active',
                                    'created_at': datetime.utcnow(),
                                    'tier_required': 'pro',  # Contractor opportunities for Pro tier
                                    'source': f'{source_name}_real'
                                }
                                opportunities.append(opportunity)
                        except Exception as e:
                            continue
                            
        except Exception as e:
            print(f"Error scraping contractor {source_name}: {e}")
        
        return opportunities

    # UTILITY METHODS

    def _extract_opportunity_from_element(self, element, source: str, base_url: str, search_term: str) -> Optional[Dict]:
        """Extract opportunity data from HTML element"""
        try:
            # Extract title
            title_elem = element.find(['h1', 'h2', 'h3', 'h4']) or element.find('a')
            title = title_elem.get_text(strip=True) if title_elem else self._extract_title_from_text(element.get_text())
            
            if not title or len(title) < 5:
                return None
            
            # Extract description
            desc_elem = element.find('p') or element.find('div', class_=re.compile(r'description|summary|content'))
            description = desc_elem.get_text(strip=True) if desc_elem else element.get_text(strip=True)[:400]
            
            # Extract metadata
            element_text = element.get_text()
            funding_amount = self._extract_value_from_text(element_text)
            closing_date = self._extract_date_from_text(element_text)
            
            # Extract link
            link_elem = element.find('a', href=True)
            if link_elem:
                href = link_elem['href']
                if href.startswith('/'):
                    official_link = f"{base_url}{href}"
                elif href.startswith('http'):
                    official_link = href
                else:
                    official_link = f"{base_url}/{href}"
            else:
                official_link = base_url
            
            # Determine funding body based on source
            funding_body_map = {
                'contracts_finder_real': 'UK Government (Contracts Finder)',
                'find_tender_real': 'UK Government (Find a Tender)',
                'innovate_uk_real': 'Innovate UK',
                'crown_commercial_real': 'Crown Commercial Service',
                'ukri_real': 'UK Research and Innovation'
            }
            
            opportunity = {
                'id': f"{source}_{hash(title + description)}",
                'title': title[:200],
                'funding_body': funding_body_map.get(source, 'Government Agency'),
                'description': description[:500],
                'detailed_description': description,
                'closing_date': closing_date or (datetime.now() + timedelta(days=45)),
                'funding_amount': funding_amount,
                'tech_areas': self._extract_tech_areas_from_text(title + ' ' + description),
                'mod_department': self._extract_department_from_text(title + description),
                'contract_type': self._determine_contract_type(title + description),
                'official_link': official_link,
                'status': 'active',
                'created_at': datetime.utcnow(),
                'tier_required': 'free',
                'source': source,
                'search_query': search_term
            }
            
            return opportunity
            
        except Exception as e:
            return None

    def _is_relevant_opportunity(self, opp: Dict) -> bool:
        """Check if opportunity is relevant to defence sector"""
        text_to_check = f"{opp.get('title', '')} {opp.get('description', '')}".lower()
        
        # High-value keywords (automatically relevant)
        high_value_keywords = [
            'defence', 'defense', 'military', 'mod', 'ministry of defence',
            'army', 'navy', 'air force', 'dstl', 'dasa', 'security clearance',
            'classified', 'restricted', 'nato', 'weapons', 'ammunition'
        ]
        
        if any(keyword in text_to_check for keyword in high_value_keywords):
            return True
        
        # Medium-value keywords (need additional context)
        medium_value_keywords = [
            'security', 'cyber', 'surveillance', 'intelligence', 'aerospace',
            'maritime', 'radar', 'communications', 'electronics', 'software'
        ]
        
        medium_matches = sum(1 for keyword in medium_value_keywords if keyword in text_to_check)
        if medium_matches >= 2:  # At least 2 medium-value keywords
            return True
        
        # High-value funding amounts are always relevant
        funding_amount = opp.get('funding_amount', '')
        if funding_amount and any(indicator in funding_amount.lower() for indicator in ['£1m', '£2m', '£5m', '£10m', 'million']):
            return True
        
        return False

    def _contains_defence_keywords(self, text: str) -> bool:
        """Check if text contains defence-related keywords"""
        return any(keyword in text for keyword in self.defence_keywords[:50])  # Check against top 50 keywords

    def _extract_tech_areas_from_text(self, text: str) -> List[str]:
        """Extract technology areas from text"""
        tech_areas = []
        text_lower = text.lower()
        
        tech_mapping = {
            'artificial intelligence': ['ai', 'artificial intelligence', 'machine learning', 'neural network'],
            'cybersecurity': ['cyber', 'cybersecurity', 'cyber security', 'information security'],
            'quantum computing': ['quantum', 'quantum computing', 'quantum communications'],
            'aerospace': ['aerospace', 'aviation', 'aircraft', 'helicopter', 'drone'],
            'maritime defence': ['maritime', 'naval', 'submarine', 'ship', 'vessel'],
            'communications': ['communications', 'radio', 'satellite', 'telecommunications'],
            'electronics': ['electronics', 'embedded', 'hardware', 'circuits'],
            'software': ['software', 'application', 'system', 'platform'],
            'materials science': ['materials', 'composites', 'ceramics', 'metals'],
            'robotics': ['robotics', 'autonomous', 'unmanned', 'robot']
        }
        
        for tech_area, keywords in tech_mapping.items():
            if any(keyword in text_lower for keyword in keywords):
                tech_areas.append(tech_area)
        
        return tech_areas if tech_areas else ['General Technology']

    def _extract_value_from_text(self, text: str) -> Optional[str]:
        """Extract monetary value from text"""
        # Look for £, $, € amounts
        value_patterns = [
            r'£[\d,]+(?:\.\d{2})?[kmb]?',
            r'\$[\d,]+(?:\.\d{2})?[kmb]?',
            r'€[\d,]+(?:\.\d{2})?[kmb]?',
            r'[\d,]+\s*(?:million|billion|thousand)',
            r'value:?\s*£?[\d,]+',
            r'worth:?\s*£?[\d,]+'
        ]
        
        for pattern in value_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group()
        
        return None

    def _extract_date_from_text(self, text: str) -> Optional[datetime]:
        """Extract closing/deadline date from text"""
        date_patterns = [
            r'(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})',
            r'(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})',
            r'(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{4})'
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    if len(match.groups()) == 3:
                        if pattern == date_patterns[2]:  # Month name format
                            day, month_str, year = match.groups()
                            month_map = {
                                'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
                                'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
                            }
                            month = month_map.get(month_str.lower()[:3])
                            if month:
                                return datetime(int(year), month, int(day))
                        else:
                            # Try different date formats
                            parts = [int(x) for x in match.groups()]
                            if parts[2] > 31:  # Year is third
                                return datetime(parts[2], parts[1], parts[0])
                            elif parts[0] > 31:  # Year is first
                                return datetime(parts[0], parts[1], parts[2])
                except (ValueError, TypeError):
                    continue
        
        return None

    def _extract_department_from_text(self, text: str) -> str:
        """Extract MOD department from text"""
        text_lower = text.lower()
        
        dept_mapping = {
            'army': ['army', 'land', 'soldier', 'infantry'],
            'navy': ['navy', 'naval', 'maritime', 'submarine', 'ship'],
            'air force': ['air force', 'raf', 'aviation', 'aircraft'],
            'dstl': ['dstl', 'defence science'],
            'dasa': ['dasa', 'defence accelerator'],
            'defence digital': ['digital', 'cyber', 'it', 'information']
        }
        
        for dept, keywords in dept_mapping.items():
            if any(keyword in text_lower for keyword in keywords):
                return dept
        
        return 'Various'

    def _determine_contract_type(self, text: str) -> str:
        """Determine contract type from text"""
        text_lower = text.lower()
        
        if any(keyword in text_lower for keyword in ['research', 'r&d', 'development', 'innovation']):
            return 'Research & Development'
        elif any(keyword in text_lower for keyword in ['procurement', 'supply', 'purchase']):
            return 'Procurement Contract'
        elif any(keyword in text_lower for keyword in ['service', 'support', 'maintenance']):
            return 'Service Contract'
        elif any(keyword in text_lower for keyword in ['framework', 'agreement']):
            return 'Framework Agreement'
        elif any(keyword in text_lower for keyword in ['grant', 'funding', 'competition']):
            return 'Innovation Grant'
        else:
            return 'Government Contract'

    def _extract_title_from_text(self, text: str) -> str:
        """Extract a reasonable title from text"""
        lines = text.strip().split('\n')
        for line in lines:
            line = line.strip()
            if 10 <= len(line) <= 200:
                return line
        return text[:100] if text else "Untitled Opportunity"

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
