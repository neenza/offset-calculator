import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import JobDetailsForm from '@/components/JobDetailsForm';
import CostBreakdown from '@/components/CostBreakdown';
import { PrintingJob } from '@/models/PrintingJob';
import { useJobStore } from '@/utils/jobStore';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const { currentJob, updateJob, loadJob, saveJob } = useJobStore();
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  
  // Load saved job state when the component mounts
  useEffect(() => {
    // Load the job data from storage
    loadJob();
    setIsLoading(false);
    
    // Save job data when the component unmounts (e.g., when navigating away)
    return () => {
      saveJob();
    };
  }, [loadJob, saveJob]);
  
  const handleJobChange = (updatedJob: PrintingJob) => {
    updateJob(updatedJob);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p>Loading...</p>
          </div>
        ) : (
          <div className={`${isMobile ? 'flex flex-col' : 'flex flex-row gap-6'}`}>
            {/* Configuration section - 60% width on desktop, full width on mobile */}
            <div className={`${isMobile ? 'w-full' : 'w-[60%]'}`}>
              <JobDetailsForm 
                job={currentJob} 
                onJobChange={handleJobChange}
                hideCostBreakdown={!isMobile} // Hide the cost breakdown in JobDetailsForm on desktop
              />
            </div>
            
            {/* Cost breakdown section - 40% width on desktop, hidden on mobile (shown at bottom of JobDetailsForm instead) */}
            {!isMobile && (
              <div className="w-[40%] sticky top-6 self-start">
                <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                  <h2 className="text-xl font-semibold text-print-blue mb-4">Cost Breakdown</h2>
                  <CostBreakdown job={currentJob} />
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
