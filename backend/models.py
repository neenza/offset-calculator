from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Union, Literal

class SheetSize(BaseModel):
    id: str
    name: str
    width: float
    height: float

class PaperType(BaseModel):
    id: str
    name: str
    costPerSheet: float

class BindingOption(BaseModel):
    id: str
    name: str
    baseCost: float
    perUnitCost: float

class LaminationCosts(BaseModel):
    matt: float = 0.25
    gloss: float = 0.35
    thermalMatt: float = 0.65
    thermalGloss: float = 0.65

class Settings(BaseModel):
    paperTypes: List[PaperType] = []
    bindingOptions: List[BindingOption] = []
    laminationCosts: LaminationCosts = LaminationCosts()
    
class CostBreakdown(BaseModel):
    materialCost: float
    prePressSetupCost: float
    pressCost: float
    finishingCost: float
    additionalCosts: float
    subtotal: float
    taxAmount: float
    discount: float
    rushFee: float
    grandTotal: float
    costPerUnit: float

class PrintingJob(BaseModel):
    # Basic information
    quantity: int
    paperTypeId: str
    paperSizeId: Optional[str] = None
    sheetSizeId: str = 'a4'
    customSheetWidth: Optional[float] = None
    customSheetHeight: Optional[float] = None
    isDoubleSided: bool = False
    numberOfColors: int = 1
    
    # Paper information
    paperGsm: Optional[float] = None
    gsmPriceMode: Literal['flat', 'slope', 'custom'] = 'flat'
    paperCostPerKg: Optional[float] = None
    paperCostIncreasePerGsm: Optional[float] = None
    customCostMatrix: Optional[Dict[str, float]] = None
    
    # Pre-press costs
    designSetupFee: float = 0
    plateCost: float = 0
    proofingCharges: float = 0
    
    # Printing costs
    fullPrintingCost: float = 0
    wastagePercentage: float = 5
    
    # Finishing options
    bindingOptionId: Optional[str] = None
    foldingRequired: bool = False
    numberOfFolds: int = 0
    cuttingRequired: bool = False
    numberOfCuts: int = 0
    laminationType: Literal['none', 'matt', 'gloss', 'thermal-matt', 'thermal-gloss'] = 'none'
    isDoubleSidedLamination: bool = False
    embossingRequired: bool = False
    foilingRequired: bool = False
    packagingDeliveryCost: float = 0
    
    # Financial adjustments
    taxPercentage: float = 18
    discountPercentage: float = 0
    rushFeePercentage: float = 0
