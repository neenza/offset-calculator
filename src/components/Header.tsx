import React from 'react';
import { Printer, Settings, RulerIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useSettingsStore, MeasurementUnit } from '@/utils/settingsStore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { measurementUnit, setMeasurementUnit } = useSettingsStore();

  const toggleMeasurementUnit = () => {
    const newUnit: MeasurementUnit = measurementUnit === 'mm' ? 'inch' : 'mm';
    setMeasurementUnit(newUnit);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Printer className="h-6 w-6 text-print-blue" />
          <h1 className="text-xl font-bold text-print-blue">Amrut Offset</h1>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Unit Toggle Switch */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <div className="flex items-center space-x-1">
                    <span className={`text-xs ${measurementUnit === 'mm' ? 'font-bold text-print-blue' : 'text-gray-500'}`}>mm</span>
                    <Switch 
                      checked={measurementUnit === 'inch'}
                      onCheckedChange={toggleMeasurementUnit}
                    />
                    <span className={`text-xs ${measurementUnit === 'inch' ? 'font-bold text-print-blue' : 'text-gray-500'}`}>in</span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Toggle between millimeters and inches</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Settings Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/settings')}
            className="text-print-blue hover:text-print-blue/80"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
