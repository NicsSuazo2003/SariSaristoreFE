import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toSettings } from '@/lib/mappers';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { useDemoSettingsStore } from '@/stores/demoSettingsStore';
import type { ApiSettings, ApiUser, Settings } from '@/types';

async function fetchUser(): Promise<ApiUser | null> {
  try {
    const { data } = await api.get<ApiUser>('/api/auth/me');
    return data;
  } catch {
    return null;
  }
}

export function useSettings() {
  const isDemo = useDemoMode();
  const demoSettings = useDemoSettingsStore((s) => s.settings);

  return useQuery({
    queryKey: ['settings', isDemo],
    queryFn: async (): Promise<Settings | null> => {
      if (isDemo) return demoSettings;
      try {
        const [settingsRes, user] = await Promise.all([
          api.get<ApiSettings>('/api/settings'),
          fetchUser(),
        ]);
        return toSettings(settingsRes.data, user);
      } catch (e: any) {
        if (e?.response?.status === 401) return null;
        throw e;
      }
    },
    staleTime: 60000,
    retry: false,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  const isDemo = useDemoMode();
  const updateDemoSettings = useDemoSettingsStore((s) => s.updateSettings);

  return useMutation({
    mutationFn: async (updates: Partial<Settings>) => {
      if (isDemo) {
        updateDemoSettings(updates);
        return null as any;
      }
      const payload = {
        receiptHeader: updates.receipt_header ?? null,
        receiptFooter: updates.receipt_footer ?? null,
        idleLockMinutes: updates.idle_timeout_minutes ?? 5,
        gcashNumber: updates.gcash_number ?? null,
        mayaNumber: updates.maya_number ?? null,
        currency: 'PHP',
      };
      const { data } = await api.put<ApiSettings>('/api/settings', payload);
      const user = await fetchUser();
      return toSettings(data, user);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}

export function useInitSettings() {
  return useMutation({
    mutationFn: async (_: { storeName: string; ownerName: string; pin: string }) => null,
  });
}

// ─── Dashboard re-exports from useSales ───
export { useDashboard } from './useSales';

// ─── Reports ───

export function useReports(period: 'daily' | 'weekly' | 'monthly') {
  const isDemo = useDemoMode();
  const demoSales = useDemoSaleStoreSafe();

  return useQuery({
    queryKey: ['reports', period, isDemo, isDemo ? demoSales.length : 0],
    queryFn: async () => {
      if (isDemo) {
        const now = new Date();
        const from = new Date(now);
        const days = period === 'monthly' ? 90 : period === 'weekly' ? 28 : 7;
        from.setDate(from.getDate() - days);

        const filtered = demoSales.filter((s) => {
          if (s.is_voided) return false;
          const t = new Date(s.created_at).getTime();
          return t >= from.getTime() && t <= now.getTime();
        });

        return filtered.map((s) => ({
          total_amount: s.total_amount,
          created_at: s.created_at,
          payment_method: s.payment_method,
          is_voided: s.is_voided,
        }));
      }
      const { data } = await api.get<any>('/api/reports/sales', {
        params: { period },
      });
      return (data.points ?? []).map((p: any) => ({
        total_amount: p.total,
        created_at: p.date,
        payment_method: 'cash' as const,
        is_voided: false,
      }));
    },
    staleTime: 60000,
  });
}

// ─── Outstanding Utang ───

export function useOutstandingUtang() {
  const isDemo = useDemoMode();
  const demoCustomers = useDemoCustomerStoreSafe();

  return useQuery({
    queryKey: ['utang-outstanding', isDemo, isDemo ? demoCustomers.length : 0],
    queryFn: async () => {
      if (isDemo) {
        return demoCustomers
          .filter((c) => c.balance > 0)
          .sort((a, b) => b.balance - a.balance);
      }
      const { data } = await api.get<any[]>('/api/reports/utang-outstanding');
      return data.map((c) => ({
        id: c.customerId,
        name: c.name,
        phone: c.phone,
        balance: c.balance,
        is_shortcut: false,
        shortcut_order: 0,
        qr_code: '',
        note: null,
        created_at: c.lastTransactionAt,
      }));
    },
    staleTime: 30000,
  });
}

// ─── Helpers to avoid circular imports at module init ───

import { useDemoSaleStore } from '@/stores/demoSaleStore';
import { useDemoCustomerStore } from '@/stores/demoCustomerStore';

function useDemoSaleStoreSafe() {
  const isDemo = useDemoMode();
  const sales = useDemoSaleStore((s) => s.sales);
  return isDemo ? sales : [];
}

function useDemoCustomerStoreSafe() {
  const isDemo = useDemoMode();
  const customers = useDemoCustomerStore((s) => s.customers);
  return isDemo ? customers : [];
}