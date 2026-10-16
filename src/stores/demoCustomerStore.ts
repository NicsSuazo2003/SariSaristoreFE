import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Customer } from '@/types';
import { demoCustomers as seedCustomers } from '@/pages/demo/demoData';

interface DemoCustomerState {
  customers: Customer[];
  addCustomer: (name: string, phone?: string, note?: string) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  toggleShortcut: (id: string) => void;
  recordPayment: (id: string, amount: number) => void;
  applyUtang: (id: string, amount: number) => void;
  reset: () => void;
}

export const useDemoCustomerStore = create<DemoCustomerState>()(
  persist(
    (set, get) => ({
      customers: seedCustomers,

      addCustomer: (name, phone, note) => {
        const id = `c-${Date.now()}`;
        set({
          customers: [
            ...get().customers,
            {
              id,
              name,
              phone: phone ?? null,
              qr_code: `C-${id.slice(-6)}`,
              balance: 0,
              is_shortcut: false,
              shortcut_order: 0,
              note: note ?? null,
              created_at: new Date().toISOString(),
            },
          ],
        });
      },

      updateCustomer: (id, updates) => {
        set({
          customers: get().customers.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        });
      },

      deleteCustomer: (id) => {
        set({ customers: get().customers.filter((c) => c.id !== id) });
      },

      toggleShortcut: (id) => {
        set({
          customers: get().customers.map((c) =>
            c.id === id ? { ...c, is_shortcut: !c.is_shortcut } : c
          ),
        });
      },

      recordPayment: (id, amount) => {
        set({
          customers: get().customers.map((c) =>
            c.id === id
              ? { ...c, balance: Math.max(0, c.balance - amount) }
              : c
          ),
        });
      },

      applyUtang: (id, amount) => {
        set({
          customers: get().customers.map((c) =>
            c.id === id ? { ...c, balance: c.balance + amount } : c
          ),
        });
      },

      reset: () => {
        set({ customers: seedCustomers });
      },
    }),
    {
      name: 'demo-customers',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);