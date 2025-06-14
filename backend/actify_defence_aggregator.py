"""
ACTIFY DEFENCE: COMPREHENSIVE PROCUREMENT AGGREGATION SYSTEM
Full implementation of multi-source defence procurement intelligence platform
Following the technical brief for sophisticated filtering, classification, and de-duplication
"""

import asyncio
import aiohttp
import re
import json
import hashlib
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Set, Tuple
from dataclasses import dataclass, asdict
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
import difflib
from urllib.parse import urljoin, urlparse
import logging
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SourceType(Enum):
    UK_OFFICIAL = "uk_official"
    EU_NATO = "eu_nato"
    GLOBAL_ALLIES = "global_allies"
    PRIME_CONTRACTORS = "prime_contractors"
    INDUSTRY_NEWS = "industry_news"

class TechnologyArea(Enum):
    AI_ML = "Artificial Intelligence & Machine Learning"
    CYBERSECURITY = "Cybersecurity"
    UAV_UAS = "UAV/UAS & Autonomous Systems"
    C4ISR = "C4ISR & Communications"
    SENSORS = "Sensors & Signal Processing"
    SPACE = "Space Technologies"
    MARITIME = "Maritime Defence"
    ELECTRONIC_WARFARE = "Electronic Warfare"
    MATERIALS = "Advanced Materials"
    ENERGY = "Energy & Power Systems"
    DUAL_USE = "Dual-Use Technologies"

@dataclass
class OpportunityData:
    """Unified schema for all procurement opportunities"""
    title: str
    summary: str
    contracting_body: str
    source: str
    source_type: SourceType
    deadline: datetime
    url: str
    value_estimate: Optional[float] = None
    sme_score: float = 0.0
    tech_tags: List[str] = None
    trl: Optional[int] = None
    country: str = "UK"
    is_duplicate: bool = False
    date_scraped: datetime = None
    raw_tags: List[str] = None
    location: str = "UK"
    sme_fit: bool = False
    content_hash: str = ""
    
    def __post_init__(self):
        if self.tech_tags is None:
            self.tech_tags = []
        if self.raw_tags is None:
            self.raw_tags = []
        if self.date_scraped is None:
            self.date_scraped = datetime.utcnow()
        
        # Generate content hash for deduplication
        content_string = f"{self.title}{self.deadline.strftime('%Y-%m-%d')}{self.contracting_body}"
        self.content_hash = hashlib.md5(content_string.encode()).hexdigest()

