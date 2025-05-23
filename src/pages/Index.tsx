import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import JobDetailsForm from '@/components/JobDetailsForm';
import { PrintingJob } from '@/models/PrintingJob';
import { useJobStore } from '@/utils/jobStore';

const Index = () => {
  const { currentJob, updateJob, loadJob, saveJob } = useJobStore();
  const [isLoading, setIsLoading] = useState(true);

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
          <JobDetailsForm 
            job={currentJob} 
            onJobChange={handleJobChange}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
