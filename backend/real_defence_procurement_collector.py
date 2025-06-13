"""
REAL DEFENCE PROCUREMENT COLLECTOR
Targets actual contracting opportunities from authoritative UK defence procurement sources.
Focuses on MOD, DE&S, Dstl, DIO, DASA, CCS, and Prime Contractors.
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

class RealDefenceProcurementCollector:
    def __init__(self):
        self.session_headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
        
        # ACTUAL PROCUREMENT INDICATORS
        self.procurement_indicators = [
            'invitation to tender', 'itt', 'request for proposal', 'rfp', 'request for quotation', 'rfq',
            'tender notice', 'contract notice', 'procurement notice', 'bidding opportunity',
            'framework agreement', 'dynamic purchasing system', 'prior information notice', 'pin',
            'call for competition', 'competitive dialogue', 'negotiated procedure',
            'supply contract', 'service contract', 'works contract', 'concession contract'
        ]
        
        # CONTRACT VALUE PATTERNS
        self.value_patterns = [
            r'contract value[:\s]*£[\d,\.]+(?:k|m|million|thousand)?',
            r'estimated value[:\s]*£[\d,\.]+(?:k|m|million|thousand)?',
            r'total value[:\s]*£[\d,\.]+(?:k|m|million|thousand)?',
            r'maximum value[:\s]*£[\d,\.]+(?:k|m|million|thousand)?',
            r'£[\d,\.]+(?:k|m|million|thousand)?\s*(?:contract|tender|value)',
            r'value:\s*£[\d,\.]+(?:k|m|million|thousand)?'
        ]
        
        # DEADLINE PATTERNS
        self.deadline_patterns = [
            r'deadline[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})',
            r'closing date[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})',
            r'submission deadline[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})',
            r'tender deadline[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})',
            r'by (\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})',
            r'(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s*deadline'
        ]

    async def collect_all_real_opportunities(self) -> List[Dict]:
        """
        Collect REAL procurement opportunities from authoritative sources
        """
        print("🎯 REAL DEFENCE PROCUREMENT COLLECTION STARTING...")
        print("📋 Sources: MOD, DE&S, Dstl, DIO, DASA, CCS, Prime Contractors")
        print("🔍 Target: Actual tender notices, RFPs, framework agreements")
        print("=" * 70)
        
        all_opportunities = []
        
        # Phase 1: UK Government Procurement Portals
        print("\n🏛️ PHASE 1: UK Government Procurement Portals...")
        gov_opportunities = await self._collect_government_portals()
        all_opportunities.extend(gov_opportunities)
        
        # Phase 2: MOD & Defence Agency Specific Portals
        print("\n🛡️ PHASE 2: MOD & Defence Agency Portals...")
        mod_opportunities = await self._collect_mod_agencies()
        all_opportunities.extend(mod_opportunities)
        
        # Phase 3: Prime Contractor Opportunities
        print("\n🏭 PHASE 3: Prime Contractor Opportunities...")
        prime_opportunities = await self._collect_prime_contractors()
        all_opportunities.extend(prime_opportunities)
        
        # Phase 4: International Opportunities (NATO/EU)
        print("\n🌍 PHASE 4: International Opportunities...")
        intl_opportunities = await self._collect_international_opportunities()
        all_opportunities.extend(intl_opportunities)
        
        # Remove duplicates and validate
        unique_opportunities = self._validate_and_deduplicate(all_opportunities)
        
        print(f"\n🎯 REAL PROCUREMENT COLLECTION COMPLETE:")
        print(f"   📊 Raw opportunities: {len(all_opportunities)}")
        print(f"   📊 Validated opportunities: {len(unique_opportunities)}")
        
        return unique_opportunities

    async def _collect_government_portals(self) -> List[Dict]:
        """Collect from UK Government Procurement Portals"""
        opportunities = []
        
        # Key UK Government Procurement Sources
        gov_portals = [
            {
                'name': 'Find a Tender Service',
                'base_url': 'https://www.find-tender.service.gov.uk',
                'search_url': 'https://www.find-tender.service.gov.uk/Search',
                'search_params': ['defence', 'military', 'security', 'MOD']
            },
            {
                'name': 'Contracts Finder',
                'base_url': 'https://www.contractsfinder.service.gov.uk',
                'search_url': 'https://www.contractsfinder.service.gov.uk/Search',
                'search_params': ['ministry+of+defence', 'MOD', 'defence+equipment', 'military+contract']
            },
            {
                'name': 'Crown Commercial Service',
                'base_url': 'https://www.crowncommercial.gov.uk',
                'search_url': 'https://www.crowncommercial.gov.uk/agreements/search',
                'search_params': ['defence', 'security', 'technology']
            }
        ]
        
        connector = aiohttp.TCPConnector(limit=10)
        timeout = aiohttp.ClientTimeout(total=45)
        
        async with aiohttp.ClientSession(
            connector=connector, timeout=timeout, headers=self.session_headers
        ) as session:
            
            for portal in gov_portals:
                print(f"🔍 Searching {portal['name']}...")
                portal_opps = await self._search_portal(session, portal)
                opportunities.extend(portal_opps)
                await asyncio.sleep(2)  # Rate limiting
        
        print(f"✅ Government Portals: {len(opportunities)} opportunities")
        return opportunities

    async def _collect_mod_agencies(self) -> List[Dict]:
        """Collect from MOD and Defence Agency specific sources"""
        opportunities = []
        
        # MOD and Defence Agency Sources
        mod_sources = [
            {
                'name': 'Defence Equipment & Support (DE&S)',
                'urls': [
                    'https://www.gov.uk/government/organisations/defence-equipment-and-support',
                    'https://www.des.mod.uk/what-we-do/procurement'
                ]
            },
            {
                'name': 'Defence Science and Technology Laboratory (Dstl)',
                'urls': [
                    'https://www.gov.uk/government/organisations/defence-science-and-technology-laboratory',
                    'https://www.dstl.gov.uk/what-we-do/partnering-and-collaboration'
                ]
            },
            {
                'name': 'Defence Infrastructure Organisation (DIO)',
                'urls': [
                    'https://www.gov.uk/government/organisations/defence-infrastructure-organisation',
                    'https://www.dio.mod.uk/contracts-and-tenders'
                ]
            },
            {
                'name': 'Defence and Security Accelerator (DASA)',
                'urls': [
                    'https://www.gov.uk/government/organisations/defence-and-security-accelerator',
                    'https://www.gov.uk/government/collections/defence-and-security-accelerator-submit-a-research-proposal'
                ]
            }
        ]
        
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                )
                
                for source in mod_sources:
                    print(f"🛡️ Collecting from {source['name']}...")
                    source_opps = await self._collect_mod_source(context, source)
                    opportunities.extend(source_opps)
                    await asyncio.sleep(3)  # Rate limiting
                
                await browser.close()
                
        except Exception as e:
            print(f"❌ MOD agencies collection error: {e}")
        
        print(f"✅ MOD Agencies: {len(opportunities)} opportunities")
        return opportunities

    async def _collect_prime_contractors(self) -> List[Dict]:
        """Collect subcontracting opportunities from Prime Contractors"""
        opportunities = []
        
        # Major UK Defence Prime Contractors
        primes = {
            'BAE Systems': [
                'https://www.baesystems.com/en/our-company/supplier-information',
                'https://supplier.baesystems.com/opportunities'
            ],
            'Babcock International': [
                'https://www.babcockinternational.com/suppliers/',
                'https://www.babcockinternational.com/suppliers/current-opportunities/'
            ],
            'QinetiQ': [
                'https://www.qinetiq.com/what-we-do/partnering-with-qinetiq',
                'https://www.qinetiq.com/suppliers'
            ],
            'Rolls-Royce': [
                'https://www.rolls-royce.com/suppliers.aspx',
                'https://www.rolls-royce.com/suppliers/how-to-become-a-supplier.aspx'
            ],
            'Thales UK': [
                'https://www.thalesgroup.com/en/united-kingdom/suppliers',
                'https://www.thalesgroup.com/en/group/suppliers'
            ],
            'Lockheed Martin UK': [
                'https://www.lockheedmartin.com/en-us/suppliers.html',
                'https://www.lockheedmartin.co.uk/suppliers'
            ],
            'Leonardo UK': [
                'https://uk.leonardocompany.com/en/suppliers',
                'https://www.leonardocompany.com/en/suppliers'
            ],
            'MBDA': [
                'https://www.mbda-systems.com/suppliers/',
                'https://www.mbda.co.uk/suppliers'
            ]
        }
        
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                )
                
                for prime_name, urls in primes.items():
                    print(f"🏭 Collecting from {prime_name}...")
                    prime_opps = await self._collect_prime_opportunities(context, prime_name, urls)
                    opportunities.extend(prime_opps)
                    await asyncio.sleep(5)  # Longer delay for prime contractors
                
                await browser.close()
                
        except Exception as e:
            print(f"❌ Prime contractors collection error: {e}")
        
        print(f"✅ Prime Contractors: {len(opportunities)} opportunities")
        return opportunities

    async def _collect_international_opportunities(self) -> List[Dict]:
        """Collect NATO and EU opportunities accessible to UK firms"""
        opportunities = []
        
        # International Defence Procurement Sources
        intl_sources = [
            {
                'name': 'NATO Support and Procurement Agency (NSPA)',
                'urls': [
                    'https://www.nspa.nato.int/en/business/procurement',
                    'https://www.nspa.nato.int/en/business/tender-opportunities'
                ]
            },
            {
                'name': 'European Defence Agency (EDA)',
                'urls': [
                    'https://eda.europa.eu/what-we-do/capabilities/research-technology',
                    'https://eda.europa.eu/what-we-do/capabilities/armaments-cooperation'
                ]
            },
            {
                'name': 'TED (Tenders Electronic Daily)',
                'urls': [
                    'https://ted.europa.eu/TED/browse/browseByMap.do',
                    'https://ted.europa.eu/TED/search/search.do'
                ]
            }
        ]
        
        # Note: International collection is complex due to different portals and access requirements
        # For MVP, we'll focus on publicly accessible opportunities
        
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                )
                
                for source in intl_sources[:1]:  # Limit to 1 source for MVP
                    print(f"🌍 Collecting from {source['name']}...")
                    intl_opps = await self._collect_international_source(context, source)
                    opportunities.extend(intl_opps)
                    await asyncio.sleep(5)
                
                await browser.close()
                
        except Exception as e:
            print(f"❌ International collection error: {e}")
        
        print(f"✅ International: {len(opportunities)} opportunities")
        return opportunities

    async def _search_portal(self, session: aiohttp.ClientSession, portal: Dict) -> List[Dict]:
        """Search a government procurement portal"""
        opportunities = []
        
        for search_term in portal['search_params'][:3]:  # Limit searches
            try:
                # Construct search URL
                if 'find-tender' in portal['search_url']:
                    search_url = f"{portal['search_url']}?keywords={search_term}"
                else:
                    search_url = f"{portal['search_url']}?searchTerm={search_term.replace('+', '%20')}"
                
                async with session.get(search_url) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'html.parser')
                        
                        # Look for tender/contract elements
                        tender_selectors = [
                            'div[class*="search-result"]',
                            'div[class*="tender"]',
                            'div[class*="notice"]',
                            'div[class*="opportunity"]',
                            'article[class*="contract"]',
                            '.search-result',
                            '.tender-item',
                            '.notice-item'
                        ]
                        
                        tender_elements = []
                        for selector in tender_selectors:
                            elements = soup.select(selector)
                            tender_elements.extend(elements)
                        
                        for element in tender_elements[:15]:  # Limit results per search
                            try:
                                # Extract title
                                title_elem = element.find(['h1', 'h2', 'h3', 'h4']) or element.find('a')
                                title = title_elem.get_text(strip=True) if title_elem else ''
                                
                                if len(title) < 15:  # Skip very short titles
                                    continue
                                
                                # Extract description
                                desc_elem = element.find('p') or element.find('div', class_=re.compile(r'description|summary'))
                                description = desc_elem.get_text(strip=True) if desc_elem else title
                                
                                # Extract link
                                link_elem = element.find('a', href=True)
                                if link_elem and link_elem['href']:
                                    if link_elem['href'].startswith('http'):
                                        official_link = link_elem['href']
                                    else:
                                        official_link = f"{portal['base_url']}{link_elem['href']}"
                                else:
                                    official_link = search_url
                                
                                # Validate this is a real procurement opportunity
                                if self._is_real_procurement_opportunity(title, description):
                                    
                                    # Extract value if present
                                    value = self._extract_contract_value(description + ' ' + title)
                                    
                                    # Extract deadline if present
                                    deadline = self._extract_deadline(description + ' ' + title)
                                    
                                    opportunity = {
                                        'id': f"{portal['name'].lower().replace(' ', '_')}_{hash(title)}",
                                        'title': title[:200],
                                        'funding_body': self._determine_funding_body(title, description, portal['name']),
                                        'description': description[:500],
                                        'detailed_description': description,
                                        'closing_date': deadline or (datetime.now() + timedelta(days=45)),
                                        'funding_amount': value or 'TBD',
                                        'tech_areas': self._extract_tech_areas(title + ' ' + description),
                                        'contract_type': self._determine_contract_type(title, description),
                                        'official_link': official_link,
                                        'status': 'active',
                                        'created_at': datetime.utcnow(),
                                        'tier_required': 'free',
                                        'source': f"{portal['name'].lower().replace(' ', '_')}_portal",
                                        'procurement_type': self._identify_procurement_type(title, description)
                                    }
                                    
                                    opportunities.append(opportunity)
                                    
                            except Exception as e:
                                continue
                
                await asyncio.sleep(2)  # Rate limiting
                
            except Exception as e:
                print(f"Error searching {portal['name']} for '{search_term}': {e}")
                continue
        
        return opportunities

    async def _collect_mod_source(self, context, source: Dict) -> List[Dict]:
        """Collect opportunities from a MOD/Defence agency source"""
        opportunities = []
        
        for url in source['urls']:
            try:
                page = await context.new_page()
                await page.goto(url, wait_until='networkidle', timeout=30000)
                
                # Look for procurement-specific elements
                procurement_selectors = [
                    'a[href*="tender"]',
                    'a[href*="procurement"]',
                    'a[href*="opportunity"]',
                    'a[href*="contract"]',
                    'div[class*="tender"]',
                    'div[class*="procurement"]',
                    'div[class*="opportunity"]',
                    '.tender-link',
                    '.procurement-link',
                    '.opportunity-link'
                ]
                
                procurement_elements = []
                for selector in procurement_selectors:
                    try:
                        elements = await page.query_selector_all(selector)
                        procurement_elements.extend(elements)
                    except:
                        continue
                
                for element in procurement_elements[:20]:
                    try:
                        title = await element.text_content()
                        
                        if not title or len(title.strip()) < 15:
                            continue
                        
                        # Get link
                        link = await element.get_attribute('href') if element.tag_name == 'a' else ''
                        if not link:
                            link_element = await element.query_selector('a')
                            link = await link_element.get_attribute('href') if link_element else ''
                        
                        # Validate as real procurement
                        if self._is_real_procurement_opportunity(title, ''):
                            
                            opportunity = {
                                'id': f"{source['name'].lower().replace(' ', '_')}_{hash(title + url)}",
                                'title': title.strip()[:200],
                                'funding_body': source['name'],
                                'description': f'{source["name"]} procurement opportunity: {title.strip()}',
                                'detailed_description': f'{source["name"]} procurement opportunity: {title.strip()}',
                                'closing_date': datetime.now() + timedelta(days=30),
                                'funding_amount': 'TBD',
                                'tech_areas': self._extract_tech_areas(title),
                                'contract_type': 'Defence Contract',
                                'official_link': link if link.startswith('http') else f"{url.rstrip('/')}/{link.lstrip('/')}" if link else url,
                                'status': 'active',
                                'created_at': datetime.utcnow(),
                                'tier_required': 'free',
                                'source': f"{source['name'].lower().replace(' ', '_').replace('(', '').replace(')', '')}",
                                'procurement_type': self._identify_procurement_type(title, '')
                            }
                            
                            opportunities.append(opportunity)
                            
                    except Exception as e:
                        continue
                
                await page.close()
                
            except Exception as e:
                print(f"Error collecting from {url}: {e}")
                continue
        
        return opportunities

    async def _collect_prime_opportunities(self, context, prime_name: str, urls: List[str]) -> List[Dict]:
        """Collect subcontracting opportunities from prime contractor"""
        opportunities = []
        
        for url in urls:
            try:
                page = await context.new_page()
                await page.goto(url, wait_until='networkidle', timeout=30000)
                
                # Look for supplier opportunity elements
                supplier_selectors = [
                    'a[href*="opportunity"]',
                    'a[href*="tender"]',
                    'a[href*="supplier"]',
                    'a[href*="subcontract"]',
                    'div[class*="opportunity"]',
                    'div[class*="supplier"]',
                    '.supplier-opportunity',
                    '.subcontract-opportunity'
                ]
                
                supplier_elements = []
                for selector in supplier_selectors:
                    try:
                        elements = await page.query_selector_all(selector)
                        supplier_elements.extend(elements)
                    except:
                        continue
                
                for element in supplier_elements[:15]:
                    try:
                        title = await element.text_content()
                        
                        if not title or len(title.strip()) < 15:
                            continue
                        
                        # Get link
                        link = await element.get_attribute('href') if element.tag_name == 'a' else ''
                        if not link:
                            link_element = await element.query_selector('a')
                            link = await link_element.get_attribute('href') if link_element else ''
                        
                        # Prime contractor opportunities are inherently defence-related
                        opportunity = {
                            'id': f"{prime_name.lower().replace(' ', '_')}_{hash(title + url)}",
                            'title': title.strip()[:200],
                            'funding_body': f'{prime_name} (Prime Contractor)',
                            'description': f'Subcontracting opportunity with {prime_name}: {title.strip()}',
                            'detailed_description': f'Prime contractor subcontracting opportunity from {prime_name}: {title.strip()}',
                            'closing_date': datetime.now() + timedelta(days=60),
                            'funding_amount': 'Subcontract Value TBD',
                            'tech_areas': self._extract_tech_areas(title),
                            'contract_type': 'Subcontract Opportunity',
                            'official_link': link if link.startswith('http') else f"{url.split('/')[0]}//{url.split('/')[2]}{link}" if link else url,
                            'status': 'active',
                            'created_at': datetime.utcnow(),
                            'tier_required': 'pro',  # Prime opportunities for Pro tier
                            'source': f'prime_{prime_name.lower().replace(" ", "_").replace("-", "_")}',
                            'procurement_type': 'Subcontract'
                        }
                        
                        opportunities.append(opportunity)
                        
                    except Exception as e:
                        continue
                
                await page.close()
                
            except Exception as e:
                print(f"Error collecting from {prime_name} at {url}: {e}")
                continue
        
        return opportunities

    async def _collect_international_source(self, context, source: Dict) -> List[Dict]:
        """Collect from international defence procurement source"""
        opportunities = []
        
        for url in source['urls'][:1]:  # Limit for MVP
            try:
                page = await context.new_page()
                await page.goto(url, wait_until='networkidle', timeout=30000)
                
                # Look for international tender elements
                intl_selectors = [
                    'a[href*="tender"]',
                    'a[href*="procurement"]',
                    'a[href*="rfp"]',
                    'div[class*="tender"]',
                    'div[class*="opportunity"]'
                ]
                
                intl_elements = []
                for selector in intl_selectors:
                    try:
                        elements = await page.query_selector_all(selector)
                        intl_elements.extend(elements)
                    except:
                        continue
                
                for element in intl_elements[:10]:  # Limit international results
                    try:
                        title = await element.text_content()
                        
                        if not title or len(title.strip()) < 15:
                            continue
                        
                        # Get link
                        link = await element.get_attribute('href') if element.tag_name == 'a' else ''
                        
                        opportunity = {
                            'id': f"intl_{source['name'].lower().replace(' ', '_')}_{hash(title + url)}",
                            'title': title.strip()[:200],
                            'funding_body': source['name'],
                            'description': f'International defence opportunity: {title.strip()}',
                            'detailed_description': f'International defence procurement from {source["name"]}: {title.strip()}',
                            'closing_date': datetime.now() + timedelta(days=90),
                            'funding_amount': 'International Contract',
                            'tech_areas': self._extract_tech_areas(title),
                            'contract_type': 'International Defence Contract',
                            'official_link': link if link.startswith('http') else f"{url.rstrip('/')}/{link.lstrip('/')}" if link else url,
                            'status': 'active',
                            'created_at': datetime.utcnow(),
                            'tier_required': 'pro',  # International opportunities for Pro tier
                            'source': f"intl_{source['name'].lower().replace(' ', '_').replace('(', '').replace(')', '')}",
                            'procurement_type': 'International'
                        }
                        
                        opportunities.append(opportunity)
                        
                    except Exception as e:
                        continue
                
                await page.close()
                
            except Exception as e:
                print(f"Error collecting international from {url}: {e}")
                continue
        
        return opportunities

    def _is_real_procurement_opportunity(self, title: str, description: str) -> bool:
        """
        Validate this is a REAL procurement opportunity, not informational content
        """
        text = f"{title} {description}".lower()
        
        # IMMEDIATE REJECTION for informational/navigation content
        rejection_patterns = [
            'about us', 'contact us', 'our services', 'what we do', 'who we are',
            'home page', 'navigation', 'site map', 'privacy policy', 'terms and conditions',
            'news', 'press release', 'announcement', 'blog', 'article',
            'guidance', 'how to', 'information', 'overview', 'introduction',
            'organisation', 'department', 'unit', 'team', 'staff', 'people',
            'procurement reforms', 'policy', 'strategy', 'framework overview',
            'general', 'generic', 'standard', 'template', 'example'
        ]
        
        for pattern in rejection_patterns:
            if pattern in text:
                return False
        
        # MUST have procurement indicators
        has_procurement_indicator = any(indicator in text for indicator in self.procurement_indicators)
        
        # Look for specific contracting elements
        contracting_elements = [
            'supply of', 'provision of', 'delivery of', 'maintenance of',
            'development of', 'installation of', 'design and build',
            'support services', 'consultancy services', 'professional services',
            'equipment supply', 'software development', 'system integration',
            'training services', 'research and development'
        ]
        
        has_contracting_elements = any(element in text for element in contracting_elements)
        
        # Look for value or deadline indicators
        has_value = any(re.search(pattern, text) for pattern in self.value_patterns)
        has_deadline = any(re.search(pattern, text) for pattern in self.deadline_patterns)
        
        # Score the opportunity
        score = 0
        if has_procurement_indicator:
            score += 15
        if has_contracting_elements:
            score += 10
        if has_value:
            score += 10
        if has_deadline:
            score += 10
        
        # Additional scoring for specific terms
        specific_terms = ['rfp', 'itt', 'tender notice', 'contract notice', 'framework agreement']
        for term in specific_terms:
            if term in text:
                score += 5
        
        is_real_opportunity = score >= 15
        
        if is_real_opportunity:
            print(f"✅ REAL OPPORTUNITY: {title[:60]}... (Score: {score})")
        else:
            print(f"❌ NOT REAL OPPORTUNITY: {title[:60]}... (Score: {score})")
        
        return is_real_opportunity

    def _extract_contract_value(self, text: str) -> Optional[str]:
        """Extract contract value from text"""
        for pattern in self.value_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(0)
        return None

    def _extract_deadline(self, text: str) -> Optional[datetime]:
        """Extract deadline from text"""
        for pattern in self.deadline_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    date_str = match.group(1) if match.groups() else match.group(0)
                    # Try to parse the date
                    for fmt in ['%d/%m/%Y', '%d-%m-%Y', '%d.%m.%Y', '%d/%m/%y']:
                        try:
                            return datetime.strptime(date_str, fmt)
                        except ValueError:
                            continue
                except:
                    continue
        return None

    def _determine_funding_body(self, title: str, description: str, source: str) -> str:
        """Determine the funding body from context"""
        text = f"{title} {description} {source}".lower()
        
        body_mapping = {
            'ministry of defence': ['mod', 'ministry of defence'],
            'defence equipment & support': ['de&s', 'des', 'defence equipment'],
            'defence science and technology laboratory': ['dstl', 'defence science'],
            'defence infrastructure organisation': ['dio', 'defence infrastructure'],
            'defence and security accelerator': ['dasa', 'defence and security accelerator'],
            'crown commercial service': ['ccs', 'crown commercial'],
            'nato': ['nato', 'north atlantic'],
            'european defence agency': ['eda', 'european defence']
        }
        
        for body, keywords in body_mapping.items():
            if any(keyword in text for keyword in keywords):
                return body.title()
        
        return source

    def _determine_contract_type(self, title: str, description: str) -> str:
        """Determine contract type from content"""
        text = f"{title} {description}".lower()
        
        type_mapping = {
            'Supply Contract': ['supply of', 'equipment supply', 'goods'],
            'Service Contract': ['services', 'support services', 'maintenance'],
            'R&D Contract': ['research', 'development', 'innovation'],
            'Framework Agreement': ['framework', 'dps', 'dynamic purchasing'],
            'Works Contract': ['construction', 'building', 'infrastructure'],
            'Consultancy': ['consultancy', 'advisory', 'professional services']
        }
        
        for contract_type, keywords in type_mapping.items():
            if any(keyword in text for keyword in keywords):
                return contract_type
        
        return 'Defence Contract'

    def _identify_procurement_type(self, title: str, description: str) -> str:
        """Identify the type of procurement procedure"""
        text = f"{title} {description}".lower()
        
        if any(term in text for term in ['rfp', 'request for proposal']):
            return 'Request for Proposal (RFP)'
        elif any(term in text for term in ['itt', 'invitation to tender']):
            return 'Invitation to Tender (ITT)'
        elif any(term in text for term in ['rfq', 'request for quotation']):
            return 'Request for Quotation (RFQ)'
        elif any(term in text for term in ['framework', 'dps']):
            return 'Framework Agreement'
        elif any(term in text for term in ['prior information', 'pin']):
            return 'Prior Information Notice (PIN)'
        else:
            return 'Procurement Notice'

    def _extract_tech_areas(self, text: str) -> List[str]:
        """Extract technology areas from text"""
        tech_areas = []
        text_lower = text.lower()
        
        tech_mapping = {
            'Artificial Intelligence & Machine Learning': ['ai', 'artificial intelligence', 'machine learning', 'neural networks'],
            'Cybersecurity': ['cyber', 'cybersecurity', 'cyber security', 'information security'],
            'Quantum Technologies': ['quantum', 'quantum computing', 'quantum communication'],
            'Robotics & Autonomous Systems': ['robotics', 'autonomous', 'unmanned', 'robot', 'drone'],
            'Aerospace & Aviation': ['aerospace', 'aviation', 'aircraft', 'flight'],
            'Maritime Defence': ['maritime', 'naval', 'submarine', 'ship', 'vessel'],
            'Sensors & Signal Processing': ['sensors', 'radar', 'surveillance', 'detection'],
            'Communications & Networking': ['communications', 'radio', 'satellite', 'network'],
            'Advanced Materials': ['materials', 'armour', 'protection', 'composite'],
            'Space Technologies': ['space', 'satellite', 'orbital', 'launch'],
            'C4ISR': ['command', 'control', 'intelligence', 'surveillance', 'reconnaissance'],
            'Electronic Warfare': ['electronic warfare', 'ew', 'jamming', 'countermeasures'],
            'Software & IT Systems': ['software', 'information technology', 'computing', 'digital']
        }
        
        for tech_area, keywords in tech_mapping.items():
            if any(keyword in text_lower for keyword in keywords):
                tech_areas.append(tech_area)
        
        return tech_areas if tech_areas else ['Defence Technology']

    def _validate_and_deduplicate(self, opportunities: List[Dict]) -> List[Dict]:
        """Remove duplicates and validate opportunities"""
        valid_opportunities = []
        seen_titles = set()
        
        for opp in opportunities:
            # Additional validation
            if len(opp['title']) < 15:  # Skip very short titles
                continue
            
            # Check for duplicates
            title_normalized = re.sub(r'[^\w\s]', '', opp['title'].lower()).strip()
            title_words = set(title_normalized.split())
            
            is_duplicate = False
            for seen_title in seen_titles:
                seen_words = set(seen_title.split())
                
                # Check for high similarity (>70% word overlap)
                if len(title_words & seen_words) / max(len(title_words), len(seen_words), 1) > 0.7:
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                seen_titles.add(title_normalized)
                valid_opportunities.append(opp)
        
        return valid_opportunities
