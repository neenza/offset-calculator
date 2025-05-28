import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useSettingsStore } from '@/utils/settingsStore';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();  const { 
    bindingOptions, 
    setBindingOptions,
    laminationCosts,
    setLaminationCosts,
    saveSettings,
    resetSettings,
    loadSettings
  } = useSettingsStore();

  // Load settings when component mounts
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleBindingCostChange = (bindingId: string, field: 'baseCost' | 'perUnitCost', newCost: string) => {
    const cost = parseFloat(newCost) || 0;
    console.log(`Updating binding ${bindingId} ${field} to: ${cost}`);
    setBindingOptions(bindingOptions.map(binding => 
      binding.id === bindingId ? { ...binding, [field]: cost } : binding
    ));
  };

  const handleLaminationCostChange = (type: keyof typeof laminationCosts, newCost: string) => {
    const cost = parseFloat(newCost) || 0;
    console.log(`Updating lamination cost for ${type} to: ${cost}`);
    setLaminationCosts({ [type]: cost });
  };

  const handleSave = () => {
    saveSettings();
    console.log("Saved settings:", { bindingOptions });
    toast({
      title: "Settings Saved",
      description: "Your cost settings have been saved successfully.",
    });
  };

  const handleReset = () => {
    resetSettings();
    toast({
      title: "Settings Reset",
      description: "Your cost settings have been reset to defaults.",
    });
  };
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Binding Options</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" defaultValue={bindingOptions.map(b => b.id)}>
              {bindingOptions.map(binding => (
                <AccordionItem key={binding.id} value={binding.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <span>{binding.name}</span>
                      <span className="text-sm text-gray-500">
                        Base: ₹{binding.baseCost} | Per Unit: ₹{binding.perUnitCost}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500 mb-2">{binding.description}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm">Base Cost (₹):</label>
                          <Input 
                            type="number"
                            min="0"
                            step="0.01"
                            value={binding.baseCost}
                            onChange={(e) => handleBindingCostChange(binding.id, 'baseCost', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm">Cost per Unit (₹):</label>
                          <Input 
                            type="number"
                            min="0"
                            step="0.01"
                            value={binding.perUnitCost}
                            onChange={(e) => handleBindingCostChange(binding.id, 'perUnitCost', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lamination Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <p className="text-sm text-gray-500">Set the cost per square meter for different lamination types.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Matt Lamination (₹ per 100 sq.in)</label>
                  <Input 
                    type="number"
                    min="0"
                    step="0.01"
                    value={laminationCosts.matt}
                    onChange={(e) => handleLaminationCostChange('matt', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Gloss Lamination (₹ per 100 sq.in)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={laminationCosts.gloss}
                    onChange={(e) => handleLaminationCostChange('gloss', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Thermal Matt Lamination (₹ per 100 sq.in)</label>
                  <Input 
                    type="number"
                    min="0"
                    step="0.01"
                    value={laminationCosts['thermal-matt']}
                    onChange={(e) => handleLaminationCostChange('thermal-matt', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Thermal Gloss Lamination (₹ per 100 sq.in)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={laminationCosts['thermal-gloss']}
                    onChange={(e) => handleLaminationCostChange('thermal-gloss', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
