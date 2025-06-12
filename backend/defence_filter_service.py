"""
DEFENCE-FOCUSED OPPORTUNITY FILTERING SERVICE
This service ensures ONLY defence-related opportunities are collected and stored.
"""

import re
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import asyncio
import aiohttp
from bs4 import BeautifulSoup

class DefenceOpportunityFilter:
    def __init__(self):
        # STRICT Defence Keywords - Must contain at least one
        self.defence_keywords = [
            'defence', 'defense', 'military', 'mod', 'ministry of defence',
            'army', 'navy', 'air force', 'raf', 'royal navy', 'royal air force',
            'dstl', 'dasa', 'nato', 'security clearance', 'classified',
            'weapons', 'ammunition', 'ordnance', 'ballistics', 'munitions',
            'surveillance', 'intelligence', 'reconnaissance', 'radar',
            'cybersecurity', 'cyber security', 'cyber defence', 'cyber attack',
            'missile', 'rocket', 'submarine', 'warship', 'fighter', 'bomber',
            'combat', 'tactical', 'strategic', 'operational security',
            'counter terrorism', 'homeland security', 'border security',
            'electronic warfare', 'signals intelligence', 'sigint',
            'special forces', 'special operations', 'counter intelligence',
            'nuclear security', 'cbrn', 'chemical biological radiological',
            'armoured', 'armored', 'vehicle protection', 'body armour',
            'night vision', 'thermal imaging', 'battlefield',
            'command and control', 'c4isr', 'battle management'
        ]
        
        # Technology Keywords (must be combined with defence context)
        self.defence_tech_keywords = [
            'military ai', 'defence ai', 'military artificial intelligence',
            'military robotics', 'defence robotics', 'autonomous weapons',
            'military drones', 'defence drones', 'military uav',
            'military quantum', 'defence quantum', 'quantum radar',
            'military communications', 'secure communications',
            'military satellites', 'defence satellites', 'military space',
            'battlefield sensors', 'military sensors', 'defence sensors'
        ]
        
        # EXCLUSION Keywords - Automatically reject if present
        self.exclusion_keywords = [
            'utilities', 'water', 'gas', 'electricity', 'energy supply',
            'waste management', 'recycling', 'street lighting', 'roads',
            'highways', 'transport', 'bus', 'train', 'railway',
            'healthcare', 'hospital', 'medical', 'pharmaceutical',
            'education', 'school', 'university', 'teaching',
            'social services', 'housing', 'construction', 'building',
            'facilities management', 'cleaning', 'catering', 'food',
            'insurance', 'legal services', 'accounting', 'finance',
            'human resources', 'recruitment', 'training',
            'it support', 'office supplies', 'stationery',
            'telecommunications', 'broadband', 'mobile phone',
            'environmental', 'sustainability', 'carbon',
            'agriculture', 'farming', 'forestry'
        ]
        
        # Defence Organizations
        self.defence_organizations = [
            'ministry of defence', 'mod', 'dstl', 'dasa',
            'defence equipment and support', 'des',
            'army', 'royal navy', 'royal air force', 'raf',
            'royal marines', 'special air service', 'sas',
            'government communications headquarters', 'gchq',
            'secret intelligence service', 'sis', 'mi6',
            'defence intelligence', 'joint forces command',
            'strategic command', 'nato', 'european defence agency'
        ]

    def is_defence_related(self, opportunity: Dict) -> bool:
        """
        Strict defence filtering - only allow genuinely defence-related opportunities
        """
        title = opportunity.get('title', '').lower()
        description = opportunity.get('description', '').lower()
        funding_body = opportunity.get('funding_body', '').lower()
        
        text_to_check = f"{title} {description} {funding_body}"
        
        # IMMEDIATE REJECTION for exclusion keywords
        for exclusion in self.exclusion_keywords:
            if exclusion in text_to_check:
                return False
        
        # SCORE-BASED APPROACH for defence relevance
        defence_score = 0
        
        # High-value defence keywords (5 points each)
        high_value_keywords = [
            'defence', 'defense', 'military', 'mod', 'dstl', 'dasa',
            'weapons', 'ammunition', 'combat', 'warfare', 'security clearance'
        ]
        for keyword in high_value_keywords:
            if keyword in text_to_check:
                defence_score += 5
        
        # Medium-value keywords (3 points each)
        medium_value_keywords = [
            'army', 'navy', 'air force', 'surveillance', 'intelligence',
            'radar', 'missile', 'tactical', 'strategic', 'cybersecurity'
        ]
        for keyword in medium_value_keywords:
            if keyword in text_to_check:
                defence_score += 3
        
        # Defence organizations (10 points each)
        for org in self.defence_organizations:
            if org in text_to_check:
                defence_score += 10
        
        # Technology keywords need defence context (2 points each)
        tech_keywords = ['ai', 'quantum', 'robotics', 'sensors', 'communications']
        for keyword in tech_keywords:
            if keyword in text_to_check:
                # Only count if there's defence context
                if any(defence_word in text_to_check for defence_word in ['defence', 'defense', 'military', 'security']):
                    defence_score += 2
        
        # Require minimum score of 5 for acceptance
        return defence_score >= 5

    async def collect_defence_opportunities(self) -> List[Dict]:
        """
        Collect ONLY defence-related opportunities with strict filtering
        """
        print("🎯 COLLECTING STRICTLY DEFENCE-RELATED OPPORTUNITIES...")
        
        opportunities = []
        
        # DEFENCE-SPECIFIC search terms
        defence_search_terms = [
            'ministry of defence', 'mod contracts', 'dstl',
            'defence equipment support', 'army contracts',
            'royal navy contracts', 'raf contracts',
            'military equipment', 'defence technology',
            'security clearance', 'classified contracts',
            'weapons systems', 'military communications',
            'defence cybersecurity', 'military radar',
            'submarine technology', 'aircraft maintenance',
            'missile systems', 'armoured vehicles',
            'military training', 'defence research'
        ]
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
        
        connector = aiohttp.TCPConnector(limit=10)
        timeout = aiohttp.ClientTimeout(total=30)
        
        async with aiohttp.ClientSession(
            connector=connector, timeout=timeout, headers=headers
        ) as session:
            
            # UK Contracts Finder with defence-specific searches
            for search_term in defence_search_terms[:10]:  # Top 10 most specific terms
                try:
                    url = f"https://www.contractsfinder.service.gov.uk/Search?searchTerm={search_term.replace(' ', '%20')}"
                    
                    async with session.get(url) as response:
                        if response.status == 200:
                            html = await response.text()
                            soup = BeautifulSoup(html, 'html.parser')
                            
                            # Look for contract results
                            contract_elements = soup.select('div[class*="result"], article[class*="contract"]')
                            
                            for element in contract_elements[:5]:  # Max 5 per search
                                try:
                                    title_elem = element.find(['h2', 'h3', 'h4']) or element.find('a')
                                    title = title_elem.get_text(strip=True) if title_elem else ''
                                    
                                    if len(title) < 10:
                                        continue
                                    
                                    desc_elem = element.find('p') or element.find('div', class_=re.compile(r'description'))
                                    description = desc_elem.get_text(strip=True) if desc_elem else title
                                    
                                    link_elem = element.find('a', href=True)
                                    official_link = f"https://www.contractsfinder.service.gov.uk{link_elem['href']}" if link_elem and link_elem['href'].startswith('/') else url
                                    
                                    opportunity = {
                                        'id': f"defence_cf_{hash(title + search_term)}",
                                        'title': title[:200],
                                        'funding_body': 'UK Government (Defence Contract)',
                                        'description': description[:500],
                                        'detailed_description': description,
                                        'closing_date': datetime.now() + timedelta(days=30),
                                        'funding_amount': 'TBD',
                                        'tech_areas': self._extract_tech_areas_from_text(title + ' ' + description),
                                        'contract_type': 'Defence Contract',
                                        'official_link': official_link,
                                        'status': 'active',
                                        'created_at': datetime.utcnow(),
                                        'tier_required': 'free',
                                        'source': 'defence_contracts_real',
                                        'search_term': search_term
                                    }
                                    
                                    # STRICT DEFENCE FILTERING
                                    if self.is_defence_related(opportunity):
                                        opportunities.append(opportunity)
                                        print(f"✅ Defence opportunity: {title[:60]}...")
                                    else:
                                        print(f"❌ Rejected non-defence: {title[:60]}...")
                                        
                                except Exception as e:
                                    continue
                    
                    await asyncio.sleep(1)  # Rate limiting
                    
                except Exception as e:
                    print(f"Error with search term '{search_term}': {e}")
                    continue
            
            # DASA/Innovation sources with defence focus
            dasa_urls = [
                'https://www.gov.uk/government/organisations/defence-and-security-accelerator',
                'https://www.gov.uk/government/collections/defence-and-security-accelerator-dasa-open-calls-for-innovation'
            ]
            
            for url in dasa_urls:
                try:
                    async with session.get(url) as response:
                        if response.status == 200:
                            html = await response.text()
                            soup = BeautifulSoup(html, 'html.parser')
                            
                            # Look for innovation calls
                            innovation_elements = soup.select('a[href*="innovation"], a[href*="competition"], div[class*="call"]')
                            
                            for element in innovation_elements[:10]:
                                try:
                                    if element.name == 'a':
                                        title = element.get_text(strip=True)
                                        link = element.get('href', '')
                                    else:
                                        title_elem = element.find('a')
                                        title = title_elem.get_text(strip=True) if title_elem else ''
                                        link = title_elem.get('href', '') if title_elem else ''
                                    
                                    if len(title) < 10:
                                        continue
                                    
                                    # Create DASA opportunity
                                    opportunity = {
                                        'id': f"dasa_{hash(title + url)}",
                                        'title': title[:200],
                                        'funding_body': 'Defence & Security Accelerator (DASA)',
                                        'description': f'DASA innovation opportunity: {title}',
                                        'detailed_description': f'Defence and Security Accelerator innovation call: {title}',
                                        'closing_date': datetime.now() + timedelta(days=60),
                                        'funding_amount': '£25K - £1M',
                                        'tech_areas': ['Defence Innovation'],
                                        'contract_type': 'Defence Innovation',
                                        'official_link': link if link.startswith('http') else f"https://www.gov.uk{link}",
                                        'status': 'active',
                                        'created_at': datetime.utcnow(),
                                        'tier_required': 'free',
                                        'source': 'dasa_real'
                                    }
                                    
                                    # All DASA opportunities are defence by nature
                                    opportunities.append(opportunity)
                                    print(f"✅ DASA opportunity: {title[:60]}...")
                                    
                                except Exception as e:
                                    continue
                                    
                except Exception as e:
                    print(f"Error with DASA URL {url}: {e}")
                    continue
        
        print(f"\n🎯 DEFENCE FILTERING COMPLETE:")
        print(f"   📊 Total defence opportunities: {len(opportunities)}")
        
        return opportunities

    def _extract_tech_areas_from_text(self, text: str) -> List[str]:
        """Extract technology areas with defence context"""
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