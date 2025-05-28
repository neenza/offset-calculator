import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button"; // Added Button import
import { PrintingJob } from "@/models/PrintingJob";
import { SHEET_SIZES } from "@/data/printingOptions";
import { GSM_OPTIONS } from "@/data/paperMatrix";
import { useSettingsStore } from '@/utils/settingsStore';
import { formatSheetSizeDescription, formatMeasurement } from '@/utils/calculatorUtils';
import PaperMatrixSelector from './PaperMatrixSelector';
import CostBreakdown from './CostBreakdown';

interface JobDetailsFormProps {
  job: PrintingJob;
  onJobChange: (job: PrintingJob) => void;
  hideCostBreakdown?: boolean; // New prop to control visibility of cost breakdown section
}

const JobDetailsForm: React.FC<JobDetailsFormProps> = ({ job, onJobChange, hideCostBreakdown = false }) => {
  // Initialize with cost-breakdown only if it's not hidden
  const initialOpenSections = ["printing-specs"];
  if (!hideCostBreakdown) initialOpenSections.push("cost-breakdown");
    const [openSections, setOpenSections] = useState<string[]>(initialOpenSections);
  
  // Add states to track dropdown values
  const [paperTypeKey, setPaperTypeKey] = useState<number>(0);
  const [sheetSizeKey, setSheetSizeKey] = useState<number>(0);
  // Local state for custom width and height input display values
  const [customWidthDisplay, setCustomWidthDisplay] = useState<string>("");
  const [customHeightDisplay, setCustomHeightDisplay] = useState<string>("");
  const [showPaperMatrix, setShowPaperMatrix] = useState<boolean>(false); // New state for matrix visibility
  const [isWidthFocused, setIsWidthFocused] = useState(false);
  const [isHeightFocused, setIsHeightFocused] = useState(false);
  const [isCustomTaxSelected, setIsCustomTaxSelected] = useState(false);
  const [customTaxValue, setCustomTaxValue] = useState<string>("");

  const { paperTypes, bindingOptions, measurementUnit } = useSettingsStore();

  // Force re-render of dropdowns when job values change from matrix
  useEffect(() => {
    // When paperTypeId changes externally (via matrix), increment key to force Select component refresh
    setPaperTypeKey(prev => prev + 1);
  }, [job.paperTypeId, job.paperGsm]);

  useEffect(() => {
    // When sheetSizeId changes externally (via matrix), increment key to force Select component refresh
    setSheetSizeKey(prev => prev + 1);
  }, [job.sheetSizeId, job.paperSizeId]);

  // Force re-render when measurement unit changes
  useEffect(() => {
    // This will force a re-render of inputs when measurement unit changes
    setSheetSizeKey(prev => prev + 1);
  }, [measurementUnit]);  // Initialize custom tax state based on job.taxPercentage
  useEffect(() => {
    // Check if current tax percentage is one of our fixed options
    if ([5, 12, 18].includes(job.taxPercentage)) {
      setIsCustomTaxSelected(false);
    } else {
      setIsCustomTaxSelected(false); // Don't automatically focus the custom input on load
      setCustomTaxValue(job.taxPercentage.toString());
    }
  }, []); // Run once on component mount

  const handleInputChange = (field: keyof PrintingJob, value: any) => {
    // Only update if value has actually changed
    if (job[field] !== value) {
      console.log(`Updating ${field} to:`, value);
      // Create a partial update with just the changed field
      const update = { [field]: value } as Partial<PrintingJob>;
      onJobChange({
        ...job,
        ...update
      });
    }
  };

  const handleNumberInputChange = (field: keyof PrintingJob, value: string) => {
    if (value.trim() === '') {
      handleInputChange(field, 0); // Set to 0 if input is cleared
    } else {
      const numberValue = parseFloat(value);
      if (!isNaN(numberValue)) {
        handleInputChange(field, numberValue);
      }
      // If not a valid number and not empty, do nothing, let input show invalid entry
    }
  };

  const handleBindingOptionChange = (value: string) => {
    handleInputChange('bindingOptionId', value === 'none' ? null : value);
  };

  useEffect(() => {
    if (job.sheetSizeId) {
      handleInputChange('paperSizeId', job.sheetSizeId);
    }
  }, [job.sheetSizeId]);

  useEffect(() => {
    if (job.paperTypeId) {
      // Extract the material type from paperTypeId (e.g., "coated-gloss-150" -> "coated-gloss")
      const parts = job.paperTypeId.split('-');
      if (parts.length >= 2) {
        // Remove the last part which is the GSM number
        const materialParts = parts.slice(0, -1);
        const materialType = materialParts.join('-');
        
        if (materialType && materialType !== job.paperMaterialType) {
          handleInputChange('paperMaterialType', materialType);
          console.log(`Extracted material type: ${materialType} from paper type: ${job.paperTypeId}`);
        }
      }
    }
  }, [job.paperTypeId]);

  useEffect(() => {
    if (job.paperTypeId) {
      const gsmMatch = job.paperTypeId.match(/(\d+)$/);
      if (gsmMatch && gsmMatch[1]) {
        const gsm = parseInt(gsmMatch[1], 10);
        if (!isNaN(gsm)) {
          handleInputChange('paperGsm', gsm);
          console.log(`Extracted GSM: ${gsm} from paper type: ${job.paperTypeId}`);
        }
      }
    }
  }, [job.paperTypeId]);

  // Effect to update display values when job properties or measurement unit change
  useEffect(() => {
    if (job.sheetSizeId === 'custom') {
      // Width
      if (job.customSheetWidth != null) {
        let newDisplayWidth: string;
        if (measurementUnit === 'mm') {
          newDisplayWidth = String(job.customSheetWidth === 0 && isWidthFocused && customWidthDisplay === "0" ? "0" : job.customSheetWidth);
        } else { // inch
          const inchValue = job.customSheetWidth / 25.4;
          if (isWidthFocused) {
            const currentTypedInches = parseFloat(customWidthDisplay);
            if (customWidthDisplay && !isNaN(currentTypedInches) && Math.abs(currentTypedInches - inchValue) < 1e-7 && customWidthDisplay !== "0") {
              newDisplayWidth = customWidthDisplay;
            } else if (customWidthDisplay && customWidthDisplay.endsWith('.') && !isNaN(parseFloat(customWidthDisplay.slice(0, -1))) && Math.abs(parseFloat(customWidthDisplay.slice(0,-1)) - inchValue) < 1e-7) {
              newDisplayWidth = customWidthDisplay;
            } else if (job.customSheetWidth === 0 && customWidthDisplay === "0") {
              newDisplayWidth = "0"; // Keep "0" if that's what is typed and value is 0
            } else {
              newDisplayWidth = String(inchValue); // Show full precision or allow further typing
            }
          } else {
            newDisplayWidth = inchValue.toFixed(2); // Format on blur/external change
          }
        }
        if (customWidthDisplay !== newDisplayWidth) {
          setCustomWidthDisplay(newDisplayWidth);
        }
      } else {
        if (customWidthDisplay !== '') setCustomWidthDisplay('');
      }

      // Height
      if (job.customSheetHeight != null) {
        let newDisplayHeight: string;
        if (measurementUnit === 'mm') {
          newDisplayHeight = String(job.customSheetHeight === 0 && isHeightFocused && customHeightDisplay === "0" ? "0" : job.customSheetHeight);
        } else { // inch
          const inchValue = job.customSheetHeight / 25.4;
          if (isHeightFocused) {
            const currentTypedInches = parseFloat(customHeightDisplay);
            if (customHeightDisplay && !isNaN(currentTypedInches) && Math.abs(currentTypedInches - inchValue) < 1e-7 && customHeightDisplay !== "0") {
              newDisplayHeight = customHeightDisplay;
            } else if (customHeightDisplay && customHeightDisplay.endsWith('.') && !isNaN(parseFloat(customHeightDisplay.slice(0, -1))) && Math.abs(parseFloat(customHeightDisplay.slice(0,-1)) - inchValue) < 1e-7) {
                newDisplayHeight = customHeightDisplay;
            } else if (job.customSheetHeight === 0 && customHeightDisplay === "0") {
              newDisplayHeight = "0"; // Keep "0" if that's what is typed and value is 0
            } else {
              newDisplayHeight = String(inchValue);
            }
          } else {
            newDisplayHeight = inchValue.toFixed(2);
          }
        }
        if (customHeightDisplay !== newDisplayHeight) {
          setCustomHeightDisplay(newDisplayHeight);
        }
      } else {
        if (customHeightDisplay !== '') setCustomHeightDisplay('');
      }
    } else {
      if (customWidthDisplay !== '') setCustomWidthDisplay('');
      if (customHeightDisplay !== '') setCustomHeightDisplay('');
    }
  }, [job.customSheetWidth, job.customSheetHeight, measurementUnit, job.sheetSizeId, isWidthFocused, isHeightFocused, customWidthDisplay, customHeightDisplay]);

  const handleCustomGsmCostChange = (gsm: string, value: string) => {
    const cost = parseFloat(value);
    const newCustomCostMatrix = {
      ...(job.customCostMatrix || {}),
      [gsm]: isNaN(cost) ? 0 : cost, // Default to 0 if input is not a valid number
    };
    handleInputChange('customCostMatrix', newCustomCostMatrix);
  };

  return (
    <div className="space-y-4 mb-16">
      <Card className="border border-gray-200">
        <CardHeader className="bg-gray-200">
          <CardTitle className="text-print-blue">Job Details</CardTitle>
        </CardHeader>
        <CardContent className="bg-gray-100 p-4 shadow-inner">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="jobName" className="text-sm font-medium">Job Name/Description</label>
              <Input 
                id="jobName" 
                placeholder="Enter job name or description" 
                value={job.jobName}
                onChange={(e) => handleInputChange('jobName', e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="quantity" className="text-sm font-medium">Quantity</label>
              <Input 
                id="quantity" 
                type="number" 
                min="1"
                value={String(job.quantity)} // Changed
                onChange={(e) => handleNumberInputChange('quantity', e.target.value)}
                className="bg-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Accordion 
        type="multiple" 
        value={openSections}
        onValueChange={setOpenSections}
      >
        {/* Printing Specifications */}
        <AccordionItem value="printing-specs" className="mb-2">
          <AccordionTrigger className="bg-gray-200 hover:bg-gray-300 rounded-t-md px-4 py-2 text-print-blue font-medium transition-colors">
            Printing Specifications
          </AccordionTrigger>
          <AccordionContent className="bg-gray-100 p-4 border border-gray-200 rounded-b-md shadow-inner">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="colors" className="text-sm font-medium">Number of Colors</label>
                <Select 
                  value={job.numberOfColors.toString()} 
                  onValueChange={(value) => handleNumberInputChange('numberOfColors', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select number of colors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1-color</SelectItem>
                    <SelectItem value="2">2-color</SelectItem>
                    <SelectItem value="4">4-color (CMYK)</SelectItem>
                    <SelectItem value="5">5-color (CMYK + Spot)</SelectItem>
                    <SelectItem value="6">6-color</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="doubleSided" 
                  checked={job.isDoubleSided}
                  onCheckedChange={(checked) => handleInputChange('isDoubleSided', !!checked)}
                />
                <label htmlFor="doubleSided" className="text-sm font-medium">Double-sided Printing</label>
              </div>              <div className="space-y-2">
                <label htmlFor="sheetSize" className="text-sm font-medium">Sheet Size</label>                <Select 
                  key={`sheet-size-${sheetSizeKey}`}
                  value={job.sheetSizeId || ""} 
                  onValueChange={(value) => {                    // Update the sheet size
                    if (value === 'custom') {
                      // When selecting custom, we need to also update paperSizeId
                      // and ensure we have some default dimensions
                      const updates: Partial<PrintingJob> = {
                        sheetSizeId: value,
                        paperSizeId: value,
                        // Set default dimensions if not already set
                        customSheetWidth: job.customSheetWidth || 210, // A4 width as default
                        customSheetHeight: job.customSheetHeight || 297 // A4 height as default
                      };
                      
                      onJobChange({
                        ...job,
                        ...updates
                      });
                      console.log(`Sheet size dropdown: updated to custom size`);
                    } else {
                      // Batch updates for better synchronization
                      const updates: Partial<PrintingJob> = {
                        sheetSizeId: value,
                        paperSizeId: value
                      };
                      
                      onJobChange({
                        ...job,
                        ...updates
                      });
                      console.log(`Sheet size dropdown: updated size to ${value}`);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sheet size" />
                  </SelectTrigger>                  <SelectContent>                    {SHEET_SIZES.map(size => (
                      <SelectItem key={size.id} value={size.id}>
                        {size.name} - {formatSheetSizeDescription(size.width, size.height, measurementUnit)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>{job.sheetSizeId === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">                    <label htmlFor="customWidth" className="text-sm font-medium">
                      Width ({measurementUnit === 'mm' ? 'mm' : 'in'})
                    </label>                    <Input 
                      id="customWidth" 
                      type="number"                      value={customWidthDisplay}
                      onFocus={() => setIsWidthFocused(true)}
                      onBlur={() => {
                        setIsWidthFocused(false);
                        // Explicitly re-format on blur to apply toFixed(2) if needed
                        if (job.sheetSizeId === 'custom' && job.customSheetWidth != null && measurementUnit === 'inch') {
                          setCustomWidthDisplay((job.customSheetWidth / 25.4).toFixed(2));
                        }
                      }}
                      onChange={(e) => {
                        const userInput = e.target.value;
                        setCustomWidthDisplay(userInput); // Update display immediately

                        let newMmWidth: number;
                        if (userInput.trim() === "") {
                          newMmWidth = 0; // Default for empty input
                        } else {
                          const parsedValue = parseFloat(userInput);
                          if (!isNaN(parsedValue)) {
                            // Convert to mm without intermediate rounding of the parsed inch value
                            newMmWidth = measurementUnit === 'inch'
                              ? parsedValue * 25.4
                              : parsedValue;
                          } else {
                            // Invalid input, do not update the job's numeric value
                            return;
                          }
                        }

                        onJobChange({
                          ...job,
                          customSheetWidth: newMmWidth,
                          paperSizeId: 'custom' // Ensure this is still set
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-2">                    <label htmlFor="customHeight" className="text-sm font-medium">
                      Height ({measurementUnit === 'mm' ? 'mm' : 'in'})
                    </label>
                    <Input 
                      id="customHeight" 
                      type="number"                      value={customHeightDisplay}
                      onFocus={() => setIsHeightFocused(true)}
                      onBlur={() => {
                        setIsHeightFocused(false);
                        // Explicitly re-format on blur
                        if (job.sheetSizeId === 'custom' && job.customSheetHeight != null && measurementUnit === 'inch') {
                          setCustomHeightDisplay((job.customSheetHeight / 25.4).toFixed(2));
                        }
                      }}
                      onChange={(e) => {
                        const userInput = e.target.value;
                        setCustomHeightDisplay(userInput); // Update display immediately

                        let newMmHeight: number;
                        if (userInput.trim() === "") {
                          newMmHeight = 0; // Default for empty input
                        } else {
                          const parsedValue = parseFloat(userInput);
                          if (!isNaN(parsedValue)) {
                            // Convert to mm without intermediate rounding of the parsed inch value
                            newMmHeight = measurementUnit === 'inch'
                              ? parsedValue * 25.4
                              : parsedValue;
                          } else {
                            // Invalid input, do not update the job's numeric value
                            return;
                          }
                        }

                        onJobChange({
                          ...job,
                          customSheetHeight: newMmHeight,
                          paperSizeId: 'custom' // Ensure this is still set
                        });
                      }}
                    />
                  </div>
                </div>              )}                {/* Paper Selection (Split into Material Type and GSM) */}
              
              {/* Paper Material Type */}
              <div className="space-y-2">
                <label htmlFor="paperMaterialType" className="text-sm font-medium">Paper Material</label>
                <Select 
                  key={`paper-material-${paperTypeKey}`}
                  value={job.paperMaterialType || "coated-gloss"}
                  onValueChange={(value) => {
                    // Update paper material type and also update the combined paperTypeId
                    const updates: Partial<PrintingJob> = {
                      paperMaterialType: value,
                      paperTypeId: `${value}-${job.paperGsm || 150}`
                    };
                    
                    onJobChange({
                      ...job,
                      ...updates
                    });
                    console.log(`Paper material updated to: ${value}`);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select paper material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uncoated">Uncoated Paper</SelectItem>
                    <SelectItem value="coated-matt">Coated Matt Paper</SelectItem>
                    <SelectItem value="coated-gloss">Coated Gloss Paper</SelectItem>
                    <SelectItem value="cardstock">Cardstock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Paper GSM */}
              <div className="space-y-2">
                <label htmlFor="paperGsm" className="text-sm font-medium">Paper GSM</label>
                <Select 
                  key={`paper-gsm-${paperTypeKey}`}
                  value={job.paperGsm?.toString() || ""}
                  onValueChange={(value) => {
                    const gsm = parseInt(value, 10);
                    if (!isNaN(gsm)) {
                      // Batch updates for better synchronization
                      const updates: Partial<PrintingJob> = {
                        paperGsm: gsm,
                        paperTypeId: `${job.paperMaterialType || 'coated-gloss'}-${gsm}`
                      };
                      
                      onJobChange({
                        ...job,
                        ...updates
                      });
                      console.log(`Paper GSM updated to: ${gsm}`);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select GSM" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {GSM_OPTIONS.map(gsm => (
                      <SelectItem key={gsm} value={gsm.toString()}>
                        {gsm} GSM
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>                <p className="text-xs text-gray-500 mt-1">
                  {job.paperMaterialType && job.paperGsm ? 
                   `${job.paperMaterialType.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())} ${job.paperGsm}gsm` : 
                   "Select paper material and GSM, or use the matrix below for precise pricing"}
                </p>
              </div>

              {/* GSM Price Mode Selection */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="text-sm font-medium mb-2 block">Paper Costing Mode</label>
                <RadioGroup
                  value={job.gsmPriceMode}
                  onValueChange={(value: 'flat' | 'custom') => {
                    // Ensure only 'flat' or 'custom' can be set
                    if (value === 'flat' || value === 'custom') {
                        handleInputChange('gsmPriceMode', value);
                    }
                  }}
                  className="flex space-x-2"
                >
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="flat" id="flat-pricing" />
                    <label htmlFor="flat-pricing" className="text-sm font-medium cursor-pointer">Flat</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="custom" id="custom-pricing" />
                    <label htmlFor="custom-pricing" className="text-sm font-medium cursor-pointer">Custom</label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-gray-500 mt-1">
                  Select 'Flat' for a single cost per Kg, or 'Custom' to set cost per Kg for each GSM.
                </p>
              </div>

              {/* Cost per Kg input for Flat mode */}
              {job.gsmPriceMode === 'flat' && (
                <div className="mt-4 space-y-2 bg-gray-200 p-3 rounded-md shadow-sm">
                  <label htmlFor="costPerKgFlat" className="text-sm font-medium">
                    Cost per Kg (₹)
                  </label>
                  <Input 
                    id="costPerKgFlat" 
                    type="number" 
                    min="0" 
                    step="1" 
                    value={String(job.paperCostPerKg || '')} 
                    onChange={(e) => handleNumberInputChange('paperCostPerKg', e.target.value)} 
                    className="bg-white"
                  />
                  <p className="text-xs text-gray-500">
                    Enter the paper cost per kilogram for all GSM values.
                  </p>
                </div>
              )}

              {/* Custom Cost per GSM inputs for Custom mode */}
              {job.gsmPriceMode === 'custom' && (
                <div className="mt-4 space-y-2 bg-gray-200 p-3 rounded-md shadow-sm">
                  <label className="text-sm font-medium">Custom Cost per Kg by GSM (₹)</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-4 gap-y-2 mt-1">
                    {GSM_OPTIONS.map(gsm => (
                      <div key={gsm} className="space-y-1">
                        <label htmlFor={`custom-cost-${gsm}`} className="text-xs font-medium">{gsm} GSM</label>
                        <Input
                          id={`custom-cost-${gsm}`}
                          type="number"
                          min="0"
                          step="1"
                          value={String(job.customCostMatrix?.[gsm.toString()] || '')}
                          onChange={(e) => handleCustomGsmCostChange(gsm.toString(), e.target.value)}
                          className="bg-white text-sm h-8 w-full"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Enter the specific cost per kg for each GSM value.
                  </p>
                </div>
              )}

              {/* Paper Matrix Toggle Button */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button 
                  variant="outline"
                  className="w-full text-sm py-2 h-auto bg-gray-50 hover:bg-gray-100 text-print-blue border-gray-300"
                  onClick={() => setShowPaperMatrix(!showPaperMatrix)}
                >
                  {showPaperMatrix ? "Hide Paper Cost Matrix" : "Show Paper Cost Matrix"}
                </Button>
              </div>

              {/* Paper Matrix Selector - Conditionally Rendered */} 
              {showPaperMatrix && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium mb-2">Paper Cost Matrix</h3>
                  <PaperMatrixSelector 
                    selectedGsm={job.paperGsm}
                    selectedSizeId={job.paperSizeId}
                    costPerKg={job.paperCostPerKg}
                    gsmPriceMode={job.gsmPriceMode}
                    paperCostIncreasePerGsm={job.paperCostIncreasePerGsm}
                    customCostMatrix={job.customCostMatrix}
                    onMatrixCellSelected={(gsm, sizeId, costPerSheet) => {
                      // Create a batch of updates to ensure all changes are applied together
                      const updates: Partial<PrintingJob> = {};
                      
                      // Update matrix-specific fields
                      updates.paperGsm = gsm;
                      updates.paperSizeId = sizeId;
                        // Also update the sheet size dropdown to match
                      updates.sheetSizeId = sizeId;
                      
                      // Use the currently selected paper material type or default to coated-gloss
                      const paperMaterialType = job.paperMaterialType || 'coated-gloss';
                      
                      // Update material type
                      updates.paperMaterialType = paperMaterialType;
                      
                      // Create the combined paperTypeId from material type and GSM
                      const newPaperTypeId = `${updates.paperMaterialType}-${gsm}`;
                      updates.paperTypeId = newPaperTypeId;
                      
                      // Apply all updates at once
                      onJobChange({
                        ...job,
                        ...updates
                      });
                      
                      console.log(`Matrix selection applied: Size=${sizeId}, GSM=${gsm}, Paper=${updates.paperMaterialType}, Cost=${costPerSheet}`);
                    }}
                  />
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Pre-Press Costs */}
        <AccordionItem value="prepress-costs" className="mb-2">
          <AccordionTrigger className="bg-gray-200 hover:bg-gray-300 rounded-t-md px-4 py-2 text-print-blue font-medium transition-colors">
            Pre-Press Costs
          </AccordionTrigger>
          <AccordionContent className="bg-gray-100 p-4 border border-gray-200 rounded-b-md shadow-inner">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="designSetupFee" className="text-sm font-medium">Design & Setup Fee (₹)</label>
                <Input 
                  id="designSetupFee" 
                  type="number"
                  min="0"
                  step="0.01"
                  value={String(job.designSetupFee)} // Changed
                  onChange={(e) => handleNumberInputChange('designSetupFee', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="plateCost" className="text-sm font-medium">Plate Cost (₹ per plate)</label>
                <Input 
                  id="plateCost" 
                  type="number"
                  min="0"
                  step="0.01"
                  value={String(job.plateCost)} // Changed
                  onChange={(e) => handleNumberInputChange('plateCost', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="proofingCharges" className="text-sm font-medium">Proofing Charges (₹)</label>
                <Input 
                  id="proofingCharges" 
                  type="number"
                  min="0"
                  step="0.01"
                  value={String(job.proofingCharges)} // Changed
                  onChange={(e) => handleNumberInputChange('proofingCharges', e.target.value)}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Press & Production Costs */}
        <AccordionItem value="press-costs" className="mb-2">
          <AccordionTrigger className="bg-gray-200 hover:bg-gray-300 rounded-t-md px-4 py-2 text-print-blue font-medium transition-colors">
            Press & Production Costs
          </AccordionTrigger>
          <AccordionContent className="bg-gray-100 p-4 border border-gray-200 rounded-b-md shadow-inner">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="pressHourlyRate" className="text-sm font-medium">Press Hourly Rate (₹ per hour)</label>
                <Input 
                  id="pressHourlyRate" 
                  type="number"
                  min="0"
                  step="0.01"
                  value={String(job.pressHourlyRate)} // Changed
                  onChange={(e) => handleNumberInputChange('pressHourlyRate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="estimatedPrintRunTime" className="text-sm font-medium">
                  Estimated Print Run Time (hours)
                </label>
                <Input 
                  id="estimatedPrintRunTime" 
                  type="number"
                  min="0"
                  step="0.1"
                  value={String(job.estimatedPrintRunTime)} // Changed
                  onChange={(e) => handleNumberInputChange('estimatedPrintRunTime', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="makeReadyTime" className="text-sm font-medium">Make-Ready Time (hours)</label>
                <Input 
                  id="makeReadyTime" 
                  type="number"
                  min="0"
                  step="0.1"
                  value={String(job.makeReadyTime)} // Changed
                  onChange={(e) => handleNumberInputChange('makeReadyTime', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Wastage Allowance (%)</label>
                <div className="pt-2">
                  <Slider
                    value={[job.wastagePercentage]}
                    min={0}
                    max={20}
                    step={1}
                    onValueChange={(value) => handleInputChange('wastagePercentage', value[0])}
                  />
                  <div className="text-right text-sm mt-1">{job.wastagePercentage}%</div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Finishing Options */}
        <AccordionItem value="finishing-options" className="mb-2">
          <AccordionTrigger className="bg-gray-200 hover:bg-gray-300 rounded-t-md px-4 py-2 text-print-blue font-medium transition-colors">
            Finishing Options
          </AccordionTrigger>
          <AccordionContent className="bg-gray-100 p-4 border border-gray-200 rounded-b-md shadow-inner">
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="foldingRequired" 
                    checked={job.foldingRequired || false}
                    onCheckedChange={(checked) => handleInputChange('foldingRequired', !!checked)}
                  />
                  <label htmlFor="foldingRequired" className="text-sm font-medium">Folding Required</label>
                </div>
                
                {job.foldingRequired && (
                  <div className="mt-2 ml-6 space-y-2">
                    <label htmlFor="numberOfFolds" className="text-sm font-medium">Number of Folds</label>
                    <Input 
                      id="numberOfFolds" 
                      type="number"
                      min="1"
                      max="4"
                      value={String(job.numberOfFolds || 0)} // Changed
                      onChange={(e) => handleNumberInputChange('numberOfFolds', e.target.value)}
                    />
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="cuttingRequired" 
                    checked={job.cuttingRequired || false}
                    onCheckedChange={(checked) => handleInputChange('cuttingRequired', !!checked)}
                  />
                  <label htmlFor="cuttingRequired" className="text-sm font-medium">Cutting/Trimming Required</label>
                </div>
                
                {job.cuttingRequired && (
                  <div className="mt-2 ml-6 space-y-2">
                    <label htmlFor="numberOfCuts" className="text-sm font-medium">Number of Cuts</label>
                    <Input 
                      id="numberOfCuts" 
                      type="number"
                      min="1"
                      value={String(job.numberOfCuts || 0)} // Changed
                      onChange={(e) => handleNumberInputChange('numberOfCuts', e.target.value)}
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="bindingOption" className="text-sm font-medium">Binding Option</label>
                <Select 
                  value={job.bindingOptionId || 'none'}
                  onValueChange={handleBindingOptionChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select binding (if required)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {bindingOptions.map(binding => (
                      <SelectItem key={binding.id} value={binding.id}>
                        {binding.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {job.bindingOptionId && bindingOptions.find(b => b.id === job.bindingOptionId) && (
                  <p className="text-xs text-gray-500 mt-1">
                    {bindingOptions.find(b => b.id === job.bindingOptionId)?.description}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="laminationType" className="text-sm font-medium">Lamination</label>
                <Select 
                  value={job.laminationType || 'none'}
                  onValueChange={(value: 'none' | 'matt' | 'gloss') => handleInputChange('laminationType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lamination type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="matt">Matt</SelectItem>
                    <SelectItem value="gloss">Gloss</SelectItem>
                  </SelectContent>
                </Select>
                
                {job.laminationType !== 'none' && (
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox 
                      id="doubleSidedLamination" 
                      checked={job.isDoubleSidedLamination || false}
                      onCheckedChange={(checked) => handleInputChange('isDoubleSidedLamination', !!checked)}
                    />
                    <label htmlFor="doubleSidedLamination" className="text-sm">Double-sided Lamination</label>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="embossingRequired" 
                  checked={job.embossingRequired || false}
                  onCheckedChange={(checked) => handleInputChange('embossingRequired', !!checked)}
                />
                <label htmlFor="embossingRequired" className="text-sm font-medium">Embossing Required</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="foilingRequired" 
                  checked={job.foilingRequired || false}
                  onCheckedChange={(checked) => handleInputChange('foilingRequired', !!checked)}
                />
                <label htmlFor="foilingRequired" className="text-sm font-medium">Foiling Required</label>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="packagingDeliveryCost" className="text-sm font-medium">
                  Packaging & Delivery Cost (₹)
                </label>
                <Input 
                  id="packagingDeliveryCost" 
                  type="number"
                  min="0"
                  step="0.01"
                  value={String(job.packagingDeliveryCost || 0)} // Changed
                  onChange={(e) => handleNumberInputChange('packagingDeliveryCost', e.target.value)}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Additional Costs */}
        <AccordionItem value="additional-costs" className="mb-2">
          <AccordionTrigger className="bg-gray-200 hover:bg-gray-300 rounded-t-md px-4 py-2 text-print-blue font-medium transition-colors">
            Additional Costs
          </AccordionTrigger>
          <AccordionContent className="bg-gray-100 p-4 border border-gray-200 rounded-b-md shadow-inner">
            <div className="space-y-4">              <div className="space-y-2">
                <label className="text-sm font-medium">Tax Rate (%)</label>                <div className="mt-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    <div 
                      onClick={() => handleInputChange('taxPercentage', 5)}
                      className={`flex flex-col items-center justify-between rounded-md border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 cursor-pointer
                        ${job.taxPercentage === 5 ? 'border-print-blue' : ''}`}
                    >
                      <span className="text-sm font-medium">5%</span>
                    </div>

                    <div 
                      onClick={() => handleInputChange('taxPercentage', 12)}
                      className={`flex flex-col items-center justify-between rounded-md border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 cursor-pointer
                        ${job.taxPercentage === 12 ? 'border-print-blue' : ''}`}
                    >
                      <span className="text-sm font-medium">12%</span>
                    </div>

                    <div 
                      onClick={() => handleInputChange('taxPercentage', 18)}
                      className={`flex flex-col items-center justify-between rounded-md border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 cursor-pointer
                        ${job.taxPercentage === 18 ? 'border-print-blue' : ''}`}
                    >
                      <span className="text-sm font-medium">18%</span>
                    </div>

                    <div 
                      onClick={() => setIsCustomTaxSelected(true)}
                      className={`flex flex-col items-center justify-between rounded-md border-2 border-gray-200 bg-white p-3 hover:bg-gray-50 cursor-pointer
                        ${![5, 12, 18].includes(job.taxPercentage) ? 'border-print-blue' : ''}`}
                    >
                      {isCustomTaxSelected ? (
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
                          step="0.5"
                          value={customTaxValue}
                          onClick={(e) => e.stopPropagation()}
                          onFocus={() => setIsCustomTaxSelected(true)}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setCustomTaxValue(newValue);
                            
                            const taxValue = parseFloat(newValue);
                            if (!isNaN(taxValue)) {
                              handleInputChange('taxPercentage', taxValue);
                            }
                          }}
                          className="w-full text-center"
                          autoFocus
                        />
                      ) : (
                        <span className="text-sm font-medium">{job.taxPercentage}%</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right text-sm mt-3">Current tax rate: {job.taxPercentage}%</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Discount (%)</label>
                <div className="pt-2">
                  <Slider
                    value={[job.discountPercentage]}
                    min={0}
                    max={50}
                    step={1}
                    onValueChange={(value) => handleInputChange('discountPercentage', value[0])}
                  />
                  <div className="text-right text-sm mt-1">{job.discountPercentage}%</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Rush Fee (%)</label>
                <div className="pt-2">
                  <Slider
                    value={[job.rushFeePercentage]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={(value) => handleInputChange('rushFeePercentage', value[0])}
                  />
                  <div className="text-right text-sm mt-1">{job.rushFeePercentage}%</div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Cost Breakdown */}
        {!hideCostBreakdown && (
          <AccordionItem value="cost-breakdown" className="mt-4">
            <AccordionTrigger className="bg-gray-200 hover:bg-gray-300 rounded-t-md px-4 py-2 text-print-blue font-medium transition-colors">
              Cost Breakdown
            </AccordionTrigger>
            <AccordionContent className="bg-gray-100 p-4 border border-gray-200 rounded-b-md shadow-inner">
              <CostBreakdown job={job} />
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
};

export default JobDetailsForm;