class FilteringEngine:
    """Advanced filtering logic for defence procurement opportunities"""
    
    # Whitelist filters - opportunities containing these are more likely to be relevant
    WHITELIST_KEYWORDS = {
        'defence', 'military', 'innovation', 'cyber', 'cybersecurity', 'uav', 'uas', 'drone',
        'c4isr', 'ai', 'artificial intelligence', 'machine learning', 'autonomy', 'autonomous',
        'underwater', 'space', 'satellite', 'sensor fusion', 'sensors', 'radar', 'lidar',
        'non-lethal', 'dual-use', 'isr', 'surveillance', 'reconnaissance', 'electronic warfare',
        'quantum', 'robotics', 'communications', 'command and control', 'simulation',
        'training systems', 'virtual reality', 'augmented reality', 'blockchain',
        'encryption', 'secure communications', 'network security', 'threat detection',
        'maritime defence', 'naval', 'aerospace', 'aviation', 'flight systems',
        'countermeasures', 'protection systems', 'armor', 'materials science',
        'energy storage', 'power systems', 'propulsion', 'stealth', 'camouflage'
    }
    
    WHITELIST_AGENCIES = {
        'mod', 'ministry of defence', 'dstl', 'defence science and technology laboratory',
        'dasa', 'defence and security accelerator', 'nato', 'nspa', 'edf', 'european defence fund',
        'des', 'defence equipment and support', 'dio', 'defence infrastructure organisation'
    }
    
    WHITELIST_CATEGORIES = {
        'r&d', 'research and development', 'trials', 'prototype', 'prototyping', 'sbri',
        'small business research initiative', 'sme only', 'innovation', 'trl', 'technology readiness'
    }
    
    # Blacklist filters - opportunities containing these are likely irrelevant
    BLACKLIST_KEYWORDS = {
        'catering', 'hr', 'human resources', 'janitorial', 'cleaning', 'office supplies',
        'stationery', 'vehicle hire', 'car rental', 'grounds maintenance', 'landscaping',
        'gardening', 'print', 'printing', 'translation', 'interpretation', 'language services',
        'furniture', 'office equipment', 'photocopying', 'waste management', 'recycling',
        'pest control', 'security guards', 'reception', 'administrative', 'typing',
        'data entry', 'filing', 'archive', 'storage', 'warehousing', 'logistics',
        'transport', 'delivery', 'courier', 'postal', 'accommodation', 'hotel',
        'conference', 'event management', 'travel', 'insurance', 'legal services',
        'audit', 'accounting', 'payroll', 'recruitment', 'training courses',
        'health and safety', 'fire safety', 'first aid', 'medical services'
    }
    
    # Technology classification keywords
    TECH_CLASSIFICATION = {
        TechnologyArea.AI_ML: {
            'ai', 'artificial intelligence', 'machine learning', 'neural networks', 'deep learning',
            'computer vision', 'natural language processing', 'nlp', 'predictive analytics',
            'pattern recognition', 'automated decision', 'intelligent systems'
        },
        TechnologyArea.CYBERSECURITY: {
            'cyber', 'cybersecurity', 'cyber security', 'information security', 'network security',
            'encryption', 'cryptography', 'secure communications', 'threat detection',
            'malware', 'intrusion detection', 'firewall', 'vulnerability', 'penetration testing'
        },
        TechnologyArea.UAV_UAS: {
            'uav', 'uas', 'drone', 'unmanned', 'autonomous vehicle', 'autonomous system',
            'remotely piloted', 'robotics', 'autonomous navigation', 'swarm', 'multi-agent'
        },
        TechnologyArea.C4ISR: {
            'c4isr', 'command', 'control', 'communications', 'computers', 'intelligence',
            'surveillance', 'reconnaissance', 'isr', 'situational awareness', 'command and control'
        },
        TechnologyArea.SENSORS: {
            'sensor', 'radar', 'lidar', 'sonar', 'detection', 'tracking', 'monitoring',
            'imaging', 'optical', 'infrared', 'thermal', 'acoustic', 'seismic', 'magnetic'
        },
        TechnologyArea.SPACE: {
            'space', 'satellite', 'orbital', 'launch', 'spacecraft', 'space-based',
            'earth observation', 'navigation', 'gps', 'gnss', 'space situational awareness'
        },
        TechnologyArea.MARITIME: {
            'maritime', 'naval', 'marine', 'underwater', 'submarine', 'sonar', 'oceanographic',
            'port security', 'coastal', 'ship', 'vessel', 'aquatic', 'subsea'
        },
        TechnologyArea.ELECTRONIC_WARFARE: {
            'electronic warfare', 'ew', 'jamming', 'countermeasures', 'signal intelligence',
            'sigint', 'communications intelligence', 'electronic attack', 'electronic protection'
        },
        TechnologyArea.MATERIALS: {
            'materials', 'composite', 'armor', 'protection', 'lightweight', 'advanced materials',
            'nanotechnology', 'smart materials', 'metamaterials', 'ceramics', 'polymers'
        },
        TechnologyArea.ENERGY: {
            'energy', 'power', 'battery', 'fuel cell', 'solar', 'generator', 'storage',
            'efficiency', 'renewable', 'propulsion', 'engine', 'turbine'
        }
    }
    
    @classmethod
    def calculate_sme_score(cls, opportunity: OpportunityData) -> float:
        """Calculate SME relevance score (0-1)"""
        score = 0.0
        content = f"{opportunity.title} {opportunity.summary}".lower()
        
        # Budget scoring (smaller contracts score higher for SMEs)
        if opportunity.value_estimate:
            if opportunity.value_estimate <= 1_000_000:  # £1M or less
                score += 0.3
            elif opportunity.value_estimate <= 5_000_000:  # £5M or less
                score += 0.2
            elif opportunity.value_estimate <= 20_000_000:  # £20M or less
                score += 0.1
        else:
            score += 0.1  # Unknown budget gets neutral score
        
        # Agency scoring (some agencies are more SME-friendly)
        agency_lower = opportunity.contracting_body.lower()
        if any(agency in agency_lower for agency in ['dasa', 'dstl', 'innovation']):
            score += 0.25
        elif 'mod' in agency_lower or 'ministry of defence' in agency_lower:
            score += 0.15
        
        # SME-specific language
        sme_indicators = ['sme', 'small business', 'startup', 'innovation', 'agile', 'rapid']
        sme_mentions = sum(1 for indicator in sme_indicators if indicator in content)
        score += min(sme_mentions * 0.1, 0.3)
        
        # Technology relevance
        tech_matches = sum(1 for keywords in cls.TECH_CLASSIFICATION.values() 
                          for keyword in keywords if keyword in content)
        score += min(tech_matches * 0.05, 0.2)
        
        # Time to deadline (more time = better for SMEs)
        days_to_deadline = (opportunity.deadline - datetime.now()).days
        if days_to_deadline >= 30:
            score += 0.1
        elif days_to_deadline >= 14:
            score += 0.05
        
        return min(score, 1.0)
    
    @classmethod
    def extract_trl(cls, content: str) -> Optional[int]:
        """Extract Technology Readiness Level from content"""
        trl_patterns = [
            r'trl\s*(\d+)',
            r'technology readiness level\s*(\d+)',
            r'readiness level\s*(\d+)',
            r'trl\s*[-:]\s*(\d+)',
            r'level\s*(\d+)\s*technology'
        ]
        
        content_lower = content.lower()
        for pattern in trl_patterns:
            match = re.search(pattern, content_lower)
            if match:
                trl = int(match.group(1))
                if 1 <= trl <= 9:  # Valid TRL range
                    return trl
        return None
    
    @classmethod
    def classify_technology_areas(cls, content: str) -> List[str]:
        """Classify content into technology areas"""
        content_lower = content.lower()
        areas = []
        
        for area, keywords in cls.TECH_CLASSIFICATION.items():
            if any(keyword in content_lower for keyword in keywords):
                areas.append(area.value)
        
        return areas
    
    @classmethod
    def apply_filters(cls, opportunity: OpportunityData) -> bool:
        """Apply whitelist and blacklist filters"""
        content = f"{opportunity.title} {opportunity.summary} {opportunity.contracting_body}".lower()
        
        # Check blacklist first (hard exclusion)
        if any(keyword in content for keyword in cls.BLACKLIST_KEYWORDS):
            return False
        
        # Check whitelist (must have at least one match)
        has_keyword = any(keyword in content for keyword in cls.WHITELIST_KEYWORDS)
        has_agency = any(agency in content for agency in cls.WHITELIST_AGENCIES)
        has_category = any(category in content for category in cls.WHITELIST_CATEGORIES)
        
        return has_keyword or has_agency or has_category

