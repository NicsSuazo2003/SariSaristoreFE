import type {
  ApiProduct, ApiCategory, ApiCustomer, ApiSupplier,
  ApiSale, ApiSaleItem, ApiSettings, ApiUser,
  Product, Category, Customer, Supplier, Sale, SaleItem, Settings,
} from '@/types';

export function toProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    name: p.name,
    barcode: p.barcode,
    qr_code: p.qrCode,
    category_id: p.categoryId,
    price: p.sellingPrice,
    cost: p.costPrice,
    stock: p.stockQty,
    low_stock_threshold: p.reorderLevel,
    unit: p.unit,
    is_favorite: p.isFavorite,
    favorite_order: p.favoriteOrder,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
    category: p.categoryId
      ? { id: p.categoryId, name: p.categoryName ?? '', sort_order: 0, created_at: p.createdAt }
      : null,
  };
}

export function toApiProduct(u: Partial<Product>) {
  const out: any = {};
  if (u.name !== undefined) out.name = u.name;
  if (u.barcode !== undefined) out.barcode = u.barcode;
  if (u.category_id !== undefined) out.categoryId = u.category_id;
  if (u.unit !== undefined) out.unit = u.unit;
  if (u.cost !== undefined) out.costPrice = u.cost;
  if (u.price !== undefined) out.sellingPrice = u.price;
  if (u.stock !== undefined) out.stockQty = u.stock;
  if (u.low_stock_threshold !== undefined) out.reorderLevel = u.low_stock_threshold;
  return out;
}

export function toCategory(c: ApiCategory): Category {
  return { id: c.id, name: c.name, sort_order: c.sortOrder, created_at: c.createdAt };
}

export function toCustomer(c: ApiCustomer): Customer {
  return {
    id: c.id, name: c.name, phone: c.phone, qr_code: c.qrCode,
    balance: c.creditBalance, is_shortcut: c.isShortcut,
    shortcut_order: c.shortcutOrder, note: c.note, created_at: c.createdAt,
  };
}

export function toSupplier(s: ApiSupplier): Supplier {
  return {
    id: s.id, name: s.name,
    phone: s.contact, address: s.address, created_at: s.createdAt,
  };
}

export function toSaleItem(i: ApiSaleItem): SaleItem {
  return {
    id: i.id, sale_id: '', product_id: i.productId,
    product_name: i.productName, qty: i.qty,
    unit_price: i.unitPrice, subtotal: i.subtotal,
  };
}

export function toSale(s: ApiSale): Sale & { sale_items: SaleItem[] } {
  const items = s.items.map((i) => ({ ...toSaleItem(i), sale_id: s.id }));
  return {
    id: s.id,
    receipt_no: s.receiptNo,
    client_id: s.clientId,
    total_amount: s.totalAmount,
    amount_paid: s.amountPaid,
    change_amount: s.change,
    discount: s.discount,
    payment_method: s.paymentMethod,
    customer_id: s.customerId,
    note: s.note,
    is_voided: s.status === 'Voided',
    created_at: s.createdAt,
    sale_items: items,
    customer: s.customerId
      ? ({ id: s.customerId, name: s.customerName ?? '', phone: null, qr_code: '',
          balance: 0, is_shortcut: false, shortcut_order: 0, note: null,
          created_at: s.createdAt } as Customer)
      : null,
  };
}

export function toSettings(s: ApiSettings, user?: ApiUser | null): Settings {
  return {
    id: 'singleton',
    store_name: user?.storeName ?? 'Sari-Sari Store',
    owner_name: user?.name ?? null,
    gcash_number: s.gcashNumber,
    maya_number: s.mayaNumber,
    receipt_header: s.receiptHeader,
    receipt_footer: s.receiptFooter,
    idle_timeout_minutes: s.idleLockMinutes,
    dark_mode: false,
    created_at: new Date().toISOString(),
  };
}