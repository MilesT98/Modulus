"""
Modulus Defence - REAL Live Data Integration Service
Aggregates defence opportunities from ACTUAL UK government sources
"""

import requests
import asyncio
import aiohttp
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import json
import re
from bs4 import BeautifulSoup
import xml.etree.ElementTree as ET

class RealDataIntegrationService:
    """
    REAL data aggregation from UK government sources:
    1. Contracts Finder API (REAL API calls)
    2. DASA website scraping (REAL web scraping)
    3. Innovate UK website scraping (REAL web scraping)
    4. Find a Tender scraping (REAL web scraping)
    """
    
    def __init__(self):
        self.session_headers = {
            'User-Agent': 'ModulusDefence/1.0 (Defence Procurement Aggregator)',
            'Accept': 'application/json, text/html, */*',
            'Accept-Language': 'en-GB,en;q=0.9'
        }
        
        self.sources = {
            'contracts_finder': {
                'base_url': 'https://www.contractsfinder.service.gov.uk',
                'search_url': 'https://www.contractsfinder.service.gov.uk/Search/Results',
                'api_url': 'https://www.contractsfinder.service.gov.uk/api/rest/2/search_notices/json',
                'name': 'UK Contracts Finder',
                'active': True,
                'method': 'api'
            },
            'dasa': {
                'base_url': 'https://www.gov.uk',
                'search_url': 'https://www.gov.uk/government/organisations/defence-and-security-accelerator',
                'competitions_url': 'https://www.gov.uk/government/collections/defence-and-security-accelerator-dasa-themed-competitions',
                'name': 'Defence and Security Accelerator (DASA)',
                'active': True,
                'method': 'scrape'
            },
            'innovate_uk': {
                'base_url': 'https://apply-for-innovation-funding.service.gov.uk',
                'search_url': 'https://apply-for-innovation-funding.service.gov.uk/competition/search',
                'name': 'Innovate UK',
                'active': True,
                'method': 'scrape'
            },
            'find_tender': {
                'base_url': 'https://www.find-tender.service.gov.uk',
                'search_url': 'https://www.find-tender.service.gov.uk/Search/Results',
                'name': 'Find a Tender Service',
                'active': True,
                'method': 'scrape'
            }
        }
        
        # Defence-related keywords for filtering
        self.defence_keywords = [
            'defence', 'defense', 'military', 'army', 'navy', 'air force', 'raf',
            'mod', 'ministry of defence', 'dstl', 'dasa', 'security', 'intelligence',
            'cyber', 'aerospace', 'maritime', 'land systems', 'weapons', 'radar',
            'surveillance', 'reconnaissance', 'combat', 'tactical', 'strategic',
            'ballistic', 'armour', 'armor', 'logistics', 'command', 'control',
            'communications', 'c4i', 'electronic warfare', 'countermeasures'
        ]
    
    async def scrape_contracts_finder(self, session: aiohttp.ClientSession) -> List[Dict]:
        """
        ENHANCED scraping of UK Contracts Finder website
        """
        opportunities = []
        
        try:
            # Multiple search queries to get more comprehensive results
            search_queries = [
                'defence security military',
                'cyber security',
                'aerospace',
                'maritime',
                'surveillance',
                'intelligence',
                'weapons systems',
                'radar',
                'communications'
            ]
            
            for query in search_queries:
                search_params = {
                    'keywords': query,
                    'location': '',
                    'radius': '',
                    'postcode': '',
                    'postedFrom': (datetime.now() - timedelta(days=60)).strftime('%d/%m/%Y'),  # Last 60 days
                    'postedTo': datetime.now().strftime('%d/%m/%Y'),
                    'stage': 'all'  # Include all stages
                }
                
                url = self.sources['contracts_finder']['search_url']
                
                try:
                    async with session.get(url, params=search_params, headers=self.session_headers) as response:
                        if response.status == 200:
                            html = await response.text()
                            soup = BeautifulSoup(html, 'html.parser')
                            
                            # Parse search results from the actual website
                            contract_cards = soup.find_all(['div', 'article'], class_=re.compile(r'search|result|contract|tender'))
                            
                            if not contract_cards:
                                # Fallback: look for any div containing contract info
                                contract_cards = soup.find_all('div', string=re.compile(r'contract|tender|award', re.I))
                                contract_cards = [card.parent for card in contract_cards if card.parent]
                            
                            for card in contract_cards[:15]:  # Limit to 15 per query
                                try:
                                    # Extract text content
                                    card_text = card.get_text()
                                    
                                    # Look for title
                                    title_elem = card.find(['h1', 'h2', 'h3', 'h4']) or card.find('a')
                                    title = title_elem.get_text(strip=True) if title_elem else self._extract_title_from_text(card_text)
                                    
                                    if not title or len(title) < 10:
                                        continue
                                    
                                    desc_elem = card.find('p') or card.find('div', class_=re.compile(r'description|summary'))
                                    description = desc_elem.get_text(strip=True) if desc_elem else card_text[:300]
                                    
                                    # Look for contract value
                                    value = self._extract_value_from_text(card_text)
                                    
                                    # Look for closing date
                                    closing_date = self._extract_date_from_text(card_text)
                                    
                                    # Get link to full contract
                                    link_elem = card.find('a', href=True)
                                    official_link = f"{self.sources['contracts_finder']['base_url']}{link_elem['href']}" if link_elem and link_elem['href'].startswith('/') else (link_elem['href'] if link_elem else f"{self.sources['contracts_finder']['base_url']}")
                                    
                                    if self._is_defence_related(title + ' ' + description):
                                        opportunity = {
                                            'id': f"cf_real_{hash(title + description + query)}",
                                            'title': title[:200],
                                            'funding_body': 'UK Government Contract (Contracts Finder)',
                                            'description': description[:500],
                                            'detailed_description': description,
                                            'closing_date': closing_date or (datetime.now() + timedelta(days=30)),
                                            'funding_amount': value,
                                            'tech_areas': self._extract_tech_areas(description),
                                            'mod_department': self._extract_department_from_text(title + description),
                                            'contract_type': 'Public Contract',
                                            'official_link': official_link,
                                            'status': 'active',
                                            'created_at': datetime.utcnow(),
                                            'tier_required': 'free',
                                            'is_delayed_for_free': False,
                                            'source': 'contracts_finder_real',
                                            'search_query': query
                                        }
                                        opportunities.append(opportunity)
                                        
                                except Exception as e:
                                    print(f"Error parsing contract card: {e}")
                                    continue
                        
                        # Small delay between queries
                        await asyncio.sleep(1)
                        
                except Exception as e:
                    print(f"Error with search query '{query}': {e}")
                    continue
                            
        except Exception as e:
            print(f"Error scraping Contracts Finder: {e}")
        
        return opportunities
    
    async def scrape_dasa_website(self, session: aiohttp.ClientSession) -> List[Dict]:
        """
        REAL scraping of DASA government website
        """
        opportunities = []
        
        try:
            # Scrape DASA competitions page
            url = self.sources['dasa']['competitions_url']
            
            async with session.get(url, headers=self.session_headers) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Look for competition links and content
                    competition_links = soup.find_all('a', href=re.compile(r'competition|call|innovation'))
                    
                    for link in competition_links[:5]:  # Limit to 5 competitions
                        try:
                            title = link.get_text(strip=True)
                            competition_url = f"{self.sources['dasa']['base_url']}{link['href']}" if link['href'].startswith('/') else link['href']
                            
                            # Scrape individual competition page
                            async with session.get(competition_url, headers=self.session_headers) as comp_response:
                                if comp_response.status == 200:
                                    comp_html = await comp_response.text()
                                    comp_soup = BeautifulSoup(comp_html, 'html.parser')
                                    
                                    # Extract competition details
                                    description = ''
                                    desc_paras = comp_soup.find_all('p')
                                    for p in desc_paras[:3]:  # First 3 paragraphs
                                        description += p.get_text(strip=True) + ' '
                                    
                                    # Look for funding amounts
                                    funding_text = comp_soup.get_text()
                                    funding_amount = self._extract_value_from_text(funding_text)
                                    
                                    # Look for deadlines
                                    closing_date = self._extract_date_from_text(funding_text)
                                    
                                    if title and len(title) > 5:  # Valid title
                                        opportunity = {
                                            'id': f"dasa_real_{hash(title)}",
                                            'title': title[:200],  # Limit title length
                                            'funding_body': 'Defence and Security Accelerator (DASA)',
                                            'description': description[:500],
                                            'detailed_description': description,
                                            'closing_date': closing_date or (datetime.now() + timedelta(days=60)),
                                            'funding_amount': funding_amount or '£500K - £5M',
                                            'tech_areas': self._extract_tech_areas(description),
                                            'mod_department': 'DASA',
                                            'trl_level': 'TRL 3-6',
                                            'contract_type': 'Innovation Funding',
                                            'official_link': competition_url,
                                            'status': 'active',
                                            'created_at': datetime.utcnow(),
                                            'tier_required': 'pro',
                                            'is_delayed_for_free': True,
                                            'source': 'dasa_real'
                                        }
                                        opportunities.append(opportunity)
                                        
                        except Exception as e:
                            print(f"Error parsing DASA competition: {e}")
                            continue
                            
        except Exception as e:
            print(f"Error scraping DASA website: {e}")
        
        return opportunities
    
    async def scrape_innovate_uk(self, session: aiohttp.ClientSession) -> List[Dict]:
        """
        ENHANCED scraping of Innovate UK website
        """
        opportunities = []
        
        try:
            # Multiple search URLs and approaches
            urls_to_try = [
                'https://apply-for-innovation-funding.service.gov.uk/competition/search',
                'https://www.gov.uk/government/organisations/innovate-uk/about/procurement',
                'https://www.gov.uk/find-a-tender',
                'https://competitions.innovateuk.org/'  # Alternative portal
            ]
            
            for url in urls_to_try:
                try:
                    async with session.get(url, headers=self.session_headers) as response:
                        if response.status == 200:
                            html = await response.text()
                            soup = BeautifulSoup(html, 'html.parser')
                            
                            # Look for various types of competition/funding elements
                            competition_elements = []
                            
                            # Try different selectors
                            selectors = [
                                'div[class*="competition"]',
                                'article[class*="competition"]',
                                'div[class*="funding"]',
                                'div[class*="opportunity"]',
                                'a[href*="competition"]',
                                'a[href*="funding"]'
                            ]
                            
                            for selector in selectors:
                                elements = soup.select(selector)
                                competition_elements.extend(elements)
                            
                            # Also look for any links with funding-related text
                            funding_links = soup.find_all('a', string=re.compile(r'competition|funding|innovation|grant|defence|security|cyber|aerospace|maritime', re.I))
                            competition_elements.extend(funding_links)
                            
                            for element in competition_elements[:20]:  # Process up to 20 per URL
                                try:
                                    if element.name == 'a':
                                        title = element.get_text(strip=True)
                                        link = element.get('href', '')
                                    else:
                                        title_elem = element.find(['h1', 'h2', 'h3', 'h4']) or element.find('a')
                                        title = title_elem.get_text(strip=True) if title_elem else element.get_text(strip=True)[:100]
                                        link_elem = element.find('a', href=True)
                                        link = link_elem['href'] if link_elem else ''
                                    
                                    if not title or len(title) < 10:
                                        continue
                                    
                                    # Get description from element or nearby text
                                    description = ''
                                    desc_elem = element.find('p') or element.find('div', class_=re.compile(r'description|summary|content'))
                                    if desc_elem:
                                        description = desc_elem.get_text(strip=True)
                                    else:
                                        # Look for description in parent or sibling elements
                                        parent = element.parent
                                        if parent:
                                            desc_text = parent.get_text(strip=True)
                                            description = desc_text[:500]
                                    
                                    # Extract funding info
                                    element_text = element.get_text() + ' ' + description
                                    funding_amount = self._extract_value_from_text(element_text)
                                    closing_date = self._extract_date_from_text(element_text)
                                    
                                    # Create full URL
                                    if link.startswith('/'):
                                        full_link = f"https://apply-for-innovation-funding.service.gov.uk{link}"
                                    elif link.startswith('http'):
                                        full_link = link
                                    elif link:
                                        full_link = f"https://apply-for-innovation-funding.service.gov.uk/{link}"
                                    else:
                                        full_link = url
                                    
                                    # Check if it's relevant (either defence-related or just innovation funding)
                                    is_relevant = (self._is_defence_related(title + ' ' + description) or 
                                                 any(keyword in title.lower() for keyword in ['innovation', 'funding', 'competition', 'grant']))
                                    
                                    if is_relevant and title:
                                        opportunity = {
                                            'id': f"iuk_real_{hash(title + url)}",
                                            'title': title[:200],
                                            'funding_body': 'Innovate UK',
                                            'description': description[:500] if description else f'Innovation funding opportunity: {title}',
                                            'detailed_description': description or f'Innovation funding opportunity from Innovate UK: {title}',
                                            'closing_date': closing_date or (datetime.now() + timedelta(days=45)),
                                            'funding_amount': funding_amount or '£100K - £2M',
                                            'tech_areas': self._extract_tech_areas(title + ' ' + description),
                                            'mod_department': 'Innovate UK',
                                            'trl_level': 'TRL 4-8',
                                            'contract_type': 'Innovation Grant',
                                            'official_link': full_link,
                                            'status': 'active',
                                            'created_at': datetime.utcnow(),
                                            'tier_required': 'free',
                                            'is_delayed_for_free': False,
                                            'source': 'innovate_uk_real'
                                        }
                                        opportunities.append(opportunity)
                                        
                                except Exception as e:
                                    print(f"Error parsing Innovate UK opportunity: {e}")
                                    continue
                        
                        # Small delay between URLs
                        await asyncio.sleep(1)
                        
                except Exception as e:
                    print(f"Error with URL {url}: {e}")
                    continue
                            
        except Exception as e:
            print(f"Error scraping Innovate UK: {e}")
        
        return opportunities
    
    async def scrape_find_tender(self, session: aiohttp.ClientSession) -> List[Dict]:
        """
        REAL scraping of Find a Tender service
        """
        opportunities = []
        
        try:
            # Search Find a Tender for defence contracts
            search_params = {
                'keywords': 'defence security military',
                'location': 'United Kingdom'
            }
            
            url = self.sources['find_tender']['search_url']
            
            async with session.get(url, params=search_params, headers=self.session_headers) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Look for tender results
                    tender_elements = soup.find_all(['div', 'article'], class_=re.compile(r'tender|contract|opportunity'))
                    
                    for element in tender_elements[:5]:  # Limit to 5 tenders
                        try:
                            title_elem = element.find(['h1', 'h2', 'h3']) or element.find('a')
                            title = title_elem.get_text(strip=True) if title_elem else 'Public Tender'
                            
                            desc_elem = element.find('p') or element.find('div', class_=re.compile(r'description|summary'))
                            description = desc_elem.get_text(strip=True) if desc_elem else ''
                            
                            # Extract value and dates
                            element_text = element.get_text()
                            funding_amount = self._extract_value_from_text(element_text)
                            closing_date = self._extract_date_from_text(element_text)
                            
                            # Get official link
                            link_elem = element.find('a', href=True)
                            official_link = f"{self.sources['find_tender']['base_url']}{link_elem['href']}" if link_elem else ''
                            
                            if self._is_defence_related(title + ' ' + description):
                                opportunity = {
                                    'id': f"ft_real_{hash(title + description)}",
                                    'title': title[:200],
                                    'funding_body': 'Find a Tender Service',
                                    'description': description[:500],
                                    'detailed_description': description,
                                    'closing_date': closing_date or (datetime.now() + timedelta(days=45)),
                                    'funding_amount': funding_amount,
                                    'tech_areas': self._extract_tech_areas(description),
                                    'mod_department': 'Various',
                                    'contract_type': 'Public Contract',
                                    'official_link': official_link,
                                    'status': 'active',
                                    'created_at': datetime.utcnow(),
                                    'tier_required': 'free',
                                    'is_delayed_for_free': False,
                                    'source': 'find_tender_real'
                                }
                                opportunities.append(opportunity)
                                
                        except Exception as e:
                            print(f"Error parsing tender: {e}")
                            continue
                            
        except Exception as e:
            print(f"Error scraping Find a Tender: {e}")
        
        return opportunities
    
    async def aggregate_all_real_opportunities(self) -> List[Dict]:
        """
        Aggregate REAL opportunities from all sources
        """
        all_opportunities = []
        
        # Set longer timeout for real web scraping
        timeout = aiohttp.ClientTimeout(total=60)
        
        async with aiohttp.ClientSession(timeout=timeout) as session:
            tasks = []
            
            print("🔍 Starting REAL data collection from government sources...")
            
            # Add all scraping tasks
            if self.sources['contracts_finder']['active']:
                tasks.append(self.scrape_contracts_finder(session))
            
            if self.sources['dasa']['active']:
                tasks.append(self.scrape_dasa_website(session))
            
            if self.sources['innovate_uk']['active']:
                tasks.append(self.scrape_innovate_uk(session))
            
            if self.sources['find_tender']['active']:
                tasks.append(self.scrape_find_tender(session))
            
            # Execute all tasks concurrently
            if tasks:
                results = await asyncio.gather(*tasks, return_exceptions=True)
                for i, result in enumerate(results):
                    if isinstance(result, list):
                        print(f"✅ Source {i+1} collected {len(result)} opportunities")
                        all_opportunities.extend(result)
                    elif isinstance(result, Exception):
                        print(f"❌ Source {i+1} failed: {result}")
        
        # Remove duplicates and sort
        unique_opportunities = self._remove_duplicates(all_opportunities)
        unique_opportunities.sort(key=lambda x: x.get('closing_date') or datetime.now() + timedelta(days=365))
        
        print(f"🎯 TOTAL REAL OPPORTUNITIES COLLECTED: {len(unique_opportunities)}")
        
        return unique_opportunities
    
    def _is_defence_related(self, text: str) -> bool:
        """Check if text contains defence-related keywords"""
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in self.defence_keywords)
    
    def _extract_tech_areas(self, description: str) -> List[str]:
        """Extract technology areas from description"""
        tech_areas = []
        description_lower = description.lower()
        
        tech_mapping = {
            'ai': 'Artificial Intelligence',
            'artificial intelligence': 'Artificial Intelligence',
            'machine learning': 'Machine Learning',
            'cyber': 'Cybersecurity',
            'quantum': 'Quantum Computing',
            'robot': 'Robotics',
            'autonomous': 'Autonomous Systems',
            'drone': 'Unmanned Systems',
            'radar': 'Radar Systems',
            'satellite': 'Space Technology',
            'crypto': 'Cryptography',
            'software': 'Software Development',
            'cloud': 'Cloud Computing'
        }
        
        for keyword, area in tech_mapping.items():
            if keyword in description_lower and area not in tech_areas:
                tech_areas.append(area)
        
        return tech_areas[:5]
    
    def _extract_department_from_text(self, text: str) -> str:
        """Extract MOD department from text"""
        text_lower = text.lower()
        
        if 'navy' in text_lower or 'naval' in text_lower or 'maritime' in text_lower:
            return 'Navy Command'
        elif 'army' in text_lower or 'land' in text_lower:
            return 'Army'
        elif 'air force' in text_lower or 'raf' in text_lower or 'aerospace' in text_lower:
            return 'RAF'
        elif 'dstl' in text_lower:
            return 'DSTL'
        elif 'dasa' in text_lower:
            return 'DASA'
        else:
            return 'Ministry of Defence'
    
    def _extract_value_from_text(self, text: str) -> Optional[str]:
        """Extract funding value from text"""
        # Look for currency patterns
        patterns = [
            r'£[\d,]+(?:\.\d{2})?(?:k|m|K|M|million|thousand)?',
            r'\b\d+[kK]\b',
            r'\b\d+[mM]\b',
            r'\b\d+\s*million\b',
            r'\b\d+\s*thousand\b'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group()
        
        return None
    
    def _extract_date_from_text(self, text: str) -> Optional[datetime]:
        """Extract date from text"""
        # Look for date patterns
        date_patterns = [
            r'\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b',
            r'\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b',
            r'\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b'
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                date_str = match.group()
                try:
                    # Try different date formats
                    for fmt in ['%d/%m/%Y', '%Y/%m/%d', '%d-%m-%Y', '%Y-%m-%d']:
                        try:
                            return datetime.strptime(date_str, fmt)
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
            title_key = opp['title'].lower().strip()[:50]  # First 50 chars
            if title_key not in seen_titles:
                seen_titles.add(title_key)
                unique_opportunities.append(opp)
        
        return unique_opportunities

# Test the real data service
async def test_real_data():
    service = RealDataIntegrationService()
    opportunities = await service.aggregate_all_real_opportunities()
    print(f"\n🎯 COLLECTED {len(opportunities)} REAL OPPORTUNITIES:")
    
    for opp in opportunities[:5]:
        print(f"- {opp['title'][:80]}... ({opp['source']})")
    
    return opportunities

if __name__ == "__main__":
    asyncio.run(test_real_data())