import sys
from pymongo import MongoClient
from datetime import datetime, timedelta
import uuid

# Database connection
MONGO_URL = 'mongodb://localhost:27017'
DB_NAME = 'modulus_defence'

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Collections
opportunities_collection = db.opportunities

def create_real_defence_opportunities():
    """Create the required real defence opportunities for testing"""
    # Free tier opportunities (4)
    free_opportunities = [
        {
            "id": str(uuid.uuid4()),
            "title": "Supply and Installation of Advanced Radar Systems for Royal Navy Fleet",
            "funding_body": "MOD",
            "description": "The Ministry of Defence is seeking suppliers to provide and install advanced radar systems for the Royal Navy fleet. This contract includes supply, installation, testing, and maintenance services.",
            "detailed_description": "Comprehensive radar systems with advanced detection capabilities required for Royal Navy vessels. Systems must meet NATO standards and integrate with existing fleet infrastructure.",
            "closing_date": datetime.utcnow() + timedelta(days=30),
            "funding_amount": "£25M",
            "tech_areas": ["Radar Systems", "Maritime Defence", "Electronics"],
            "mod_department": "Royal Navy",
            "trl_level": "TRL 7-9",
            "contract_type": "ITT",
            "official_link": "https://www.gov.uk/contracts-finder",
            "status": "active",
            "created_at": datetime.utcnow(),
            "tier_required": "free",
            "is_delayed_for_free": False
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Artificial Intelligence Research and Development for Defence Applications",
            "funding_body": "Dstl",
            "description": "The Defence Science and Technology Laboratory (Dstl) is seeking proposals for innovative AI solutions that can enhance defence capabilities across multiple domains.",
            "detailed_description": "Research and development of AI algorithms and systems for military applications including threat detection, autonomous systems, and decision support tools.",
            "closing_date": datetime.utcnow() + timedelta(days=45),
            "funding_amount": "£8.5M",
            "tech_areas": ["Artificial Intelligence", "Machine Learning", "Defence Technology"],
            "mod_department": "Dstl",
            "trl_level": "TRL 3-6",
            "contract_type": "RFP",
            "official_link": "https://www.gov.uk/government/organisations/defence-science-and-technology-laboratory",
            "status": "active",
            "created_at": datetime.utcnow(),
            "tier_required": "free",
            "is_delayed_for_free": False
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Cybersecurity Services Framework for Defence Networks",
            "funding_body": "DE&S",
            "description": "Defence Equipment and Support (DE&S) is establishing a framework for cybersecurity services to protect critical defence networks and infrastructure from evolving threats.",
            "detailed_description": "Comprehensive cybersecurity services including threat monitoring, vulnerability assessment, penetration testing, and incident response for defence networks.",
            "closing_date": datetime.utcnow() + timedelta(days=60),
            "funding_amount": "£50M",
            "tech_areas": ["Cybersecurity", "Network Security", "Information Assurance"],
            "mod_department": "DE&S",
            "trl_level": "TRL 7-9",
            "contract_type": "Framework",
            "official_link": "https://www.gov.uk/government/organisations/defence-equipment-and-support",
            "status": "active",
            "created_at": datetime.utcnow(),
            "tier_required": "free",
            "is_delayed_for_free": False
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Military Base Infrastructure Modernisation Programme",
            "funding_body": "DIO",
            "description": "The Defence Infrastructure Organisation (DIO) is seeking contractors for a major infrastructure modernisation programme across multiple UK military bases.",
            "detailed_description": "Comprehensive infrastructure upgrade including buildings, utilities, security systems, and communications networks at key military installations.",
            "closing_date": datetime.utcnow() + timedelta(days=90),
            "funding_amount": "£120M",
            "tech_areas": ["Construction", "Infrastructure", "Security Systems"],
            "mod_department": "DIO",
            "trl_level": "TRL 8-9",
            "contract_type": "Design & Build",
            "official_link": "https://www.gov.uk/government/organisations/defence-infrastructure-organisation",
            "status": "active",
            "created_at": datetime.utcnow(),
            "tier_required": "free",
            "is_delayed_for_free": False
        }
    ]
    
    # Pro tier opportunities (2)
    pro_opportunities = [
        {
            "id": str(uuid.uuid4()),
            "title": "Advanced Composite Materials for Next-Generation Fighter Aircraft",
            "funding_body": "BAE Systems",
            "description": "BAE Systems is seeking suppliers of advanced composite materials for the development of next-generation fighter aircraft with enhanced performance characteristics.",
            "detailed_description": "Development and supply of lightweight, high-strength composite materials for aircraft structures with specific requirements for heat resistance, radar absorption, and durability.",
            "closing_date": datetime.utcnow() + timedelta(days=40),
            "funding_amount": "£15M",
            "tech_areas": ["Advanced Materials", "Aerospace", "Manufacturing"],
            "mod_department": "N/A",
            "trl_level": "TRL 6-8",
            "contract_type": "Subcontract",
            "official_link": "https://www.baesystems.com/en/suppliers",
            "status": "active",
            "created_at": datetime.utcnow(),
            "tier_required": "pro",
            "is_delayed_for_free": True
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Secure Military Communications Systems Integration",
            "funding_body": "Leonardo UK",
            "description": "Leonardo UK is seeking partners for the integration of secure communications systems for military applications, with a focus on interoperability and encryption.",
            "detailed_description": "Integration of secure voice, data, and video communication systems for military platforms with advanced encryption, anti-jamming capabilities, and interoperability with NATO systems.",
            "closing_date": datetime.utcnow() + timedelta(days=50),
            "funding_amount": "£12M",
            "tech_areas": ["Communications", "Encryption", "Systems Integration"],
            "mod_department": "N/A",
            "trl_level": "TRL 7-9",
            "contract_type": "Subcontract",
            "official_link": "https://www.leonardo.com/en/suppliers",
            "status": "active",
            "created_at": datetime.utcnow(),
            "tier_required": "pro",
            "is_delayed_for_free": True
        }
    ]
    
    # Clear existing opportunities
    opportunities_collection.delete_many({})
    
    # Insert free tier opportunities
    opportunities_collection.insert_many(free_opportunities)
    print(f"✅ Inserted {len(free_opportunities)} free tier opportunities")
    
    # Insert pro tier opportunities
    opportunities_collection.insert_many(pro_opportunities)
    print(f"✅ Inserted {len(pro_opportunities)} pro tier opportunities")
    
    return len(free_opportunities) + len(pro_opportunities)

def main():
    print("\n🚀 Populating database with real defence opportunities\n")
    
    # Create opportunities
    total_created = create_real_defence_opportunities()
    
    print(f"\n✅ Successfully created {total_created} real defence opportunities")
    return 0

if __name__ == "__main__":
    sys.exit(main())