class SourceScraper:
    """Base class for source-specific scrapers"""
    
    def __init__(self):
        self.session_headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
    
    async def scrape(self) -> List[OpportunityData]:
        """Override in subclasses"""
        raise NotImplementedError

class FindTenderScraper(SourceScraper):
    """Scraper for Find a Tender Service (FTS)"""
    
    async def scrape(self) -> List[OpportunityData]:
        opportunities = []
        
        search_terms = ['defence', 'military', 'security', 'innovation', 'research']
        base_url = "https://www.find-tender.service.gov.uk"
        
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent=self.session_headers['User-Agent']
                )
                
                for term in search_terms[:2]:  # Limit for demo
                    page = await context.new_page()
                    search_url = f"{base_url}/Search?keywords={term}"
                    
                    try:
                        await page.goto(search_url, wait_until='networkidle', timeout=30000)
                        
                        # Look for tender results
                        tender_selectors = [
                            '.search-result',
                            '[data-testid="search-result"]',
                            '.tender-summary',
                            '.notice-summary'
                        ]
                        
                        for selector in tender_selectors:
                            elements = await page.query_selector_all(selector)
                            for element in elements[:10]:  # Limit per search
                                try:
                                    title_elem = await element.query_selector('h2, h3, h4, .title, [data-testid="title"]')
                                    title = await title_elem.text_content() if title_elem else ""
                                    
                                    if not title or len(title) < 20:
                                        continue
                                    
                                    summary_elem = await element.query_selector('p, .summary, .description')
                                    summary = await summary_elem.text_content() if summary_elem else ""
                                    
                                    link_elem = await element.query_selector('a')
                                    link = await link_elem.get_attribute('href') if link_elem else ""
                                    if link and not link.startswith('http'):
                                        link = urljoin(base_url, link)
                                    
                                    # Extract contracting body
                                    body_elem = await element.query_selector('.organisation, .buyer, .contracting-authority')
                                    contracting_body = await body_elem.text_content() if body_elem else "UK Government"
                                    
                                    # Extract deadline
                                    deadline_elem = await element.query_selector('.deadline, .closing-date, .date')
                                    deadline_text = await deadline_elem.text_content() if deadline_elem else ""
                                    deadline = self._parse_deadline(deadline_text) or (datetime.now() + timedelta(days=30))
                                    
                                    opportunity = OpportunityData(
                                        title=title.strip(),
                                        summary=summary.strip()[:500],
                                        contracting_body=contracting_body.strip(),
                                        source="Find a Tender Service",
                                        source_type=SourceType.UK_OFFICIAL,
                                        deadline=deadline,
                                        url=link or search_url,
                                        country="UK",
                                        location="UK"
                                    )
                                    
                                    opportunities.append(opportunity)
                                    
                                except Exception as e:
                                    logger.warning(f"Error extracting tender element: {e}")
                                    continue
                    
                    except Exception as e:
                        logger.error(f"Error scraping FTS for term '{term}': {e}")
                        continue
                    
                    finally:
                        await page.close()
                    
                    await asyncio.sleep(2)  # Rate limiting
                
                await browser.close()
                
        except Exception as e:
            logger.error(f"Error in FTS scraper: {e}")
        
        logger.info(f"FTS Scraper collected {len(opportunities)} opportunities")
        return opportunities
    
    def _parse_deadline(self, date_text: str) -> Optional[datetime]:
        """Parse various date formats"""
        if not date_text:
            return None
        
        date_patterns = [
            r'(\d{1,2})\s+(\w+)\s+(\d{4})',  # 15 December 2024
            r'(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})',  # 15/12/2024
            r'(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})',  # 2024/12/15
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, date_text)
            if match:
                try:
                    if len(match.groups()) == 3:
                        if match.group(2).isalpha():  # Month name
                            return datetime.strptime(f"{match.group(1)} {match.group(2)} {match.group(3)}", "%d %B %Y")
                        else:  # Numeric date
                            return datetime.strptime(f"{match.group(1)}/{match.group(2)}/{match.group(3)}", "%d/%m/%Y")
                except ValueError:
                    continue
        
        return None

