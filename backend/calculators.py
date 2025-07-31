from typing import Dict, List, Optional, Union, Literal
from models import PrintingJob, CostBreakdown, SheetSize, PaperType, BindingOption
from constants import SHEET_SIZES, DEFAULT_PAPER_TYPES, DEFAULT_BINDING_OPTIONS, DEFAULT_LAMINATION_COSTS
import locale
import math

# Set locale for currency formatting
try:
    locale.setlocale(locale.LC_ALL, 'en_IN')
except locale.Error:
    try:
        locale.setlocale(locale.LC_ALL, 'en_US.UTF-8')
    except locale.Error:
        # Fallback to default locale if neither is available
        locale.setlocale(locale.LC_ALL, '')

# In-memory store for settings
# In a real app, this would be a database
class SettingsStore:
    def __init__(self):
        self.paper_types = DEFAULT_PAPER_TYPES
        self.binding_options = DEFAULT_BINDING_OPTIONS
        self.lamination_costs = DEFAULT_LAMINATION_COSTS

    def get_paper_types(self):
        return self.paper_types

    def get_binding_options(self):
        return self.binding_options
    
    def get_lamination_costs(self):
        return self.lamination_costs

# Initialize the settings store
settings_store = SettingsStore()

# Convert millimeters to inches
def mm_to_inch(mm: float) -> float:
    return mm / 25.4  # 1 inch = 25.4 mm

# Format measurements based on the unit preference
def format_measurement(value: float, unit: str) -> str:
    if unit == 'inch':
        inches = mm_to_inch(value)
        return f"{inches:.2f}"
    return f"{value}mm"

# Format sheet size description based on the unit preference
def format_sheet_size_description(width: float, height: float, unit: str) -> str:
    if unit == 'inch':
        return f"{mm_to_inch(width):.2f}\" × {mm_to_inch(height):.2f}\""
    return f"{width}mm × {height}mm"

# Calculate cost per sheet
def calculate_cost_per_sheet(
    width: float,
    height: float,
    gsm: float,
    cost_per_kg: float,
    gsm_price_mode: str,
    paper_cost_increase_per_gsm: Optional[float] = None,
    base_gsm: float = 80,
    custom_cost_matrix: Optional[Dict[str, float]] = None
) -> float:
    # Area in square meters
    area_in_sqm = (width / 1000) * (height / 1000)
    
    # Weight of one sheet in kg
    weight_in_kg = area_in_sqm * (gsm / 1000)
    
    # Calculate the cost based on the price mode
    if gsm_price_mode == 'flat':
        return weight_in_kg * cost_per_kg
    elif gsm_price_mode == 'slope':
        if paper_cost_increase_per_gsm is None:
            paper_cost_increase_per_gsm = 0
        gsm_difference = gsm - base_gsm
        cost_multiplier = 1 + (gsm_difference * paper_cost_increase_per_gsm / 100)
        return weight_in_kg * cost_per_kg * cost_multiplier
    elif gsm_price_mode == 'custom' and custom_cost_matrix:
        # Find the closest GSM in the custom matrix
        gsm_keys = [float(key) for key in custom_cost_matrix.keys()]
        closest_gsm = min(gsm_keys, key=lambda x: abs(x - gsm))
        custom_cost = custom_cost_matrix.get(str(closest_gsm), cost_per_kg)
        return weight_in_kg * custom_cost
    
    # Default fallback
    return weight_in_kg * cost_per_kg

