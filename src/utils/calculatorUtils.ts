import { CostBreakdown, PrintingJob } from "../models/PrintingJob";
import { SHEET_SIZES } from "../data/printingOptions";
import { useSettingsStore } from "../utils/settingsStore";
import { calculateCostPerSheet } from "../data/paperMatrix";

export function calculateTotalCost(job: PrintingJob): CostBreakdown {
  // Get current settings from the store
  const { paperTypes, bindingOptions } = useSettingsStore.getState();

  // Find the selected paper and binding option
  const selectedPaper = paperTypes.find(paper => paper.id === job.paperTypeId);
  const selectedBinding = job.bindingOptionId 
    ? bindingOptions.find(binding => binding.id === job.bindingOptionId) 
    : null;
  
  console.log("Selected Paper: ", selectedPaper);
  console.log("Selected Binding: ", selectedBinding);
  console.log("Quantity: ", job.quantity);
  
  // Calculate material cost
  const sheetsNeeded = job.quantity * (job.isDoubleSided ? 1 : 1) * (1 + job.wastagePercentage / 100);
  console.log("Sheets Needed: ", sheetsNeeded);
  
  // Get cost per sheet - either from the matrix calculation or from the paper type
  let costPerSheet = selectedPaper ? selectedPaper.costPerSheet : 0;
    // If we have matrix values, use those for a more accurate calculation
  if (job.paperGsm && job.paperSizeId) {
    const selectedSize = SHEET_SIZES.find(size => size.id === job.paperSizeId);
    if (selectedSize) {
      // Make sure we have the required parameters based on the pricing mode
      const hasValidParams = (
        (job.gsmPriceMode === 'flat' && job.paperCostPerKg) ||
        (job.gsmPriceMode === 'slope' && job.paperCostPerKg && job.paperCostIncreasePerGsm) ||
        (job.gsmPriceMode === 'custom' && job.customCostMatrix)
      );

      if (hasValidParams) {
        costPerSheet = calculateCostPerSheet(
          selectedSize.width,
          selectedSize.height,
          job.paperGsm,
          job.paperCostPerKg || 150, // Default if not provided
          job.gsmPriceMode,
          job.paperCostIncreasePerGsm,
          80, // baseGsm
          job.customCostMatrix
        );
        console.log(`Using matrix calculation: ${costPerSheet} per sheet (${job.gsmPriceMode} pricing)`);
      }
    }
  }
  
  const paperCost = sheetsNeeded * costPerSheet;
  console.log("Paper Cost: ", paperCost);
  const materialCost = paperCost;
  
  // Calculate pre-press setup cost
  const plateCostTotal = (job.plateCost) * job.numberOfColors * (job.isDoubleSided ? 2 : 1);
  const prePressSetupCost = (job.designSetupFee) + plateCostTotal + (job.proofingCharges);
  
  // Calculate press cost
  const totalPressTime = job.makeReadyTime + job.estimatedPrintRunTime;
  const pressCost = totalPressTime * job.pressHourlyRate;
  
  // Calculate finishing cost
  let finishingCost = 0;
  
  // Folding (x100 for Rupees)
  if (job.foldingRequired) {
    finishingCost += job.numberOfFolds * job.quantity * 1; // Changed from 0.01 to 1 (x100)
  }
  
  // Cutting (x100 for Rupees)
  if (job.cuttingRequired) {
    finishingCost += job.numberOfCuts * 500; // Changed from 5 to 500 (x100)
  }
  
  // Binding
  if (selectedBinding) {
    finishingCost += selectedBinding.baseCost + (selectedBinding.perUnitCost * job.quantity);
  }
  
  // Lamination (x100 for Rupees)
  if (job.laminationType !== 'none') {
    const laminationBaseCost = job.laminationType === 'matt' ? 10 : 12; // Changed from 0.1/0.12 to 10/12
    const laminationMultiplier = job.isDoubleSidedLamination ? 2 : 1;
    finishingCost += laminationBaseCost * job.quantity * laminationMultiplier;
  }
  
  // Embossing/Foiling
  if (job.embossingRequired) {
    finishingCost += 100 + (0.2 * job.quantity); // Base + per unit
  }
  
  if (job.foilingRequired) {
    finishingCost += 150 + (0.3 * job.quantity); // Base + per unit
  }
  
  // Add packaging and delivery
  finishingCost += job.packagingDeliveryCost;
  
  // Calculate subtotal
  const subtotal = materialCost + prePressSetupCost + pressCost + finishingCost;
  
  // Calculate tax, discount, and rush fee
  const taxAmount = subtotal * (job.taxPercentage / 100);
  const discount = subtotal * (job.discountPercentage / 100);
  const rushFee = subtotal * (job.rushFeePercentage / 100);
  
  // Calculate grand total
  const grandTotal = subtotal + taxAmount - discount + rushFee;
  
  // Calculate cost per unit
  const costPerUnit = job.quantity > 0 ? grandTotal / job.quantity : 0;
  
  return {
    materialCost,
    prePressSetupCost,
    pressCost,
    finishingCost,
    additionalCosts: job.packagingDeliveryCost,
    subtotal,
    taxAmount,
    discount,
    rushFee,
    grandTotal,
    costPerUnit
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
}

export function getSelectedPaperType(job: PrintingJob) {
  const { paperTypes } = useSettingsStore.getState();
  return paperTypes.find(paper => paper.id === job.paperTypeId);
}

export function getSelectedSheetSize(job: PrintingJob) {
  return SHEET_SIZES.find(size => size.id === job.sheetSizeId);
}

export function getSelectedBindingOption(job: PrintingJob) {
  const { bindingOptions } = useSettingsStore.getState();
  return job.bindingOptionId 
    ? bindingOptions.find(binding => binding.id === job.bindingOptionId) 
    : null;
}
