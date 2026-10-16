import { useMemo, useState, useEffect, useRef } from 'react';
import {
  ShoppingCart, Banknote, Star, Package, X, Minus, Plus,
  Trash2, Check, Receipt, Camera, Pause, ZoomIn, ZoomOut,
  Zap, Keyboard, CameraOff,
} from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat } from '@zxing/library';
import { useDemoCartStore } from '@/stores/demoCartStore';
import { demoProducts, demoCategories, demoCustomers } from './demoData';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { Product, PaymentMethod } from '@/types';

type Step = 'pos' | 'payment' | 'receipt';

export function DemoPOS() {
  const isMobile = useIsMobile();
  const [step, setStep] = useState<Step>('pos');
  const [receipt, setReceipt] = useState<any>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const items = useDemoCartStore((s) => s.items);
  const total = useDemoCartStore((s) => s.getTotal());
  const count = useDemoCartStore((s) => s.getItemCount());
  const clear = useDemoCartStore((s) => s.clear);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'F1' && items.length > 0) { e.preventDefault(); setStep('payment'); }
      if (e.key === 'F5' && items.length > 0) { e.preventDefault(); clear(); toast.info('Cart cleared'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [items.length, clear]);

  // ─── MOBILE ───
  if (isMobile) {
    return (
      <div className="flex flex-col h-full w-full overflow-hidden select-none relative">
        <div className="flex-1 overflow-hidden pb-16">
          <DemoProductArea onScan={() => setScannerOpen(true)} />
        </div>

        {/* Sticky checkout */}
        <div className="absolute bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border px-3.5 py-2.5 flex items-center justify-between gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] z-30">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="flex items-center gap-3 flex-1 min-w-0 p-1.5 rounded-xl hover:bg-muted/60 active:scale-[0.98] transition-all text-left"
          >
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 text-primary shrink-0">
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center shadow-xs">
                  {count}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-medium text-muted-foreground leading-tight">
                {count === 0 ? 'Cart is empty' : `${count} item${count !== 1 ? 's' : ''}`}
              </div>
              <div className="text-base font-extrabold text-foreground tabular-nums tracking-tight">
                {formatCurrency(total)}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStep('payment')}
            disabled={count === 0}
            className={cn(
              'h-12 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm shrink-0',
              count > 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground opacity-50'
            )}
          >
            <Banknote className="h-5 w-5" />
            <span>Pay</span>
          </button>
        </div>

        {cartOpen && <DemoCartDrawer onClose={() => setCartOpen(false)} />}
        {step === 'payment' && (
          <DemoPaymentModal
            onClose={() => setStep('payment')} // no-op stays
            onCancel={() => setStep('pos')}
            onComplete={(r) => { setReceipt(r); setStep('receipt'); }}
          />
        )}
        {step === 'receipt' && receipt && (
          <DemoReceipt receipt={receipt} onClose={() => { setReceipt(null); setStep('pos'); }} />
        )}
        {scannerOpen && <DemoScanner onClose={() => setScannerOpen(false)} />}
      </div>
    );
  }

  // ─── DESKTOP ───
  return (
    <div className="flex h-full w-full overflow-hidden relative">
      <div className="flex-1 overflow-hidden">
        <DemoProductArea onScan={() => setScannerOpen(true)} />
      </div>

      <DemoCartPanel onPay={() => setStep('payment')} />

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 hidden xl:flex items-center gap-4 text-xs text-muted-foreground bg-card/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-border shadow-sm pointer-events-none">
        <span><kbd className="font-mono bg-muted px-1.5 py-0.5 rounded text-[11px] mr-1">F1</kbd>Pay</span>
        <span><kbd className="font-mono bg-muted px-1.5 py-0.5 rounded text-[11px] mr-1">F5</kbd>Clear</span>
        <span><kbd className="font-mono bg-muted px-1.5 py-0.5 rounded text-[11px] mr-1">Esc</kbd>Close</span>
      </div>

      {step === 'payment' && (
        <DemoPaymentModal
          onClose={() => {}}
          onCancel={() => setStep('pos')}
          onComplete={(r) => { setReceipt(r); setStep('receipt'); }}
        />
      )}
      {step === 'receipt' && receipt && (
        <DemoReceipt receipt={receipt} onClose={() => { setReceipt(null); setStep('pos'); }} />
      )}
      {scannerOpen && <DemoScanner onClose={() => setScannerOpen(false)} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PRODUCT AREA
// ═══════════════════════════════════════════════════════════════
function DemoProductArea({ onScan }: { onScan: () => void }) {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const items = useDemoCartStore((s) => s.items);
  const add = useDemoCartStore((s) => s.add);
  const setCustomer = useDemoCartStore((s) => s.setCustomer);
  const setPaymentMethod = useDemoCartStore((s) => s.setPaymentMethod);

  const cartQtyMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const item of items) m.set(item.product.id, item.qty);
    return m;
  }, [items]);

  const favorites = useMemo(
    () => demoProducts.filter((p) => p.is_favorite).sort((a, b) => a.favorite_order - b.favorite_order),
    []
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return demoProducts.filter((p) => {
      if (q) return p.name.toLowerCase().includes(q) || p.barcode?.toLowerCase().includes(q);
      if (activeCategory) return p.category_id === activeCategory;
      return true;
    });
  }, [search, activeCategory]);

  const handleAdd = (p: Product) => {
    add(p);
    if (navigator.vibrate) navigator.vibrate(25);
  };

  const showAll = !search && !activeCategory;

  return (
    <div className="flex flex-col h-full select-none">
      {/* Search */}
      <div className="p-3 bg-card border-b border-border sticky top-0 z-10 shadow-xs">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product or barcode..."
              className="w-full h-11 pl-9 pr-9 rounded-xl border border-input bg-background text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            type="button"
            onClick={onScan}
            size="icon"
            className="h-11 w-11 shrink-0 rounded-xl"
            aria-label="Scan"
          >
            <Camera className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Customer shortcuts */}
        {showAll && (
          <section>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Quick Utang Accounts
            </h3>
            <div className={cn('grid gap-2', isMobile ? 'grid-cols-3' : 'grid-cols-6')}>
              {demoCustomers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCustomer(c);
                    setPaymentMethod('utang');
                    toast.success(`Selected ${c.name}`, { duration: 1000 });
                  }}
                  className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-2 hover:border-primary active:scale-95 transition-all min-h-[64px] text-center"
                >
                  <span className="text-xs font-semibold truncate w-full">{c.name}</span>
                  <span className={cn('text-[11px] font-bold tabular-nums mt-0.5', c.balance > 0 ? 'text-warning' : 'text-success')}>
                    {formatCurrency(c.balance)}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Favorites */}
        {showAll && favorites.length > 0 && (
          <section>
            <div className="flex items-center gap-1.5 mb-2">
              <Star className="h-3.5 w-3.5 text-warning fill-warning" />
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Favorites</h3>
            </div>
            <div className={cn('grid gap-2', isMobile ? 'grid-cols-3' : 'grid-cols-6 lg:grid-cols-8')}>
              {favorites.map((p) => <DemoProductTile key={p.id} product={p} qty={cartQtyMap.get(p.id) || 0} onAdd={handleAdd} isMobile={isMobile} />)}
            </div>
          </section>
        )}

        {/* Categories */}
        {showAll && (
          <section className="space-y-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Categories</h3>
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 active:scale-95',
                  !activeCategory ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-secondary'
                )}
              >
                All
              </button>
              {demoCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCategory(c.id)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 active:scale-95',
                    activeCategory === c.id ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-secondary'
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Grid */}
        <section>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              {search ? `No items matching "${search}"` : 'No products found'}
            </div>
          ) : (
            <div className={cn('grid gap-2', isMobile ? 'grid-cols-3' : 'grid-cols-6 lg:grid-cols-8')}>
              {filtered.map((p) => <DemoProductTile key={p.id} product={p} qty={cartQtyMap.get(p.id) || 0} onAdd={handleAdd} isMobile={isMobile} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function DemoProductTile({
  product, qty, onAdd, isMobile,
}: { product: Product; qty: number; onAdd: (p: Product) => void; isMobile: boolean }) {
  const isLowStock = product.stock <= product.low_stock_threshold;
  return (
    <button
      type="button"
      onClick={() => onAdd(product)}
      className={cn(
        'flex flex-col items-center justify-between rounded-xl border p-2.5 active:scale-95 transition-all relative text-center',
        isMobile ? 'min-h-[86px]' : 'h-24',
        qty > 0 ? 'border-primary bg-primary/5 shadow-2xs' : 'border-border bg-card hover:border-muted-foreground/30'
      )}
    >
      {qty > 0 && (
        <span className="absolute -top-1.5 -left-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4.5 min-w-[18px] px-1 flex items-center justify-center">
          {qty}
        </span>
      )}
      {isLowStock && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive ring-2 ring-background" />
      )}
      <span className="text-xs font-medium line-clamp-2 leading-tight w-full">{product.name}</span>
      <div className="flex flex-col items-center mt-1 w-full">
        <span className="text-xs font-bold text-primary tabular-nums">{formatCurrency(product.price)}</span>
        <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
          {product.stock} {product.unit}
        </span>
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// CART PANEL (desktop)
// ═══════════════════════════════════════════════════════════════
function DemoCartPanel({ onPay }: { onPay: () => void }) {
  const items = useDemoCartStore((s) => s.items);
  const customer = useDemoCartStore((s) => s.customer);
  const inc = useDemoCartStore((s) => s.incrementQty);
  const dec = useDemoCartStore((s) => s.decrementQty);
  const remove = useDemoCartStore((s) => s.remove);
  const clear = useDemoCartStore((s) => s.clear);
  const setCustomer = useDemoCartStore((s) => s.setCustomer);
  const subtotal = useDemoCartStore((s) => s.getSubtotal());
  const total = useDemoCartStore((s) => s.getTotal());
  const count = useDemoCartStore((s) => s.getItemCount());

  return (
    <div className="w-[380px] bg-card border-l border-border flex flex-col h-full shrink-0">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          <span className="font-semibold">Cart ({count})</span>
        </div>
        {items.length > 0 && (
          <button onClick={clear} className="text-xs text-muted-foreground hover:text-destructive">
            Clear all
          </button>
        )}
      </div>

      {customer && (
        <div className="px-4 py-2 bg-warning/10 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{customer.name}</span>
            {customer.balance > 0 && (
              <span className="text-xs text-warning">Bal: {formatCurrency(customer.balance)}</span>
            )}
          </div>
          <button onClick={() => setCustomer(null)} className="text-xs text-muted-foreground hover:text-foreground">
            Remove
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            Cart is empty. Tap products or scan to add.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.product.id} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{item.product.name}</div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  {formatCurrency(item.product.price)} each
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => dec(item.product.id)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/70">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-7 text-center text-sm font-semibold tabular-nums">{item.qty}</span>
                <button onClick={() => inc(item.product.id)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/70">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="w-20 text-right text-sm font-bold tabular-nums">
                {formatCurrency(item.product.price * item.qty)}
              </div>
              <button onClick={() => remove(item.product.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-border p-4 space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="tabular-nums text-primary">{formatCurrency(total)}</span>
          </div>
        </div>
        <Button onClick={onPay} disabled={items.length === 0} className="w-full h-12 text-base">
          Pay {formatCurrency(total)}
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MOBILE CART DRAWER
// ═══════════════════════════════════════════════════════════════
function DemoCartDrawer({ onClose }: { onClose: () => void }) {
  const items = useDemoCartStore((s) => s.items);
  const customer = useDemoCartStore((s) => s.customer);
  const inc = useDemoCartStore((s) => s.incrementQty);
  const dec = useDemoCartStore((s) => s.decrementQty);
  const remove = useDemoCartStore((s) => s.remove);
  const clear = useDemoCartStore((s) => s.clear);
  const setCustomer = useDemoCartStore((s) => s.setCustomer);
  const subtotal = useDemoCartStore((s) => s.getSubtotal());
  const total = useDemoCartStore((s) => s.getTotal());
  const count = useDemoCartStore((s) => s.getItemCount());

  return (
    <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose}>
      <div
        className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-card rounded-t-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <span className="font-semibold">Cart ({count})</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {customer && (
          <div className="px-4 py-2 bg-warning/10 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium">{customer.name}</span>
            <button onClick={() => setCustomer(null)} className="text-xs text-muted-foreground">Remove</button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px]">
          {items.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">Cart is empty.</div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.product.name}</div>
                  <div className="text-xs text-muted-foreground tabular-nums">{formatCurrency(item.product.price)}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => dec(item.product.id)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold tabular-nums">{item.qty}</span>
                  <button onClick={() => inc(item.product.id)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="w-16 text-right text-sm font-bold tabular-nums">
                  {formatCurrency(item.product.price * item.qty)}
                </div>
                <button onClick={() => remove(item.product.id)} className="p-1 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-border p-4 space-y-3">
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="tabular-nums text-primary">{formatCurrency(total)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={clear} disabled={items.length === 0}>
              <Trash2 className="h-4 w-4 mr-1" /> Clear
            </Button>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAYMENT MODAL
// ═══════════════════════════════════════════════════════════════
function DemoPaymentModal({
  onCancel, onComplete,
}: { onClose: () => void; onCancel: () => void; onComplete: (r: any) => void }) {
  const items = useDemoCartStore((s) => s.items);
  const customer = useDemoCartStore((s) => s.customer);
  const method = useDemoCartStore((s) => s.paymentMethod);
  const setMethod = useDemoCartStore((s) => s.setPaymentMethod);
  const total = useDemoCartStore((s) => s.getTotal());
  const clear = useDemoCartStore((s) => s.clear);
  const [amountPaid, setAmountPaid] = useState(total.toFixed(2));

  const change = Math.max(0, (parseFloat(amountPaid) || 0) - total);

  const handleKeypad = (k: string) => {
    if (k === 'del') { setAmountPaid((p) => p.slice(0, -1)); return; }
    if (k === '.') { if (!amountPaid.includes('.')) setAmountPaid((p) => p + '.'); return; }
    setAmountPaid((p) => p + k);
  };

  const handleConfirm = () => {
    if (method === 'utang' && !customer) {
      toast.error('Select a customer for utang');
      return;
    }
    if (method === 'cash' && (parseFloat(amountPaid) || 0) < total) {
      toast.error('Amount paid less than total');
      return;
    }

    const receipt = {
      id: crypto.randomUUID(),
      receipt_no: `DEMO-${Date.now().toString().slice(-6)}`,
      total_amount: total,
      amount_paid: method === 'utang' ? 0 : parseFloat(amountPaid) || total,
      change_amount: method === 'cash' ? change : 0,
      discount: 0,
      payment_method: method,
      customer_id: customer?.id ?? null,
      customer: customer,
      is_voided: false,
      created_at: new Date().toISOString(),
      items: items.map((i) => ({
        product_name: i.product.name,
        qty: i.qty,
        unit_price: i.product.price,
        subtotal: i.product.price * i.qty,
      })),
    };

    clear();
    onComplete(receipt);
  };

  const methods = [
    { v: 'cash',   l: 'Cash',   i: Banknote },
    { v: 'gcash',  l: 'GCash',  i: Zap },
    { v: 'maya',   l: 'Maya',   i: Zap },
    { v: 'utang',  l: 'Utang',  i: Star },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-lg">Payment (Demo)</h2>
          <button onClick={onCancel} className="p-2 rounded-lg hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="text-center py-3 bg-secondary rounded-xl">
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="text-3xl font-bold text-primary tabular-nums">{formatCurrency(total)}</div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {methods.map((m) => {
              const Icon = m.i;
              return (
                <button
                  key={m.v}
                  type="button"
                  onClick={() => setMethod(m.v as PaymentMethod)}
                  className={cn(
                    'flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all',
                    method === m.v ? 'border-primary bg-primary/10' : 'border-border'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{m.l}</span>
                </button>
              );
            })}
          </div>

          {method === 'cash' && (
            <>
              <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                <div>
                  <div className="text-xs text-muted-foreground">Paid</div>
                  <div className="text-xl font-bold tabular-nums">{formatCurrency(parseFloat(amountPaid) || 0)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Change</div>
                  <div className="text-xl font-bold text-success tabular-nums">{formatCurrency(change)}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['1','2','3','4','5','6','7','8','9','.','0','del'].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => handleKeypad(k)}
                    className="h-12 rounded-xl bg-secondary hover:bg-secondary/70 active:scale-95 text-lg font-semibold"
                  >
                    {k === 'del' ? '⌫' : k}
                  </button>
                ))}
              </div>
            </>
          )}

          {method === 'utang' && (
            <div className="p-3 rounded-xl bg-warning/10 text-sm">
              {customer ? (
                <>
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-muted-foreground">Balance: {formatCurrency(customer.balance)}</div>
                  <div className="text-warning font-medium mt-1">
                    New: {formatCurrency(customer.balance + total)}
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground">
                  Select a customer from shortcuts first
                </div>
              )}
            </div>
          )}

          {(method === 'gcash' || method === 'maya') && (
            <div className="p-3 rounded-xl bg-primary/10 text-center">
              <div className="text-xs text-muted-foreground">Demo — simulated {method.toUpperCase()} payment</div>
            </div>
          )}

          <Button
            onClick={handleConfirm}
            disabled={method === 'utang' && !customer}
            className="w-full h-12 text-base"
          >
            <Check className="h-5 w-5 mr-2" />
            Confirm Sale
          </Button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// RECEIPT
// ═══════════════════════════════════════════════════════════════
function DemoReceipt({ receipt, onClose }: { receipt: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold">Receipt (Demo)</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-3 text-sm">
          <div className="text-center pb-3 border-b border-dashed border-border">
            <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold">DEMO RECEIPT</div>
            <div className="font-bold text-lg mt-1">Kita POS</div>
            <div className="text-xs text-muted-foreground">No data was saved</div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Receipt #</span>
              <span className="font-mono">{receipt.receipt_no}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Date</span>
              <span>{new Date(receipt.created_at).toLocaleString('en-PH')}</span>
            </div>
          </div>

          <div className="py-3 border-y border-dashed border-border space-y-2">
            {receipt.items.map((i: any, idx: number) => (
              <div key={idx} className="flex justify-between text-sm">
                <div className="min-w-0 flex-1">
                  <div className="truncate">{i.product_name}</div>
                  <div className="text-xs text-muted-foreground">{i.qty} × {formatCurrency(i.unit_price)}</div>
                </div>
                <div className="font-semibold tabular-nums ml-2">{formatCurrency(i.subtotal)}</div>
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(receipt.total_amount)}</span>
            </div>
            {receipt.payment_method === 'cash' && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="tabular-nums">{formatCurrency(receipt.amount_paid)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Change</span>
                  <span className="tabular-nums">{formatCurrency(receipt.change_amount)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Method</span>
              <span className="font-semibold uppercase">{receipt.payment_method}</span>
            </div>
            {receipt.customer && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-semibold">{receipt.customer.name}</span>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-3 text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed text-center">
            <strong>This is a demo.</strong> In the real app, this receipt saves to your database and can be printed or emailed.
          </div>

          <Button onClick={onClose} className="w-full h-12 text-base">
            New Sale
          </Button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCANNER (simplified — matches demo barcodes)
// ═══════════════════════════════════════════════════════════════
function DemoScanner({ onClose }: { onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState('Align barcode inside the frame');
  const [torchOn, setTorchOn] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [manual, setManual] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const mountedRef = useRef(true);
  const lastScanRef = useRef<{ code: string; at: number } | null>(null);
  const add = useDemoCartStore((s) => s.add);

  useEffect(() => {
    if (manual) return;
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128, BarcodeFormat.CODE_39,
      BarcodeFormat.ITF, BarcodeFormat.QR_CODE,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    const reader = new BrowserMultiFormatReader(hints);
    mountedRef.current = true;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const controls = await reader.decodeFromVideoElement(videoRef.current!, (result) => {
          if (!mountedRef.current || !result) return;
          const text = result.getText();
          const now = Date.now();
          if (lastScanRef.current && lastScanRef.current.code === text && now - lastScanRef.current.at < 2000) return;
          lastScanRef.current = { code: text, at: now };
          const product = demoProducts.find((p) => p.barcode === text || p.qr_code === text);
          if (product) {
            add(product);
            if (navigator.vibrate) navigator.vibrate(80);
            toast.success(`${product.name} added`, { duration: 800 });
            onClose();
          } else {
            toast.error(`Not in demo: ${text}`, { duration: 1500 });
          }
        });
        controlsRef.current = controls;
      } catch (e: any) {
        setError(e?.message ?? 'Camera access denied');
      }
    })();

    return () => {
      mountedRef.current = false;
      try { controlsRef.current?.stop(); } catch {}
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [manual, add, onClose]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as any] });
      setTorchOn(!torchOn);
    } catch { toast.error('Torch not supported'); }
  };

  const applyZoom = async (z: number) => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ zoom: z } as any] });
      setZoom(z);
    } catch { toast.error('Zoom not supported'); }
  };

  const handleManual = () => {
    if (!manualCode.trim()) return;
    const product = demoProducts.find((p) => p.barcode === manualCode.trim());
    if (product) {
      add(product);
      toast.success(`${product.name} added`);
      onClose();
    } else {
      toast.error(`No match: ${manualCode.trim()}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 text-white shrink-0">
        <span className="font-medium">{manual ? 'Enter Barcode' : 'Scan Barcode'}</span>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
          <X className="h-5 w-5" />
        </button>
      </div>

      {!manual ? (
        <div className="flex-1 relative overflow-hidden">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-72 h-0.5 bg-red-500 shadow-[0_0_20px_4px_rgba(239,68,68,0.7)] animate-pulse" />
          </div>
          {!error && (
            <p className="absolute bottom-40 left-0 right-0 text-center text-white text-sm px-4 drop-shadow-lg">{hint}</p>
          )}
          {!error && (
            <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-3">
              <button onClick={() => applyZoom(Math.max(1, zoom - 0.5))} className="w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center">
                <ZoomOut className="h-5 w-5" />
              </button>
              <div className="px-3 h-10 rounded-full bg-black/50 text-white flex items-center text-sm">{zoom.toFixed(1)}×</div>
              <button onClick={() => applyZoom(Math.min(3, zoom + 0.5))} className="w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center">
                <ZoomIn className="h-5 w-5" />
              </button>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white p-6 text-center">
              <div>
                <CameraOff className="h-12 w-12 mx-auto mb-3 text-red-400" />
                <p className="mb-2">⚠️ {error}</p>
                <Button variant="secondary" onClick={() => setManual(true)}>Manual Entry</Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-white">
          <Keyboard className="h-16 w-16 mb-4 text-white/40" />
          <input
            type="text"
            inputMode="numeric"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManual()}
            placeholder="4801981100217"
            autoFocus
            className="w-full max-w-sm h-14 px-4 rounded bg-white/10 border border-white/20 text-white text-center text-lg"
          />
          <Button onClick={handleManual} disabled={!manualCode.trim()} className="mt-4 w-full max-w-sm h-12">
            Add to Cart
          </Button>
        </div>
      )}

      <div className="p-4 flex justify-around items-center text-white shrink-0 border-t border-white/10">
        {!manual ? (
          <>
            <button onClick={toggleTorch} className="flex flex-col items-center gap-1 p-3">
              <Zap className={`h-6 w-6 ${torchOn ? 'text-yellow-400' : ''}`} />
              <span className="text-xs">Torch</span>
            </button>
            <button onClick={() => setManual(true)} className="flex flex-col items-center gap-1 p-3">
              <Keyboard className="h-6 w-6" />
              <span className="text-xs">Manual</span>
            </button>
          </>
        ) : (
          <button onClick={() => setManual(false)} className="flex flex-col items-center gap-1 p-3">
            <Camera className="h-6 w-6" />
            <span className="text-xs">Camera</span>
          </button>
        )}
      </div>
    </div>
  );
}