import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import type { ApiUser } from '@/types';

interface AuthState {
  isSetup: boolean;
  isLocked: boolean;
  token: string | null;
  user: ApiUser | null;
  storeName: string;
  ownerName: string;

  checkSetup: () => Promise<boolean>;
  setup: (storeName: string, ownerName: string, pin: string) => Promise<void>;
  unlock: (pin?: string) => Promise<void>;
  lock: () => void;
  logout: () => void;
  loadMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isSetup: false,
      isLocked: false,
      token: null,
      user: null,
      storeName: 'Sari-Sari Store',
      ownerName: '',

           checkSetup: async () => {
        try {
          const { data } = await api.get<{ needsSetup: boolean }>('/api/auth/needs-setup');
          const isSetup = !data.needsSetup;
          set({ isSetup });
          return isSetup;
        } catch (err) {
          console.error('[checkSetup] Failed:', err);
          set({ isSetup: false }); // fail-safe: assume setup needed
          return false;
        }
      },

      setup: async (storeName, ownerName, pin) => {
        const { data } = await api.post<{ token: string; user: ApiUser }>(
          '/api/auth/setup',
          { storeName, ownerName, pin }
        );
        localStorage.setItem('pos-token', data.token);
        set({
          isSetup: true,
          isLocked: false,
          token: data.token,
          user: data.user,
          storeName: data.user.storeName,
          ownerName: data.user.name,
        });
      },

      unlock: async (pin) => {
        if (!pin) {
          set({ isLocked: false });
          return;
        }
        const { data } = await api.post<{ token: string; user: ApiUser }>(
          '/api/auth/login',
          { pin }
        );
        localStorage.setItem('pos-token', data.token);
        set({
          token: data.token,
          user: data.user,
          storeName: data.user.storeName,
          ownerName: data.user.name,
          isLocked: false,
        });
      },

      lock: () => set({ isLocked: true }),

      logout: () => {
        localStorage.removeItem('pos-token');
        set({ token: null, user: null, isLocked: false });
      },

      loadMe: async () => {
        const token = localStorage.getItem('pos-token');
        if (!token) return;
        try {
          const { data } = await api.get<ApiUser>('/api/auth/me');
          set({
            token,
            user: data,
            storeName: data.storeName,
            ownerName: data.name,
            isSetup: true,
          });
        } catch {
          localStorage.removeItem('pos-token');
          set({ token: null, user: null });
        }
      },
    }),
       {
      name: 'pos-auth',
      // Do NOT persist isSetup — always re-check with backend
      partialize: (s) => ({
        storeName: s.storeName,
        ownerName: s.ownerName,
      }),
    } 
  )
);