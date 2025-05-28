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
  }, [measurementUnit]);

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
    const numberValue = value === '' ? 0 : parseFloat(value);
    handleInputChange(field, numberValue);
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
                value={job.quantity}
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
                      type="number"                      value={measurementUnit === 'inch' && job.customSheetWidth 
                        ? (job.customSheetWidth / 25.4).toFixed(2)
                        : job.customSheetWidth || ''}
                      onChange={(e) => {
                        // Convert to mm if in inches
                        const width = measurementUnit === 'inch' 
                          ? parseFloat(e.target.value) * 25.4 
                          : parseFloat(e.target.value);
                        
                        // Ensure both dimensions are updated to refresh cost calculations
                        onJobChange({
                          ...job,
                          customSheetWidth: width || 0,
                          // Ensure paperSizeId matches the custom setting
                          paperSizeId: 'custom'
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-2">                    <label htmlFor="customHeight" className="text-sm font-medium">
                      Height ({measurementUnit === 'mm' ? 'mm' : 'in'})
                    </label>
                    <Input 
                      id="customHeight" 
                      type="number"                      value={measurementUnit === 'inch' && job.customSheetHeight 
                        ? (job.customSheetHeight / 25.4).toFixed(2)
                        : job.customSheetHeight || ''}
                      onChange={(e) => {
                        // Convert to mm if in inches
                        const height = measurementUnit === 'inch' 
                          ? parseFloat(e.target.value) * 25.4 
                          : parseFloat(e.target.value);
                        
                        // Ensure both dimensions are updated to refresh cost calculations
                        onJobChange({
                          ...job,
                          customSheetHeight: height || 0,
                          // Ensure paperSizeId matches the custom setting
                          paperSizeId: 'custom'
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
              </div>              {/* GSM Price Mode */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium mb-2">GSM Price Variation Mode</h3>
                <div className="space-y-3">
                  <RadioGroup
                    value={job.gsmPriceMode}
                    onValueChange={(value: 'flat' | 'slope' | 'custom') => {
                      handleInputChange('gsmPriceMode', value);
                    }}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="flat" id="flat-pricing" />
                      <label htmlFor="flat-pricing" className="text-sm font-medium">
                        Flat Pricing
                        <p className="text-xs text-gray-500 mt-0.5">
                          Cost per kg is the same for all GSM values
                        </p>
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="slope" id="slope-pricing" />
                      <label htmlFor="slope-pricing" className="text-sm font-medium">
                        Slope Pricing
                        <p className="text-xs text-gray-500 mt-0.5">
                          Cost increases with higher GSM values
                        </p>
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="custom-pricing" />
                      <label htmlFor="custom-pricing" className="text-sm font-medium">
                        Custom Pricing
                        <p className="text-xs text-gray-500 mt-0.5">
                          Set specific cost per kg for each GSM value
                        </p>
                      </label>
                    </div>
                  </RadioGroup>

                  {job.gsmPriceMode === 'slope' && (
                    <div className="space-y-2 mt-3 ml-6">
                      <label htmlFor="paperCostIncreasePerGsm" className="text-sm font-medium">
                        Cost Increase per GSM (₹)
                      </label>
                      <Input
                        id="paperCostIncreasePerGsm"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={job.paperCostIncreasePerGsm || 0.5}
                        onChange={(e) => handleNumberInputChange(
                          'paperCostIncreasePerGsm', 
                          e.target.value
                        )}
                        className="w-32"
                      />
                      <p className="text-xs text-gray-500">
                        Amount to increase cost per kg for each GSM unit above 80gsm
                      </p>
                    </div>
                  )}
                </div>
              </div>              {/* Paper Matrix Selector */}              <div className="mt-4 pt-4 border-t border-gray-200">                <h3 className="text-sm font-medium mb-2">Paper Cost Matrix</h3>                <PaperMatrixSelector 
                  selectedGsm={job.paperGsm}
                  selectedSizeId={job.paperSizeId}
                  costPerKg={job.paperCostPerKg}
                  gsmPriceMode={job.gsmPriceMode}
                  paperCostIncreasePerGsm={job.paperCostIncreasePerGsm}
                  customCostMatrix={job.customCostMatrix}
                  onCustomCostChange={(gsm, value) => {
                    // Create a new customCostMatrix with the updated value
                    const updatedMatrix = { 
                      ...(job.customCostMatrix || {}), 
                      [gsm]: value 
                    };
                    
                    // Update the job with the new matrix
                    handleInputChange('customCostMatrix', updatedMatrix);
                    console.log(`Updated custom cost for ${gsm} GSM: ${value}`);
                  }}
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
                  onCostPerKgChange={(value) => handleInputChange('paperCostPerKg', value)}
                />
              </div>
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
                  value={job.designSetupFee}
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
                  value={job.plateCost}
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
                  value={job.proofingCharges}
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
                  value={job.pressHourlyRate}
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
                  value={job.estimatedPrintRunTime}
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
                  value={job.makeReadyTime}
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
                      value={job.numberOfFolds || 0}
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
                      value={job.numberOfCuts || 0}
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
                  value={job.packagingDeliveryCost || 0}
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
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tax Rate (%)</label>
                <div className="pt-2">
                  <Slider
                    value={[job.taxPercentage]}
                    min={0}
                    max={25}
                    step={0.5}
                    onValueChange={(value) => handleInputChange('taxPercentage', value[0])}
                  />
                  <div className="text-right text-sm mt-1">{job.taxPercentage}%</div>
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
