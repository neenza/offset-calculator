import { create } from 'zustand';
import { PAPER_TYPES, BINDING_OPTIONS } from '@/data/printingOptions';
import { PaperType, BindingOption } from '@/models/PrintingJob';

interface SettingsStore {
  paperTypes: PaperType[];  // Keeping for backward compatibility
  bindingOptions: BindingOption[];
  setPaperTypes: (types: PaperType[]) => void;  // Keeping for backward compatibility
  setBindingOptions: (options: BindingOption[]) => void;
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

  setPaperTypes: (types) => set({ paperTypes: types }),
  setBindingOptions: (options) => set({ bindingOptions: options }),

  loadSettings: () => {
    set({
      paperTypes: PAPER_TYPES, // Always use default paper types
      bindingOptions: loadFromStorage('bindingOptions', BINDING_OPTIONS),
    });
  },

  saveSettings: () => {
    const { bindingOptions } = get();
    localStorage.setItem('bindingOptions', JSON.stringify(bindingOptions));
    console.log('Settings saved:', { bindingOptions });
  },
  
  resetSettings: () => {
    set({
      paperTypes: PAPER_TYPES,
      bindingOptions: BINDING_OPTIONS
    });
    localStorage.removeItem('paperTypes');
    localStorage.removeItem('bindingOptions');
  }
}));