class ContractsFinderScraper(SourceScraper):
    """Scraper for Contracts Finder"""
    
    async def scrape(self) -> List[OpportunityData]:
        opportunities = []
        
        search_terms = ['ministry+of+defence', 'MOD', 'defence+equipment', 'dstl', 'dasa']
        base_url = "https://www.contractsfinder.service.gov.uk"
        
        connector = aiohttp.TCPConnector(limit=5)
        timeout = aiohttp.ClientTimeout(total=30)
        
        try:
            async with aiohttp.ClientSession(
                connector=connector, timeout=timeout, headers=self.session_headers
            ) as session:
                
                for term in search_terms[:3]:  # Limit for demo
                    search_url = f"{base_url}/Search?searchTerm={term}"
                    
                    try:
                        async with session.get(search_url) as response:
                            if response.status == 200:
                                html = await response.text()
                                soup = BeautifulSoup(html, 'html.parser')
                                
                                # Look for contract results
                                result_selectors = [
                                    '.search-result',
                                    '.contract-summary',
                                    '[class*="result"]'
                                ]
                                
                                for selector in result_selectors:
                                    elements = soup.select(selector)
                                    for element in elements[:15]:  # Limit per search
                                        try:
                                            title_elem = element.find(['h2', 'h3', 'h4']) or element.find('a')
                                            title = title_elem.get_text(strip=True) if title_elem else ""
                                            
                                            if not title or len(title) < 20:
                                                continue
                                            
                                            summary_elem = element.find('p') or element.find('div', class_=re.compile(r'description|summary'))
                                            summary = summary_elem.get_text(strip=True) if summary_elem else ""
                                            
                                            link_elem = element.find('a', href=True)
                                            link = ""
                                            if link_elem and link_elem['href']:
                                                if link_elem['href'].startswith('http'):
                                                    link = link_elem['href']
                                                else:
                                                    link = urljoin(base_url, link_elem['href'])
                                            
                                            # Extract value if present
                                            value_elem = element.find(text=re.compile(r'£[\d,]+'))
                                            value_estimate = self._parse_value(value_elem) if value_elem else None
                                            
                                            opportunity = OpportunityData(
                                                title=title[:200],
                                                summary=summary[:500],
                                                contracting_body="UK Government (Contracts Finder)",
                                                source="Contracts Finder",
                                                source_type=SourceType.UK_OFFICIAL,
                                                deadline=datetime.now() + timedelta(days=45),
                                                url=link or search_url,
                                                value_estimate=value_estimate,
                                                country="UK",
                                                location="UK"
                                            )
                                            
                                            opportunities.append(opportunity)
                                            
                                        except Exception as e:
                                            logger.warning(f"Error extracting contract element: {e}")
                                            continue
                    
                    except Exception as e:
                        logger.error(f"Error scraping Contracts Finder for term '{term}': {e}")
                        continue
                    
                    await asyncio.sleep(2)  # Rate limiting
                
        except Exception as e:
            logger.error(f"Error in Contracts Finder scraper: {e}")
        
        logger.info(f"Contracts Finder collected {len(opportunities)} opportunities")
        return opportunities
    
    def _parse_value(self, value_text: str) -> Optional[float]:
        """Parse contract value from text"""
        if not value_text:
            return None
        
        # Extract numbers and convert
        numbers = re.findall(r'[\d,]+', str(value_text))
        if numbers:
            try:
                value = float(numbers[0].replace(',', ''))
                # Handle K/M suffixes
                if 'k' in str(value_text).lower():
                    value *= 1000
                elif 'm' in str(value_text).lower():
                    value *= 1000000
                return value
            except ValueError:
                pass
        return None

