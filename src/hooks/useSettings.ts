import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toSettings } from '@/lib/mappers';
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
  return useQuery({
    queryKey: ['settings'],
    queryFn: async (): Promise<Settings | null> => {
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
  return useMutation({
    mutationFn: async (updates: Partial<Settings>) => {
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

// No longer used — setup handled by authStore. Kept for import compat.
export function useInitSettings() {
  return useMutation({
    mutationFn: async (_: { storeName: string; ownerName: string; pin: string }) => null,
  });
}

// ─── Dashboard ───

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get<any>('/api/reports/dashboard');
      const dailyData = (data.last7Days ?? []).map((d: any) => ({
        date: d.date,
        total: d.total,
      }));
      return {
        todayTotal: data.todaySales ?? 0,
        todayCount: data.todayTxns ?? 0,
        cashTotal: 0,
        gcashTotal: 0,
        utangTotal: 0,
        dailyData,
        outstandingUtang: data.utangOutstanding ?? 0,
        lowStockCount: data.lowStockCount ?? 0,
      };
    },
    staleTime: 30000,
  });
}

export function useReports(period: 'daily' | 'weekly' | 'monthly') {
  return useQuery({
    queryKey: ['reports', period],
    queryFn: async () => {
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

export function useOutstandingUtang() {
  return useQuery({
    queryKey: ['utang-outstanding'],
    queryFn: async () => {
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