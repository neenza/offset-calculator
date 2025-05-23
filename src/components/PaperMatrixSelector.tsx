import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { SHEET_SIZES } from "@/data/printingOptions";
import { GSM_OPTIONS, calculateCostPerSheet } from "@/data/paperMatrix";
import { formatCurrency } from "@/utils/calculatorUtils";

interface PaperMatrixSelectorProps {
  selectedGsm: number | undefined;
  selectedSizeId: string | undefined;
  costPerKg: number | undefined;
  onMatrixCellSelected: (gsm: number, sizeId: string, costPerSheet: number) => void;
  onCostPerKgChange: (value: number) => void;
}

const PaperMatrixSelector: React.FC<PaperMatrixSelectorProps> = ({
  selectedGsm,
  selectedSizeId,
  costPerKg = 150,
  onMatrixCellSelected,
  onCostPerKgChange
}) => {
  const [matrixValues, setMatrixValues] = useState<{[key: string]: number}>({});
  
  // Filter out 'custom' size for the matrix
  const relevantSizes = SHEET_SIZES.filter(size => size.id !== 'custom');
  
  // Calculate all matrix values when costPerKg changes
  useEffect(() => {
    const newValues: {[key: string]: number} = {};
    
    relevantSizes.forEach(size => {
      GSM_OPTIONS.forEach(gsm => {
        const key = `${size.id}-${gsm}`;
        newValues[key] = calculateCostPerSheet(
          size.width,
          size.height,
          gsm,
          costPerKg || 150
        );
      });
    });
    
    setMatrixValues(newValues);
  }, [costPerKg]);
  
  const handleCellClick = (gsm: number, sizeId: string) => {
    const key = `${sizeId}-${gsm}`;
    const costPerSheet = matrixValues[key] || 0;
    onMatrixCellSelected(gsm, sizeId, costPerSheet);
  };
  
  return (
    <div className="space-y-4 mt-4">      <div className="bg-gray-200 p-2 rounded-md">
        <div className="space-y-2">
          <label htmlFor="costPerKg" className="text-sm font-medium">Cost per Kg (₹)</label>
          <Input 
            id="costPerKg"
            type="number"
            min="1"
            step="1"
            value={costPerKg || ""}
            onChange={(e) => onCostPerKgChange(parseFloat(e.target.value) || 0)}
            className="bg-white"
          />
          <p className="text-xs text-gray-600">Enter the paper cost per kilogram</p>
        </div>
      </div>
      
      <div className="relative overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px] sticky left-0 z-20 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Size</TableHead>
              {GSM_OPTIONS.map(gsm => (
                <TableHead key={gsm} className="text-center">
                  {gsm} GSM
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {relevantSizes.map(size => (
              <TableRow key={size.id}>
                <TableCell className="font-medium whitespace-nowrap sticky left-0 z-10 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  {size.name}<br />
                  <span className="text-xs text-gray-500">{size.description}</span>                </TableCell>
                {GSM_OPTIONS.map(gsm => {
                  const key = `${size.id}-${gsm}`;
                  const cost = matrixValues[key] || 0;
                  const isSelected = selectedGsm === gsm && selectedSizeId === size.id;
                  
                  return (
                    <TableCell 
                      key={gsm} 
                      className={`text-center cursor-pointer hover:bg-gray-200 min-w-[100px] ${
                        isSelected ? 'bg-blue-100 font-bold' : ''
                      }`}
                      onClick={() => handleCellClick(gsm, size.id)}
                    >
                      {formatCurrency(cost)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="text-sm text-gray-600">
        <p>Click on a cell to select that paper size and GSM combination.</p>
        <p>Cost calculated as: Area (m²) × GSM × (Cost per kg ÷ 1000)</p>
      </div>
    </div>
  );
};

export default PaperMatrixSelector;