def calculate_total_cost(job: PrintingJob) -> CostBreakdown:
    # Get current settings
    paper_types = settings_store.get_paper_types()
    binding_options = settings_store.get_binding_options()
    lamination_costs = settings_store.get_lamination_costs()
    
    # Find the selected paper and binding option
    selected_paper = next((paper for paper in paper_types if paper["id"] == job.paperTypeId), None)
    selected_binding = next((binding for binding in binding_options if binding["id"] == job.bindingOptionId), None) if job.bindingOptionId else None
    
    print(f"Selected Paper: {selected_paper}")
    print(f"Selected Binding: {selected_binding}")
    print(f"Quantity: {job.quantity}")
    
    # Calculate material cost
    sheets_needed = job.quantity * (1 if job.isDoubleSided else 1) * (1 + job.wastagePercentage / 100)
    print(f"Sheets Needed: {sheets_needed}")
    
    # Get cost per sheet - either from the matrix calculation or from the paper type
    cost_per_sheet = selected_paper["costPerSheet"] if selected_paper else 0
    
    # If we have matrix values, use those for a more accurate calculation
    if job.paperGsm:
        width, height = None, None
        
        # Prioritize custom sheet size if selected
        if job.sheetSizeId == 'custom' and job.customSheetWidth and job.customSheetHeight:
            width = job.customSheetWidth
            height = job.customSheetHeight
            print(f"Using custom sheet size: {width} × {height}")
        # Handle standard sheet size if custom is not used or dimensions are missing
        elif job.paperSizeId:
            selected_size = next((size for size in SHEET_SIZES if size["id"] == job.paperSizeId), None)
            if selected_size:
                width = selected_size["width"]
                height = selected_size["height"]
                print(f"Using standard sheet size: {selected_size['name']} - {width} × {height}")
        
        # If we have valid dimensions, calculate the cost
        if width and height:
            # Make sure we have the required parameters based on the pricing mode
            has_valid_params = (
                (job.gsmPriceMode == 'flat' and job.paperCostPerKg) or
                (job.gsmPriceMode == 'slope' and job.paperCostPerKg and job.paperCostIncreasePerGsm) or
                (job.gsmPriceMode == 'custom' and job.customCostMatrix)
            )
            
            if has_valid_params:
                cost_per_sheet = calculate_cost_per_sheet(
                    width,
                    height,
                    job.paperGsm,
                    job.paperCostPerKg or 150,  # Default if not provided
                    job.gsmPriceMode,
                    job.paperCostIncreasePerGsm,
                    80,  # baseGsm
                    job.customCostMatrix
                )
                print(f"Using matrix calculation: {cost_per_sheet} per sheet ({job.gsmPriceMode} pricing)")
    
    paper_cost = sheets_needed * cost_per_sheet
    print(f"Paper Cost: {paper_cost}")
    material_cost = paper_cost
    
    # Calculate pre-press setup cost
    plate_cost_total = (job.plateCost) * job.numberOfColors * (2 if job.isDoubleSided else 1)
    pre_press_setup_cost = (job.designSetupFee) + plate_cost_total + (job.proofingCharges)
    
    # Calculate press cost
    press_cost = job.fullPrintingCost
    print(f"Press Cost: {press_cost}")
    print(f"Pre-Press Setup Cost: {pre_press_setup_cost}")
    
    # Calculate finishing cost
    finishing_cost = 0
    
    # Folding
    if job.foldingRequired:
        finishing_cost += job.numberOfFolds * job.quantity * 1
    
    # Cutting
    if job.cuttingRequired:
        finishing_cost += job.numberOfCuts * 500
    
    # Binding
    if selected_binding:
        finishing_cost += selected_binding["baseCost"] + (selected_binding["perUnitCost"] * job.quantity)
    
    # Lamination
    if job.laminationType != 'none':
        # Get lamination costs
        lamination_per_sqm_cost = lamination_costs.get(job.laminationType) or (
            0.25 if job.laminationType == 'matt' else
            0.35 if job.laminationType == 'gloss' else
            0.65 if job.laminationType == 'thermal-matt' else
            0.65 if job.laminationType == 'thermal-gloss' else 0.35
        )
        
        lamination_multiplier = 2 if job.isDoubleSidedLamination else 1
        
        # Determine sheet dimensions (in mm)
        width, height = None, None
        if job.sheetSizeId == 'custom' and job.customSheetWidth and job.customSheetHeight:
            width = job.customSheetWidth
            height = job.customSheetHeight
        elif job.paperSizeId:
            selected_size = next((size for size in SHEET_SIZES if size["id"] == job.paperSizeId), None)
            if selected_size:
                width = selected_size["width"]
                height = selected_size["height"]
        
        # Calculate area in sq in
        area_in_sqin = 0
        if width and height:
            area_in_sqin = (width / 25.4) * (height / 25.4)
        
        print(f"Lamination area: {area_in_sqin} sq in (width: {width}, height: {height}), cost per sq in: {lamination_per_sqm_cost}")
        finishing_cost += lamination_per_sqm_cost * job.quantity * lamination_multiplier * area_in_sqin / 100
    
    # Embossing/Foiling
    if job.embossingRequired:
        finishing_cost += 100 + (0.2 * job.quantity)  # Base + per unit
    
    if job.foilingRequired:
        finishing_cost += 150 + (0.3 * job.quantity)  # Base + per unit
    
    # Add packaging and delivery
    finishing_cost += job.packagingDeliveryCost
    
    # Calculate subtotal
    subtotal = material_cost + pre_press_setup_cost + press_cost + finishing_cost
    
    # Calculate tax, discount, and rush fee
    tax_amount = subtotal * (job.taxPercentage / 100)
    discount = subtotal * (job.discountPercentage / 100)
    rush_fee = subtotal * (job.rushFeePercentage / 100)
    
    # Calculate grand total
    grand_total = subtotal + tax_amount - discount + rush_fee
    
    # Calculate cost per unit
    cost_per_unit = grand_total / job.quantity if job.quantity > 0 else 0
    
    return CostBreakdown(
        materialCost=material_cost,
        prePressSetupCost=pre_press_setup_cost,
        pressCost=press_cost,
        finishingCost=finishing_cost,
        additionalCosts=job.packagingDeliveryCost,
        subtotal=subtotal,
        taxAmount=tax_amount,
        discount=discount,
        rushFee=rush_fee,
        grandTotal=grand_total,
        costPerUnit=cost_per_unit
    )

def format_currency(amount: float) -> str:
    try:
        return locale.currency(amount, grouping=True, symbol=True)
    except:
        # Fallback if locale is not available
        return f"₹{amount:,.2f}"

def get_selected_paper_type(job: PrintingJob):
    paper_types = settings_store.get_paper_types()
    return next((paper for paper in paper_types if paper["id"] == job.paperTypeId), None)

def get_selected_sheet_size(job: PrintingJob):
    return next((size for size in SHEET_SIZES if size["id"] == job.sheetSizeId), None)

def get_selected_binding_option(job: PrintingJob):
    binding_options = settings_store.get_binding_options()
    return next((binding for binding in binding_options if binding["id"] == job.bindingOptionId), None) if job.bindingOptionId else None
