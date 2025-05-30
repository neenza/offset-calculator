export interface PaperMatrix {
  gsm: number;
  sizeId: string;
  costPerSheet: number;
}

export interface PaperType {
  id: string;
  name: string;
  description: string;
  costPerSheet: number;
  costPerKg?: number;  // New field for cost per kg
}

export interface SheetSize {
  id: string;
  name: string;
  width: number;
  height: number;
  description: string;
}

export interface BindingOption {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  perUnitCost: number;
}

export interface PrintingJob {
  // Basic Job Details
  jobName: string;
  quantity: number;
  
  // Printing Specifications
  numberOfColors: number;
  isDoubleSided: boolean;
  sheetSizeId: string;
  customSheetWidth?: number;
  customSheetHeight?: number;
  finalTrimWidth?: number;
  finalTrimHeight?: number;
  // Paper Details
  paperTypeId: string;       // Combined paper type ID (legacy)
  paperMaterialType: string; // Material type: uncoated, coated-matt, coated-gloss, cardstock
  paperGsm?: number;         // GSM value
  paperSizeId?: string;      // Size ID for matrix selection
  gsmPriceMode: 'flat' | 'slope' | 'custom'; // GSM pricing mode: flat (same cost), slope (increasing cost), custom (per GSM costs)
  paperCostPerKg?: number;   // Base cost per kg (for flat and slope modes)
  paperCostIncreasePerGsm?: number; // Cost increase per GSM unit (for slope mode only)  customCostMatrix?: {[key: string]: number}; // Custom costs per kg by GSM (for custom mode, format: "gsm": cost)
  
  // Allow dynamic property access for TypeScript
  [key: string]: any;
  
  // Pre-Press Costs
  designSetupFee: number;
  plateCost: number;
  proofingCharges: number;
  // Press & Production Costs
  fullPrintingCost: number;
  wastagePercentage: number;
  
  // Post-Press Costs
  foldingRequired: boolean;
  numberOfFolds: number;  cuttingRequired: boolean;
  numberOfCuts: number;
  bindingOptionId: string | null;
  laminationType: 'none' | 'matt' | 'gloss' | 'thermal-matt' | 'thermal-gloss';
  isDoubleSidedLamination: boolean;
  embossingRequired: boolean;
  foilingRequired: boolean;
  packagingDeliveryCost: number;
  
  // Additional Costs
  taxPercentage: number;
  discountPercentage: number;
  rushFeePercentage: number;
}

export interface CostBreakdown {
  materialCost: number;
  prePressSetupCost: number;
  pressCost: number;
  finishingCost: number;
  additionalCosts: number;
  subtotal: number;
  taxAmount: number;
  discount: number;
  rushFee: number;
  grandTotal: number;
  costPerUnit: number;
}

export const DEFAULT_PRINTING_JOB: PrintingJob = {
  jobName: "",
  quantity: 500,
  numberOfColors: 4,
  isDoubleSided: false,
  sheetSizeId: "a4",
  paperTypeId: "coated-gloss-150",
  paperMaterialType: "coated-gloss",
  paperGsm: 150,
  paperSizeId: "a4",
  paperCostPerKg: 150,
  gsmPriceMode: 'flat', // Default to flat pricing
  paperCostIncreasePerGsm: 0.5, // Default increase per GSM for slope mode
  customCostMatrix: {
    "70": 120,  // Lower GSM papers are typically cheaper
    "80": 130,
    "90": 140,
    "100": 145,
    "120": 150,
    "130": 155,
    "150": 160,
    "170": 165,
    "200": 175,
    "220": 185,
    "250": 195,
    "300": 210,
    "350": 220
  },
  designSetupFee: 0,
  plateCost: 25,
  proofingCharges: 15,  fullPrintingCost: 1000,
  wastagePercentage: 0,
  foldingRequired: false,
  numberOfFolds: 0,
  cuttingRequired: false,
  numberOfCuts: 0,
  bindingOptionId: null,
  laminationType: 'none',
  isDoubleSidedLamination: false,
  embossingRequired: false,
  foilingRequired: false,
  packagingDeliveryCost: 0,
  taxPercentage: 18,
  discountPercentage: 0,
  rushFeePercentage: 0
};
