from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Union, Literal
import math

app = FastAPI(title="Offset Printing Calculator API")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
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

# Setup authentication routes
setup_auth_routes(app)

from calculators import (
    calculate_total_cost,
    mm_to_inch,
    format_measurement,
    format_sheet_size_description,
    format_currency
)

# Routes
@app.get("/")
async def root():
    return {"message": "Offset Printing Calculator API"}

@app.post("/calculate", response_model=CostBreakdown)
async def calculate_costs(job: PrintingJob, current_user = Depends(get_current_active_user)):
    """Calculate the total cost breakdown for a printing job"""
    return calculate_total_cost(job)

# We've removed the formatting-related endpoints
# These functions have been moved to the frontend for better performance

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
