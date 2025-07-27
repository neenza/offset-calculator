import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { SHEET_SIZES } from "@/data/printingOptions";
import { GSM_OPTIONS } from "@/data/paperMatrix";
import calculatorApi from '@/utils/calculatorApi';
import { formatCurrency, formatSheetSizeDescription } from '@/utils/formatters';
import { useSettingsStore } from '@/utils/settingsStore';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isLoggedIn } from '@/utils/authService';

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
  const [loading, setLoading] = useState<boolean>(true);
  const { measurementUnit } = useSettingsStore();
  const navigate = useNavigate();
  
  // Filter out 'custom' size for the matrix
  const relevantSizes = SHEET_SIZES.filter(size => size.id !== 'custom');
  
  // Use local calculation or backend API based on authentication status
  useEffect(() => {
    const calculateMatrixValues = async () => {
      setLoading(true);
      
      // If not logged in, use client-side calculation (implement a simpler version)
      if (!isLoggedIn()) {
        setLoading(false);
        return;
      }
      
      try {
        // Implementation for authenticated API calculation would go here
        // This would need an API endpoint to calculate the entire matrix at once
        // For now, we're keeping the implementation simple
        
        const newValues: {[key: string]: number} = {};
        
        // Simple calculation as fallback while we wait for API implementation
        for (const size of relevantSizes) {
          for (const gsm of GSM_OPTIONS) {
            const key = `${size.id}-${gsm}`;
            
            // Simple calculation as a placeholder
            // In a real implementation, this would call the API
            const areaInSqm = (size.width / 1000) * (size.height / 1000);
            const weightInKg = areaInSqm * (gsm / 1000);
            const costValue = weightInKg * (costPerKg || 150);
            
            newValues[key] = costValue;
          }
        }
        
        setMatrixValues(newValues);
      } catch (error) {
        console.error('Error calculating matrix values:', error);
      } finally {
        setLoading(false);
      }
    };
    
    calculateMatrixValues();
  }, [costPerKg, gsmPriceMode, paperCostIncreasePerGsm, customCostMatrix, relevantSizes]);
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
    if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading paper matrix...</span>
      </div>
    );
  }
  
  if (!isLoggedIn()) {
    return (
      <div className="p-4 text-center">
        <p>Please login to view the paper matrix</p>
        <button 
          onClick={() => navigate('/profile')} 
          className="mt-2 bg-primary text-primary-foreground px-4 py-2 rounded"
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="relative overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px] sticky left-0 z-20 bg-background shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Size</TableHead>
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
                <TableCell className="font-medium whitespace-nowrap sticky left-0 z-10 bg-background shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  {size.name}<br />
                  <span className="text-xs text-muted-foreground">
                    {formatSheetSizeDescription(size.width, size.height, measurementUnit)}
                  </span>
                </TableCell>
                {GSM_OPTIONS.map(gsm => {
                  const key = `${size.id}-${gsm}`;
                  const isHighlighted = highlightedCell === key;
                  
                  return (
                    <TableCell 
                      key={key} 
                      className={`text-center cursor-pointer hover:bg-muted ${isHighlighted ? 'bg-primary/10 hover:bg-primary/20' : ''}`}
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
