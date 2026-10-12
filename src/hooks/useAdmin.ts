import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '@/lib/api';
import type {
  StoreSummary,
  CreateStoreRequest,
  CreateStoreResponse,
} from '@/types';
import { toast } from 'sonner';

// ─── Queries ────────────────────────────────────────

export function useStores() {
  return useQuery<StoreSummary[]>({
    queryKey: ['admin', 'stores'],
    queryFn: async () => {
      const { data } = await api.get<StoreSummary[]>('/api/admin/stores');
      return data;
    },
    staleTime: 1000 * 30,     // 30s — admin data doesn't need to be instant
    refetchOnWindowFocus: false,
  });
}

// ─── Mutations ──────────────────────────────────────

export function useCreateStore() {
  const qc = useQueryClient();

  return useMutation<CreateStoreResponse, any, CreateStoreRequest>({
    mutationFn: async (payload) => {
      const { data } = await api.post<CreateStoreResponse>(
        '/api/admin/stores',
        payload,
      );
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'stores'] });
      toast.success(`Store "${data.storeName}" created — code: ${data.storeCode}`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}