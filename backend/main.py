from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Union, Literal
import math
import os

app = FastAPI(title="Offset Printing Calculator API")

# Get environment variables
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Configure CORS for frontend access
if ENVIRONMENT == "production":
    # Production CORS settings
    allowed_origins = [FRONTEND_URL] if FRONTEND_URL else ["*"]
else:
    # Development CORS settings
    allowed_origins = ["http://localhost:5173", "http://localhost:3000", "http://192.168.1.3:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,  # Required for httpOnly cookies
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Import the models and calculation utilities
from models import (
    PrintingJob, 
    CostBreakdown,
    SheetSize,
    PaperType,
    BindingOption,
    LaminationCosts
)

# Import authentication module
from auth import setup_auth_routes, get_current_active_user

# Import database configuration and routes
from database import connect_to_mongo, close_mongo_connection
from database_routes import router as database_router

# Setup authentication routes
setup_auth_routes(app)

# Include database routes
app.include_router(database_router)

from calculators import (
    calculate_total_cost,
    mm_to_inch,
    format_measurement,
    format_sheet_size_description,
    format_currency
)

# Routes
@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    try:
        await connect_to_mongo()
        print("✅ Database initialization completed")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        print("💡 Make sure MongoDB is configured in your .env file")
        # Continue startup even if database fails to allow API to work without DB

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown"""
    await close_mongo_connection()

@app.get("/")
async def root():
    return {"message": "Offset Printing Calculator API with MongoDB Database"}

@app.post("/calculate", response_model=CostBreakdown)
async def calculate_costs(job: PrintingJob, current_user = Depends(get_current_active_user)):
    """Calculate the total cost breakdown for a printing job"""
    return calculate_total_cost(job)

# We've removed the formatting-related endpoints
# These functions have been moved to the frontend for better performance

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
