import React, { useEffect, useState } from 'react';
import JobDetailsForm from '@/components/JobDetailsForm';
import CostBreakdown from '@/components/CostBreakdown';
import { PrintingJob } from '@/models/PrintingJob';
import { useJobStore } from '@/utils/jobStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { isLoggedIn } from '@/utils/authService';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { currentJob, updateJob, loadJob, saveJob } = useJobStore();
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

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

  if (!isLoggedIn()) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background min-h-screen">
        <button
          className="text-lg text-primary underline hover:text-primary/80 px-6 py-4 rounded-lg shadow-md bg-card border border-border"
          onClick={() => navigate('/profile')}
        >
          Please login first
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background overflow-auto">
      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading...</p>
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
                <div className="bg-card rounded-lg shadow-md p-4 border border-border">
                  <h2 className="text-xl font-semibold text-primary mb-4">Cost Breakdown</h2>
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
