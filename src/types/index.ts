export type PaymentMethod = 'cash' | 'gcash' | 'maya' | 'utang';

export type InventoryMovementType = 'receive' | 'adjust' | 'sale' | 'void';

// ─── UI types (snake_case — matches what pages expect) ───

export interface Category {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  barcode: string | null;
  qr_code: string;
  category_id: string | null;
  price: number;
  cost: number;
  stock: number;
  low_stock_threshold: number;
  unit: string;
  is_favorite: boolean;
  favorite_order: number;
  created_at: string;
  updated_at: string;
  category?: Category | null;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  qr_code: string;
  balance: number;
  is_shortcut: boolean;
  shortcut_order: number;
  note: string | null;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  product_name: string;
  qty: number;
  unit_price: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  receipt_no: string;
  client_id: string | null;
  total_amount: number;
  amount_paid: number;
  change_amount: number;
  discount: number;
  payment_method: PaymentMethod;
  customer_id: string | null;
  note: string | null;
  is_voided: boolean;
  created_at: string;
  sale_items?: SaleItem[];
  customer?: Customer | null;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  type: InventoryMovementType;
  qty_change: number;
  new_qty: number;
  reason: string | null;
  supplier_id: string | null;
  cost: number | null;
  created_at: string;
  product?: Product | null;
  supplier?: Supplier | null;
}

export interface Settings {
  id: string;
  store_name: string;
  owner_name: string | null;
  gcash_number: string | null;
  maya_number: string | null;
  receipt_header: string | null;
  receipt_footer: string | null;
  idle_timeout_minutes: number;
  dark_mode: boolean;
  created_at: string;
}

export interface CartItem {
  product: Product;
  qty: number;
}

export interface HeldSale {
  id: string;
  label: string;
  items: CartItem[];
  customerId: string | null;
  createdAt: number;
}

// ─── API raw types (camelCase — what ASP.NET returns) ───

export interface ApiCategory {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface ApiProduct {
  id: string;
  name: string;
  barcode: string | null;
  qrCode: string;
  categoryId: string | null;
  categoryName: string | null;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  stockQty: number;
  reorderLevel: number;
  expiryDate: string | null;
  imageUrl: string | null;
  isFavorite: boolean;
  favoriteOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiCustomer {
  id: string;
  name: string;
  phone: string | null;
  qrCode: string;
  creditBalance: number;
  isShortcut: boolean;
  shortcutOrder: number;
  note: string | null;
  createdAt: string;
}

export interface ApiSupplier {
  id: string;
  name: string;
  contact: string | null;
  address: string | null;
  createdAt: string;
}

export interface ApiSaleItem {
  id: string;
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export interface ApiSale {
  id: string;
  receiptNo: string;
  clientId: string;
  customerId: string | null;
  customerName: string | null;
  subtotal: number;
  discount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  paymentRef: string | null;
  status: 'Completed' | 'Voided';
  note: string | null;
  createdAt: string;
  serverCreatedAt: string;
  items: ApiSaleItem[];
}

export interface ApiSettings {
  receiptHeader: string | null;
  receiptFooter: string | null;
  idleLockMinutes: number;
  gcashNumber: string | null;
  mayaNumber: string | null;
  currency: string;
}

export interface ApiUser {
  id: string;
  name: string;
  storeName: string;
  storeAddress: string | null;
  phone: string | null;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}