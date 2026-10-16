import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toSale, toProduct } from '@/lib/mappers';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { useDemoSaleStore } from '@/stores/demoSaleStore';
import { useDemoProductStore } from '@/stores/demoProductStore';
import { useDemoCustomerStore } from '@/stores/demoCustomerStore';
import type {
  ApiSale, ApiProduct, PagedResult, Sale, SaleItem,
} from '@/types';

// ─── Sales ───

export function useSales(params?: {
  fromDate?: string; toDate?: string; page?: number; pageSize?: number;
}) {
  const isDemo = useDemoMode();
  const demoSales = useDemoSaleStore((s) => s.sales);

  return useQuery({
    queryKey: ['sales', params, isDemo, isDemo ? demoSales.length : 0],
    queryFn: async (): Promise<Sale[]> => {
      if (isDemo) {
        let list = demoSales;
        if (params?.fromDate) {
          list = list.filter((s) => new Date(s.created_at) >= new Date(params.fromDate!));
        }
        if (params?.toDate) {
          list = list.filter((s) => new Date(s.created_at) <= new Date(params.toDate!));
        }
        return list;
      }
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
  const isDemo = useDemoMode();
  const demoSales = useDemoSaleStore((s) => s.sales);

  return useQuery({
    queryKey: ['sale', id, isDemo],
    queryFn: async (): Promise<(Sale & { sale_items: SaleItem[] }) | null> => {
      if (!id) return null;
      if (isDemo) {
        return (demoSales.find((s) => s.id === id) ?? null) as any;
      }
      const { data } = await api.get<ApiSale>(`/api/sales/${id}`);
      return toSale(data);
    },
    enabled: !!id,
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  const isDemo = useDemoMode();
  const addSale = useDemoSaleStore((s) => s.addSale);
  const adjustStock = useDemoProductStore((s) => s.adjustStock);
  const demoProducts = useDemoProductStore((s) => s.products);
  const applyUtang = useDemoCustomerStore((s) => s.applyUtang);
  const demoCustomers = useDemoCustomerStore((s) => s.customers);

  return useMutation({
    mutationFn: async (params: {
      items: { productId: string; productName: string; qty: number; unitPrice: number }[];
      customerId: string | null;
      paymentMethod: string;
      amountPaid: number;
      discount: number;
      note?: string | null;
    }) => {
      if (isDemo) {
        const subtotal = params.items.reduce(
          (s, i) => s + i.unitPrice * i.qty,
          0
        );
        const total = subtotal - params.discount;

        const items: SaleItem[] = params.items.map((i, idx) => ({
          id: `si-${Date.now()}-${idx}`,
          sale_id: '',
          product_id: i.productId,
          product_name: i.productName,
          qty: i.qty,
          unit_price: i.unitPrice,
          subtotal: i.unitPrice * i.qty,
        }));

        const customer = params.customerId
          ? demoCustomers.find((c) => c.id === params.customerId) ?? null
          : null;

        const sale = addSale({
          receipt_no: `DEMO-${Date.now().toString().slice(-6)}`,
          client_id: `demo-${Date.now()}`,
          total_amount: total,
          amount_paid: params.paymentMethod === 'utang' ? 0 : params.amountPaid,
          change_amount:
            params.paymentMethod === 'cash'
              ? Math.max(0, params.amountPaid - total)
              : 0,
          discount: params.discount,
          payment_method: params.paymentMethod as any,
          customer_id: params.customerId,
          note: params.note ?? null,
          is_voided: false,
          sale_items: items.map((it) => ({ ...it, sale_id: '' })),
          customer,
        });

        // Deduct stock
        for (const item of params.items) {
          const p = demoProducts.find((x) => x.id === item.productId);
          if (p) adjustStock(p.id, Math.max(0, p.stock - item.qty), 'Demo sale');
        }

        // Apply utang
        if (params.paymentMethod === 'utang' && params.customerId) {
          applyUtang(params.customerId, total);
        }

        return sale as any;
      }

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
  const isDemo = useDemoMode();
  const voidSale = useDemoSaleStore((s) => s.voidSale);

  return useMutation({
    mutationFn: async (saleId: string) => {
      if (isDemo) {
        voidSale(saleId);
        return null as any;
      }
      const { data } = await api.post<ApiSale>(`/api/sales/${saleId}/void`);
      return toSale(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ─── Reports / Dashboard ───

export function useDashboard() {
  const isDemo = useDemoMode();
  const demoSales = useDemoSaleStore((s) => s.sales);
  const demoCustomers = useDemoCustomerStore((s) => s.customers);
  const demoProducts = useDemoProductStore((s) => s.products);

  return useQuery({
    queryKey: [
      'dashboard',
      isDemo,
      isDemo ? demoSales.length : 0,
      isDemo ? demoCustomers.length : 0,
    ],
    queryFn: async () => {
      if (isDemo) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaySales = demoSales.filter(
          (s) =>
            !s.is_voided && new Date(s.created_at).getTime() >= today.getTime()
        );
        const todayTotal = todaySales.reduce(
          (sum, s) => sum + s.total_amount,
          0
        );
        const cashTotal = todaySales
          .filter((s) => s.payment_method === 'cash')
          .reduce((sum, s) => sum + s.total_amount, 0);
        const gcashTotal = todaySales
          .filter((s) => s.payment_method === 'gcash' || s.payment_method === 'maya')
          .reduce((sum, s) => sum + s.total_amount, 0);
        const utangTotal = todaySales
          .filter((s) => s.payment_method === 'utang')
          .reduce((sum, s) => sum + s.total_amount, 0);

        // Last 7 days chart
        const dailyData = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const nextDay = new Date(d);
          nextDay.setDate(nextDay.getDate() + 1);

          const dayTotal = demoSales
            .filter((s) => {
              if (s.is_voided) return false;
              const t = new Date(s.created_at).getTime();
              return t >= d.getTime() && t < nextDay.getTime();
            })
            .reduce((sum, s) => sum + s.total_amount, 0);

          dailyData.push({
            date: d.toISOString().slice(0, 10),
            total: dayTotal,
          });
        }

        const outstandingUtang = demoCustomers.reduce(
          (sum, c) => sum + c.balance,
          0
        );

        const lowStockCount = demoProducts.filter(
          (p) => p.stock <= p.low_stock_threshold
        ).length;

        return {
          todayTotal,
          todayCount: todaySales.length,
          cashTotal,
          gcashTotal,
          utangTotal,
          dailyData,
          outstandingUtang,
          lowStockCount,
        };
      }

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

// ─── Inventory (low stock, stock in, adjust) ───

export function useLowStock() {
  const isDemo = useDemoMode();
  const demoProducts = useDemoProductStore((s) => s.products);

  return useQuery({
    queryKey: ['low-stock', isDemo, isDemo ? demoProducts.length : 0],
    queryFn: async () => {
      if (isDemo) {
        return demoProducts.filter((p) => p.stock <= p.low_stock_threshold);
      }
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
    staleTime: 30000,
  });
}

export function useStockIn() {
  const qc = useQueryClient();
  const isDemo = useDemoMode();
  const receiveStock = useDemoProductStore((s) => s.receiveStock);

  return useMutation({
    mutationFn: async (params: {
      items: { productId: string; qty: number; cost: number }[];
      supplierId?: string | null;
    }) => {
      if (isDemo) {
        receiveStock(params.items);
        return;
      }
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
  const isDemo = useDemoMode();
  const adjustStock = useDemoProductStore((s) => s.adjustStock);

  return useMutation({
    mutationFn: async ({
      productId, newQty, reason,
    }: { productId: string; newQty: number; reason: string }) => {
      if (isDemo) {
        adjustStock(productId, newQty, reason);
        return;
      }
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

export function useInventoryMovements() {
  const isDemo = useDemoMode();

  return useQuery({
    queryKey: ['inventory-movements', isDemo],
    queryFn: async () => {
      if (isDemo) return [];
      const { data } = await api.get<any[]>('/api/inventory/movements');
      return data.map((m) => ({
        id: m.id,
        product_id: m.productId,
        type: (m.type ?? '').toLowerCase(),
        qty_change: m.qtyChange,
        new_qty: m.qtyAfter,
        reason: m.reason,
        supplier_id: m.supplierId,
        cost: m.unitCost,
        created_at: m.createdAt,
        product: m.productName
          ? { id: m.productId, name: m.productName }
          : null,
        supplier: null,
      }));
    },
    staleTime: 30000,
  });
}