import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toProduct, toApiProduct, toCategory } from '@/lib/mappers';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { useDemoProductStore } from '@/stores/demoProductStore';
import type {
  ApiProduct, ApiCategory, PagedResult, Product, Category,
} from '@/types';

// ─── Products ───

export function useProducts(params?: {
  search?: string;
  categoryId?: string | null;
  favoritesOnly?: boolean;
}) {
  const isDemo = useDemoMode();
  const demoProducts = useDemoProductStore((s) => s.products);

  return useQuery({
    queryKey: ['products', params, isDemo, isDemo ? demoProducts.length : 0],
    queryFn: async (): Promise<Product[]> => {
      if (isDemo) {
        let list = demoProducts;
        if (params?.search) {
          const s = params.search.toLowerCase();
          list = list.filter(
            (p) => p.name.toLowerCase().includes(s) || p.barcode?.includes(s)
          );
        }
        if (params?.categoryId) {
          list = list.filter((p) => p.category_id === params.categoryId);
        }
        if (params?.favoritesOnly) {
          list = list.filter((p) => p.is_favorite);
        }
        return list;
      }

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
  const isDemo = useDemoMode();
  const demoProducts = useDemoProductStore((s) => s.products);

  return useQuery({
    queryKey: ['product-scan', code, isDemo],
    queryFn: async (): Promise<Product | null> => {
      if (!code) return null;
      if (isDemo) {
        return demoProducts.find((p) => p.barcode === code || p.qr_code === code) ?? null;
      }
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
  const isDemo = useDemoMode();
  const addProduct = useDemoProductStore((s) => s.addProduct);

  return useMutation({
    mutationFn: async (product: Partial<Product>) => {
      if (isDemo) {
        addProduct({
          name: product.name ?? '',
          barcode: product.barcode ?? null,
          category_id: product.category_id ?? null,
          price: product.price ?? 0,
          cost: product.cost ?? 0,
          stock: product.stock ?? 0,
          low_stock_threshold: product.low_stock_threshold ?? 5,
          unit: product.unit ?? 'pc',
          is_favorite: false,
          favorite_order: 0,
        });
        return null as any;
      }
      const { data } = await api.post<ApiProduct>('/api/products', toApiProduct(product));
      return toProduct(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  const isDemo = useDemoMode();
  const updateProduct = useDemoProductStore((s) => s.updateProduct);

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      if (isDemo) {
        updateProduct(id, updates);
        return null as any;
      }
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
  const isDemo = useDemoMode();
  const deleteProduct = useDemoProductStore((s) => s.deleteProduct);

  return useMutation({
    mutationFn: async (id: string) => {
      if (isDemo) {
        deleteProduct(id);
        return;
      }
      await api.delete(`/api/products/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  const isDemo = useDemoMode();
  const toggleFavorite = useDemoProductStore((s) => s.toggleFavorite);

  return useMutation({
    mutationFn: async ({
      id, isFavorite, favoriteOrder,
    }: { id: string; isFavorite: boolean; favoriteOrder?: number }) => {
      if (isDemo) {
        toggleFavorite(id);
        return null as any;
      }
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
  const isDemo = useDemoMode();
  const demoCategories = useDemoProductStore((s) => s.categories);

  return useQuery({
    queryKey: ['categories', isDemo, isDemo ? demoCategories.length : 0],
    queryFn: async (): Promise<Category[]> => {
      if (isDemo) return demoCategories;
      const { data } = await api.get<ApiCategory[]>('/api/categories');
      return data.map(toCategory);
    },
    staleTime: 60000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  const isDemo = useDemoMode();
  const addCategory = useDemoProductStore((s) => s.addCategory);

  return useMutation({
    mutationFn: async (name: string) => {
      if (isDemo) {
        addCategory(name);
        return null as any;
      }
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
  const isDemo = useDemoMode();
  const updateCategory = useDemoProductStore((s) => s.updateCategory);

  return useMutation({
    mutationFn: async ({
      id, name, sort_order,
    }: { id: string; name?: string; sort_order?: number }) => {
      if (isDemo) {
        updateCategory(id, name ?? '');
        return null as any;
      }
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
  const isDemo = useDemoMode();
  const deleteCategory = useDemoProductStore((s) => s.deleteCategory);

  return useMutation({
    mutationFn: async (id: string) => {
      if (isDemo) {
        deleteCategory(id);
        return;
      }
      await api.delete(`/api/categories/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}