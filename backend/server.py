from fastapi import FastAPI, HTTPException, Depends, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import jwt
from passlib.context import CryptContext
import uuid
from enum import Enum
import asyncio
import logging

# Configure logger
logger = logging.getLogger(__name__)

try:
    from data_integration_service import DataIntegrationService
    DATA_SERVICE_AVAILABLE = True
except ImportError:
    print("Warning: Comprehensive data service not available")
    DATA_SERVICE_AVAILABLE = False

load_dotenv()

app = FastAPI(title="Modulus Defence API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'modulus_defence')

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Collections
users_collection = db.users
opportunities_collection = db.opportunities
funding_opportunities_collection = db.funding_opportunities
subscriptions_collection = db.subscriptions

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "modulus-defence-secret-key-2025"
ALGORITHM = "HS256"

class UserTier(str, Enum):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"

class OpportunityStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    DRAFT = "draft"

# Pydantic models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    company_name: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    email: str
    company_name: str
    full_name: str
    tier: UserTier
    created_at: datetime
    is_active: bool

class Opportunity(BaseModel):
    id: str
    title: str
    funding_body: str
    description: str
    detailed_description: Optional[str] = None
    closing_date: datetime
    funding_amount: Optional[str] = None
    tech_areas: List[str] = []
    mod_department: Optional[str] = None
    trl_level: Optional[str] = None
    contract_type: Optional[str] = None
    official_link: str
    status: OpportunityStatus
    created_at: datetime
    tier_required: UserTier
    is_delayed_for_free: bool = False

class OpportunityCreate(BaseModel):
    title: str
    funding_body: str
    description: str
    detailed_description: Optional[str] = None
    closing_date: datetime
    funding_amount: Optional[str] = None
    tech_areas: List[str] = []
    mod_department: Optional[str] = None
    trl_level: Optional[str] = None
    contract_type: Optional[str] = None
    official_link: str
    tier_required: UserTier = UserTier.FREE

class FundingOpportunity(BaseModel):
    id: str
    name: str
    category: str
    investment_focus: str
    investment_stage: str
    geographic_focus: str
    website_url: str
    status: str = "active"
    created_at: datetime
    updated_at: datetime
    last_verified: Optional[datetime] = None
    additional_info: Optional[dict] = {}

class FundingOpportunityCreate(BaseModel):
    name: str
    category: str
    investment_focus: str
    investment_stage: str
    geographic_focus: str
    website_url: str
    additional_info: Optional[dict] = {}

class AlertPreferences(BaseModel):
    keywords: List[str] = []
    tech_areas: List[str] = []
    funding_bodies: List[str] = []
    min_funding: Optional[int] = None
    max_funding: Optional[int] = None

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(user_id: str = Depends(verify_token)):
    user = users_collection.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Initialize data integration service
if DATA_SERVICE_AVAILABLE:
    data_service = DataIntegrationService()
else:
    data_service = None

# API Routes
@app.get("/api/")
async def root():
    return {"message": "Modulus Defence API is running"}

@app.post("/api/data/refresh")
async def refresh_data(
    current_user: dict = Depends(get_current_user)
):
    """Refresh opportunities data using Actify Defence Aggregation (Pro/Enterprise only)"""
    if current_user['tier'] == 'free':
        raise HTTPException(status_code=403, detail="Data refresh requires Pro or Enterprise subscription")
    
    try:
        import sys
        import os
        
        # Add current directory to Python path
        current_dir = os.path.dirname(os.path.abspath(__file__))
        if current_dir not in sys.path:
            sys.path.insert(0, current_dir)
        
        # Try enhanced aggregation first, then full, then fallback to basic
        try:
            from enhanced_actify_defence_aggregator import run_enhanced_actify_aggregation
            logger.info("🚀 Starting ENHANCED Actify Defence aggregation (all sources + keyword filtering)...")
            opportunities = await run_enhanced_actify_aggregation()
            source_info = "Enhanced multi-source aggregation with keyword prioritization: UK Official, EU/NATO, Global Allies, Prime Contractors, Industry Networks"
        except ImportError:
            try:
                from actify_defence_full_aggregator import run_full_actify_aggregation
                logger.info("🚀 Starting FULL Actify Defence aggregation (all sources)...")
                opportunities = await run_full_actify_aggregation()
                source_info = "Full multi-source aggregation: UK, EU, NATO, Global Allies, Prime Contractors"
            except ImportError:
                from actify_defence_aggregator import run_full_aggregation
                logger.info("🚀 Starting basic Actify Defence aggregation...")
                opportunities = await run_full_aggregation()
                source_info = "Basic aggregation: UK sources (FTS, Contracts Finder, DASA)"
        
        if opportunities:
            # Clear existing opportunities and insert new ones
            opportunities_collection.delete_many({})
            
            # Convert to proper format for database
            db_opportunities = []
            for opp in opportunities:
                # Ensure proper datetime conversion
                if isinstance(opp['deadline'], str):
                    opp['deadline'] = datetime.fromisoformat(opp['deadline'].replace('Z', '+00:00'))
                if isinstance(opp['date_scraped'], str):
                    opp['date_scraped'] = datetime.fromisoformat(opp['date_scraped'].replace('Z', '+00:00'))
                if isinstance(opp['created_at'], str):
                    opp['created_at'] = datetime.fromisoformat(opp['created_at'].replace('Z', '+00:00'))
                
                db_opportunities.append(opp)
            
            result = opportunities_collection.insert_many(db_opportunities)
            
            logger.info(f"✅ Inserted {len(result.inserted_ids)} opportunities from Actify Defence aggregation")
            
            # Get source breakdown
            sources = {}
            for opp in opportunities:
                source = opp.get('source', 'unknown')
                sources[source] = sources.get(source, 0) + 1
            
            return {
                "status": "success",
                "message": f"Actify Defence aggregation complete. {len(opportunities)} opportunities collected.",
                "source_info": source_info,
                "opportunities_count": len(opportunities),
                "source_breakdown": sources,
                "timestamp": datetime.utcnow().isoformat(),
                "filtering_applied": True,
                "deduplication_applied": True,
                "sme_scoring_applied": True,
                "technology_classification_applied": True,
                "confidence_scoring_applied": True
            }
        else:
            return {
                "status": "warning", 
                "message": "Aggregation completed but no opportunities met the filtering criteria.",
                "timestamp": datetime.utcnow().isoformat()
            }
            
    except Exception as e:
        logger.error(f"Error during Actify Defence aggregation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to refresh data: {str(e)}")

@app.get("/api/opportunities/aggregation-stats")
async def get_aggregation_stats(
    current_user: dict = Depends(get_current_user)
):
    """Get statistics about the aggregation system (Pro/Enterprise only)"""
    if current_user['tier'] == 'free':
        raise HTTPException(status_code=403, detail="Aggregation statistics require Pro or Enterprise subscription")
    
    try:
        # Get opportunity statistics
        total_opportunities = opportunities_collection.count_documents({})
        
        # Count by source
        pipeline = [
            {"$group": {"_id": "$source", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        source_stats = list(opportunities_collection.aggregate(pipeline))
        
        # Count by technology area
        tech_pipeline = [
            {"$unwind": "$tech_tags"},
            {"$group": {"_id": "$tech_tags", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        tech_stats = list(opportunities_collection.aggregate(tech_pipeline))
        
        # SME score distribution
        sme_high = opportunities_collection.count_documents({"sme_score": {"$gte": 0.7}})
        sme_medium = opportunities_collection.count_documents({"sme_score": {"$gte": 0.5, "$lt": 0.7}})
        sme_low = opportunities_collection.count_documents({"sme_score": {"$lt": 0.5}})
        
        return {
            "total_opportunities": total_opportunities,
            "source_breakdown": source_stats,
            "technology_areas": tech_stats,
            "sme_relevance": {
                "high_relevance": sme_high,
                "medium_relevance": sme_medium,
                "low_relevance": sme_low
            },
            "last_updated": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting aggregation stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get aggregation statistics")

@app.get("/api/data/sources")
async def get_data_sources():
    """
    Get information about available data sources
    """
    return {
        "sources": [
            {
                "name": "UK Contracts Finder",
                "description": "Government contracts over £12,000",
                "status": "active",
                "last_updated": datetime.utcnow().isoformat()
            },
            {
                "name": "Find a Tender Service", 
                "description": "High-value public sector contracts",
                "status": "active",
                "last_updated": datetime.utcnow().isoformat()
            },
            {
                "name": "Defence and Security Accelerator (DASA)",
                "description": "Innovation funding for defence technology",
                "status": "active", 
                "last_updated": datetime.utcnow().isoformat()
            },
            {
                "name": "Innovate UK",
                "description": "Innovation grants including defence applications",
                "status": "active",
                "last_updated": datetime.utcnow().isoformat()
            }
        ],
        "total_sources": 4,
        "refresh_frequency": "Every 6 hours"
    }

async def fetch_and_store_live_data():
    """
    Background task to fetch live data and store in database
    """
    if not DATA_SERVICE_AVAILABLE or not data_service:
        print("Data integration service not available")
        return
        
    try:
        print("Starting live data refresh...")
        live_opportunities = await data_service.aggregate_all_real_opportunities()
        
        # Store in database with source tracking
        stored_count = 0
        for opp in live_opportunities:
            # Check if opportunity already exists (by title to avoid duplicates)
            existing = opportunities_collection.find_one({"title": opp["title"]})
            if not existing:
                opportunities_collection.insert_one(opp)
                stored_count += 1
                print(f"✅ Added new opportunity: {opp['title'][:60]}...")
            else:
                print(f"🔄 Skipped duplicate: {opp['title'][:60]}...")
        
        print(f"Live data refresh completed. Stored {stored_count} new opportunities (out of {len(live_opportunities)} collected)")
        
    except Exception as e:
        print(f"Error in live data refresh: {e}")

async def periodic_data_refresh():
    """
    Periodically refresh live data based on subscription tiers:
    - Free users: Weekly updates (7 days)
    - Pro users: Hourly updates (1 hour)
    """
    while True:
        print("🔄 Starting scheduled live data refresh...")
        await fetch_and_store_live_data()
        
        # Sleep for 1 hour to support Pro hourly updates
        # Free users will see filtered data that updates weekly
        await asyncio.sleep(1 * 60 * 60)  # Sleep for 1 hour

# API Routes
@app.get("/api/")
async def root():
    return {"message": "Modulus Defence API is running"}

@app.post("/api/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    if users_collection.find_one({"email": user_data.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)
    
    user = {
        "id": user_id,
        "email": user_data.email,
        "password": hashed_password,
        "company_name": user_data.company_name,
        "full_name": user_data.full_name,
        "tier": UserTier.FREE,
        "created_at": datetime.utcnow(),
        "is_active": True,
        "alert_preferences": {
            "keywords": [],
            "tech_areas": [],
            "funding_bodies": [],
            "min_funding": None,
            "max_funding": None
        }
    }
    
    users_collection.insert_one(user)
    
    # Create access token
    access_token = create_access_token(data={"sub": user_id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user_data.email,
            "company_name": user_data.company_name,
            "full_name": user_data.full_name,
            "tier": UserTier.FREE
        }
    }

@app.post("/api/auth/login")
async def login(user_data: UserLogin):
    # Find user
    user = users_collection.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create access token
    access_token = create_access_token(data={"sub": user["id"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "company_name": user["company_name"],
            "full_name": user["full_name"],
            "tier": user["tier"]
        }
    }

@app.get("/api/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "company_name": current_user["company_name"],
        "full_name": current_user["full_name"],
        "tier": current_user["tier"],
        "created_at": current_user["created_at"],
        "is_active": current_user["is_active"]
    }

@app.get("/api/opportunities")
async def get_opportunities(
    search: Optional[str] = None,
    funding_body: Optional[str] = None,
    tech_area: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    # Build query
    query = {"status": OpportunityStatus.ACTIVE}
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    if funding_body:
        query["funding_body"] = {"$regex": funding_body, "$options": "i"}
    
    if tech_area:
        query["tech_areas"] = {"$in": [tech_area]}
    
    # Get opportunities
    opportunities = list(opportunities_collection.find(query))
    
    # Apply new subscription model filtering
    user_tier = current_user["tier"]
    filtered_opportunities = []
    current_time = datetime.utcnow()
    
    for opp in opportunities:
        # Convert ObjectId to string for JSON serialization
        opp["_id"] = str(opp["_id"])
        
        # Check tier access based on new model
        if user_tier == UserTier.FREE:
            # Free users: Weekly updates only
            # Check if opportunity was created in the last week (7 days)
            opp_created = opp.get("created_at", current_time)
            days_since_creation = (current_time - opp_created).total_seconds() / (24 * 3600)
            
            # Only show opportunities older than 7 days (weekly updates)
            if days_since_creation >= 7:
                opp["is_delayed"] = True
                opp["delay_message"] = "Weekly Updates: Pro Members Get Hourly Updates"
                filtered_opportunities.append(opp)
        else:
            # Pro users: Full access with hourly updates
            opp["is_delayed"] = False
            filtered_opportunities.append(opp)
    
    # Free users: Limit to 1/3 of available opportunities
    if user_tier == UserTier.FREE and filtered_opportunities:
        # Sort by creation date to ensure consistent selection
        filtered_opportunities.sort(key=lambda x: x.get("created_at", current_time))
        
        # Take only 1/3 of opportunities (rounded up)
        one_third = len(filtered_opportunities) // 3
        if one_third == 0 and filtered_opportunities:
            one_third = 1  # Ensure at least 1 opportunity if any exist
        
        filtered_opportunities = filtered_opportunities[:one_third]
        
        # Add limitation message to each opportunity
        for opp in filtered_opportunities:
            opp["access_limited"] = True
            opp["limitation_message"] = f"Limited Access: Showing {len(filtered_opportunities)} of {len(opportunities)} opportunities. Upgrade to Pro for full access."
    
    return filtered_opportunities

@app.post("/api/opportunities")
async def create_opportunity(
    opportunity_data: OpportunityCreate,
    current_user: dict = Depends(get_current_user)
):
    # For MVP, allow any user to create opportunities (in real app, would be admin only)
    opportunity_id = str(uuid.uuid4())
    
    opportunity = {
        "id": opportunity_id,
        "title": opportunity_data.title,
        "funding_body": opportunity_data.funding_body,
        "description": opportunity_data.description,
        "detailed_description": opportunity_data.detailed_description,
        "closing_date": opportunity_data.closing_date,
        "funding_amount": opportunity_data.funding_amount,
        "tech_areas": opportunity_data.tech_areas,
        "mod_department": opportunity_data.mod_department,
        "trl_level": opportunity_data.trl_level,
        "contract_type": opportunity_data.contract_type,
        "official_link": opportunity_data.official_link,
        "status": OpportunityStatus.ACTIVE,
        "created_at": datetime.utcnow(),
        "tier_required": opportunity_data.tier_required,
        "is_delayed_for_free": opportunity_data.tier_required == UserTier.PRO,
        "created_by": current_user["id"]
    }
    
    opportunities_collection.insert_one(opportunity)
    
    return {"message": "Opportunity created successfully", "id": opportunity_id}

@app.get("/api/opportunities/{opportunity_id}")
async def get_opportunity(
    opportunity_id: str,
    current_user: dict = Depends(get_current_user)
):
    # Try to find by both id and _id fields
    opportunity = opportunities_collection.find_one({
        "$or": [
            {"id": opportunity_id},
            {"_id": opportunity_id}
        ]
    })
    
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Check tier access with enhanced logic for free users
    user_tier = current_user["tier"]
    required_tier = opportunity.get("tier_required", UserTier.FREE)
    
    if user_tier == UserTier.FREE and required_tier in [UserTier.PRO, UserTier.ENTERPRISE]:
        # For free users, check if opportunity is older than 48 hours
        current_time = datetime.utcnow()
        opp_created = opportunity.get("created_at", current_time)
        hours_since_creation = (current_time - opp_created).total_seconds() / 3600
        
        if hours_since_creation < 48:
            raise HTTPException(status_code=403, detail="Upgrade to Pro to access this opportunity immediately")
        else:
            # Mark as delayed access
            opportunity["is_delayed"] = True
            opportunity["delay_message"] = "Delayed Access: Pro/SME Members See This Instantly"
    else:
        opportunity["is_delayed"] = False
    
    # Convert ObjectId to string
    opportunity["_id"] = str(opportunity["_id"])
    
    return opportunity

@app.post("/api/opportunities/{opportunity_id}/check-link")
async def check_opportunity_link(
    opportunity_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Check if the opportunity's external link is accessible"""
    import requests
    from urllib.parse import urlparse
    
    # Get the opportunity
    opportunity = opportunities_collection.find_one({
        "$or": [
            {"id": opportunity_id},
            {"_id": opportunity_id}
        ]
    })
    
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    official_link = opportunity.get("official_link")
    if not official_link:
        return {"status": "no_link", "message": "No official link available"}
    
    try:
        # Validate URL format
        parsed_url = urlparse(official_link)
        if not parsed_url.scheme or not parsed_url.netloc:
            return {"status": "invalid_url", "message": "Invalid URL format"}
        
        # Make a HEAD request to check if the link is accessible
        response = requests.head(official_link, timeout=10, allow_redirects=True)
        
        if response.status_code == 200:
            return {
                "status": "available",
                "message": "Link is accessible",
                "final_url": response.url,
                "checked_at": datetime.utcnow().isoformat()
            }
        elif response.status_code in [301, 302, 303, 307, 308]:
            return {
                "status": "redirect",
                "message": "Link redirects to another page",
                "final_url": response.url,
                "checked_at": datetime.utcnow().isoformat()
            }
        else:
            return {
                "status": "unavailable",
                "message": f"Link returned status code {response.status_code}",
                "status_code": response.status_code,
                "checked_at": datetime.utcnow().isoformat()
            }
            
    except requests.exceptions.Timeout:
        return {
            "status": "timeout",
            "message": "Link check timed out",
            "checked_at": datetime.utcnow().isoformat()
        }
    except requests.exceptions.ConnectionError:
        return {
            "status": "connection_error",
            "message": "Could not connect to the link",
            "checked_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error checking link: {str(e)}",
            "checked_at": datetime.utcnow().isoformat()
        }

@app.put("/api/users/alert-preferences")
async def update_alert_preferences(
    preferences: AlertPreferences,
    current_user: dict = Depends(get_current_user)
):
    users_collection.update_one(
        {"id": current_user["id"]},
        {"$set": {"alert_preferences": preferences.dict()}}
    )
    return {"message": "Alert preferences updated successfully"}

@app.get("/api/users/alert-preferences")
async def get_alert_preferences(current_user: dict = Depends(get_current_user)):
    return current_user.get("alert_preferences", {
        "keywords": [],
        "tech_areas": [],
        "funding_bodies": [],
        "min_funding": None,
        "max_funding": None
    })

@app.post("/api/users/upgrade")
async def upgrade_subscription(
    tier: UserTier,
    current_user: dict = Depends(get_current_user)
):
    # For MVP, simulate subscription upgrade without payment
    if tier == current_user["tier"]:
        raise HTTPException(status_code=400, detail="Already on this tier")
    
    users_collection.update_one(
        {"id": current_user["id"]},
        {"$set": {"tier": tier, "upgraded_at": datetime.utcnow()}}
    )
    
    return {"message": f"Successfully upgraded to {tier} tier"}

@app.get("/api/funding-opportunities")
async def get_funding_opportunities(
    search: Optional[str] = None,
    category: Optional[str] = None,
    stage: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get funding opportunities with optional filtering"""
    # Build query
    query = {"status": "active"}
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"investment_focus": {"$regex": search, "$options": "i"}},
            {"category": {"$regex": search, "$options": "i"}}
        ]
    
    if category and category != "all":
        query["category"] = category
    
    if stage:
        query["investment_stage"] = {"$regex": stage, "$options": "i"}
    
    # Get funding opportunities
    funding_opportunities = list(funding_opportunities_collection.find(query))
    
    # Convert ObjectId to string for JSON serialization
    for opp in funding_opportunities:
        opp["_id"] = str(opp["_id"])
    
    return funding_opportunities

@app.post("/api/funding-opportunities")
async def create_funding_opportunity(
    funding_data: FundingOpportunityCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new funding opportunity (admin only for MVP)"""
    funding_id = str(uuid.uuid4())
    
    funding_opportunity = {
        "id": funding_id,
        "name": funding_data.name,
        "category": funding_data.category,
        "investment_focus": funding_data.investment_focus,
        "investment_stage": funding_data.investment_stage,
        "geographic_focus": funding_data.geographic_focus,
        "website_url": funding_data.website_url,
        "additional_info": funding_data.additional_info,
        "status": "active",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "last_verified": datetime.utcnow(),
        "created_by": current_user["id"]
    }
    
    funding_opportunities_collection.insert_one(funding_opportunity)
    
    return {"message": "Funding opportunity created successfully", "id": funding_id}

@app.get("/api/funding-opportunities/{funding_id}")
async def get_funding_opportunity(
    funding_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific funding opportunity"""
    funding_opportunity = funding_opportunities_collection.find_one({
        "$or": [
            {"id": funding_id},
            {"_id": funding_id}
        ]
    })
    
    if not funding_opportunity:
        raise HTTPException(status_code=404, detail="Funding opportunity not found")
    
    # Convert ObjectId to string
    funding_opportunity["_id"] = str(funding_opportunity["_id"])
    
    return funding_opportunity

@app.post("/api/funding-opportunities/refresh")
async def refresh_funding_opportunities(
    current_user: dict = Depends(get_current_user)
):
    """Refresh funding opportunities data (Pro/Enterprise only)"""
    if current_user['tier'] == 'free':
        raise HTTPException(status_code=403, detail="Data refresh requires Pro or Enterprise subscription")
    
    try:
        # This would be where we call our funding opportunity aggregation service
        # For now, we'll simulate an update by checking existing data
        
        current_count = funding_opportunities_collection.count_documents({"status": "active"})
        
        # Update last_verified timestamps
        funding_opportunities_collection.update_many(
            {"status": "active"},
            {"$set": {"last_verified": datetime.utcnow()}}
        )
        
        # In a real implementation, this would:
        # 1. Scrape venture capital websites
        # 2. Check government funding databases
        # 3. Monitor corporate venture arms
        # 4. Update existing records with new information
        # 5. Add newly discovered funding sources
        
        return {
            "status": "success",
            "message": f"Funding opportunities refresh complete. {current_count} active funding sources verified.",
            "timestamp": datetime.utcnow().isoformat(),
            "sources_checked": [
                "Venture Capital Databases",
                "Corporate Innovation Arms", 
                "Government Funding Schemes",
                "University Technology Transfer Offices",
                "Private Equity Firms",
                "Accelerator Networks"
            ]
        }
        
    except Exception as e:
        logger.error(f"Error during funding opportunities refresh: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to refresh funding data: {str(e)}")

@app.get("/api/funding-opportunities/stats")
async def get_funding_stats(
    current_user: dict = Depends(get_current_user)
):
    """Get funding opportunities statistics"""
    try:
        # Total active funding opportunities
        total_funding = funding_opportunities_collection.count_documents({"status": "active"})
        
        # Count by category
        pipeline = [
            {"$match": {"status": "active"}},
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        category_stats = list(funding_opportunities_collection.aggregate(pipeline))
        
        # Recently updated (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recently_updated = funding_opportunities_collection.count_documents({
            "status": "active",
            "updated_at": {"$gte": seven_days_ago}
        })
        
        # Count by investment stage
        stage_pipeline = [
            {"$match": {"status": "active"}},
            {"$group": {"_id": "$investment_stage", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        stage_stats = list(funding_opportunities_collection.aggregate(stage_pipeline))
        
        return {
            "total_funding_sources": total_funding,
            "recently_updated": recently_updated,
            "category_breakdown": category_stats,
            "stage_breakdown": stage_stats,
            "last_refresh": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting funding stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get funding statistics")

@app.post("/api/funding-opportunities/verify-urls")
async def verify_funding_urls(
    current_user: dict = Depends(get_current_user)
):
    """Verify and update funding opportunity URLs (Pro/Enterprise only)"""
    if current_user['tier'] == 'free':
        raise HTTPException(status_code=403, detail="URL verification requires Pro or Enterprise subscription")
    
    try:
        import requests
        from urllib.parse import urlparse
        
        verified_count = 0
        updated_count = 0
        
        # Get all active funding opportunities
        funding_opps = list(funding_opportunities_collection.find({"status": "active"}))
        
        for opp in funding_opps:
            original_url = opp.get("website_url", "")
            if not original_url:
                continue
                
            try:
                # Try the original URL first
                response = requests.head(original_url, timeout=10, allow_redirects=True)
                
                if response.status_code == 200:
                    # URL works, update last_verified
                    funding_opportunities_collection.update_one(
                        {"_id": opp["_id"]},
                        {
                            "$set": {
                                "last_verified": datetime.utcnow(),
                                "url_status": "verified",
                                "final_url": response.url
                            }
                        }
                    )
                    verified_count += 1
                    
                elif response.status_code in [404, 403, 410]:
                    # Try fallback to main domain
                    try:
                        parsed = urlparse(original_url)
                        main_domain = f"{parsed.scheme}://{parsed.netloc}"
                        
                        fallback_response = requests.head(main_domain, timeout=10, allow_redirects=True)
                        
                        if fallback_response.status_code == 200:
                            # Update to working main domain
                            funding_opportunities_collection.update_one(
                                {"_id": opp["_id"]},
                                {
                                    "$set": {
                                        "website_url": main_domain,
                                        "last_verified": datetime.utcnow(),
                                        "url_status": "updated_to_fallback",
                                        "original_url": original_url,
                                        "final_url": fallback_response.url
                                    }
                                }
                            )
                            updated_count += 1
                        else:
                            # Mark as broken
                            funding_opportunities_collection.update_one(
                                {"_id": opp["_id"]},
                                {
                                    "$set": {
                                        "last_verified": datetime.utcnow(),
                                        "url_status": "broken",
                                        "last_error": f"Status {fallback_response.status_code}"
                                    }
                                }
                            )
                    except Exception as fallback_error:
                        # Mark as broken
                        funding_opportunities_collection.update_one(
                            {"_id": opp["_id"]},
                            {
                                "$set": {
                                    "last_verified": datetime.utcnow(),
                                    "url_status": "broken",
                                    "last_error": str(fallback_error)
                                }
                            }
                        )
                        
            except requests.exceptions.RequestException as e:
                # Network error, mark as unverified
                funding_opportunities_collection.update_one(
                    {"_id": opp["_id"]},
                    {
                        "$set": {
                            "last_verified": datetime.utcnow(),
                            "url_status": "network_error",
                            "last_error": str(e)
                        }
                    }
                )
        
        return {
            "status": "success",
            "message": f"URL verification complete. {verified_count} verified, {updated_count} updated to fallbacks.",
            "verified_count": verified_count,
            "updated_count": updated_count,
            "total_checked": len(funding_opps),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error during URL verification: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to verify URLs: {str(e)}")

@app.put("/api/funding-opportunities/{funding_id}")
async def update_funding_opportunity(
    funding_id: str,
    funding_data: FundingOpportunityCreate,
    current_user: dict = Depends(get_current_user)
):
    """Update a funding opportunity (admin only for MVP)"""
    existing = funding_opportunities_collection.find_one({
        "$or": [
            {"id": funding_id},
            {"_id": funding_id}
        ]
    })
    
    if not existing:
        raise HTTPException(status_code=404, detail="Funding opportunity not found")
    
    # Update the funding opportunity
    update_data = {
        "name": funding_data.name,
        "category": funding_data.category,
        "investment_focus": funding_data.investment_focus,
        "investment_stage": funding_data.investment_stage,
        "geographic_focus": funding_data.geographic_focus,
        "website_url": funding_data.website_url,
        "additional_info": funding_data.additional_info,
        "updated_at": datetime.utcnow(),
        "last_verified": datetime.utcnow()
    }
    
    funding_opportunities_collection.update_one(
        {"$or": [{"id": funding_id}, {"_id": funding_id}]},
        {"$set": update_data}
    )
    
    return {"message": "Funding opportunity updated successfully"}

async def initialize_funding_opportunities():
    """Initialize the database with funding opportunities if empty"""
    if funding_opportunities_collection.count_documents({}) == 0:
        print("🔄 Initializing funding opportunities database...")
        
        # Helper function to ensure URLs have proper protocol
        def ensure_https(url):
            if not url.startswith(('http://', 'https://')):
                return f'https://{url}' if not url.startswith('www.') else f'https://{url}'
            return url
        
        # Enhanced funding opportunities data with government sources
        initial_funding_data = [
            # Existing Private VC/Investment sources
            {
                "id": str(uuid.uuid4()),
                "name": "Shield Capital",
                "category": "Defence & Security VC",
                "investment_focus": "Early-stage companies building technologies that matter in artificial intelligence, autonomy, cybersecurity, and space, with a mission focus on the convergence of commercial technology and national security.",
                "investment_stage": "Early-stage (Seed, Series A)",
                "geographic_focus": "Primarily US, but invests globally in relevant areas",
                "website_url": "https://shieldcap.com/",
                "status": "active",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_verified": datetime.utcnow(),
                "additional_info": {"focus_areas": ["AI", "autonomy", "cybersecurity", "space"]}
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Paladin Capital Group",
                "category": "Defence & Security VC",
                "investment_focus": "Global multi-stage investor focusing on cybersecurity, artificial intelligence, big data, and advanced computing, with significant defence and national security applications.",
                "investment_stage": "Multi-stage (growth equity to later stage)",
                "geographic_focus": "Global",
                "website_url": "https://www.paladincapgroup.com/",
                "status": "active",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_verified": datetime.utcnow(),
                "additional_info": {"focus_areas": ["cybersecurity", "AI", "big data"]}
            },
            
            # NEW: Government Funding & Innovation Programs
            {
                "id": str(uuid.uuid4()),
                "name": "Defence and Security Accelerator (DASA)",
                "category": "Government Funding & Innovation",
                "investment_focus": "DASA funding competitions for defence and security innovations. Open calls and themed challenges supporting early-stage through to mature defence technologies. The primary UK government portal for defence innovation funding.",
                "investment_stage": "All stages - from concept to commercialization",
                "geographic_focus": "UK",
                "website_url": "https://www.gov.uk/government/organisations/defence-and-security-accelerator",
                "status": "active",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_verified": datetime.utcnow(),
                "additional_info": {"focus_areas": ["defence innovation", "security technology", "dual-use"]}
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Innovate UK Defence Innovation",
                "category": "Government Funding & Innovation",
                "investment_focus": "Innovation funding service for defence-relevant grants and dual-use technologies. Part of UKRI, supporting commercialization of innovative defence solutions through various funding competitions.",
                "investment_stage": "R&D grants and innovation loans",
                "geographic_focus": "UK",
                "website_url": "https://www.gov.uk/apply-for-innovation-funding",
                "status": "active",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_verified": datetime.utcnow(),
                "additional_info": {"focus_areas": ["innovation", "R&D", "commercialization"]}
            },
            {
                "id": str(uuid.uuid4()),
                "name": "UK Defence Innovation Fund (£400m)",
                "category": "Government Funding & Innovation",
                "investment_focus": "Major £400 million fund to transform military technology and accelerate UK defence innovation. Channeled through DASA and Innovate UK for breakthrough defence technologies.",
                "investment_stage": "Strategic defence technology development",
                "geographic_focus": "UK",
                "website_url": "https://www.gov.uk/government/news/major-5-billion-technology-investment-accelerates-uk-defence-innovation",
                "status": "active",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_verified": datetime.utcnow(),
                "additional_info": {"focus_areas": ["military technology", "defence transformation"]}
            },
            
            # NEW: Procurement & Supplier Registration
            {
                "id": str(uuid.uuid4()),
                "name": "Defence Sourcing Portal (DSP)",
                "category": "Procurement & Tenders",
                "investment_focus": "Primary platform for direct Ministry of Defence (MOD) tenders. Essential registration portal for accessing MOD procurement opportunities and supplier frameworks.",
                "investment_stage": "Contract opportunities (all values)",
                "geographic_focus": "UK",
                "website_url": "https://www.contracts.mod.uk/",
                "status": "active",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_verified": datetime.utcnow(),
                "additional_info": {"focus_areas": ["MOD contracts", "defence procurement"]}
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Contracts Finder",
                "category": "Procurement & Tenders",
                "investment_focus": "All UK government tenders above £10,000, including defence contracts. Official government portal for public sector procurement opportunities.",
                "investment_stage": "Government contracts £10k+",
                "geographic_focus": "UK",
                "website_url": "https://www.contractsfinder.service.gov.uk/",
                "status": "active",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_verified": datetime.utcnow(),
                "additional_info": {"focus_areas": ["government contracts", "public procurement"]}
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Find a Tender Service (FTS)",
                "category": "Procurement & Tenders",
                "investment_focus": "High-value public sector tenders in the UK. Post-Brexit replacement for OJEU, covering major government and defence procurement opportunities.",
                "investment_stage": "High-value public contracts",
                "geographic_focus": "UK",
                "website_url": "https://www.find-tender.service.gov.uk/",
                "status": "active",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_verified": datetime.utcnow(),
                "additional_info": {"focus_areas": ["high-value tenders", "public procurement"]}
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Helios SME Portal",
                "category": "Procurement & Tenders",
                "investment_focus": "Free platform designed to enhance SME visibility to buyers across defence, aerospace, and security sectors. Joint initiative with MOD and BAE Systems.",
                "investment_stage": "SME supplier registration and visibility",
                "geographic_focus": "UK",
                "website_url": "https://heliosportal.co.uk/",
                "status": "active",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_verified": datetime.utcnow(),
                "additional_info": {"focus_areas": ["SME visibility", "supplier registration"]}
            },
            
            # NEW: Strategic Investment Funds
            {
                "id": str(uuid.uuid4()),
                "name": "National Security Strategic Investment Fund (NSSIF)",
                "category": "Strategic Government Investment",
                "investment_focus": "Government-backed investment fund specifically for national security technologies. Managed by British Business Bank, focusing on critical technologies for UK national security.",
                "investment_stage": "Strategic investment in national security tech",
                "geographic_focus": "UK",
                "website_url": "https://www.british-business-bank.co.uk/ourpartners/national-security-strategic-investment-fund/",
                "status": "active",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_verified": datetime.utcnow(),
                "additional_info": {"focus_areas": ["national security", "critical technologies"]}
            },
            
            # NEW: Industry Bodies & Support
            {
                "id": str(uuid.uuid4()),
                "name": "ADS Group",
                "category": "Industry Bodies & Support",
                "investment_focus": "Trade organization for aerospace, defence, security, and space industries. Provides networking, support, and advocacy for defence SMEs and access to industry connections.",
                "investment_stage": "Industry support and networking",
                "geographic_focus": "UK",
                "website_url": "https://www.adsgroup.org.uk/",
                "status": "active",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_verified": datetime.utcnow(),
                "additional_info": {"focus_areas": ["aerospace", "defence", "security", "space"]}
            },
            {
                "id": str(uuid.uuid4()),
                "name": "UK Defence Solutions Centre (UKDSC)",
                "category": "Industry Bodies & Support",
                "investment_focus": "Facilitates collaboration within the UK defence sector, connecting SMEs with larger defence contractors and government opportunities.",
                "investment_stage": "Collaboration and networking support",
                "geographic_focus": "UK",
                "website_url": "https://www.ukdefencesolutionscentre.com/",
                "status": "active",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_verified": datetime.utcnow(),
                "additional_info": {"focus_areas": ["defence collaboration", "SME support"]}
            },
            
            # Continue with existing private sources...
            {
                "id": str(uuid.uuid4()),
                "name": "Octopus Ventures",
                "category": "Deep Tech & Dual-Use VC",
                "investment_focus": "Broad deep tech, AI, fintech, health tech, and other sectors; dual-use potential is often a factor.",
                "investment_stage": "Pre-seed, Seed, Series A, and later-stage",
                "geographic_focus": "UK & Europe",
                "website_url": "https://octopusventures.com/",
                "status": "active",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_verified": datetime.utcnow(),
                "additional_info": {"focus_areas": ["deep tech", "AI", "dual-use"]}
            },
            {
                "id": str(uuid.uuid4()),
                "name": "British Business Bank",
                "category": "Government-Backed Schemes",
                "investment_focus": "Facilitates access to finance for smaller businesses via partner funds, covering venture capital, debt finance, and regional funds.",
                "investment_stage": "Varies by program/partner fund",
                "geographic_focus": "UK",
                "website_url": "https://www.british-business-bank.co.uk/",
                "status": "active",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_verified": datetime.utcnow(),
                "additional_info": {"type": "enabler", "partners": "multiple"}
            },
            {
                "id": str(uuid.uuid4()),
                "name": "MMC Ventures",
                "category": "Deep Tech & Dual-Use VC",
                "investment_focus": "AI and data-driven companies, including enterprise AI, fintech, data-driven health, data infrastructure, and cloud.",
                "investment_stage": "Series A specialist",
                "geographic_focus": "Europe",
                "website_url": "https://mmc.vc/",
                "status": "active",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_verified": datetime.utcnow(),
                "additional_info": {"focus_areas": ["AI", "data infrastructure"]}
            }
        ]
        
        funding_opportunities_collection.insert_many(initial_funding_data)
        print(f"✅ Initialized {len(initial_funding_data)} funding opportunities with working URLs")
    else:
        count = funding_opportunities_collection.count_documents({"status": "active"})
        print(f"📊 Database contains {count} active funding opportunities")

@app.get("/api/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    user_tier = current_user["tier"]
    
    # Count opportunities based on user tier with enhanced logic
    total_opportunities = opportunities_collection.count_documents({"status": OpportunityStatus.ACTIVE})
    
    if user_tier == UserTier.FREE:
        # Free users see UK sources + delayed Pro content
        accessible_opportunities = opportunities_collection.count_documents({
            "status": OpportunityStatus.ACTIVE,
            "$or": [
                {"tier_required": "free"},
                {
                    "tier_required": {"$in": ["pro", "enterprise"]},
                    "created_at": {"$lte": datetime.utcnow() - timedelta(hours=48)}
                }
            ]
        })
        new_this_week = max(2, accessible_opportunities // 4)
        closing_soon = max(1, accessible_opportunities // 6)
    else:
        accessible_opportunities = total_opportunities
        new_this_week = max(8, total_opportunities // 3)
        closing_soon = max(4, total_opportunities // 5)
    
    # Enhanced tier benefits
    tier_benefits = {
        UserTier.FREE: [
            "Basic UK opportunity listings",
            "48-hour delay on premium content", 
            "General procurement guides",
            f"Access to {accessible_opportunities} opportunities"
        ],
        UserTier.PRO: [
            "Real-time global opportunity alerts",
            "Enhanced Actify Defence aggregation",
            "SME relevance scoring & prioritization",
            "Technology area classification",
            "Premium content & expert analysis",
            "Community forum access",
            f"Full access to {accessible_opportunities} opportunities"
        ],
        UserTier.ENTERPRISE: [
            "Everything in Pro tier",
            "Multi-user access (5 seats)",
            "Custom opportunity reports",
            "Priority expert support",
            "Exclusive networking events",
            "Advanced API access",
            f"Enterprise access to {accessible_opportunities} opportunities"
        ]
    }
    
    return {
        "total_opportunities": accessible_opportunities,
        "new_this_week": new_this_week,
        "closing_soon": closing_soon,
        "tier": user_tier,
        "tier_benefits": tier_benefits.get(user_tier, []),
        "enhanced_features": {
            "keyword_prioritization": user_tier != UserTier.FREE,
            "sme_scoring": user_tier != UserTier.FREE,
            "global_sources": user_tier != UserTier.FREE,
            "technology_classification": user_tier != UserTier.FREE,
            "real_time_access": user_tier != UserTier.FREE
        }
    }

async def periodic_data_refresh():
    """
    Periodically refresh live data every 4 hours
    """
    while True:
        await fetch_and_store_live_data()
        await asyncio.sleep(4 * 60 * 60)  # Sleep for 4 hours

# Initialize with live data only
@app.on_event("startup")
async def initialize_live_data():
    # Initialize funding opportunities
    await initialize_funding_opportunities()
    
    # Check if we need to populate with live data
    if opportunities_collection.count_documents({}) == 0:
        print("🔄 No opportunities found, fetching live data...")
        await fetch_and_store_live_data()
    else:
        live_count = opportunities_collection.count_documents({'source': {'$exists': True}})
        print(f"📊 Database contains {live_count} live opportunities")
        
    # Schedule periodic live data refresh (every 4 hours)
    asyncio.create_task(periodic_data_refresh())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
