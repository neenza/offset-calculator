import { PaperMatrix } from "@/models/PrintingJob";

// Standard GSM values for paper
export const GSM_OPTIONS = [70, 80, 90, 100, 120, 130, 150, 170, 200, 220, 250, 300, 350];

// Function to calculate cost per sheet based on area, GSM, and cost per kg
export const calculateCostPerSheet = (
  width: number,  // mm
  height: number, // mm
  gsm: number,    // g/m²
  costPerKg: number // cost per kg
): number => {
  // Convert mm to m for area calculation
  const widthInMeters = width / 1000;
  const heightInMeters = height / 1000;
  
  // Calculate area in m²
  const areaInSqMeters = widthInMeters * heightInMeters;
  
  // Calculate weight of the sheet in kg
  // GSM is grams per square meter, so: area * gsm = weight in grams
  // Then convert to kg by dividing by 1000
  const weightInKg = (areaInSqMeters * gsm) / 1000;
  
  // Calculate cost
  const cost = weightInKg * costPerKg;
  
  return cost;
};

// Function to generate paper matrix options based on available GSMs and sheet sizes
export const generatePaperMatrix = (
  sheetSizes: {id: string; width: number; height: number}[], 
  gsmValues: number[],
  costPerKg: number
): PaperMatrix[] => {
  const matrix: PaperMatrix[] = [];
  
  sheetSizes.forEach(size => {
    // Skip custom size
    if (size.id === 'custom') return;
    
    gsmValues.forEach(gsm => {
      const costPerSheet = calculateCostPerSheet(
        size.width,
        size.height,
        gsm,
        costPerKg
      );
      
      matrix.push({
        gsm,
        sizeId: size.id,
        costPerSheet
      });
    });
  });
  
  return matrix;
};
