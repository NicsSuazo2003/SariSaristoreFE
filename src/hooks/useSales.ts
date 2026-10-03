import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toSale, toProduct } from '@/lib/mappers';
import type {
  ApiSale, ApiProduct, PagedResult, Sale, SaleItem,
  Product, InventoryMovement, Supplier,
} from '@/types';

// ─── Sales ───

export function useSales(params?: {
  fromDate?: string; toDate?: string; page?: number; pageSize?: number;
}) {
  return useQuery({
    queryKey: ['sales', params],
    queryFn: async (): Promise<Sale[]> => {
      const { data } = await api.get<PagedResult<ApiSale>>('/api/sales', {
        params: {
          from: params?.fromDate,
          to: params?.toDate,
          page: params?.page ?? 1,
          pageSize: params?.pageSize ?? 50,
        },
      });
      return data.items.map(toSale);
    },
    staleTime: 10000,
  });
}

export function useSale(id: string | null) {
  return useQuery({
    queryKey: ['sale', id],
    queryFn: async (): Promise<(Sale & { sale_items: SaleItem[] }) | null> => {
      if (!id) return null;
      const { data } = await api.get<ApiSale>(`/api/sales/${id}`);
      return toSale(data);
    },
    enabled: !!id,
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      items: { productId: string; productName: string; qty: number; unitPrice: number }[];
      customerId: string | null;
      paymentMethod: string;
      amountPaid: number;
      discount: number;
      note?: string | null;
    }) => {
      const clientId = `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const payload = {
        clientId,
        items: params.items.map((i) => ({
          productId: i.productId,
          qty: i.qty,
          unitPrice: i.unitPrice,
        })),
        customerId: params.customerId,
        paymentMethod: params.paymentMethod,
        amountPaid: params.amountPaid,
        discount: params.discount,
        paymentRef: params.note ?? null,
        note: params.note ?? null,
        createdAt: new Date().toISOString(),
      };

      const { data } = await api.post<ApiSale>('/api/sales', payload);
      return toSale(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useVoidSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (saleId: string) => {
      const { data } = await api.post<ApiSale>(`/api/sales/${saleId}/void`);
      return toSale(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ─── Inventory ───

export function useInventoryMovements() {
  return useQuery({
    queryKey: ['inventory-movements'],
    queryFn: async (): Promise<InventoryMovement[]> => {
      const { data } = await api.get<any[]>('/api/inventory/movements');
      return data.map((m) => ({
        id: m.id,
        product_id: m.productId,
        type: (m.type ?? '').toLowerCase() as any,
        qty_change: m.qtyChange,
        new_qty: m.qtyAfter,
        reason: m.reason,
        supplier_id: m.supplierId,
        cost: m.unitCost,
        created_at: m.createdAt,
        product: m.productName
          ? ({ id: m.productId, name: m.productName } as any)
          : null,
        supplier: null,
      }));
    },
    staleTime: 30000,
  });
}

export function useLowStock() {
  return useQuery({
    queryKey: ['low-stock'],
    queryFn: async () => {
      const { data } = await api.get<any[]>('/api/inventory/low-stock');
      return data.map((p) => ({
        id: p.productId,
        name: p.name,
        stock: p.stockQty,
        low_stock_threshold: p.reorderLevel,
        price: 0,
        cost: 0,
        category_id: null,
        barcode: null,
        qr_code: '',
        unit: 'pc',
        is_favorite: false,
        favorite_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
    },
    staleTime: 60000,
  });
}

export function useStockIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      items: { productId: string; qty: number; cost: number }[];
      supplierId?: string | null;
    }) => {
      await api.post('/api/inventory/receive', {
        supplierId: params.supplierId ?? null,
        items: params.items.map((i) => ({
          productId: i.productId,
          qty: i.qty,
          cost: i.cost,
        })),
        note: null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['inventory-movements'] });
      qc.invalidateQueries({ queryKey: ['low-stock'] });
    },
  });
}

export function useStockAdjust() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId, newQty, reason,
    }: { productId: string; newQty: number; reason: string }) => {
      await api.post('/api/inventory/adjust', {
        productId,
        newQty,
        reason,
        note: null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['inventory-movements'] });
      qc.invalidateQueries({ queryKey: ['low-stock'] });
    },
  });
}

// ─── Suppliers ───

export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async (): Promise<Supplier[]> => {
      const { data } = await api.get<any[]>('/api/suppliers');
      return data.map((s) => ({
        id: s.id,
        name: s.name,
        phone: s.contact,
        address: s.address,
        created_at: s.createdAt,
      }));
    },
    staleTime: 60000,
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (supplier: Partial<Supplier>) => {
      const { data } = await api.post('/api/suppliers', {
        name: supplier.name ?? '',
        contact: supplier.phone ?? null,
        address: supplier.address ?? null,
      });
      return {
        id: data.id, name: data.name, phone: data.contact,
        address: data.address, created_at: data.createdAt,
      } as Supplier;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/suppliers/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}