import { useState } from 'react';
import { 
  Minus, Plus, Trash2, ShoppingCart, Pause, X, User, 
  ArrowRight, Sparkles 
} from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useHeldStore } from '@/stores/heldStore';
import { useUIStore } from '@/stores/uiStore';
import { formatCurrency } from '@/utils/format';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CartPanelProps {
  variant: 'desktop' | 'mobile';
}

export function CartPanel({ variant }: CartPanelProps) {
  const items = useCartStore((s) => s.items);
  const customer = useCartStore((s) => s.customer);
  const discount = useCartStore((s) => s.discount);
  const incrementQty = useCartStore((s) => s.incrementQty);
  const decrementQty = useCartStore((s) => s.decrementQty);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getTotal = useCartStore((s) => s.getTotal);
  const getItemCount = useCartStore((s) => s.getItemCount);
  
  const hold = useHeldStore((s) => s.hold);
  const heldSalesCount = useHeldStore((s) => s.heldSales.length);

  const setPaymentOpen = useUIStore((s) => s.setPaymentOpen);
  const setHeldListOpen = useUIStore((s) => s.setHeldListOpen);
  const setCartOpen = useUIStore((s) => s.setCartOpen);

  const [isHolding, setIsHolding] = useState(false);
  const [customHoldLabel, setCustomHoldLabel] = useState('');

  const subtotal = getSubtotal();
  const total = getTotal();
  const count = getItemCount();

  const triggerHaptic = (ms = 20) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };

  const handleHold = () => {
    if (items.length === 0) return;
    const label = customHoldLabel.trim() || `Sale ${new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}`;
    hold(label, items, customer?.id || null);
    clear();
    setCustomHoldLabel('');
    setIsHolding(false);
    setCartOpen(false);
    triggerHaptic(40);
    toast.success(`Sale held: ${label}`);
  };

  const handleIncrement = (productId: string) => {
    incrementQty(productId);
    triggerHaptic(15);
  };

  const handleDecrement = (productId: string) => {
    decrementQty(productId);
    triggerHaptic(15);
  };

  const handleRemove = (productId: string, productName: string) => {
    remove(productId);
    triggerHaptic(30);
    toast.info(`Removed ${productName}`);
  };

  // ─────────────────────────────────────────────────────────────
  // MOBILE SLIDE-UP DRAWER
  // ─────────────────────────────────────────────────────────────
  if (variant === 'mobile') {
    return (
      <div 
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end animate-in fade-in duration-150 select-none"
        onClick={() => setCartOpen(false)}
      >
        <div
          className="bg-card w-full max-h-[88dvh] rounded-t-3xl border-t border-border flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Grab handle indicator */}
          <div className="w-12 h-1 bg-muted-foreground/25 rounded-full mx-auto mt-3 shrink-0" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ShoppingCart className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="font-bold text-base leading-tight">Order Cart</h2>
                <p className="text-[11px] text-muted-foreground">{count} {count === 1 ? 'item' : 'items'} queued</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    clear();
                    triggerHaptic(30);
                    toast.info('Cart cleared');
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-destructive active:scale-95 transition-all"
                >
                  Clear all
                </button>
              )}
              <button 
                type="button"
                onClick={() => setCartOpen(false)} 
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted active:scale-90"
                aria-label="Close cart"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Customer Utang Tag Ribbon */}
          {customer && (
            <div className="px-5 py-2.5 bg-warning/10 border-b border-warning/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <User className="h-4 w-4 text-warning shrink-0" />
                <span className="text-xs font-bold truncate">{customer.name}</span>
                {customer.balance > 0 && (
                  <span className="text-[11px] font-bold text-warning tabular-nums">
                    (Bal: {formatCurrency(customer.balance)})
                  </span>
                )}
              </div>
              <button 
                type="button"
                onClick={() => useCartStore.getState().setCustomer(null)} 
                className="text-xs font-semibold text-muted-foreground hover:text-foreground active:scale-95"
              >
                Remove
              </button>
            </div>
          )}

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[160px] overscroll-contain">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground/60">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Your cart is empty</p>
                  <p className="text-xs">Tap items or scan barcodes to begin a transaction.</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCartOpen(false)} 
                  className="rounded-xl mt-2 text-xs"
                >
                  Back to Products
                </Button>
              </div>
            ) : (
              items.map((item) => (
                <div 
                  key={item.product.id} 
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-border bg-background shadow-2xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-bold truncate leading-tight">
                      {item.product.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
                      {formatCurrency(item.product.price)} each
                    </div>
                  </div>

                  {/* Accessible touch-target steppers */}
                  <div className="flex items-center gap-1 bg-secondary/80 p-0.5 rounded-xl border border-border shrink-0">
                    <button 
                      type="button"
                      onClick={() => handleDecrement(item.product.id)} 
                      className="w-8 h-8 rounded-lg bg-background flex items-center justify-center active:scale-90 shadow-2xs transition-transform"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-7 text-center text-xs font-bold tabular-nums">
                      {item.qty}
                    </span>
                    <button 
                      type="button"
                      onClick={() => handleIncrement(item.product.id)} 
                      className="w-8 h-8 rounded-lg bg-background flex items-center justify-center active:scale-90 shadow-2xs transition-transform"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Subtotal & trash */}
                  <div className="text-right shrink-0 min-w-[70px]">
                    <div className="text-xs sm:text-sm font-bold tabular-nums text-foreground">
                      {formatCurrency(item.product.price * item.qty)}
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={() => handleRemove(item.product.id, item.product.name)} 
                    className="p-1.5 text-muted-foreground hover:text-destructive active:scale-90 transition-transform"
                    aria-label={`Remove ${item.product.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Hold Drawer Sub-form (revealed on Hold tap) */}
          {isHolding && items.length > 0 && (
            <div className="px-4 py-3 bg-secondary/70 border-t border-border space-y-2 animate-in fade-in duration-150">
              <label className="text-xs font-semibold text-muted-foreground">
                Label this parked sale (optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customHoldLabel}
                  onChange={(e) => setCustomHoldLabel(e.target.value)}
                  placeholder="e.g., Kuya red shirt, Table 3..."
                  className="flex-1 h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                  autoFocus
                />
                <Button size="sm" onClick={handleHold} className="rounded-xl px-4 text-xs font-bold">
                  Save Hold
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsHolding(false)} className="rounded-xl px-2.5">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Totals & Bottom Bar with Safe-Area Padding */}
          <div className="border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-card space-y-3 shrink-0">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-xs text-destructive">
                  <span>Discount</span>
                  <span className="tabular-nums font-semibold">-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-sm font-bold text-foreground">Total Due</span>
                <span className="text-2xl font-extrabold text-primary tabular-nums tracking-tight">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            {/* Hold & Held list tools */}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsHolding(!isHolding)} 
                disabled={items.length === 0}
                className="h-10 rounded-xl text-xs font-semibold"
              >
                <Pause className="h-3.5 w-3.5 mr-1.5" /> 
                {isHolding ? 'Cancel Hold' : 'Park / Hold'}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCartOpen(false);
                  setHeldListOpen(true);
                }}
                className="h-10 rounded-xl text-xs font-semibold"
              >
                Held Sales ({heldSalesCount})
              </Button>
            </div>

            {/* Primary Action Button */}
            <Button
              onClick={() => {
                setCartOpen(false);
                setPaymentOpen(true);
              }}
              disabled={items.length === 0}
              className="w-full h-13 rounded-xl text-base font-bold shadow-md active:scale-[0.99]"
            >
              Proceed to Pay ({formatCurrency(total)})
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // DESKTOP FIXED SIDE PANEL
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="w-[380px] bg-card border-l border-border flex flex-col h-full shrink-0 select-none">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <ShoppingCart className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm leading-tight">Current Cart</h2>
            <span className="text-xs text-muted-foreground">{count} {count === 1 ? 'item' : 'items'}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            clear();
            toast.info('Cart cleared');
          }}
          disabled={items.length === 0}
          className="text-xs font-semibold text-muted-foreground hover:text-destructive disabled:opacity-40 transition-colors"
        >
          Clear all
        </button>
      </div>

      {customer && (
        <div className="px-4 py-2 bg-warning/10 border-b border-warning/20 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <User className="h-4 w-4 text-warning shrink-0" />
            <span className="text-xs font-bold truncate">{customer.name}</span>
            {customer.balance > 0 && (
              <span className="text-[11px] font-bold text-warning tabular-nums">
                (Bal: {formatCurrency(customer.balance)})
              </span>
            )}
          </div>
          <button 
            type="button"
            onClick={() => useCartStore.getState().setCustomer(null)} 
            className="text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Remove
          </button>
        </div>
      )}

      {/* Item List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center text-muted-foreground space-y-2">
            <ShoppingCart className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm font-medium">Cart is empty</p>
            <p className="text-xs text-muted-foreground/80 max-w-[200px]">
              Click products or scan barcodes to begin sale.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div 
              key={item.product.id} 
              className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-background hover:border-muted-foreground/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold truncate">{item.product.name}</div>
                <div className="text-[11px] text-muted-foreground tabular-nums">
                  {formatCurrency(item.product.price)} each
                </div>
              </div>

              <div className="flex items-center gap-0.5 bg-secondary/80 p-0.5 rounded-lg border border-border">
                <button 
                  type="button"
                  onClick={() => handleDecrement(item.product.id)} 
                  className="w-6 h-6 rounded-md bg-background flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-6 text-center text-xs font-bold tabular-nums">{item.qty}</span>
                <button 
                  type="button"
                  onClick={() => handleIncrement(item.product.id)} 
                  className="w-6 h-6 rounded-md bg-background flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              <div className="w-16 text-right text-xs font-bold tabular-nums">
                {formatCurrency(item.product.price * item.qty)}
              </div>

              <button 
                type="button"
                onClick={() => handleRemove(item.product.id, item.product.name)} 
                className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Hold Input Reveal */}
      {isHolding && items.length > 0 && (
        <div className="p-3 bg-secondary/80 border-t border-border space-y-1.5 animate-in fade-in duration-100">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Park Sale Label</span>
            <button type="button" onClick={() => setIsHolding(false)} className="hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={customHoldLabel}
              onChange={(e) => setCustomHoldLabel(e.target.value)}
              placeholder="e.g. Table 2, Kuya blue..."
              className="flex-1 h-9 px-2.5 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <Button size="sm" onClick={handleHold} className="h-9 rounded-lg text-xs font-bold">
              Hold
            </Button>
          </div>
        </div>
      )}

      {/* Totals & Footer */}
      <div className="border-t border-border p-4 space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums font-semibold">{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-xs text-destructive">
              <span>Discount</span>
              <span className="tabular-nums font-semibold">-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-1">
            <span className="text-sm font-bold">Total</span>
            <span className="text-2xl font-extrabold text-primary tabular-nums tracking-tight">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsHolding(!isHolding)} 
            disabled={items.length === 0} 
            className="flex-1 rounded-xl text-xs font-semibold"
          >
            <Pause className="h-3.5 w-3.5 mr-1" /> {isHolding ? 'Cancel' : 'Hold'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHeldListOpen(true)}
            className="flex-1 rounded-xl text-xs font-semibold"
          >
            Held ({heldSalesCount})
          </Button>
        </div>

        <Button
          onClick={() => setPaymentOpen(true)}
          disabled={items.length === 0}
          className="w-full h-12 rounded-xl text-base font-bold shadow-md active:scale-[0.99]"
        >
          Pay {formatCurrency(total)}
        </Button>
      </div>
    </div>
  );
}