import React, { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import calculatorApi from '@/utils/calculatorApi'; // Use the API service instead
import { Button } from '@/components/ui/button';
import { Download, Share2, Loader2 } from 'lucide-react';
import { PrintingJob, CostBreakdown as CostBreakdownType } from '@/models/PrintingJob';
import { useToast } from '@/components/ui/use-toast';
import { isLoggedIn } from '@/utils/authService';
import { useNavigate } from 'react-router-dom';

interface CostBreakdownProps {
  job: PrintingJob;
}

const CostBreakdown: React.FC<CostBreakdownProps> = ({ job }) => {
  const [costs, setCosts] = useState<CostBreakdownType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [formattedValues, setFormattedValues] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    const calculateCosts = async () => {
      setLoading(true);
      
      try {
        // Check if user is logged in before making API call
        if (!isLoggedIn()) {
          toast({
            title: "Authentication Required",
            description: "Please login to calculate costs",
            variant: "destructive",
          });
          navigate('/profile');
          return;
        }
        
        const result = await calculatorApi.calculateTotalCost(job);
        setCosts(result);
        
        // Format all currency values
        const formatted: Record<string, string> = {};
        for (const key in result) {
          if (typeof result[key] === 'number') {
            formatted[key] = await calculatorApi.formatCurrency(result[key] as number);
          }
        }
        setFormattedValues(formatted);
      } catch (error) {
        console.error('Error calculating costs:', error);
        toast({
          title: "Calculation Error",
          description: "Failed to calculate costs. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    calculateCosts();
  }, [job, toast, navigate]);
  
  const handleSaveEstimate = () => {
    toast({
      title: "Estimate Saved",
      description: "Your estimate has been saved successfully!",
    });
  };
  
  const handleShareEstimate = () => {
    toast({
      title: "Share Link Generated",
      description: "You can now share this estimate with others!",
    });
  };
  
  const CostItem = ({ label, value }: { label: string; value: number }) => (
    <div className="flex justify-between py-1">
      <span className="text-sm">{label}</span>
      <span className="font-medium">
        {formattedValues[value.toString()] || `₹${value.toFixed(2)}`}
      </span>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Calculating costs...</span>
      </div>
    );
  }

  if (!costs) {
    return (
      <div className="p-4 text-center">
        <p>Please login to view cost breakdown</p>
        <Button onClick={() => navigate('/profile')} className="mt-2">
          Login
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Card className="shadow-md">
        <CardContent className="p-4 space-y-3">
          <CostItem label="Material Cost:" value={costs.materialCost} />
          <CostItem label="Pre-Press Setup:" value={costs.prePressSetupCost} />
          <CostItem label="Press & Production:" value={costs.pressCost} />
          <CostItem label="Finishing:" value={costs.finishingCost} />
          
          <Separator className="my-2" />
          
          <CostItem label="Subtotal:" value={costs.subtotal} />
          
          {costs.taxAmount > 0 && <CostItem label="Tax:" value={costs.taxAmount} />}
          {costs.discount > 0 && <CostItem label="Discount:" value={-costs.discount} />}
          {costs.rushFee > 0 && <CostItem label="Rush Fee:" value={costs.rushFee} />}
          
          <Separator className="my-2" />
          
          <div className="flex justify-between py-1">
            <span className="text-lg font-bold">Total Cost:</span>
            <span className="text-lg font-bold text-primary">
              {formattedValues['grandTotal'] || `₹${costs.grandTotal.toFixed(2)}`}
            </span>
          </div>
          
          <div className="flex justify-between py-1 bg-muted p-2 rounded">
            <span className="text-sm font-medium">Cost per Unit:</span>
            <span className="font-medium">
              {formattedValues['costPerUnit'] || `₹${costs.costPerUnit.toFixed(2)}`}
            </span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between p-4 pt-0">
          <Button variant="outline" onClick={handleSaveEstimate} className="flex items-center gap-1">
            <Download size={16} /> Save
          </Button>
          <Button variant="outline" onClick={handleShareEstimate} className="flex items-center gap-1">
            <Share2 size={16} /> Share
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CostBreakdown;
