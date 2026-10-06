import { useState, useMemo } from 'react';
import { 
  Plus, Minus, X, Package, AlertTriangle, ArrowDownToLine, 
  Search, Check, Trash2, RotateCcw, ArrowRight 
} from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useLowStock, useStockIn, useStockAdjust, useInventoryMovements } from '@/hooks/useSales';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

export function Inventory() {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<'stock' | 'lowstock' | 'history'>('stock');
  const [search, setSearch] = useState('');

  const { data: products, isLoading: loadingProducts } = useProducts();
  const { data: lowStock, isLoading: loadingLowStock } = useLowStock();
  const { data: movements, isLoading: loadingMovements } = useInventoryMovements();
  const stockIn = useStockIn();
  const stockAdjust = useStockAdjust();

  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [showStockIn, setShowStockIn] = useState(false);

  const triggerHaptic = (pattern: number | number[] = 20) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        (navigator.vibrate as any)(pattern);
      } catch {}
    }
  };

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products || [];
    return (products || []).filter(
      (p) => p.name.toLowerCase().includes(q) || p.barcode?.toLowerCase().includes(q)
    );
  }, [products, search]);

  const filteredLowStock = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return lowStock || [];
    return (lowStock || []).filter(
      (p: any) => p.name.toLowerCase().includes(q) || p.barcode?.toLowerCase().includes(q)
    );
  }, [lowStock, search]);

  const handleOpenAdjust = (p: Product) => {
    setAdjustProduct(p);
    triggerHaptic(15);
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 overflow-hidden select-none pb-[calc(4rem+env(safe-area-inset-bottom,0px))]">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-border shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">Inventory</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit stocks and log bulk deliveries
          </p>
        </div>
        <Button
          onClick={() => {
            setShowStockIn(true);
            triggerHaptic(20);
          }}
          className="h-11 px-4 rounded-xl text-xs sm:text-sm font-bold shadow-sm active:scale-95"
        >
          <ArrowDownToLine className="h-4 w-4 mr-1.5" />
          Stock In
        </Button>
      </div>

      {/* Tabs & Search Controls */}
      <div className="py-3 space-y-2.5 shrink-0">
        <div className="flex gap-1 p-1 bg-secondary/80 rounded-xl w-full sm:w-fit">
          {[
            { key: 'stock', label: `All (${products?.length || 0})` },
            { key: 'lowstock', label: `Low Stock (${lowStock?.length || 0})` },
            { key: 'history', label: 'History' },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key as any);
                triggerHaptic(10);
              }}
              className={cn(
                'flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95',
                tab === t.key
                  ? 'bg-card text-foreground shadow-2xs font-extrabold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab !== 'history' && (
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product name or barcode..."
              className="pl-10 h-11 text-base sm:text-sm rounded-xl bg-background border-input shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:bg-muted rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Tab Panels */}
      <div className="flex-1 overflow-y-auto pb-4 space-y-2.5">
        {/* TAB 1: ALL PRODUCTS */}
        {tab === 'stock' && (
          <>
            {loadingProducts ? (
              <div className="text-center py-16 text-sm text-muted-foreground">
                Loading inventory...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                {search ? `No products found matching "${search}"` : 'No products available.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filteredProducts.map((p) => {
                  const isLow = p.stock <= p.low_stock_threshold;
                  return (
                    <Card key={p.id} className="p-3.5 flex items-center gap-3 rounded-2xl border bg-card shadow-2xs">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                        isLow ? 'bg-destructive/15 text-destructive' : 'bg-primary/10 text-primary'
                      )}>
                        <Package className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-foreground truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          In Stock:{' '}
                          <span className={cn('font-bold tabular-nums', isLow ? 'text-destructive' : 'text-foreground')}>
                            {p.stock} {p.unit}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground tabular-nums">
                          Unit Cost: {formatCurrency(p.cost)} · Price: {formatCurrency(p.price)}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAdjust(p)}
                        className="rounded-xl h-9 text-xs font-bold shrink-0 active:scale-95"
                      >
                        Adjust
                      </Button>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* TAB 2: LOW STOCK WARNINGS */}
        {tab === 'lowstock' && (
          <>
            {loadingLowStock ? (
              <div className="text-center py-16 text-sm text-muted-foreground">
                Checking low stock levels...
              </div>
            ) : filteredLowStock.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-success/15 flex items-center justify-center text-success">
                  <Check className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-foreground">Stock levels healthy</p>
                <p className="text-xs max-w-[220px]">
                  No items currently below their low stock threshold.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filteredLowStock.map((p: any) => (
                  <Card key={p.id} className="p-3.5 flex items-center gap-3 rounded-2xl border-destructive/30 bg-destructive/5 shadow-2xs">
                    <div className="w-10 h-10 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-foreground truncate">{p.name}</div>
                      <div className="text-xs text-destructive font-semibold mt-0.5">
                        Only {p.stock} {p.unit} left
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Restock warning set at ≤ {p.low_stock_threshold} {p.unit}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenAdjust(p)}
                      className="rounded-xl h-9 text-xs font-bold border-destructive/30 text-destructive hover:bg-destructive/10 shrink-0 active:scale-95"
                    >
                      Restock
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* TAB 3: AUDIT HISTORY */}
        {tab === 'history' && (
          <>
            {loadingMovements ? (
              <div className="text-center py-16 text-sm text-muted-foreground">
                Loading movement audit...
              </div>
            ) : (movements || []).length === 0 ? (
              <div className="text-center py-16 text-sm text-muted-foreground">
                No inventory movement records found.
              </div>
            ) : (
              <div className="space-y-2">
                {(movements || []).map((m: any) => {
                  const isPositive = m.qty_change > 0;
                  return (
                    <Card key={m.id} className="p-3.5 flex items-center gap-3 rounded-2xl border bg-card shadow-2xs">
                      <div className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                        isPositive ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
                      )}>
                        {isPositive ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0 select-text">
                        <div className="text-sm font-bold text-foreground truncate">
                          {m.product?.name || 'Item'}
                        </div>
                        <div className="text-xs text-muted-foreground tabular-nums">
                          <span className={cn('font-bold', isPositive ? 'text-success' : 'text-destructive')}>
                            {isPositive ? `+${m.qty_change}` : m.qty_change}
                          </span>
                          {' '}→ Stock: {m.new_qty} {m.reason ? `· ${m.reason}` : ''}
                        </div>
                      </div>
                      <div className="text-[11px] text-muted-foreground text-right shrink-0">
                        {formatDateTime(m.created_at)}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Adjust Stock Sheet */}
      {adjustProduct && (
        <AdjustStockModal
          product={adjustProduct}
          onClose={() => setAdjustProduct(null)}
          onConfirm={async (newQtyVal, reasonVal) => {
            try {
              await stockAdjust.mutateAsync({
                productId: adjustProduct.id,
                newQty: newQtyVal,
                reason: reasonVal || 'Manual count adjustment',
              });
              triggerHaptic([30, 40]);
              toast.success(`Updated stock for ${adjustProduct.name}`);
              setAdjustProduct(null);
            } catch (e: any) {
              toast.error(e?.message || 'Failed to adjust stock');
            }
          }}
          saving={stockAdjust.isPending}
        />
      )}

      {/* Stock In Batch Delivery Sheet */}
      {showStockIn && (
        <StockInModal
          products={products || []}
          onClose={() => setShowStockIn(false)}
          onConfirm={async (items) => {
            try {
              await stockIn.mutateAsync({ items });
              triggerHaptic([40, 50]);
              toast.success(`Successfully received ${items.length} product restocks`);
              setShowStockIn(false);
            } catch (e: any) {
              toast.error(e?.message || 'Failed to receive stock');
            }
          }}
          saving={stockIn.isPending}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ADJUST / AUDIT STOCK SHEET (WITH ONE-TAP INCREMENT STEPPERS)
// ─────────────────────────────────────────────────────────────
function AdjustStockModal({
  product,
  onClose,
  onConfirm,
  saving,
}: {
  product: Product;
  onClose: () => void;
  onConfirm: (newQty: number, reason: string) => void;
  saving: boolean;
}) {
  const isMobile = useIsMobile();
  const [qty, setQty] = useState(product.stock.toString());
  const [reason, setReason] = useState('Count audit');

  const parsedQty = parseInt(qty) || 0;
  const difference = parsedQty - product.stock;

  const handleStep = (delta: number) => {
    const updated = Math.max(0, parsedQty + delta);
    setQty(updated.toString());
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { (navigator.vibrate as any)(15); } catch {}
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className={cn(
          'bg-card w-full sm:max-w-sm flex flex-col overflow-hidden shadow-2xl transition-all',
          isMobile
            ? 'rounded-t-3xl pb-[max(1rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-200'
            : 'rounded-2xl'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {isMobile && (
          <div className="w-12 h-1 bg-muted-foreground/25 rounded-full mx-auto mt-2.5 shrink-0" />
        )}

        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
          <div>
            <h2 className="font-bold text-base text-foreground">Adjust Inventory</h2>
            <p className="text-xs text-muted-foreground truncate max-w-[240px]">{product.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted active:scale-90"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Current vs New Quantity Readout */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-secondary/60 rounded-2xl border border-border text-center">
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase">Current</div>
              <div className="text-xl font-extrabold text-foreground tabular-nums">
                {product.stock} {product.unit}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase">Difference</div>
              <div className={cn(
                'text-xl font-extrabold tabular-nums',
                difference > 0 ? 'text-success' : difference < 0 ? 'text-destructive' : 'text-muted-foreground'
              )}>
                {difference > 0 ? `+${difference}` : difference}
              </div>
            </div>
          </div>

          {/* Stepper Buttons for Fast Counter Counts */}
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => handleStep(-10)}
              className="h-10 px-2.5 rounded-xl bg-secondary hover:bg-secondary/80 font-bold text-xs active:scale-95"
            >
              -10
            </button>
            <button
              type="button"
              onClick={() => handleStep(-1)}
              className="w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center active:scale-95"
            >
              <Minus className="h-4 w-4" />
            </button>
            <Input
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              type="number"
              inputMode="numeric"
              className="h-12 w-24 text-center text-xl font-black font-mono rounded-xl"
            />
            <button
              type="button"
              onClick={() => handleStep(1)}
              className="w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center active:scale-95"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleStep(10)}
              className="h-10 px-2.5 rounded-xl bg-secondary hover:bg-secondary/80 font-bold text-xs active:scale-95"
            >
              +10
            </button>
          </div>

          {/* Adjustment Reason */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Reason for Adjustment
            </label>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1 mb-2">
              {['Delivery count', 'Damaged', 'Expired', 'Personal use', 'Loss'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap border shrink-0',
                    reason === r ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-border text-foreground'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Custom reason..."
              className="h-10 text-sm rounded-xl"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => onConfirm(parsedQty, reason)}
              disabled={saving}
              className="flex-1 h-12 rounded-xl text-xs font-bold shadow-sm active:scale-[0.99]"
            >
              {saving ? 'Updating...' : (
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4" />
                  Save Count
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BULK RESTOCK / STOCK IN RECEIVING SHEET
// ─────────────────────────────────────────────────────────────
function StockInModal({
  products,
  onClose,
  onConfirm,
  saving,
}: {
  products: Product[];
  onClose: () => void;
  onConfirm: (items: { productId: string; qty: number; cost: number }[]) => void;
  saving: boolean;
}) {
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState('1');
  const [cost, setCost] = useState('');
  const [batchItems, setBatchItems] = useState<{ productId: string; productName: string; qty: number; cost: number; unit: string }[]>([]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return products.slice(0, 15);
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.barcode?.toLowerCase().includes(q));
  }, [products, filter]);

  const handleSelect = (p: Product) => {
    setSelectedProduct(p);
    setCost(p.cost.toString());
  };

  const handleAddBatch = () => {
    if (!selectedProduct || !qty) return;
    const addedQty = parseInt(qty) || 1;
    const unitCost = parseFloat(cost) || selectedProduct.cost || 0;

    setBatchItems((prev) => [
      ...prev,
      {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        qty: addedQty,
        cost: unitCost,
        unit: selectedProduct.unit,
      },
    ]);

    setSelectedProduct(null);
    setFilter('');
    setQty('1');
    setCost('');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className={cn(
          'bg-card w-full sm:max-w-md flex flex-col overflow-hidden shadow-2xl transition-all',
          isMobile
            ? 'rounded-t-3xl max-h-[92dvh] pb-[max(1rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-200'
            : 'rounded-2xl max-h-[88vh]'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {isMobile && (
          <div className="w-12 h-1 bg-muted-foreground/25 rounded-full mx-auto mt-2.5 shrink-0" />
        )}

        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
          <div>
            <h2 className="font-bold text-base text-foreground">Receive Stock Delivery</h2>
            <p className="text-xs text-muted-foreground">{batchItems.length} items staged</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted active:scale-90"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-3.5 flex-1 overflow-y-auto">
          {/* Step 1: Product Selection */}
          {!selectedProduct ? (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Find Product to Restock
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Type product name or scan..."
                  className="pl-9 h-11 text-base sm:text-sm rounded-xl"
                  autoFocus
                />
              </div>
              <div className="max-h-40 overflow-y-auto divide-y divide-border rounded-xl border border-border bg-background">
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p)}
                    className="w-full text-left p-2.5 text-xs font-semibold hover:bg-secondary/70 flex justify-between items-center active:bg-secondary"
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="text-muted-foreground font-mono shrink-0 ml-2">
                      Stock: {p.stock}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-primary truncate">{selectedProduct.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  Current: {selectedProduct.stock} {selectedProduct.unit}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="text-xs font-semibold text-primary underline ml-2"
              >
                Change
              </button>
            </div>
          )}

          {/* Step 2: Quantity & Cost Inputs */}
          {selectedProduct && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                    Units Received
                  </label>
                  <Input
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    type="number"
                    inputMode="numeric"
                    placeholder="Qty"
                    className="h-11 text-base font-bold font-mono rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                    Cost per Unit (PHP)
                  </label>
                  <Input
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    type="number"
                    inputMode="decimal"
                    placeholder="0.00"
                    className="h-11 text-base font-bold font-mono rounded-xl"
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={handleAddBatch}
                className="w-full h-11 rounded-xl text-xs font-bold active:scale-95"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add to Delivery List
              </Button>
            </div>
          )}

          {/* Staged Delivery List */}
          {batchItems.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="text-xs font-bold text-muted-foreground uppercase">
                Staged Delivery Items ({batchItems.length})
              </div>
              <div className="space-y-1.5">
                {batchItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-background text-xs"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-bold truncate text-foreground">{item.productName}</div>
                      <div className="text-muted-foreground">
                        +{item.qty} {item.unit} @ {formatCurrency(item.cost)}/ea
                      </div>
                    </div>
                    <span className="font-bold tabular-nums shrink-0 mr-2">
                      {formatCurrency(item.qty * item.cost)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setBatchItems((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1 text-muted-foreground hover:text-destructive active:scale-90"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border flex gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 h-12 rounded-xl text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => onConfirm(batchItems.map(({ productId, qty, cost }) => ({ productId, qty, cost })))}
            disabled={batchItems.length === 0 || saving}
            className="flex-1 h-12 rounded-xl text-xs font-bold shadow-sm active:scale-[0.99]"
          >
            {saving ? 'Receiving...' : (
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4" />
                Confirm Restock ({batchItems.length})
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}