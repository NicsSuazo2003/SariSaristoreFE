import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, Product, Customer, PaymentMethod } from '@/types';

interface DemoCartState {
  items: CartItem[];
  customer: Customer | null;
  discount: number;
  paymentMethod: PaymentMethod;
  add: (product: Product, qty?: number) => void;
  remove: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  incrementQty: (productId: string) => void;
  decrementQty: (productId: string) => void;
  setCustomer: (customer: Customer | null) => void;
  setDiscount: (discount: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  clear: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useDemoCartStore = create<DemoCartState>()(
  persist(
    (set, get) => ({
      items: [],
      customer: null,
      discount: 0,
      paymentMethod: 'cash',

      add: (product, qty = 1) => {
        const items = get().items;
        const existing = items.find((i) => i.product.id === product.id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.product.id === product.id ? { ...i, qty: i.qty + qty } : i
            ),
          });
        } else {
          set({ items: [...items, { product, qty }] });
        }
      },

      remove: (productId) =>
        set({ items: get().items.filter((i) => i.product.id !== productId) }),

      updateQty: (productId, qty) => {
        if (qty <= 0) {
          set({ items: get().items.filter((i) => i.product.id !== productId) });
          return;
        }
        set({
          items: get().items.map((i) =>
            i.product.id === productId ? { ...i, qty } : i
          ),
        });
      },

      incrementQty: (productId) => {
        set({
          items: get().items.map((i) =>
            i.product.id === productId ? { ...i, qty: i.qty + 1 } : i
          ),
        });
      },

      decrementQty: (productId) => {
        const item = get().items.find((i) => i.product.id === productId);
        if (item && item.qty <= 1) {
          set({ items: get().items.filter((i) => i.product.id !== productId) });
          return;
        }
        set({
          items: get().items.map((i) =>
            i.product.id === productId ? { ...i, qty: i.qty - 1 } : i
          ),
        });
      },

      setCustomer: (customer) => set({ customer }),
      setDiscount: (discount) => set({ discount }),
      setPaymentMethod: (method) => set({ paymentMethod: method }),

      clear: () =>
        set({ items: [], customer: null, discount: 0, paymentMethod: 'cash' }),

      getSubtotal: () =>
        get().items.reduce((sum, i) => sum + i.product.price * i.qty, 0),

      getTotal: () => Math.max(0, get().getSubtotal() - get().discount),

      getItemCount: () => get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    {
      name: 'demo-cart',
      storage: createJSONStorage(() => sessionStorage), // ← clears on tab close
    }
  )
);