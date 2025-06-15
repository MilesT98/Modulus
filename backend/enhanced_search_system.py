"""
Enhanced Search System for Defence Opportunities
Provides semantic search, intelligent filtering, and AI-powered recommendations
"""

import re
import json
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
import math
from collections import defaultdict

class EnhancedDefenceSearch:
    def __init__(self):
        # Technology synonyms and related terms
        self.tech_synonyms = {
            'ai': ['artificial intelligence', 'machine learning', 'neural networks', 'deep learning', 'cognitive computing'],
            'drone': ['uav', 'unmanned aerial vehicle', 'uas', 'unmanned aircraft', 'autonomous aircraft'],
            'cyber': ['cybersecurity', 'information security', 'network security', 'digital security'],
            'satellite': ['space', 'orbital', 'space-based', 'constellation'],
            'radar': ['sensing', 'detection', 'surveillance', 'monitoring', 'tracking'],
            'naval': ['maritime', 'marine', 'ship', 'vessel', 'underwater', 'submarine'],
            'software': ['application', 'system', 'platform', 'solution', 'digital'],
            'communication': ['comms', 'radio', 'transmission', 'networking', 'connectivity']
        }
        
        # Intent patterns for natural language queries
        self.intent_patterns = {
            'closing_soon': [
                r'closing (soon|this week|next week)',
                r'deadline (approaching|near|urgent)',
                r'(urgent|immediate|quick) opportunities'
            ],
            'high_value': [
                r'high value|large contract|big opportunity',
                r'million|billion|\£\d+[mk]',
                r'major procurement|significant contract'
            ],
            'sme_friendly': [
                r'sme|small business|startup',
                r'easy to win|low competition',
                r'beginner friendly|accessible'
            ],
            'technology_focus': [
                r'(latest|newest|cutting.edge|advanced|emerging) technology',
                r'innovation|research|development|r&d'
            ]
        }
        
        # Scoring weights for relevance calculation
        self.scoring_weights = {
            'title_exact_match': 3.0,
            'title_partial_match': 2.0,
            'description_match': 1.5,
            'tech_tag_match': 2.5,
            'funding_body_match': 1.0,
            'synonym_match': 1.2,
            'recency_bonus': 0.5,
            'sme_score_bonus': 1.0
        }
    
    def semantic_search(self, opportunities: List[Dict], query: str, 
                       filters: Optional[Dict] = None) -> List[Dict]:
        """
        Perform semantic search with natural language understanding
        """
        if not query.strip():
            return self.apply_filters(opportunities, filters or {})
        
        # Detect search intent
        intent = self.detect_intent(query)
        
        # Expand query with synonyms
        expanded_query = self.expand_query_with_synonyms(query)
        
        # Score opportunities
        scored_opportunities = []
        for opp in opportunities:
            score = self.calculate_relevance_score(opp, query, expanded_query, intent)
            if score > 0:  # Only include relevant results
                opp_copy = opp.copy()
                opp_copy['relevance_score'] = score
                opp_copy['search_highlights'] = self.generate_highlights(opp, expanded_query)
                scored_opportunities.append(opp_copy)
        
        # Sort by relevance score
        scored_opportunities.sort(key=lambda x: x['relevance_score'], reverse=True)
        
        # Apply additional filters
        filtered_opportunities = self.apply_filters(scored_opportunities, filters or {})
        
        return filtered_opportunities
    
    def detect_intent(self, query: str) -> Dict[str, bool]:
        """Detect user intent from natural language query"""
        query_lower = query.lower()
        intent = {}
        
        for intent_type, patterns in self.intent_patterns.items():
            intent[intent_type] = any(re.search(pattern, query_lower) for pattern in patterns)
        
        return intent
    
    def expand_query_with_synonyms(self, query: str) -> List[str]:
        """Expand query terms with synonyms and related terms"""
        query_terms = re.findall(r'\b\w+\b', query.lower())
        expanded_terms = set(query_terms)
        
        for term in query_terms:
            for key, synonyms in self.tech_synonyms.items():
                if term in synonyms or term == key:
                    expanded_terms.update(synonyms)
                    expanded_terms.add(key)
        
        return list(expanded_terms)
    
    def calculate_relevance_score(self, opportunity: Dict, original_query: str, 
                                expanded_query: List[str], intent: Dict) -> float:
        """Calculate relevance score for an opportunity"""
        score = 0.0
        
        # Text fields to search
        title = opportunity.get('title', '').lower()
        description = opportunity.get('description', '').lower()
        tech_tags = [tag.lower() for tag in opportunity.get('tech_tags', [])]
        funding_body = opportunity.get('funding_body', '').lower()
        
        original_terms = re.findall(r'\b\w+\b', original_query.lower())
        
        # Exact matches in title (highest weight)
        for term in original_terms:
            if term in title:
                score += self.scoring_weights['title_exact_match']
        
        # Partial matches in title
        title_words = re.findall(r'\b\w+\b', title)
        for term in original_terms:
            for word in title_words:
                if term in word or word in term:
                    score += self.scoring_weights['title_partial_match']
        
        # Description matches
        for term in expanded_query:
            if term in description:
                score += self.scoring_weights['description_match']
        
        # Technology tag matches
        for term in expanded_query:
            for tag in tech_tags:
                if term in tag or tag in term:
                    score += self.scoring_weights['tech_tag_match']
        
        # Funding body matches
        for term in original_terms:
            if term in funding_body:
                score += self.scoring_weights['funding_body_match']
        
        # Intent-based scoring adjustments
        if intent.get('closing_soon'):
            deadline = opportunity.get('closing_date')
            if deadline and isinstance(deadline, datetime):
                days_until_deadline = (deadline - datetime.utcnow()).days
                if days_until_deadline <= 14:
                    score += 2.0  # Boost for urgent opportunities
        
        if intent.get('high_value'):
            funding_amount = opportunity.get('funding_amount', '')
            amount_value = self.extract_monetary_value(funding_amount)
            if amount_value and amount_value >= 1000000:  # £1M+
                score += 1.5
        
        if intent.get('sme_friendly'):
            sme_score = opportunity.get('enhanced_metadata', {}).get('sme_score', 0)
            if sme_score > 0.7:
                score += self.scoring_weights['sme_score_bonus']
        
        # Recency bonus
        created_at = opportunity.get('created_at')
        if created_at and isinstance(created_at, datetime):
            days_old = (datetime.utcnow() - created_at).days
            if days_old <= 7:
                score += self.scoring_weights['recency_bonus']
        
        return score
    
    def extract_monetary_value(self, amount_str: str) -> Optional[float]:
        """Extract monetary value from string"""
        if not amount_str:
            return None
        
        # Remove currency symbols and commas
        cleaned = re.sub(r'[£$€,]', '', amount_str)
        
        # Look for number with multiplier
        match = re.search(r'(\d+(?:\.\d+)?)\s*([kmb]?)', cleaned.lower())
        if match:
            number = float(match.group(1))
            multiplier = match.group(2)
            
            if multiplier == 'k':
                return number * 1000
            elif multiplier == 'm':
                return number * 1000000
            elif multiplier == 'b':
                return number * 1000000000
            else:
                return number
        
        return None
    
    def generate_highlights(self, opportunity: Dict, query_terms: List[str]) -> Dict[str, List[str]]:
        """Generate search result highlights"""
        highlights = {'title': [], 'description': [], 'tech_tags': []}
        
        title = opportunity.get('title', '')
        description = opportunity.get('description', '')
        tech_tags = opportunity.get('tech_tags', [])
        
        # Highlight matches in title
        for term in query_terms:
            if term.lower() in title.lower():
                highlights['title'].append(term)
        
        # Highlight matches in description
        for term in query_terms:
            if term.lower() in description.lower():
                highlights['description'].append(term)
        
        # Highlight matching tech tags
        for term in query_terms:
            for tag in tech_tags:
                if term.lower() in tag.lower():
                    highlights['tech_tags'].append(tag)
        
        return highlights
    
    def apply_filters(self, opportunities: List[Dict], filters: Dict) -> List[Dict]:
        """Apply advanced filters to opportunities"""
        filtered = opportunities.copy()
        
        # Funding body filter
        if filters.get('funding_bodies'):
            funding_bodies = filters['funding_bodies']
            filtered = [opp for opp in filtered 
                       if any(body.lower() in opp.get('funding_body', '').lower() 
                             for body in funding_bodies)]
        
        # Technology areas filter
        if filters.get('tech_areas'):
            tech_areas = filters['tech_areas']
            filtered = [opp for opp in filtered 
                       if any(area in opp.get('tech_tags', []) for area in tech_areas)]
        
        # Value range filter
        if filters.get('value_min') or filters.get('value_max'):
            value_min = filters.get('value_min', 0)
            value_max = filters.get('value_max', float('inf'))
            
            def value_in_range(opp):
                amount = self.extract_monetary_value(opp.get('funding_amount', ''))
                return amount and value_min <= amount <= value_max
            
            filtered = [opp for opp in filtered if value_in_range(opp)]
        
        # Deadline proximity filter
        if filters.get('deadline_days'):
            deadline_days = filters['deadline_days']
            cutoff_date = datetime.utcnow() + timedelta(days=deadline_days)
            
            filtered = [opp for opp in filtered 
                       if opp.get('closing_date') and 
                       opp['closing_date'] <= cutoff_date]
        
        # SME suitability filter
        if filters.get('sme_friendly'):
            filtered = [opp for opp in filtered 
                       if opp.get('enhanced_metadata', {}).get('sme_score', 0) >= 0.6]
        
        # Status filter
        if filters.get('status'):
            status = filters['status']
            filtered = [opp for opp in filtered if opp.get('status') == status]
        
        return filtered
    
    def get_search_suggestions(self, partial_query: str, opportunities: List[Dict]) -> List[str]:
        """Generate search suggestions based on partial query"""
        suggestions = set()
        
        # Technology-based suggestions
        for tech_area in self.tech_synonyms.keys():
            if partial_query.lower() in tech_area or tech_area.startswith(partial_query.lower()):
                suggestions.add(tech_area.title())
        
        # Funding body suggestions
        funding_bodies = set()
        for opp in opportunities:
            funding_body = opp.get('funding_body', '')
            if funding_body and partial_query.lower() in funding_body.lower():
                funding_bodies.add(funding_body)
        
        suggestions.update(list(funding_bodies)[:5])
        
        # Popular search patterns
        if len(partial_query) >= 3:
            patterns = [
                f"{partial_query} opportunities",
                f"{partial_query} contracts",
                f"{partial_query} funding",
                f"{partial_query} procurement"
            ]
            suggestions.update(patterns)
        
        return sorted(list(suggestions))[:10]
    
    def analyze_search_performance(self, opportunities: List[Dict], query: str) -> Dict:
        """Analyze search performance and provide insights"""
        results = self.semantic_search(opportunities, query)
        
        analysis = {
            'total_results': len(results),
            'avg_relevance_score': sum(r.get('relevance_score', 0) for r in results) / max(len(results), 1),
            'top_funding_bodies': self.get_top_funding_bodies(results),
            'top_tech_areas': self.get_top_tech_areas(results),
            'value_distribution': self.analyze_value_distribution(results),
            'deadline_distribution': self.analyze_deadline_distribution(results)
        }
        
        return analysis
    
    def get_top_funding_bodies(self, opportunities: List[Dict], limit: int = 5) -> List[Tuple[str, int]]:
        """Get top funding bodies from search results"""
        counter = defaultdict(int)
        for opp in opportunities:
            funding_body = opp.get('funding_body', 'Unknown')
            counter[funding_body] += 1
        
        return sorted(counter.items(), key=lambda x: x[1], reverse=True)[:limit]
    
    def get_top_tech_areas(self, opportunities: List[Dict], limit: int = 5) -> List[Tuple[str, int]]:
        """Get top technology areas from search results"""
        counter = defaultdict(int)
        for opp in opportunities:
            for tag in opp.get('tech_tags', []):
                counter[tag] += 1
        
        return sorted(counter.items(), key=lambda x: x[1], reverse=True)[:limit]
    
    def analyze_value_distribution(self, opportunities: List[Dict]) -> Dict:
        """Analyze the distribution of contract values"""
        values = []
        for opp in opportunities:
            value = self.extract_monetary_value(opp.get('funding_amount', ''))
            if value:
                values.append(value)
        
        if not values:
            return {'count': 0}
        
        return {
            'count': len(values),
            'min': min(values),
            'max': max(values),
            'avg': sum(values) / len(values),
            'total': sum(values)
        }
    
    def analyze_deadline_distribution(self, opportunities: List[Dict]) -> Dict:
        """Analyze the distribution of opportunity deadlines"""
        now = datetime.utcnow()
        urgent = medium = long_term = 0
        
        for opp in opportunities:
            deadline = opp.get('closing_date')
            if deadline and isinstance(deadline, datetime):
                days_until = (deadline - now).days
                if days_until <= 14:
                    urgent += 1
                elif days_until <= 60:
                    medium += 1
                else:
                    long_term += 1
        
        return {
            'urgent': urgent,      # <= 14 days
            'medium': medium,      # 15-60 days
            'long_term': long_term # > 60 days
        }

# Example usage and testing
if __name__ == "__main__":
    search_engine = EnhancedDefenceSearch()
    
    # Test semantic search
    test_opportunities = [
        {
            'title': 'AI-powered Surveillance System',
            'description': 'Advanced artificial intelligence system for border surveillance',
            'funding_body': 'Home Office',
            'tech_tags': ['AI/ML', 'Surveillance', 'Sensors'],
            'funding_amount': '£2,500,000'
        }
    ]
    
    results = search_engine.semantic_search(test_opportunities, "artificial intelligence border security")
    print(f"Search results: {len(results)}")
    
    if results:
        print(f"Top result: {results[0]['title']}")
        print(f"Relevance score: {results[0].get('relevance_score', 0):.2f}")