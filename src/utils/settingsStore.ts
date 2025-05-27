import { create } from 'zustand';
import { PAPER_TYPES, BINDING_OPTIONS } from '@/data/printingOptions';
import { PaperType, BindingOption } from '@/models/PrintingJob';

// Define available measurement units
export type MeasurementUnit = 'mm' | 'inch';

interface SettingsStore {
  paperTypes: PaperType[];  // Keeping for backward compatibility
  bindingOptions: BindingOption[];
  measurementUnit: MeasurementUnit;
  setPaperTypes: (types: PaperType[]) => void;  // Keeping for backward compatibility
  setBindingOptions: (options: BindingOption[]) => void;
  setMeasurementUnit: (unit: MeasurementUnit) => void;
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

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  paperTypes: PAPER_TYPES, // We no longer load this from storage
  bindingOptions: loadFromStorage('bindingOptions', BINDING_OPTIONS),
  measurementUnit: loadFromStorage('measurementUnit', 'mm' as MeasurementUnit),

  setPaperTypes: (types) => set({ paperTypes: types }),
  setBindingOptions: (options) => set({ bindingOptions: options }),
  setMeasurementUnit: (unit) => {
    set({ measurementUnit: unit });
    localStorage.setItem('measurementUnit', JSON.stringify(unit));
  },

  loadSettings: () => {
    set({
      paperTypes: PAPER_TYPES, // Always use default paper types
      bindingOptions: loadFromStorage('bindingOptions', BINDING_OPTIONS),
      measurementUnit: loadFromStorage('measurementUnit', 'mm' as MeasurementUnit),
    });
  },

  saveSettings: () => {
    const { bindingOptions, measurementUnit } = get();
    localStorage.setItem('bindingOptions', JSON.stringify(bindingOptions));
    localStorage.setItem('measurementUnit', JSON.stringify(measurementUnit));
    console.log('Settings saved:', { bindingOptions, measurementUnit });
  },
  
  resetSettings: () => {
    set({
      paperTypes: PAPER_TYPES,
      bindingOptions: BINDING_OPTIONS,
      measurementUnit: 'mm'
    });
    localStorage.removeItem('paperTypes');
    localStorage.removeItem('bindingOptions');
    localStorage.removeItem('measurementUnit');
  }
}));
