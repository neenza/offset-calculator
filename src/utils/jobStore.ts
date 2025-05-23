import { create } from 'zustand';
import { DEFAULT_PRINTING_JOB, PrintingJob } from '@/models/PrintingJob';
import { persist } from 'zustand/middleware';

interface JobStore {
  currentJob: PrintingJob;
  setCurrentJob: (job: PrintingJob) => void;
  updateJob: (updates: Partial<PrintingJob>) => void;
  loadJob: () => void;
  saveJob: () => void;
  resetJob: () => void;
}

// Load job data from localStorage
const loadJobFromStorage = (): PrintingJob => {
  const stored = localStorage.getItem('currentJob');
  if (!stored) return DEFAULT_PRINTING_JOB;
  try {
    const parsed = JSON.parse(stored);
    // Add a safety check to ensure all required fields are present
    return { ...DEFAULT_PRINTING_JOB, ...parsed };
  } catch {
    return DEFAULT_PRINTING_JOB;
  }
};

export const useJobStore = create<JobStore>()(
  persist(
    (set, get) => ({
      currentJob: loadJobFromStorage(),
      
      setCurrentJob: (job) => {
        set({ currentJob: job });
        localStorage.setItem('currentJob', JSON.stringify(job));
      },
      
      updateJob: (updates) => {
        const currentJob = get().currentJob;
        const updatedJob = { ...currentJob, ...updates };
        set({ currentJob: updatedJob });
        // Save to localStorage immediately to ensure persistence
        localStorage.setItem('currentJob', JSON.stringify(updatedJob));
      },
      
      loadJob: () => {
        const loaded = loadJobFromStorage();
        set({ currentJob: loaded });
      },
      
      saveJob: () => {
        const { currentJob } = get();
        localStorage.setItem('currentJob', JSON.stringify(currentJob));
      },
      
      resetJob: () => {
        set({ currentJob: DEFAULT_PRINTING_JOB });
        localStorage.removeItem('currentJob');
      }
    }),
    {
      name: 'printing-job-storage',
      // Only store the currentJob
      partialize: (state) => ({ currentJob: state.currentJob }),
    }
  )
);