class DASAScraper(SourceScraper):
    """Scraper for DASA opportunities"""
    
    async def scrape(self) -> List[OpportunityData]:
        opportunities = []
        
        dasa_urls = [
            "https://www.gov.uk/government/organisations/defence-and-security-accelerator",
            "https://www.gov.uk/government/collections/defence-and-security-accelerator-submit-a-research-proposal"
        ]
        
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent=self.session_headers['User-Agent']
                )
                
                for url in dasa_urls:
                    page = await context.new_page()
                    
                    try:
                        await page.goto(url, wait_until='networkidle', timeout=30000)
                        
                        # Look for DASA opportunities
                        opportunity_selectors = [
                            'a[href*="competition"]',
                            'a[href*="funding"]',
                            'a[href*="opportunity"]',
                            '.publication',
                            '.document-row'
                        ]
                        
                        for selector in opportunity_selectors:
                            elements = await page.query_selector_all(selector)
                            for element in elements[:20]:
                                try:
                                    title = await element.text_content()
                                    if not title or len(title) < 15:
                                        continue
                                    
                                    # Filter for relevant opportunities
                                    if not any(keyword in title.lower() for keyword in 
                                             ['competition', 'funding', 'innovation', 'call', 'opportunity']):
                                        continue
                                    
                                    link = await element.get_attribute('href')
                                    if link and not link.startswith('http'):
                                        link = urljoin(url, link)
                                    
                                    opportunity = OpportunityData(
                                        title=title.strip(),
                                        summary=f"DASA funding opportunity: {title.strip()}",
                                        contracting_body="Defence and Security Accelerator (DASA)",
                                        source="DASA",
                                        source_type=SourceType.UK_OFFICIAL,
                                        deadline=datetime.now() + timedelta(days=60),  # DASA typically has longer deadlines
                                        url=link or url,
                                        country="UK",
                                        location="UK"
                                    )
                                    
                                    opportunities.append(opportunity)
                                    
                                except Exception as e:
                                    logger.warning(f"Error extracting DASA element: {e}")
                                    continue
                    
                    except Exception as e:
                        logger.error(f"Error scraping DASA URL {url}: {e}")
                        continue
                    
                    finally:
                        await page.close()
                    
                    await asyncio.sleep(3)  # Rate limiting
                
                await browser.close()
                
        except Exception as e:
            logger.error(f"Error in DASA scraper: {e}")
        
        logger.info(f"DASA Scraper collected {len(opportunities)} opportunities")
        return opportunities

