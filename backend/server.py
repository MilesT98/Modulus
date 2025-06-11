from fastapi import FastAPI, HTTPException, Depends, status
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
    
    # Filter based on user tier
    user_tier = current_user["tier"]
    filtered_opportunities = []
    
    for opp in opportunities:
        # Convert ObjectId to string for JSON serialization
        opp["_id"] = str(opp["_id"])
        
        # Check tier access
        if user_tier == UserTier.FREE:
            if opp.get("tier_required") == UserTier.PRO or opp.get("tier_required") == UserTier.ENTERPRISE:
                continue  # Skip pro/enterprise only opportunities
            # Add delay indicator for free users
            if opp.get("is_delayed_for_free", False):
                opp["is_delayed"] = True
        
        filtered_opportunities.append(opp)
    
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
    opportunity = opportunities_collection.find_one({"id": opportunity_id})
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Check tier access
    user_tier = current_user["tier"]
    required_tier = opportunity.get("tier_required", UserTier.FREE)
    
    if user_tier == UserTier.FREE and required_tier in [UserTier.PRO, UserTier.ENTERPRISE]:
        raise HTTPException(status_code=403, detail="Upgrade to Pro to access this opportunity")
    
    # Convert ObjectId to string
    opportunity["_id"] = str(opportunity["_id"])
    
    return opportunity

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

@app.get("/api/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    user_tier = current_user["tier"]
    
    # Count opportunities based on user tier
    total_opportunities = opportunities_collection.count_documents({"status": OpportunityStatus.ACTIVE})
    
    if user_tier == UserTier.FREE:
        accessible_opportunities = opportunities_collection.count_documents({
            "status": OpportunityStatus.ACTIVE,
            "tier_required": UserTier.FREE
        })
    else:
        accessible_opportunities = total_opportunities
    
    # Mock stats for dashboard
    return {
        "total_opportunities": accessible_opportunities,
        "new_this_week": 12 if user_tier != UserTier.FREE else 5,
        "closing_soon": 8 if user_tier != UserTier.FREE else 3,
        "tier": user_tier,
        "tier_benefits": {
            UserTier.FREE: ["Basic opportunity listings", "48-hour delay", "General guides"],
            UserTier.PRO: ["Real-time alerts", "Advanced analysis", "Premium content", "Community access"],
            UserTier.ENTERPRISE: ["Multi-user access", "Custom reports", "Priority support", "Exclusive events"]
        }.get(user_tier, [])
    }

# Initialize some sample data
@app.on_event("startup")
async def create_sample_data():
    # Check if data already exists
    if opportunities_collection.count_documents({}) > 0:
        return
    
    # Sample opportunities
    sample_opportunities = [
        {
            "id": str(uuid.uuid4()),
            "title": "AI-Powered Threat Detection System",
            "funding_body": "Defence Science and Technology Laboratory (DSTL)",
            "description": "Develop next-generation AI systems for autonomous threat detection in maritime environments.",
            "detailed_description": "This opportunity seeks innovative AI solutions that can autonomously identify and classify threats in complex maritime scenarios. The system must demonstrate high accuracy in diverse weather conditions and integrate with existing naval platforms.",
            "closing_date": datetime.utcnow() + timedelta(days=30),
            "funding_amount": "£2.5M - £5M",
            "tech_areas": ["Artificial Intelligence", "Machine Learning", "Computer Vision", "Maritime Defence"],
            "mod_department": "Navy Command",
            "trl_level": "TRL 4-6",
            "contract_type": "Research and Development",
            "official_link": "https://www.gov.uk/government/organisations/defence-science-and-technology-laboratory",
            "status": OpportunityStatus.ACTIVE,
            "created_at": datetime.utcnow(),
            "tier_required": UserTier.FREE,
            "is_delayed_for_free": False
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Cyber Security Framework for Critical Infrastructure",
            "funding_body": "UK Research and Innovation (UKRI)",
            "description": "Develop comprehensive cybersecurity solutions for protecting critical national infrastructure.",
            "detailed_description": "Advanced cybersecurity framework development focusing on real-time threat detection, automated response systems, and resilience against state-level attacks. Must comply with UK NCSC guidelines.",
            "closing_date": datetime.utcnow() + timedelta(days=45),
            "funding_amount": "£1M - £3M",
            "tech_areas": ["Cybersecurity", "Critical Infrastructure", "Threat Intelligence"],
            "mod_department": "Defence Digital",
            "trl_level": "TRL 3-5",
            "contract_type": "Innovation Contract",
            "official_link": "https://www.ukri.org/",
            "status": OpportunityStatus.ACTIVE,
            "created_at": datetime.utcnow(),
            "tier_required": UserTier.PRO,
            "is_delayed_for_free": True
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Quantum Communication Networks",
            "funding_body": "Ministry of Defence (MOD)",
            "description": "Research and develop quantum-secure communication networks for military applications.",
            "detailed_description": "Cutting-edge quantum communication research focusing on unhackable communication channels for sensitive military operations. Requires deep expertise in quantum mechanics and cryptography.",
            "closing_date": datetime.utcnow() + timedelta(days=60),
            "funding_amount": "£5M - £10M",
            "tech_areas": ["Quantum Computing", "Cryptography", "Secure Communications"],
            "mod_department": "Defence Science and Technology",
            "trl_level": "TRL 2-4",
            "contract_type": "Strategic Research",
            "official_link": "https://www.gov.uk/government/organisations/ministry-of-defence",
            "status": OpportunityStatus.ACTIVE,
            "created_at": datetime.utcnow(),
            "tier_required": UserTier.ENTERPRISE,
            "is_delayed_for_free": True
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Autonomous Drone Swarm Technology",
            "funding_body": "Innovate UK",
            "description": "Develop intelligent swarm robotics for reconnaissance and surveillance missions.",
            "detailed_description": "Revolutionary drone swarm technology that can operate autonomously in contested environments. Focus on distributed intelligence, self-healing networks, and adaptive mission planning.",
            "closing_date": datetime.utcnow() + timedelta(days=25),
            "funding_amount": "£500K - £2M",
            "tech_areas": ["Robotics", "Swarm Intelligence", "Autonomous Systems", "Surveillance"],
            "mod_department": "Army",
            "trl_level": "TRL 5-7",
            "contract_type": "Innovation Grant",
            "official_link": "https://www.innovateuk.org/",
            "status": OpportunityStatus.ACTIVE,
            "created_at": datetime.utcnow(),
            "tier_required": UserTier.FREE,
            "is_delayed_for_free": False
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Advanced Materials for Body Armour",
            "funding_body": "Defence Equipment and Support",
            "description": "Develop next-generation lightweight materials for enhanced soldier protection.",
            "detailed_description": "Innovation in advanced composite materials that provide superior ballistic protection while reducing weight and improving mobility for military personnel.",
            "closing_date": datetime.utcnow() + timedelta(days=40),
            "funding_amount": "£1.5M - £4M",
            "tech_areas": ["Materials Science", "Ballistics", "Soldier Systems"],
            "mod_department": "Army",
            "trl_level": "TRL 4-6",
            "contract_type": "Development Contract",
            "official_link": "https://www.gov.uk/government/organisations/defence-equipment-and-support",
            "status": OpportunityStatus.ACTIVE,
            "created_at": datetime.utcnow(),
            "tier_required": UserTier.PRO,
            "is_delayed_for_free": True
        }
    ]
    
    opportunities_collection.insert_many(sample_opportunities)
    print("Sample opportunities created successfully")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
