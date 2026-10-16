import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Product, Category } from '@/types';
import { demoProducts as seedProducts, demoCategories as seedCategories } from '@/pages/demo/demoData';

interface DemoProductState {
  products: Product[];
  categories: Category[];
  addProduct: (p: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'qr_code'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  receiveStock: (items: { productId: string; qty: number; cost?: number }[]) => void;
  adjustStock: (productId: string, newQty: number, reason: string) => void;
  reset: () => void;
}

export const useDemoProductStore = create<DemoProductState>()(
  persist(
    (set, get) => ({
      products: seedProducts,
      categories: seedCategories,

      addProduct: (p) => {
        const id = `p-${Date.now()}`;
        const now = new Date().toISOString();
        const product: Product = {
          ...p,
          id,
          qr_code: `P-${id.slice(-6)}`,
          created_at: now,
          updated_at: now,
        };
        set({ products: [...get().products, product] });
      },

      updateProduct: (id, updates) => {
        set({
          products: get().products.map((p) =>
            p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
          ),
        });
      },

      deleteProduct: (id) => {
        set({ products: get().products.filter((p) => p.id !== id) });
      },

      toggleFavorite: (id) => {
        set({
          products: get().products.map((p) =>
            p.id === id ? { ...p, is_favorite: !p.is_favorite } : p
          ),
        });
      },

      addCategory: (name) => {
        const exists = get().categories.some((c) => c.name.toLowerCase() === name.toLowerCase());
        if (exists) return;
        set({
          categories: [
            ...get().categories,
            {
              id: `cat-${Date.now()}`,
              name,
              sort_order: get().categories.length + 1,
              created_at: new Date().toISOString(),
            },
          ],
        });
      },

      updateCategory: (id, name) => {
        set({
          categories: get().categories.map((c) => (c.id === id ? { ...c, name } : c)),
        });
      },

      deleteCategory: (id) => {
        set({
          categories: get().categories.filter((c) => c.id !== id),
          products: get().products.map((p) =>
            p.category_id === id ? { ...p, category_id: null } : p
          ),
        });
      },

      receiveStock: (items) => {
        set({
          products: get().products.map((p) => {
            const item = items.find((i) => i.productId === p.id);
            if (!item) return p;
            return {
              ...p,
              stock: p.stock + item.qty,
              cost: item.cost ?? p.cost,
              updated_at: new Date().toISOString(),
            };
          }),
        });
      },

      adjustStock: (productId, newQty, _reason) => {
        set({
          products: get().products.map((p) =>
            p.id === productId
              ? { ...p, stock: newQty, updated_at: new Date().toISOString() }
              : p
          ),
        });
      },

      reset: () => {
        set({ products: seedProducts, categories: seedCategories });
      },
    }),
    {
      name: 'demo-products',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);