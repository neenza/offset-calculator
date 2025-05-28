import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { SHEET_SIZES } from "@/data/printingOptions";
import { GSM_OPTIONS, calculateCostPerSheet } from "@/data/paperMatrix";
import { formatCurrency, formatSheetSizeDescription } from "@/utils/calculatorUtils";
import { useSettingsStore } from '@/utils/settingsStore';

interface PaperMatrixSelectorProps {
  selectedGsm: number | undefined;
  selectedSizeId: string | undefined;
  costPerKg: number | undefined;
  gsmPriceMode: 'flat' | 'slope' | 'custom';
  paperCostIncreasePerGsm: number | undefined;
  customCostMatrix?: {[key: string]: number};
  onMatrixCellSelected: (gsm: number, sizeId: string, costPerSheet: number) => void;
}

const PaperMatrixSelector: React.FC<PaperMatrixSelectorProps> = ({
  selectedGsm,
  selectedSizeId,
  costPerKg = 150,
  gsmPriceMode = 'flat',
  paperCostIncreasePerGsm = 0.5,
  customCostMatrix = {},
  onMatrixCellSelected,
}) => {
  const [matrixValues, setMatrixValues] = useState<{[key: string]: number}>({});
  const [highlightedCell, setHighlightedCell] = useState<string | null>(null);
  const { measurementUnit } = useSettingsStore();
  
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
          costPerKg || 150,
          gsmPriceMode,
          paperCostIncreasePerGsm || 0.5,
          80, // baseGsm
          customCostMatrix
        );
      });
    });
    
    setMatrixValues(newValues);
  }, [costPerKg, gsmPriceMode, paperCostIncreasePerGsm, customCostMatrix]);
    // Update highlighted cell when props change
  useEffect(() => {
    if (selectedGsm && selectedSizeId) {
      const key = `${selectedSizeId}-${selectedGsm}`;
      setHighlightedCell(key);
      console.log(`Matrix highlight updated to: ${key} (size: ${selectedSizeId}, gsm: ${selectedGsm})`);
    } else {
      setHighlightedCell(null);
    }
  }, [selectedGsm, selectedSizeId]);
  
  const handleCellClick = (gsm: number, sizeId: string) => {
    const key = `${sizeId}-${gsm}`;
    setHighlightedCell(key);
    const costPerSheet = matrixValues[key] || 0;
    onMatrixCellSelected(gsm, sizeId, costPerSheet);
    console.log(`Matrix cell clicked: ${key} (cost: ${costPerSheet})`);
  };
    return (
    <div className="space-y-4 mt-4">
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
                  <span className="text-xs text-gray-500">
                    {formatSheetSizeDescription(size.width, size.height, measurementUnit)}
                  </span>
                </TableCell>
                {GSM_OPTIONS.map(gsm => {
                  const key = `${size.id}-${gsm}`;
                  const isHighlighted = highlightedCell === key;
                  
                  return (
                    <TableCell 
                      key={key} 
                      className={`text-center cursor-pointer hover:bg-gray-100 ${isHighlighted ? 'bg-blue-100 hover:bg-blue-100' : ''}`}
                      onClick={() => handleCellClick(gsm, size.id)}
                    >
                      {formatCurrency(matrixValues[key] || 0)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PaperMatrixSelector;
