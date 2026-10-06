import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Search, Camera, X, Star } from 'lucide-react';
import type { Product } from '@/types';
import { useProducts, useCategories } from '@/hooks/useProducts';
import { useCustomers } from '@/hooks/useCustomers';
import { useCartStore } from '@/stores/cartStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ProductAreaProps {
  searchInputRef?: React.RefObject<HTMLInputElement>;
}

export function ProductArea({ searchInputRef }: ProductAreaProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(true);
  
  const isMobile = useIsMobile();
  const cartItems = useCartStore((s) => s.items);
  const add = useCartStore((s) => s.add);
  const setScannerOpen = useUIStore((s) => s.setScannerOpen);
  
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = searchInputRef || internalRef;

  const { data: allProducts, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const { data: shortcutCustomers } = useCustomers({ shortcutsOnly: true });

  // Map product IDs to current cart quantities for instant visual feedback on tiles
  const cartQtyMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of cartItems) {
      map.set(item.product.id, item.qty);
    }
    return map;
  }, [cartItems]);

  const favorites = useMemo(() => {
    return (allProducts || [])
      .filter((p) => p.is_favorite)
      .sort((a, b) => (a.favorite_order ?? 0) - (b.favorite_order ?? 0));
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (allProducts || []).filter((p) => {
      if (q) {
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBarcode = p.barcode?.toLowerCase().includes(q);
        return matchesName || matchesBarcode;
      }
      if (activeCategory) return p.category_id === activeCategory;
      return true;
    });
  }, [allProducts, search, activeCategory]);

  const handleAddToCart = useCallback((product: Product) => {
    if (product.stock <= 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }

    add(product);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }
  }, [add]);

  // Keyboard shortcut for search focus
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' || (e.ctrlKey && e.key === 'k')) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [inputRef]);

  const showAllSection = !search && !activeCategory;

  return (
    <div className="flex flex-col h-full select-none">
      {/* Search Header */}
      <div className="p-3 bg-card border-b border-border sticky top-0 z-10 shadow-xs">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowFavorites(!e.target.value);
              }}
              placeholder="Search product or barcode..."
              /* text-base on mobile prevents iOS automatic zoom */
              className="w-full h-11 pl-9 pr-9 rounded-xl border border-input bg-background text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setShowFavorites(true); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:bg-muted active:scale-90"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            type="button"
            onClick={() => setScannerOpen(true)}
            size="icon"
            className="h-11 w-11 shrink-0 rounded-xl active:scale-95 shadow-2xs"
            aria-label="Scan barcode"
          >
            <Camera className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Customer Shortcuts */}
        {showFavorites && showAllSection && shortcutCustomers && shortcutCustomers.length > 0 && (
          <section>
            <div className="flex items-center gap-1.5 mb-2">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quick Utang Accounts</h3>
            </div>
            <div className={cn(
              'grid gap-2',
              isMobile ? 'grid-cols-3' : 'grid-cols-6'
            )}>
              {shortcutCustomers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => {
                    useCartStore.getState().setCustomer(customer);
                    useCartStore.getState().setPaymentMethod('utang');
                    toast.success(`Selected ${customer.name}`, { duration: 1000 });
                  }}
                  className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-2 hover:border-primary active:scale-95 transition-all min-h-[64px] text-center"
                >
                  <span className="text-xs font-semibold truncate w-full">{customer.name}</span>
                  <span className={cn(
                    'text-[11px] font-bold tabular-nums mt-0.5',
                    customer.balance > 0 ? 'text-warning' : 'text-success'
                  )}>
                    {formatCurrency(customer.balance)}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Favorites Section */}
        {showFavorites && showAllSection && favorites.length > 0 && (
          <section>
            <div className="flex items-center gap-1.5 mb-2">
              <Star className="h-3.5 w-3.5 text-warning fill-warning" />
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Favorites</h3>
            </div>
            {/* Switched to grid-cols-3 on mobile to match the main grid */}
            <div className={cn(
              'grid gap-2',
              isMobile ? 'grid-cols-3' : 'grid-cols-6 lg:grid-cols-8'
            )}>
              {favorites.map((product) => {
                const inCartQty = cartQtyMap.get(product.id) || 0;
                const isOutOfStock = product.stock <= 0;
                const isLowStock = !isOutOfStock && product.stock <= product.low_stock_threshold;

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleAddToCart(product)}
                    disabled={isOutOfStock}
                    className={cn(
                      'flex flex-col items-center justify-between rounded-xl border p-2.5 active:scale-95 transition-all relative text-center',
                      isMobile ? 'min-h-[86px]' : 'h-24',
                      inCartQty > 0
                        ? 'border-primary bg-primary/5 shadow-2xs'
                        : 'border-border bg-card hover:border-muted-foreground/30',
                      isOutOfStock && 'opacity-40 grayscale cursor-not-allowed active:scale-100'
                    )}
                  >
                    {/* Badge: Cart Quantity on this item */}
                    {inCartQty > 0 && (
                      <span className="absolute -top-1.5 -left-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4.5 min-w-[18px] px-1 flex items-center justify-center shadow-xs">
                        {inCartQty}
                      </span>
                    )}

                    {/* Badge: Low Stock warning dot */}
                    {isLowStock && (
                      <span
                        className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive ring-2 ring-background"
                        title="Low stock"
                      />
                    )}

                    <span className="text-xs font-medium line-clamp-2 leading-tight w-full">
                      {product.name}
                    </span>

                    <div className="flex flex-col items-center mt-1 w-full">
                      <span className="text-xs font-bold text-primary tabular-nums">
                        {formatCurrency(product.price)}
                      </span>
                      <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                        {isOutOfStock ? 'No stock' : `${product.stock} ${product.unit}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Category Horizontal Pills */}
        {showAllSection && (
          <section className="space-y-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Categories</h3>
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 touch-pan-x">
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 shrink-0',
                  !activeCategory
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                )}
              >
                All
              </button>
              {(categories || []).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 shrink-0',
                    activeCategory === cat.id
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Product Grid */}
        <section>
          {isLoading ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              Loading inventory...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm font-medium">
                {search ? `No items found matching "${search}"` : 'No products found'}
              </p>
            </div>
          ) : (
            <div className={cn(
              'grid gap-2',
              isMobile ? 'grid-cols-3' : 'grid-cols-6 lg:grid-cols-8'
            )}>
              {filteredProducts.map((product) => {
                const inCartQty = cartQtyMap.get(product.id) || 0;
                const isOutOfStock = product.stock <= 0;
                const isLowStock = !isOutOfStock && product.stock <= product.low_stock_threshold;

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleAddToCart(product)}
                    disabled={isOutOfStock}
                    className={cn(
                      'flex flex-col items-center justify-between rounded-xl border p-2.5 active:scale-95 transition-all relative text-center',
                      isMobile ? 'min-h-[86px]' : 'h-24',
                      inCartQty > 0
                        ? 'border-primary bg-primary/5 shadow-2xs'
                        : 'border-border bg-card hover:border-muted-foreground/30',
                      isOutOfStock && 'opacity-40 grayscale cursor-not-allowed active:scale-100'
                    )}
                  >
                    {/* Badge: Live Qty Added in Cart */}
                    {inCartQty > 0 && (
                      <span className="absolute -top-1.5 -left-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4.5 min-w-[18px] px-1 flex items-center justify-center shadow-xs">
                        {inCartQty}
                      </span>
                    )}

                    {/* Low Stock Indicator */}
                    {isLowStock && (
                      <span
                        className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive ring-2 ring-background"
                        title="Low stock"
                      />
                    )}

                    <span className="text-xs font-medium line-clamp-2 leading-tight w-full">
                      {product.name}
                    </span>

                    <div className="flex flex-col items-center mt-1 w-full">
                      <span className="text-xs font-bold text-primary tabular-nums">
                        {formatCurrency(product.price)}
                      </span>
                      <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                        {isOutOfStock ? 'No stock' : `${product.stock} ${product.unit}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}