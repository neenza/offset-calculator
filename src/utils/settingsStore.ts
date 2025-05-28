import { create } from 'zustand';
import { PAPER_TYPES, BINDING_OPTIONS } from '@/data/printingOptions';
import { PaperType, BindingOption } from '@/models/PrintingJob';

// Define available measurement units
export type MeasurementUnit = 'mm' | 'inch';

// Define lamination costs structure
export interface LaminationCosts {
  matt: number;
  gloss: number;
  'thermal-matt': number;
  'thermal-gloss': number;
}

interface SettingsStore {
  paperTypes: PaperType[];  // Keeping for backward compatibility
  bindingOptions: BindingOption[];
  measurementUnit: MeasurementUnit;
  laminationCosts: LaminationCosts;
  setPaperTypes: (types: PaperType[]) => void;  // Keeping for backward compatibility
  setBindingOptions: (options: BindingOption[]) => void;
  setMeasurementUnit: (unit: MeasurementUnit) => void;
  setLaminationCosts: (costs: Partial<LaminationCosts>) => void;
  loadSettings: () => void;
  saveSettings: () => void;
  resetSettings: () => void;
}

const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) return defaultValue;
  try {
    return JSON.parse(stored);
  } catch {
    return defaultValue;
  }
};

// Default lamination costs
const DEFAULT_LAMINATION_COSTS: LaminationCosts = {
  matt: 0.25,
  gloss: 0.35,
  'thermal-matt': 0.65,
  'thermal-gloss': 0.65
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  paperTypes: PAPER_TYPES, // We no longer load this from storage
  bindingOptions: loadFromStorage('bindingOptions', BINDING_OPTIONS),
  measurementUnit: loadFromStorage('measurementUnit', 'mm' as MeasurementUnit),
  laminationCosts: loadFromStorage('laminationCosts', DEFAULT_LAMINATION_COSTS),

  setPaperTypes: (types) => set({ paperTypes: types }),
  setBindingOptions: (options) => set({ bindingOptions: options }),
  setMeasurementUnit: (unit) => {
    set({ measurementUnit: unit });
    localStorage.setItem('measurementUnit', JSON.stringify(unit));
  },
  setLaminationCosts: (costs) => {
    const currentCosts = get().laminationCosts;
    const newCosts = { ...currentCosts, ...costs };
    set({ laminationCosts: newCosts });
    localStorage.setItem('laminationCosts', JSON.stringify(newCosts));
  },

  loadSettings: () => {
    set({
      paperTypes: PAPER_TYPES, // Always use default paper types
      bindingOptions: loadFromStorage('bindingOptions', BINDING_OPTIONS),
      measurementUnit: loadFromStorage('measurementUnit', 'mm' as MeasurementUnit),
      laminationCosts: loadFromStorage('laminationCosts', DEFAULT_LAMINATION_COSTS),
    });
  },

  saveSettings: () => {
    const { bindingOptions, measurementUnit, laminationCosts } = get();
    localStorage.setItem('bindingOptions', JSON.stringify(bindingOptions));
    localStorage.setItem('measurementUnit', JSON.stringify(measurementUnit));
    localStorage.setItem('laminationCosts', JSON.stringify(laminationCosts));
    console.log('Settings saved:', { bindingOptions, measurementUnit, laminationCosts });
  },
  
  resetSettings: () => {
    set({
      paperTypes: PAPER_TYPES,
      bindingOptions: BINDING_OPTIONS,
      measurementUnit: 'mm',
      laminationCosts: DEFAULT_LAMINATION_COSTS,
    });
    localStorage.removeItem('paperTypes');
    localStorage.removeItem('bindingOptions');
    localStorage.removeItem('measurementUnit');
    localStorage.removeItem('laminationCosts');
  }
}));
