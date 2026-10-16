import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toCustomer } from '@/lib/mappers';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { useDemoCustomerStore } from '@/stores/demoCustomerStore';
import type { ApiCustomer, Customer } from '@/types';

export function useCustomers(params?: { search?: string; shortcutsOnly?: boolean }) {
  const isDemo = useDemoMode();
  const demoCustomers = useDemoCustomerStore((s) => s.customers);

  return useQuery({
    queryKey: ['customers', params, isDemo, isDemo ? demoCustomers.length : 0],
    queryFn: async (): Promise<Customer[]> => {
      if (isDemo) {
        let list = demoCustomers;
        if (params?.search) {
          const s = params.search.toLowerCase();
          list = list.filter(
            (c) => c.name.toLowerCase().includes(s) || c.phone?.includes(s)
          );
        }
        if (params?.shortcutsOnly) {
          list = list.filter((c) => c.is_shortcut);
        }
        return list;
      }
      const { data } = await api.get<ApiCustomer[]>('/api/customers', {
        params: {
          search: params?.search || undefined,
          shortcuts: params?.shortcutsOnly || undefined,
        },
      });
      return data.map(toCustomer);
    },
    staleTime: 30000,
  });
}

export function useCustomer(id: string | null) {
  const isDemo = useDemoMode();
  const demoCustomers = useDemoCustomerStore((s) => s.customers);

  return useQuery({
    queryKey: ['customer', id, isDemo],
    queryFn: async (): Promise<Customer | null> => {
      if (!id) return null;
      if (isDemo) return demoCustomers.find((c) => c.id === id) ?? null;
      try {
        const { data } = await api.get<ApiCustomer>(`/api/customers/${id}`);
        return toCustomer(data);
      } catch (e: any) {
        if (e?.response?.status === 404) return null;
        throw e;
      }
    },
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  const isDemo = useDemoMode();
  const addCustomer = useDemoCustomerStore((s) => s.addCustomer);

  return useMutation({
    mutationFn: async (customer: Partial<Customer>) => {
      if (isDemo) {
        addCustomer(customer.name ?? '', customer.phone ?? undefined, customer.note ?? undefined);
        return null as any;
      }
      const { data } = await api.post<ApiCustomer>('/api/customers', {
        name: customer.name ?? '',
        phone: customer.phone ?? null,
        note: customer.note ?? null,
      });
      return toCustomer(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  const isDemo = useDemoMode();
  const updateCustomer = useDemoCustomerStore((s) => s.updateCustomer);

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Customer> & { id: string }) => {
      if (isDemo) {
        updateCustomer(id, updates);
        return null as any;
      }
      const existing = await api.get<ApiCustomer>(`/api/customers/${id}`);
      const e = existing.data;
      const { data } = await api.put<ApiCustomer>(`/api/customers/${id}`, {
        name: updates.name ?? e.name,
        phone: updates.phone !== undefined ? updates.phone : e.phone,
        note: updates.note !== undefined ? updates.note : e.note,
      });
      return toCustomer(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customer'] });
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  const isDemo = useDemoMode();
  const deleteCustomer = useDemoCustomerStore((s) => s.deleteCustomer);

  return useMutation({
    mutationFn: async (id: string) => {
      if (isDemo) {
        deleteCustomer(id);
        return;
      }
      await api.delete(`/api/customers/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

export function useToggleShortcut() {
  const qc = useQueryClient();
  const isDemo = useDemoMode();
  const toggleShortcut = useDemoCustomerStore((s) => s.toggleShortcut);

  return useMutation({
    mutationFn: async ({
      id, isShortcut, shortcutOrder,
    }: { id: string; isShortcut: boolean; shortcutOrder?: number }) => {
      if (isDemo) {
        toggleShortcut(id);
        return null as any;
      }
      const { data } = await api.patch<ApiCustomer>(`/api/customers/${id}/shortcut`, {
        isShortcut,
        shortcutOrder: shortcutOrder ?? 0,
      });
      return toCustomer(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  const isDemo = useDemoMode();
  const recordPayment = useDemoCustomerStore((s) => s.recordPayment);

  return useMutation({
    mutationFn: async ({
      customerId, amount,
    }: { customerId: string; amount: number; method?: string; note?: string }) => {
      if (isDemo) {
        recordPayment(customerId, amount);
        return null as any;
      }
      const { data } = await api.post<ApiCustomer>(
        `/api/customers/${customerId}/payments`,
        { amount, method: 'cash', note: null }
      );
      return toCustomer(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customer'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}