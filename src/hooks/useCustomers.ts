import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toCustomer } from '@/lib/mappers';
import type { ApiCustomer, Customer } from '@/types';

export function useCustomers(params?: { search?: string; shortcutsOnly?: boolean }) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: async (): Promise<Customer[]> => {
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
  return useQuery({
    queryKey: ['customer', id],
    queryFn: async (): Promise<Customer | null> => {
      if (!id) return null;
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
  return useMutation({
    mutationFn: async (customer: Partial<Customer>) => {
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
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Customer> & { id: string }) => {
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
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/customers/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

export function useToggleShortcut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id, isShortcut, shortcutOrder,
    }: { id: string; isShortcut: boolean; shortcutOrder?: number }) => {
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
  return useMutation({
    mutationFn: async ({
      customerId, amount, method, note,
    }: { customerId: string; amount: number; method?: string; note?: string }) => {
      const { data } = await api.post<ApiCustomer>(`/api/customers/${customerId}/payments`, {
        amount,
        method: method ?? 'cash',
        note: note ?? null,
      });
      return toCustomer(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customer'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}