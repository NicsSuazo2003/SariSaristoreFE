import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Sale } from '@/types';
import { demoSeedSales } from '@/pages/demo/demoSeedSales';

interface DemoSaleState {
  sales: Sale[];
  addSale: (sale: Omit<Sale, 'id' | 'created_at'>) => Sale;
  voidSale: (id: string) => void;
  reset: () => void;
}

export const useDemoSaleStore = create<DemoSaleState>()(
  persist(
    (set, get) => ({
      sales: demoSeedSales,

      addSale: (sale) => {
        const id = `s-${Date.now()}`;
        const fullSale: Sale = {
          ...sale,
          id,
          created_at: new Date().toISOString(),
        };
        set({ sales: [fullSale, ...get().sales] });
        return fullSale;
      },

      voidSale: (id) => {
        set({
          sales: get().sales.map((s) =>
            s.id === id ? { ...s, is_voided: true } : s
          ),
        });
      },

      reset: () => set({ sales: demoSeedSales }),
    }),
    {
      name: 'demo-sales',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);