import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import type { ApiUser, AuthResponse } from '@/types';

interface AuthState {
  // ── State ─────────────────────────────────────────
  isSetup: boolean;
  isLocked: boolean;
  token: string | null;
  user: ApiUser | null;

  // Denormalized fields used across the UI
  storeName: string;
  storeCode: string;      // ⭐ persisted across sessions
  ownerName: string;

  // ── Actions ───────────────────────────────────────
  checkSetup: () => Promise<boolean>;
  setup: (
    storeName: string,
    ownerName: string,
    pin: string,
  ) => Promise<ApiUser>;
  unlock: (storeCode: string, pin: string) => Promise<void>;
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
      storeCode: '',
      ownerName: '',

      // ── Check if first-time setup is needed ─────────
      checkSetup: async () => {
        try {
          const { data } = await api.get<{ needsSetup: boolean }>(
            '/api/auth/needs-setup',
          );
          const isSetup = !data.needsSetup;
          set({ isSetup });
          return isSetup;
        } catch (err) {
          console.error('[checkSetup] Failed:', err);
          set({ isSetup: false });
          return false;
        }
      },

      // ── First-time setup: create store + owner ──────
      setup: async (storeName, ownerName, pin) => {
        const { data } = await api.post<AuthResponse>('/api/auth/setup', {
          storeName,
          ownerName,
          pin,
        });

        localStorage.setItem('pos-token', data.token);
        set({
          isSetup: true,
          isLocked: false,
          token: data.token,
          user: data.user,
          storeName: data.user.storeName,
          storeCode: data.user.storeCode,   // ⭐ NEW
          ownerName: data.user.name,
        });
        return data.user;                    // ⭐ NEW: return for wizard
      },

      // ── Unlock / login: storeCode + PIN ─────────────
      unlock: async (storeCode, pin) => {
        const { data } = await api.post<AuthResponse>('/api/auth/login', {
          storeCode: storeCode.trim().toUpperCase(),
          pin,
        });

        localStorage.setItem('pos-token', data.token);
        set({
          token: data.token,
          user: data.user,
          storeName: data.user.storeName,
          storeCode: data.user.storeCode,   // ⭐ lock it in
          ownerName: data.user.name,
          isLocked: false,
        });
      },

      // ── Lock (keep storeCode for fast re-login) ────
      lock: () => set({ isLocked: true }),

      // ── Full logout (forget everything) ─────────────
      logout: () => {
        localStorage.removeItem('pos-token');
        set({
          token: null,
          user: null,
          isLocked: false,
          storeCode: '',   // ⭐ forget the store — different person/device
        });
      },

      // ── Refresh user from /api/auth/me ──────────────
      loadMe: async () => {
        const token = localStorage.getItem('pos-token');
        if (!token) return;
        try {
          const { data } = await api.get<ApiUser>('/api/auth/me');
          set({
            token,
            user: data,
            storeName: data.storeName,
            storeCode: data.storeCode,    // ⭐ refresh
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
      // Persist storeCode + names so returning devices skip the code step.
      // Do NOT persist token here — it lives in localStorage['pos-token'].
      // Do NOT persist isSetup — always re-check with backend.
      partialize: (s) => ({
        storeName: s.storeName,
        storeCode: s.storeCode,   // ⭐ the key addition
        ownerName: s.ownerName,
      }),
    },
  ),
);