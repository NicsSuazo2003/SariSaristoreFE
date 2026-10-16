import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Settings } from '@/types';

const defaultDemoSettings: Settings = {
  id: 'demo-settings',
  store_name: 'Demo Sari-Sari Store',
  owner_name: 'Juan Dela Cruz',
  gcash_number: '0917-000-0000',
  maya_number: '0917-000-0000',
  receipt_header: 'Thank you for shopping!',
  receipt_footer: 'Please come again',
  idle_timeout_minutes: 5,
  dark_mode: false,
  created_at: new Date().toISOString(),
};

interface DemoSettingsState {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  reset: () => void;
}

export const useDemoSettingsStore = create<DemoSettingsState>()(
  persist(
    (set, get) => ({
      settings: defaultDemoSettings,
      updateSettings: (updates) => {
        set({ settings: { ...get().settings, ...updates } });
      },
      reset: () => set({ settings: defaultDemoSettings }),
    }),
    {
      name: 'demo-settings',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);