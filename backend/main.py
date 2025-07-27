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

@app.get("/utils/mm-to-inch/{mm}")
async def convert_mm_to_inch(mm: float):
    """Convert millimeters to inches"""
    return {"mm": mm, "inch": mm_to_inch(mm)}

@app.get("/utils/format-measurement")
async def format_measurement_endpoint(value: float, unit: Literal["mm", "inch"]):
    """Format a measurement based on the unit preference"""
    return {"formatted": format_measurement(value, unit)}

@app.get("/utils/format-sheet-size")
async def format_sheet_size(width: float, height: float, unit: Literal["mm", "inch"]):
    """Format a sheet size description based on the unit preference"""
    return {"formatted": format_sheet_size_description(width, height, unit)}

@app.get("/utils/format-currency/{amount}")
async def format_currency_endpoint(amount: float):
    """Format a currency amount"""
    return {"formatted": format_currency(amount)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