class DeduplicationEngine:
    """Advanced deduplication for opportunities from multiple sources"""
    
    @staticmethod
    def find_duplicates(opportunities: List[OpportunityData]) -> List[OpportunityData]:
        """Find and mark duplicates using multiple strategies"""
        unique_opportunities = []
        seen_hashes = set()
        title_groups = {}
        
        # First pass: exact hash matching
        for opp in opportunities:
            if opp.content_hash not in seen_hashes:
                seen_hashes.add(opp.content_hash)
                unique_opportunities.append(opp)
            else:
                opp.is_duplicate = True
        
        # Second pass: fuzzy title matching
        for opp in unique_opportunities:
            title_normalized = re.sub(r'[^\w\s]', '', opp.title.lower()).strip()
            title_words = set(title_normalized.split())
            
            found_similar = False
            for existing_title, existing_opp in title_groups.items():
                existing_words = set(existing_title.split())
                
                # Calculate Jaccard similarity
                similarity = len(title_words & existing_words) / len(title_words | existing_words)
                
                if similarity > 0.85:  # 85% similarity threshold
                    # Keep the one with more detail or earlier date
                    if len(opp.summary) > len(existing_opp.summary):
                        existing_opp.is_duplicate = True
                        title_groups[title_normalized] = opp
                    else:
                        opp.is_duplicate = True
                    found_similar = True
                    break
            
            if not found_similar:
                title_groups[title_normalized] = opp
        
        return [opp for opp in unique_opportunities if not opp.is_duplicate]

