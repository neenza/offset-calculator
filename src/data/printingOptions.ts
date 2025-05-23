import { PaperType, SheetSize, BindingOption } from "../models/PrintingJob";

export const PAPER_TYPES: PaperType[] = [
  {
    id: "uncoated-80",
    name: "Uncoated 80gsm",
    description: "Standard uncoated paper suitable for everyday printing",
    costPerSheet: 3.00
  },
  {
    id: "uncoated-100",
    name: "Uncoated 100gsm",
    description: "Medium weight uncoated paper with better opacity",
    costPerSheet: 4.00
  },
  {
    id: "coated-matt-130",
    name: "Coated Matt 130gsm",
    description: "Professional matt coated paper for brochures and flyers",
    costPerSheet: 5.00
  },
  {
    id: "coated-gloss-150",
    name: "Coated Gloss 150gsm",
    description: "Glossy paper ideal for vibrant color reproduction",
    costPerSheet: 6.00
  },
  {
    id: "coated-gloss-250",
    name: "Coated Gloss 250gsm",
    description: "Heavy glossy paper for premium brochures and covers",
    costPerSheet: 9.00
  },
  {
    id: "cardstock-300",
    name: "Cardstock 300gsm",
    description: "Thick cardstock for business cards and postcards",
    costPerSheet: 12.00
  },
  {
    id: "cardstock-350",
    name: "Cardstock 350gsm",
    description: "Premium thick cardstock for luxury print items",
    costPerSheet: 15.00
  }
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
