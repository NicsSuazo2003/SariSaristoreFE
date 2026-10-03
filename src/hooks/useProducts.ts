import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toProduct, toApiProduct, toCategory } from '@/lib/mappers';
import type {
  ApiProduct, ApiCategory, PagedResult, Product, Category,
} from '@/types';

export function useProducts(params?: {
  search?: string;
  categoryId?: string | null;
  favoritesOnly?: boolean;
}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async (): Promise<Product[]> => {
      const { data } = await api.get<PagedResult<ApiProduct>>('/api/products', {
        params: {
          search: params?.search || undefined,
          categoryId: params?.categoryId || undefined,
          favorites: params?.favoritesOnly || undefined,
          page: 1,
          pageSize: 200,
        },
      });
      return data.items.map(toProduct);
    },
    staleTime: 30000,
  });
}

export function useProductByBarcode(code: string | null) {
  return useQuery({
    queryKey: ['product-scan', code],
    queryFn: async (): Promise<Product | null> => {
      if (!code) return null;
      try {
        const { data } = await api.get<ApiProduct>(`/api/products/scan/${encodeURIComponent(code)}`);
        return toProduct(data);
      } catch (e: any) {
        if (e?.response?.status === 404) return null;
        throw e;
      }
    },
    enabled: !!code,
    retry: false,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: Partial<Product>) => {
      const { data } = await api.post<ApiProduct>('/api/products', toApiProduct(product));
      return toProduct(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      const existing = await api.get<ApiProduct>(`/api/products/${id}`);
      const e = existing.data;
      const payload = {
        name: updates.name ?? e.name,
        barcode: updates.barcode !== undefined ? updates.barcode : e.barcode,
        categoryId: updates.category_id !== undefined ? updates.category_id : e.categoryId,
        unit: updates.unit ?? e.unit,
        costPrice: updates.cost ?? e.costPrice,
        sellingPrice: updates.price ?? e.sellingPrice,
        reorderLevel: updates.low_stock_threshold ?? e.reorderLevel,
        expiryDate: e.expiryDate,
        imageUrl: e.imageUrl,
        isActive: true,
      };
      const { data } = await api.put<ApiProduct>(`/api/products/${id}`, payload);
      return toProduct(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/products/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id, isFavorite, favoriteOrder,
    }: { id: string; isFavorite: boolean; favoriteOrder?: number }) => {
      const { data } = await api.patch<ApiProduct>(`/api/products/${id}/favorite`, {
        isFavorite,
        favoriteOrder: favoriteOrder ?? 0,
      });
      return toProduct(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

// ─── Categories ───

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const { data } = await api.get<ApiCategory[]>('/api/categories');
      return data.map(toCategory);
    },
    staleTime: 60000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post<ApiCategory>('/api/categories', {
        name, description: null, sortOrder: 0,
      });
      return toCategory(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id, name, sort_order,
    }: { id: string; name?: string; sort_order?: number }) => {
      const { data } = await api.put<ApiCategory>(`/api/categories/${id}`, {
        name: name ?? '',
        description: null,
        sortOrder: sort_order ?? 0,
      });
      return toCategory(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/categories/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}