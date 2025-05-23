import { PaperType, SheetSize, BindingOption } from "../models/PrintingJob";
import { GSM_OPTIONS } from "./paperMatrix";

// Generate paper types from all GSM values in the matrix
export const PAPER_TYPES: PaperType[] = [
  // Uncoated paper types
  ...GSM_OPTIONS.map(gsm => ({
    id: `uncoated-${gsm}`,
    name: `Uncoated ${gsm}gsm`,
    description: `Standard uncoated paper ${gsm}gsm suitable for general printing`,
    costPerSheet: 0 // Cost is now calculated by the matrix
  })),
  
  // Coated matt paper types
  ...GSM_OPTIONS.map(gsm => ({
    id: `coated-matt-${gsm}`,
    name: `Coated Matt ${gsm}gsm`,
    description: `Professional matt coated paper ${gsm}gsm for brochures and flyers`,
    costPerSheet: 0 // Cost is now calculated by the matrix
  })),
  
  // Coated gloss paper types
  ...GSM_OPTIONS.map(gsm => ({
    id: `coated-gloss-${gsm}`,
    name: `Coated Gloss ${gsm}gsm`,
    description: `Glossy paper ${gsm}gsm ideal for vibrant color reproduction`,
    costPerSheet: 0 // Cost is now calculated by the matrix
  }))
];

export const SHEET_SIZES: SheetSize[] = [
  {
    id: "a6",
    name: "A6",
    width: 105,
    height: 148,
    description: "105mm × 148mm"
  },
  {
    id: "a5",
    name: "A5",
    width: 148,
    height: 210,
    description: "148mm × 210mm"
  },
  {
    id: "a4",
    name: "A4",
    width: 210,
    height: 297,
    description: "210mm × 297mm"
  },
  {
    id: "a3",
    name: "A3",
    width: 297,
    height: 420,
    description: "297mm × 420mm"
  },
  {
    id: "sra3",
    name: "SRA3",
    width: 320,
    height: 450,
    description: "320mm × 450mm"
  },
  {
    id: "custom",
    name: "Custom Size",
    width: 0,
    height: 0,
    description: "Enter your own dimensions"
  }
];

export const BINDING_OPTIONS: BindingOption[] = [
  {
    id: "saddle-stitch",
    name: "Saddle Stitch",
    description: "Stapled binding for booklets and brochures",
    baseCost: 3000,
    perUnitCost: 10
  },
  {
    id: "perfect-binding",
    name: "Perfect Binding",
    description: "Glued spine for books and catalogs",
    baseCost: 10000,
    perUnitCost: 50
  },
  {
    id: "spiral-binding",
    name: "Spiral Binding",
    description: "Wire or plastic coil binding for documents",
    baseCost: 5000,
    perUnitCost: 30
  },
  {
    id: "hardcover",
    name: "Hardcover",
    description: "Premium hardcover binding for books",
    baseCost: 20000,
    perUnitCost: 200
  }
];
