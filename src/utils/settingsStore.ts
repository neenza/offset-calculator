import { create } from 'zustand';
import { PAPER_TYPES, BINDING_OPTIONS } from '@/data/printingOptions';
import { PaperType, BindingOption } from '@/models/PrintingJob';

interface SettingsStore {
  paperTypes: PaperType[];
  bindingOptions: BindingOption[];
  setPaperTypes: (types: PaperType[]) => void;
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
  paperTypes: loadFromStorage('paperTypes', PAPER_TYPES),
  bindingOptions: loadFromStorage('bindingOptions', BINDING_OPTIONS),

  setPaperTypes: (types) => set({ paperTypes: types }),
  setBindingOptions: (options) => set({ bindingOptions: options }),

  loadSettings: () => {
    set({
      paperTypes: loadFromStorage('paperTypes', PAPER_TYPES),
      bindingOptions: loadFromStorage('bindingOptions', BINDING_OPTIONS),
    });
  },

  saveSettings: () => {
    const { paperTypes, bindingOptions } = get();
    localStorage.setItem('paperTypes', JSON.stringify(paperTypes));
    localStorage.setItem('bindingOptions', JSON.stringify(bindingOptions));
    console.log('Settings saved:', { paperTypes, bindingOptions });
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
