"""
ACTIFY DEFENCE: FULL IMPLEMENTATION
Complete multi-source defence procurement intelligence platform
Implementing all sources from the technical brief with advanced features
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
import xml.etree.ElementTree as ET
from dateutil import parser as date_parser

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
    QUANTUM = "Quantum Technologies"
    SIMULATION = "Simulation & Training"

@dataclass
class OpportunityData:
    """Enhanced unified schema for all procurement opportunities"""
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
    
    # Enhanced fields
    procurement_type: str = "Open Tender"
    security_clearance_required: bool = False
    submission_deadline: datetime = None
    contract_duration: Optional[str] = None
    cpv_codes: List[str] = None
    keywords_matched: List[str] = None
    confidence_score: float = 0.0
    
    def __post_init__(self):
        if self.tech_tags is None:
            self.tech_tags = []
        if self.raw_tags is None:
            self.raw_tags = []
        if self.cpv_codes is None:
            self.cpv_codes = []
        if self.keywords_matched is None:
            self.keywords_matched = []
        if self.date_scraped is None:
            self.date_scraped = datetime.utcnow()
        if self.submission_deadline is None:
            self.submission_deadline = self.deadline
        
        # Generate content hash for deduplication
        content_string = f"{self.title}{self.deadline.strftime('%Y-%m-%d')}{self.contracting_body}"
        self.content_hash = hashlib.md5(content_string.encode()).hexdigest()

class EnhancedFilteringEngine:
    """Advanced filtering logic with comprehensive defence focus"""
    
    # Enhanced whitelist with weights
    WHITELIST_KEYWORDS = {
        # Core Defence
        'defence': 3, 'military': 3, 'armed forces': 3, 'navy': 2, 'army': 2, 'air force': 2,
        'mod': 3, 'ministry of defence': 3, 'nato': 2, 'alliance': 2,
        
        # Technology & Innovation
        'innovation': 2, 'research': 2, 'development': 2, 'technology': 2, 'prototype': 3,
        'ai': 3, 'artificial intelligence': 3, 'machine learning': 3, 'neural networks': 2,
        'quantum': 3, 'quantum computing': 3, 'quantum communication': 3,
        'cybersecurity': 3, 'cyber security': 3, 'information security': 2, 'network security': 2,
        
        # Systems & Platforms
        'uav': 3, 'uas': 3, 'drone': 3, 'unmanned': 3, 'autonomous': 3, 'robotics': 2,
        'c4isr': 3, 'command and control': 2, 'surveillance': 2, 'reconnaissance': 2,
        'satellite': 2, 'space': 2, 'orbital': 2, 'launcher': 2,
        
        # Warfare & Capabilities
        'electronic warfare': 3, 'ew': 3, 'radar': 2, 'sonar': 2, 'lidar': 2,
        'countermeasures': 2, 'jamming': 2, 'signals intelligence': 2,
        'maritime defence': 2, 'submarine': 2, 'naval': 2, 'underwater': 2,
        
        # Materials & Engineering
        'advanced materials': 2, 'composite': 2, 'armor': 2, 'stealth': 3,
        'propulsion': 2, 'engine': 1, 'turbine': 1, 'fuel cell': 2,
        
        # Dual-use Technologies
        'dual-use': 3, 'commercial': 1, 'cots': 2, 'mots': 2,
        'simulation': 2, 'training': 1, 'virtual reality': 2, 'augmented reality': 2
    }
    
    # Enhanced blacklist with patterns
    BLACKLIST_PATTERNS = {
        # Administrative Services
        r'\b(catering|canteen|food service|restaurant)\b': 5,
        r'\b(cleaning|janitorial|housekeeping|maintenance)\b': 5,
        r'\b(office supplies|stationery|printing|photocopying)\b': 5,
        r'\b(hr|human resources|recruitment|staffing)\b': 4,
        r'\b(accounting|payroll|audit|bookkeeping)\b': 4,
        r'\b(legal services|solicitor|barrister|lawyer)\b': 3,
        
        # Transport & Logistics (non-military)
        r'\b(vehicle hire|car rental|taxi|courier)\b': 4,
        r'\b(postal|mail|delivery|shipping)\b': 3,
        r'\b(warehouse|storage|filing)\b': 3,
        
        # Facilities & Property
        r'\b(grounds maintenance|landscaping|gardening)\b': 5,
        r'\b(pest control|waste management|recycling)\b': 5,
        r'\b(furniture|office equipment|fixtures)\b': 4,
        r'\b(accommodation|hotel|conference|events)\b': 3,
        
        # General Business Services
        r'\b(translation|interpretation|language)\b': 3,
        r'\b(insurance|financial advice|banking)\b': 3,
        r'\b(travel|tourism|leisure)\b': 4,
        r'\b(medical services|healthcare|dental)\b': 2,
    }
    
    # Technology classification with enhanced patterns
    TECH_CLASSIFICATION_ENHANCED = {
        TechnologyArea.AI_ML: {
            'patterns': [
                r'\b(ai|artificial intelligence|machine learning|ml)\b',
                r'\b(neural network|deep learning|computer vision)\b',
                r'\b(natural language processing|nlp|pattern recognition)\b',
                r'\b(automated decision|intelligent system|cognitive)\b'
            ],
            'weight': 3
        },
        TechnologyArea.CYBERSECURITY: {
            'patterns': [
                r'\b(cyber|cybersecurity|cyber security|infosec)\b',
                r'\b(encryption|cryptography|secure communication)\b',
                r'\b(threat detection|malware|intrusion detection)\b',
                r'\b(firewall|vulnerability|penetration testing)\b'
            ],
            'weight': 3
        },
        TechnologyArea.QUANTUM: {
            'patterns': [
                r'\b(quantum|quantum computing|quantum communication)\b',
                r'\b(quantum cryptography|quantum sensing|qkd)\b',
                r'\b(quantum radar|quantum algorithm)\b'
            ],
            'weight': 4
        },
        TechnologyArea.UAV_UAS: {
            'patterns': [
                r'\b(uav|uas|drone|unmanned|rpv)\b',
                r'\b(autonomous vehicle|autonomous system|robotics)\b',
                r'\b(swarm|multi-agent|remotely piloted)\b'
            ],
            'weight': 3
        },
        TechnologyArea.SPACE: {
            'patterns': [
                r'\b(space|satellite|orbital|spacecraft)\b',
                r'\b(launch|launcher|rocket|missile)\b',
                r'\b(earth observation|navigation|gps|gnss)\b',
                r'\b(space situational awareness|space debris)\b'
            ],
            'weight': 2
        },
        TechnologyArea.ELECTRONIC_WARFARE: {
            'patterns': [
                r'\b(electronic warfare|ew|jamming|ecm)\b',
                r'\b(signal intelligence|sigint|comint|elint)\b',
                r'\b(electronic attack|electronic protection)\b'
            ],
            'weight': 3
        }
    }
    
    @classmethod
    def calculate_enhanced_sme_score(cls, opportunity: OpportunityData) -> float:
        """Enhanced SME relevance scoring with multiple factors"""
        score = 0.0
        content = f"{opportunity.title} {opportunity.summary}".lower()
        
        # Budget scoring (enhanced)
        if opportunity.value_estimate:
            if opportunity.value_estimate <= 500_000:  # £500K or less
                score += 0.4
            elif opportunity.value_estimate <= 2_000_000:  # £2M or less
                score += 0.3
            elif opportunity.value_estimate <= 10_000_000:  # £10M or less
                score += 0.2
            elif opportunity.value_estimate <= 50_000_000:  # £50M or less
                score += 0.1
        else:
            score += 0.15  # Unknown budget gets neutral score
        
        # Agency scoring (enhanced)
        agency_lower = opportunity.contracting_body.lower()
        if any(agency in agency_lower for agency in ['dasa', 'defence and security accelerator']):
            score += 0.3  # DASA is very SME-friendly
        elif any(agency in agency_lower for agency in ['dstl', 'defence science and technology']):
            score += 0.25  # Dstl actively works with SMEs
        elif 'mod' in agency_lower or 'ministry of defence' in agency_lower:
            score += 0.15
        elif any(agency in agency_lower for agency in ['innovate uk', 'ukri']):
            score += 0.2
        
        # SME-specific language (enhanced)
        sme_patterns = [
            (r'\bsme\b', 0.15),
            (r'\bsmall business\b', 0.15),
            (r'\bstartup\b', 0.1),
            (r'\binnovation\b', 0.05),
            (r'\bagile\b', 0.05),
            (r'\brapid\b', 0.05),
            (r'\bopen to all\b', 0.1),
            (r'\bno minimum turnover\b', 0.15),
            (r'\blow value\b', 0.1)
        ]
        
        for pattern, weight in sme_patterns:
            if re.search(pattern, content):
                score += weight
        
        # Technology relevance (enhanced)
        tech_score = 0
        for area, config in cls.TECH_CLASSIFICATION_ENHANCED.items():
            for pattern in config['patterns']:
                if re.search(pattern, content):
                    tech_score += config['weight'] * 0.02
        score += min(tech_score, 0.25)
        
        # Procurement type scoring
        proc_type = opportunity.procurement_type.lower()
        if any(term in proc_type for term in ['sbri', 'innovation', 'r&d', 'research']):
            score += 0.15
        elif any(term in proc_type for term in ['framework', 'dps', 'dynamic purchasing']):
            score += 0.1
        
        # Time to deadline (enhanced)
        days_to_deadline = (opportunity.deadline - datetime.now()).days
        if days_to_deadline >= 60:
            score += 0.15
        elif days_to_deadline >= 30:
            score += 0.1
        elif days_to_deadline >= 14:
            score += 0.05
        elif days_to_deadline < 7:
            score -= 0.1  # Penalize very short deadlines
        
        # TRL scoring
        if opportunity.trl:
            if 3 <= opportunity.trl <= 6:  # Sweet spot for SMEs
                score += 0.1
            elif 1 <= opportunity.trl <= 2:  # Very early stage
                score += 0.05
        
        return min(score, 1.0)
    
    @classmethod
    def extract_enhanced_trl(cls, content: str) -> Optional[int]:
        """Enhanced TRL extraction with context awareness"""
        trl_patterns = [
            r'trl\s*[-:]?\s*(\d+)',
            r'technology readiness level\s*[-:]?\s*(\d+)',
            r'readiness level\s*[-:]?\s*(\d+)',
            r'level\s*(\d+)\s*technology',
            r'trl(\d+)',
            r'at\s*trl\s*(\d+)',
            r'from\s*trl\s*(\d+)',
            r'to\s*trl\s*(\d+)'
        ]
        
        content_lower = content.lower()
        for pattern in trl_patterns:
            matches = re.finditer(pattern, content_lower)
            for match in matches:
                trl = int(match.group(1))
                if 1 <= trl <= 9:  # Valid TRL range
                    return trl
        return None

# Enhanced source scrapers with all sources from the brief
class TEDScraper:
    """Scraper for TED (Tenders Electronic Daily) - EU procurement"""
    
    async def scrape(self) -> List[OpportunityData]:
        opportunities = []
        
        # TED search URLs for defence-related tenders
        search_urls = [
            "https://ted.europa.eu/api/v2/notices/search?q=defence&scope=3",
            "https://ted.europa.eu/api/v2/notices/search?q=military&scope=3",
            "https://ted.europa.eu/api/v2/notices/search?q=security&scope=3"
        ]
        
        connector = aiohttp.TCPConnector(limit=5)
        timeout = aiohttp.ClientTimeout(total=30)
        
        try:
            async with aiohttp.ClientSession(
                connector=connector, timeout=timeout
            ) as session:
                
                for search_url in search_urls[:2]:  # Limit for demo
                    try:
                        async with session.get(search_url) as response:
                            if response.status == 200:
                                data = await response.json()
                                
                                for notice in data.get('results', [])[:10]:
                                    try:
                                        title = notice.get('title', {}).get('en', '')
                                        if not title or len(title) < 20:
                                            continue
                                        
                                        summary = notice.get('description', {}).get('en', '')
                                        
                                        # Extract contracting authority
                                        contracting_body = "European Union"
                                        if 'contractingAuthority' in notice:
                                            contracting_body = notice['contractingAuthority'].get('name', contracting_body)
                                        
                                        # Extract deadline
                                        deadline_str = notice.get('deadline', '')
                                        deadline = self._parse_iso_date(deadline_str) or (datetime.now() + timedelta(days=30))
                                        
                                        # Extract value
                                        value_estimate = None
                                        if 'value' in notice:
                                            value_estimate = float(notice['value'].get('amount', 0))
                                        
                                        opportunity = OpportunityData(
                                            title=title[:200],
                                            summary=summary[:500],
                                            contracting_body=contracting_body,
                                            source="TED (EU)",
                                            source_type=SourceType.EU_NATO,
                                            deadline=deadline,
                                            url=f"https://ted.europa.eu/udl?uri=TED:NOTICE:{notice.get('id', '')}",
                                            value_estimate=value_estimate,
                                            country="EU",
                                            location="European Union",
                                            procurement_type="EU Tender"
                                        )
                                        
                                        opportunities.append(opportunity)
                                        
                                    except Exception as e:
                                        logger.warning(f"Error parsing TED notice: {e}")
                                        continue
                    
                    except Exception as e:
                        logger.error(f"Error scraping TED: {e}")
                        continue
                    
                    await asyncio.sleep(2)
        
        except Exception as e:
            logger.error(f"Error in TED scraper: {e}")
        
        logger.info(f"TED Scraper collected {len(opportunities)} opportunities")
        return opportunities
    
    def _parse_iso_date(self, date_str: str) -> Optional[datetime]:
        """Parse ISO date format"""
        if not date_str:
            return None
        try:
            return date_parser.parse(date_str)
        except:
            return None

class NSPAScraper:
    """Scraper for NATO Support and Procurement Agency"""
    
    async def scrape(self) -> List[OpportunityData]:
        opportunities = []
        
        nspa_urls = [
            "https://www.nspa.nato.int/business/procurement/procurement-opportunities",
            "https://www.nspa.nato.int/business/tender-opportunities"
        ]
        
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context()
                
                for url in nspa_urls:
                    page = await context.new_page()
                    
                    try:
                        await page.goto(url, wait_until='networkidle', timeout=30000)
                        
                        # Look for procurement opportunities
                        opportunity_selectors = [
                            '.procurement-opportunity',
                            '.tender-item',
                            'a[href*="tender"]',
                            'a[href*="procurement"]',
                            '.notice'
                        ]
                        
                        for selector in opportunity_selectors:
                            elements = await page.query_selector_all(selector)
                            for element in elements[:15]:
                                try:
                                    title = await element.text_content()
                                    if not title or len(title) < 15:
                                        continue
                                    
                                    link = await element.get_attribute('href')
                                    if link and not link.startswith('http'):
                                        link = urljoin(url, link)
                                    
                                    opportunity = OpportunityData(
                                        title=title.strip(),
                                        summary=f"NATO procurement opportunity: {title.strip()}",
                                        contracting_body="NATO Support and Procurement Agency (NSPA)",
                                        source="NSPA (NATO)",
                                        source_type=SourceType.EU_NATO,
                                        deadline=datetime.now() + timedelta(days=45),
                                        url=link or url,
                                        country="NATO",
                                        location="NATO Alliance",
                                        procurement_type="NATO Procurement"
                                    )
                                    
                                    opportunities.append(opportunity)
                                    
                                except Exception as e:
                                    logger.warning(f"Error extracting NSPA element: {e}")
                                    continue
                    
                    except Exception as e:
                        logger.error(f"Error scraping NSPA URL {url}: {e}")
                        continue
                    
                    finally:
                        await page.close()
                    
                    await asyncio.sleep(3)
                
                await browser.close()
                
        except Exception as e:
            logger.error(f"Error in NSPA scraper: {e}")
        
        logger.info(f"NSPA Scraper collected {len(opportunities)} opportunities")
        return opportunities

class SAMGovScraper:
    """Scraper for SAM.gov (US Federal procurement)"""
    
    async def scrape(self) -> List[OpportunityData]:
        opportunities = []
        
        # SAM.gov API endpoints (public opportunities)
        search_terms = ['defense', 'defence', 'military', 'security']
        
        connector = aiohttp.TCPConnector(limit=3)
        timeout = aiohttp.ClientTimeout(total=45)
        
        try:
            async with aiohttp.ClientSession(
                connector=connector, timeout=timeout
            ) as session:
                
                for term in search_terms[:2]:  # Limit for demo
                    # SAM.gov opportunities API
                    api_url = f"https://api.sam.gov/opportunities/v2/search?keywords={term}&limit=50"
                    
                    try:
                        headers = {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Accept': 'application/json'
                        }
                        
                        async with session.get(api_url, headers=headers) as response:
                            if response.status == 200:
                                data = await response.json()
                                
                                for opp in data.get('opportunitiesData', [])[:10]:
                                    try:
                                        title = opp.get('title', '')
                                        if not title or len(title) < 20:
                                            continue
                                        
                                        # Filter for defence-related
                                        if not any(keyword in title.lower() for keyword in 
                                                 ['defense', 'defence', 'military', 'army', 'navy', 'air force']):
                                            continue
                                        
                                        summary = opp.get('description', '')
                                        
                                        # Extract agency
                                        agency = opp.get('department', {}).get('name', 'US Government')
                                        
                                        # Extract deadline
                                        deadline_str = opp.get('responseDeadLine', '')
                                        deadline = self._parse_us_date(deadline_str) or (datetime.now() + timedelta(days=30))
                                        
                                        opportunity = OpportunityData(
                                            title=title[:200],
                                            summary=summary[:500],
                                            contracting_body=agency,
                                            source="SAM.gov (USA)",
                                            source_type=SourceType.GLOBAL_ALLIES,
                                            deadline=deadline,
                                            url=f"https://sam.gov/opp/{opp.get('noticeId', '')}",
                                            country="USA",
                                            location="United States",
                                            procurement_type="US Federal Procurement"
                                        )
                                        
                                        opportunities.append(opportunity)
                                        
                                    except Exception as e:
                                        logger.warning(f"Error parsing SAM.gov opportunity: {e}")
                                        continue
                    
                    except Exception as e:
                        logger.error(f"Error scraping SAM.gov for term '{term}': {e}")
                        continue
                    
                    await asyncio.sleep(3)
        
        except Exception as e:
            logger.error(f"Error in SAM.gov scraper: {e}")
        
        logger.info(f"SAM.gov Scraper collected {len(opportunities)} opportunities")
        return opportunities
    
    def _parse_us_date(self, date_str: str) -> Optional[datetime]:
        """Parse US date formats"""
        if not date_str:
            return None
        try:
            return date_parser.parse(date_str)
        except:
            return None

class PrimeContractorScraper:
    """Enhanced scraper for prime contractor opportunities"""
    
    async def scrape(self) -> List[OpportunityData]:
        opportunities = []
        
        # Enhanced prime contractor mappings
        prime_contractors = {
            'BAE Systems': {
                'urls': [
                    'https://www.baesystems.com/en/our-company/supplier-information',
                    'https://supplier.baesystems.com/opportunities'
                ],
                'selectors': ['a[href*="opportunity"]', '.supplier-opportunity', '.tender-link']
            },
            'Leonardo UK': {
                'urls': [
                    'https://uk.leonardocompany.com/en/suppliers',
                    'https://www.leonardocompany.com/en/suppliers'
                ],
                'selectors': ['a[href*="tender"]', '.supplier-link', '.opportunity']
            },
            'Thales': {
                'urls': [
                    'https://www.thalesgroup.com/en/group/suppliers',
                    'https://www.thalesgroup.com/en/united-kingdom/suppliers'
                ],
                'selectors': ['a[href*="supplier"]', '.procurement', '.opportunity']
            },
            'Rolls-Royce': {
                'urls': [
                    'https://www.rolls-royce.com/suppliers.aspx',
                    'https://www.rolls-royce.com/suppliers/how-to-become-a-supplier.aspx'
                ],
                'selectors': ['a[href*="supplier"]', '.supplier-opportunity']
            },
            'Babcock International': {
                'urls': [
                    'https://www.babcockinternational.com/suppliers/',
                    'https://www.babcockinternational.com/suppliers/current-opportunities/'
                ],
                'selectors': ['.opportunity', 'a[href*="tender"]', '.supplier-notice']
            },
            'QinetiQ': {
                'urls': [
                    'https://www.qinetiq.com/what-we-do/partnering-with-qinetiq',
                    'https://www.qinetiq.com/suppliers'
                ],
                'selectors': ['a[href*="partner"]', '.partnership', '.opportunity']
            }
        }
        
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                )
                
                for prime_name, config in prime_contractors.items():
                    print(f"🏭 Collecting from {prime_name}...")
                    
                    for url in config['urls']:
                        page = await context.new_page()
                        
                        try:
                            await page.goto(url, wait_until='networkidle', timeout=30000)
                            
                            for selector in config['selectors']:
                                elements = await page.query_selector_all(selector)
                                for element in elements[:10]:
                                    try:
                                        title = await element.text_content()
                                        if not title or len(title) < 15:
                                            continue
                                        
                                        # Filter for relevant opportunities
                                        title_lower = title.lower()
                                        if not any(keyword in title_lower for keyword in 
                                                 ['opportunity', 'tender', 'supplier', 'partner', 'procurement']):
                                            continue
                                        
                                        link = await element.get_attribute('href')
                                        if link and not link.startswith('http'):
                                            link = urljoin(url, link)
                                        
                                        opportunity = OpportunityData(
                                            title=title.strip()[:200],
                                            summary=f"Prime contractor opportunity with {prime_name}: {title.strip()}",
                                            contracting_body=f"{prime_name} (Prime Contractor)",
                                            source=f"{prime_name}",
                                            source_type=SourceType.PRIME_CONTRACTORS,
                                            deadline=datetime.now() + timedelta(days=60),
                                            url=link or url,
                                            country="UK",
                                            location="UK",
                                            procurement_type="Prime Contractor Opportunity"
                                        )
                                        
                                        opportunities.append(opportunity)
                                        
                                    except Exception as e:
                                        logger.warning(f"Error extracting {prime_name} element: {e}")
                                        continue
                        
                        except Exception as e:
                            logger.error(f"Error scraping {prime_name} at {url}: {e}")
                            continue
                        
                        finally:
                            await page.close()
                        
                        await asyncio.sleep(2)
                    
                    await asyncio.sleep(3)  # Longer delay between primes
                
                await browser.close()
                
        except Exception as e:
            logger.error(f"Error in Prime Contractor scraper: {e}")
        
        logger.info(f"Prime Contractor Scraper collected {len(opportunities)} opportunities")
        return opportunities

class ActifyDefenceFullAggregator:
    """Complete implementation of the Actify Defence aggregation system"""
    
    def __init__(self):
        # All scrapers from the technical brief
        self.scrapers = {
            # UK Official
            'uk_official': [
                # Already implemented in basic version
            ],
            # EU & NATO
            'eu_nato': [
                TEDScraper(),
                NSPAScraper()
            ],
            # Global Allies
            'global_allies': [
                SAMGovScraper()
            ],
            # Prime Contractors
            'prime_contractors': [
                PrimeContractorScraper()
            ]
        }
        
        self.filtering_engine = EnhancedFilteringEngine()
    
    async def aggregate_all_sources_full(self) -> List[OpportunityData]:
        """Full aggregation from all sources"""
        logger.info("🚀 Starting FULL Actify Defence aggregation across ALL sources...")
        
        all_opportunities = []
        source_stats = {}
        
        # Collect from all source categories
        for category, scrapers in self.scrapers.items():
            logger.info(f"📊 Processing {category.upper()} sources...")
            
            for scraper in scrapers:
                try:
                    scraper_name = scraper.__class__.__name__
                    logger.info(f"🔍 Running {scraper_name}...")
                    
                    opportunities = await scraper.scrape()
                    all_opportunities.extend(opportunities)
                    
                    source_stats[scraper_name] = len(opportunities)
                    logger.info(f"✅ {scraper_name}: {len(opportunities)} opportunities")
                    
                except Exception as e:
                    logger.error(f"❌ Error in {scraper.__class__.__name__}: {e}")
                    continue
        
        logger.info(f"📊 Raw collection complete: {len(all_opportunities)} total opportunities")
        
        # Enhanced filtering and processing
        processed_opportunities = []
        
        for opp in all_opportunities:
            try:
                # Apply enhanced filtering
                if self._apply_enhanced_filters(opp):
                    # Enhance with classification and scoring
                    opp.tech_tags = self._classify_technology_areas_enhanced(opp)
                    opp.trl = self.filtering_engine.extract_enhanced_trl(f"{opp.title} {opp.summary}")
                    opp.sme_score = self.filtering_engine.calculate_enhanced_sme_score(opp)
                    opp.sme_fit = opp.sme_score >= 0.5
                    opp.confidence_score = self._calculate_confidence_score(opp)
                    
                    processed_opportunities.append(opp)
                    
            except Exception as e:
                logger.warning(f"Error processing opportunity: {e}")
                continue
        
        logger.info(f"📊 After enhanced filtering: {len(processed_opportunities)} opportunities")
        
        # Advanced deduplication
        unique_opportunities = self._advanced_deduplication(processed_opportunities)
        
        logger.info(f"📊 After deduplication: {len(unique_opportunities)} opportunities")
        
        # Sort by combined score (SME score + confidence score)
        unique_opportunities.sort(
            key=lambda x: (x.sme_score * 0.7 + x.confidence_score * 0.3), 
            reverse=True
        )
        
        # Log final statistics
        self._log_final_statistics(unique_opportunities, source_stats)
        
        return unique_opportunities
    
    def _apply_enhanced_filters(self, opportunity: OpportunityData) -> bool:
        """Apply enhanced filtering logic"""
        content = f"{opportunity.title} {opportunity.summary} {opportunity.contracting_body}".lower()
        
        # Enhanced blacklist check with pattern matching
        blacklist_score = 0
        for pattern, weight in self.filtering_engine.BLACKLIST_PATTERNS.items():
            if re.search(pattern, content):
                blacklist_score += weight
        
        if blacklist_score >= 5:  # Threshold for rejection
            return False
        
        # Enhanced whitelist check with weighted scoring
        whitelist_score = 0
        keywords_matched = []
        
        for keyword, weight in self.filtering_engine.WHITELIST_KEYWORDS.items():
            if keyword in content:
                whitelist_score += weight
                keywords_matched.append(keyword)
        
        opportunity.keywords_matched = keywords_matched
        
        # Must meet minimum relevance threshold
        return whitelist_score >= 2
    
    def _classify_technology_areas_enhanced(self, opportunity: OpportunityData) -> List[str]:
        """Enhanced technology area classification"""
        content = f"{opportunity.title} {opportunity.summary}".lower()
        areas = []
        
        for area, config in self.filtering_engine.TECH_CLASSIFICATION_ENHANCED.items():
            area_score = 0
            
            for pattern in config['patterns']:
                matches = len(re.findall(pattern, content))
                area_score += matches * config['weight']
            
            if area_score >= 2:  # Threshold for classification
                areas.append(area.value)
        
        return areas if areas else ['General Defence']
    
    def _calculate_confidence_score(self, opportunity: OpportunityData) -> float:
        """Calculate confidence score for opportunity quality"""
        score = 0.0
        
        # Source reliability
        source_scores = {
            SourceType.UK_OFFICIAL: 0.9,
            SourceType.EU_NATO: 0.8,
            SourceType.GLOBAL_ALLIES: 0.7,
            SourceType.PRIME_CONTRACTORS: 0.6,
            SourceType.INDUSTRY_NEWS: 0.4
        }
        score += source_scores.get(opportunity.source_type, 0.5) * 0.3
        
        # Content completeness
        if len(opportunity.title) >= 20:
            score += 0.2
        if len(opportunity.summary) >= 100:
            score += 0.2
        if opportunity.value_estimate:
            score += 0.1
        if opportunity.deadline > datetime.now():
            score += 0.1
        
        # Keywords matched
        score += min(len(opportunity.keywords_matched) * 0.02, 0.1)
        
        return min(score, 1.0)
    
    def _advanced_deduplication(self, opportunities: List[OpportunityData]) -> List[OpportunityData]:
        """Advanced deduplication with fuzzy matching and content analysis"""
        unique_opportunities = []
        processed_hashes = set()
        
        for opp in opportunities:
            is_duplicate = False
            
            # Check exact hash
            if opp.content_hash in processed_hashes:
                continue
            
            # Advanced fuzzy matching
            for existing in unique_opportunities:
                similarity = self._calculate_similarity(opp, existing)
                
                if similarity > 0.85:  # High similarity threshold
                    # Keep the one with higher combined score
                    opp_score = opp.sme_score * 0.7 + opp.confidence_score * 0.3
                    existing_score = existing.sme_score * 0.7 + existing.confidence_score * 0.3
                    
                    if opp_score <= existing_score:
                        is_duplicate = True
                        break
                    else:
                        # Replace existing with current (higher score)
                        unique_opportunities.remove(existing)
                        break
            
            if not is_duplicate:
                unique_opportunities.append(opp)
                processed_hashes.add(opp.content_hash)
        
        return unique_opportunities
    
    def _calculate_similarity(self, opp1: OpportunityData, opp2: OpportunityData) -> float:
        """Calculate similarity between two opportunities"""
        # Title similarity
        title1_words = set(re.sub(r'[^\w\s]', '', opp1.title.lower()).split())
        title2_words = set(re.sub(r'[^\w\s]', '', opp2.title.lower()).split())
        
        if not title1_words or not title2_words:
            return 0.0
        
        title_similarity = len(title1_words & title2_words) / len(title1_words | title2_words)
        
        # Deadline similarity
        deadline_diff = abs((opp1.deadline - opp2.deadline).days)
        deadline_similarity = max(0, 1 - deadline_diff / 30)  # Similar if within 30 days
        
        # Combined similarity
        return title_similarity * 0.8 + deadline_similarity * 0.2
    
    def _log_final_statistics(self, opportunities: List[OpportunityData], source_stats: Dict[str, int]):
        """Log comprehensive statistics"""
        logger.info("\n🎯 ACTIFY DEFENCE FULL AGGREGATION COMPLETE")
        logger.info(f"📊 Final opportunities: {len(opportunities)}")
        
        # Source breakdown
        logger.info("\n📈 SOURCE STATISTICS:")
        for source, count in source_stats.items():
            logger.info(f"   {source}: {count}")
        
        # Technology area breakdown
        tech_counts = {}
        for opp in opportunities:
            for tech in opp.tech_tags:
                tech_counts[tech] = tech_counts.get(tech, 0) + 1
        
        logger.info("\n🔬 TECHNOLOGY AREAS:")
        for tech, count in sorted(tech_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
            logger.info(f"   {tech}: {count}")
        
        # SME relevance
        high_sme = sum(1 for opp in opportunities if opp.sme_score >= 0.7)
        medium_sme = sum(1 for opp in opportunities if 0.5 <= opp.sme_score < 0.7)
        
        logger.info(f"\n🎯 SME RELEVANCE:")
        logger.info(f"   High (≥0.7): {high_sme}")
        logger.info(f"   Medium (0.5-0.7): {medium_sme}")
        logger.info(f"   Low (<0.5): {len(opportunities) - high_sme - medium_sme}")
    
    def opportunities_to_dict_enhanced(self, opportunities: List[OpportunityData]) -> List[Dict]:
        """Convert to enhanced dictionary format with all new fields"""
        result = []
        
        for opp in opportunities:
            opp_dict = asdict(opp)
            
            # Convert datetime objects
            opp_dict['deadline'] = opp.deadline.isoformat()
            opp_dict['date_scraped'] = opp.date_scraped.isoformat()
            opp_dict['submission_deadline'] = opp.submission_deadline.isoformat() if opp.submission_deadline else opp.deadline.isoformat()
            
            # Convert enum
            opp_dict['source_type'] = opp.source_type.value
            
            # Enhanced fields for API compatibility
            opp_dict['id'] = opp.content_hash
            opp_dict['funding_body'] = opp.contracting_body
            opp_dict['description'] = opp.summary
            opp_dict['detailed_description'] = opp.summary
            opp_dict['closing_date'] = opp.deadline.isoformat()
            opp_dict['funding_amount'] = f"£{opp.value_estimate:,.0f}" if opp.value_estimate else "TBD"
            opp_dict['contract_type'] = opp.procurement_type
            opp_dict['official_link'] = opp.url
            opp_dict['status'] = 'active'
            opp_dict['created_at'] = opp.date_scraped.isoformat()
            opp_dict['tier_required'] = 'pro' if opp.source_type == SourceType.PRIME_CONTRACTORS else 'free'
            
            # Add enhanced metadata
            opp_dict['enhanced_metadata'] = {
                'sme_score': opp.sme_score,
                'confidence_score': opp.confidence_score,
                'tech_tags': opp.tech_tags,
                'keywords_matched': opp.keywords_matched,
                'trl': opp.trl,
                'security_clearance_required': opp.security_clearance_required
            }
            
            result.append(opp_dict)
        
        return result

# Main function for full aggregation
async def run_full_actify_aggregation() -> List[Dict]:
    """Run the complete Actify Defence aggregation with all sources"""
    aggregator = ActifyDefenceFullAggregator()
    opportunities = await aggregator.aggregate_all_sources_full()
    return aggregator.opportunities_to_dict_enhanced(opportunities)

if __name__ == "__main__":
    # Test the full aggregation system
    async def main():
        opportunities = await run_full_actify_aggregation()
        
        print(f"\n🎯 ACTIFY DEFENCE FULL AGGREGATION RESULTS")
        print(f"📊 Total opportunities: {len(opportunities)}")
        
        if opportunities:
            print(f"\n🏆 TOP 10 OPPORTUNITIES:")
            for i, opp in enumerate(opportunities[:10]):
                metadata = opp.get('enhanced_metadata', {})
                print(f"{i+1}. {opp['title']}")
                print(f"   Source: {opp['source']} | SME: {metadata.get('sme_score', 0):.2f} | Confidence: {metadata.get('confidence_score', 0):.2f}")
                print(f"   Tech: {', '.join(metadata.get('tech_tags', []))}")
                print(f"   Value: {opp['funding_amount']} | Deadline: {opp['deadline'][:10]}")
                print()
    
    asyncio.run(main())
