import React from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { calculateTotalCost, formatCurrency, getSelectedPaperType } from '@/utils/calculatorUtils';
import { Button } from '@/components/ui/button';
import { Download, Share2 } from 'lucide-react';
import { PrintingJob } from '@/models/PrintingJob';
import { useToast } from '@/components/ui/use-toast';

interface CostBreakdownProps {
  job: PrintingJob;
}

const CostBreakdown: React.FC<CostBreakdownProps> = ({ job }) => {
  const costs = calculateTotalCost(job);
  const { toast } = useToast();
  const paperType = getSelectedPaperType(job);
  
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
      <span className="font-medium">{formatCurrency(value)}</span>
    </div>
  );

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
            <span className="text-lg font-bold text-primary">{formatCurrency(costs.grandTotal)}</span>
          </div>
          
          <div className="flex justify-between py-1 bg-muted p-2 rounded">
            <span className="text-sm font-medium">Cost per Unit:</span>
            <span className="font-medium">{formatCurrency(costs.costPerUnit)}</span>
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