class ActifyDefenceAggregator:
    """Main orchestrator for the defence procurement aggregation system"""
    
    def __init__(self):
        self.scrapers = [
            FindTenderScraper(),
            ContractsFinderScraper(),
            DASAScraper()
        ]
        self.filtering_engine = FilteringEngine()
        self.deduplication_engine = DeduplicationEngine()
    
    async def aggregate_all_sources(self) -> List[OpportunityData]:
        """Main aggregation method"""
        logger.info("🚀 Starting Actify Defence full aggregation...")
        
        all_opportunities = []
        
        # Collect from all sources
        for scraper in self.scrapers:
            try:
                source_opportunities = await scraper.scrape()
                all_opportunities.extend(source_opportunities)
                logger.info(f"✅ Collected {len(source_opportunities)} from {scraper.__class__.__name__}")
            except Exception as e:
                logger.error(f"❌ Error in {scraper.__class__.__name__}: {e}")
                continue
        
        logger.info(f"📊 Total raw opportunities collected: {len(all_opportunities)}")
        
        # Apply filtering
        filtered_opportunities = []
        for opp in all_opportunities:
            if self.filtering_engine.apply_filters(opp):
                # Enhance with classification and scoring
                opp.tech_tags = self.filtering_engine.classify_technology_areas(f"{opp.title} {opp.summary}")
                opp.trl = self.filtering_engine.extract_trl(f"{opp.title} {opp.summary}")
                opp.sme_score = self.filtering_engine.calculate_sme_score(opp)
                opp.sme_fit = opp.sme_score >= 0.5
                
                filtered_opportunities.append(opp)
        
        logger.info(f"📊 Opportunities after filtering: {len(filtered_opportunities)}")
        
        # Apply deduplication
        unique_opportunities = self.deduplication_engine.find_duplicates(filtered_opportunities)
        
        logger.info(f"📊 Final unique opportunities: {len(unique_opportunities)}")
        
        # Sort by SME score (highest first)
        unique_opportunities.sort(key=lambda x: x.sme_score, reverse=True)
        
        return unique_opportunities
    
    def opportunities_to_dict(self, opportunities: List[OpportunityData]) -> List[Dict]:
        """Convert opportunities to dictionary format for API"""
        result = []
        for opp in opportunities:
            opp_dict = asdict(opp)
            # Convert datetime objects to strings
            opp_dict['deadline'] = opp.deadline.isoformat()
            opp_dict['date_scraped'] = opp.date_scraped.isoformat()
            # Convert enum to string
            opp_dict['source_type'] = opp.source_type.value
            
            # Add legacy fields for compatibility
            opp_dict['id'] = opp.content_hash
            opp_dict['funding_body'] = opp.contracting_body
            opp_dict['description'] = opp.summary
            opp_dict['detailed_description'] = opp.summary
            opp_dict['closing_date'] = opp.deadline.isoformat()
            opp_dict['funding_amount'] = f"£{opp.value_estimate:,.0f}" if opp.value_estimate else "TBD"
            opp_dict['contract_type'] = "Defence Procurement"
            opp_dict['official_link'] = opp.url
            opp_dict['status'] = 'active'
            opp_dict['created_at'] = opp.date_scraped.isoformat()
            opp_dict['tier_required'] = 'free'
            opp_dict['procurement_type'] = 'Multi-Source Aggregation'
            
            result.append(opp_dict)
        
        return result

# Convenience function for easy integration
async def run_full_aggregation() -> List[Dict]:
    """Run the full aggregation pipeline and return formatted results"""
    aggregator = ActifyDefenceAggregator()
    opportunities = await aggregator.aggregate_all_sources()
    return aggregator.opportunities_to_dict(opportunities)

if __name__ == "__main__":
    # Test the aggregation system
    async def main():
        opportunities = await run_full_aggregation()
        
        print(f"\n🎯 ACTIFY DEFENCE AGGREGATION COMPLETE")
        print(f"📊 Total opportunities: {len(opportunities)}")
        
        if opportunities:
            print(f"\n🏆 TOP 5 SME-RELEVANT OPPORTUNITIES:")
            for i, opp in enumerate(opportunities[:5]):
                print(f"{i+1}. {opp['title']}")
                print(f"   Source: {opp['source']} | SME Score: {opp['sme_score']:.2f}")
                print(f"   Tech Areas: {', '.join(opp['tech_tags']) if opp['tech_tags'] else 'General'}")
                print(f"   Value: {opp['funding_amount']} | Deadline: {opp['deadline'][:10]}")
                print()
    
    asyncio.run(main())
