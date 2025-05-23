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
  paperTypeId: string;
  paperGsm?: number;         // Added for matrix selection - GSM value
  paperSizeId?: string;      // Added for matrix selection - Size ID
  paperCostPerKg?: number;   // Added for user-input cost per kg
  
  // Pre-Press Costs
  designSetupFee: number;
  plateCost: number;
  proofingCharges: number;
  
  // Press & Production Costs
  pressHourlyRate: number;
  estimatedPrintRunTime: number;
  makeReadyTime: number;
  wastagePercentage: number;
  
  // Post-Press Costs
  foldingRequired: boolean;
  numberOfFolds: number;
  cuttingRequired: boolean;
  numberOfCuts: number;
  bindingOptionId: string | null;
  laminationType: 'none' | 'matt' | 'gloss';
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
  paperGsm: 150,
  paperSizeId: "a4",
  paperCostPerKg: 150,
  designSetupFee: 0,
  plateCost: 25,
  proofingCharges: 15,
  pressHourlyRate: 120,
  estimatedPrintRunTime: 1,
  makeReadyTime: 0.5,
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
