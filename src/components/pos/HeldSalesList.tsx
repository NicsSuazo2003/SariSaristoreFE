import { useState } from 'react';
import { Pause, Trash2, Play, X, User, AlertCircle, ShoppingBag } from 'lucide-react';
import { useHeldStore } from '@/stores/heldStore';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function HeldSalesList() {
  const isMobile = useIsMobile();
  const heldSales = useHeldStore((s) => s.heldSales);
  const resume = useHeldStore((s) => s.resume);
  const remove = useHeldStore((s) => s.remove);
  const setHeldListOpen = useUIStore((s) => s.setHeldListOpen);
  const clearCart = useCartStore((s) => s.clear);
  const addToCart = useCartStore((s) => s.add);
  const currentCartCount = useCartStore((s) => s.getItemCount());

  const [confirmResumeId, setConfirmResumeId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const triggerHaptic = (ms = 20) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };

  const handleResume = (id: string) => {
    // If cart has active items, require double-tap confirmation BEFORE modifying stores
    if (currentCartCount > 0 && confirmResumeId !== id) {
      setConfirmResumeId(id);
      setConfirmDeleteId(null);
      triggerHaptic(30);
      return;
    }

    const sale = resume(id);
    if (!sale) return;

    clearCart();
    sale.items.forEach((item) => addToCart(item.product, item.qty));
    setHeldListOpen(false);
    setConfirmResumeId(null);
    triggerHaptic(40);
    toast.success(`Resumed: ${sale.label}`);
  };

  const handleRemove = (id: string, label: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setConfirmResumeId(null);
      triggerHaptic(20);
      return;
    }

    remove(id);
    setConfirmDeleteId(null);
    triggerHaptic(30);
    toast.info(`Removed ${label}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center animate-in fade-in duration-150 select-none"
      onClick={() => setHeldListOpen(false)}
    >
      <div
        className={cn(
          'bg-card w-full sm:max-w-md flex flex-col overflow-hidden shadow-2xl transition-all',
          isMobile
            ? 'rounded-t-3xl max-h-[85dvh] pb-[max(1rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-200'
            : 'rounded-2xl max-h-[80vh]'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile grab handle */}
        {isMobile && (
          <div className="w-12 h-1 bg-muted-foreground/25 rounded-full mx-auto mt-2.5 shrink-0" />
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Pause className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">Parked Sales</h2>
              <p className="text-[11px] text-muted-foreground">
                {heldSales.length} {heldSales.length === 1 ? 'sale' : 'sales'} on hold
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setHeldListOpen(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted active:scale-90"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Warning banner if resuming will overwrite current cart */}
        {currentCartCount > 0 && heldSales.length > 0 && (
          <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 shrink-0">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Active cart has items. Resuming a sale replaces them.</span>
          </div>
        )}

        {/* Scrollable list of held sales */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {heldSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground/60">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">No parked sales</p>
              <p className="text-xs max-w-[220px]">
                Use the "Hold" button in the cart panel to park an order while a customer gets more items.
              </p>
            </div>
          ) : (
            heldSales.map((sale) => {
              const total = sale.items.reduce((s, i) => s + i.product.price * i.qty, 0);
              const itemCount = sale.items.reduce((s, i) => s + i.qty, 0);
              const isConfirmingResume = confirmResumeId === sale.id;
              const isConfirmingDelete = confirmDeleteId === sale.id;

              return (
                <div
                  key={sale.id}
                  className={cn(
                    'p-3.5 rounded-2xl border transition-all space-y-2 bg-background',
                    isConfirmingResume
                      ? 'border-primary ring-1 ring-primary/30'
                      : isConfirmingDelete
                        ? 'border-destructive ring-1 ring-destructive/30'
                        : 'border-border'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-foreground truncate">
                        {sale.label}
                      </div>
                      <div className="text-xs text-muted-foreground tabular-nums mt-0.5">
                        {itemCount} {itemCount === 1 ? 'item' : 'items'} ·{' '}
                        <span className="font-semibold text-foreground">{formatCurrency(total)}</span>
                      </div>
                    </div>

                    {/* Quick action buttons with ample tap targets */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleResume(sale.id)}
                        className={cn(
                          'h-9 px-3 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs',
                          isConfirmingResume
                            ? 'bg-primary text-primary-foreground animate-pulse'
                            : 'bg-primary/10 text-primary hover:bg-primary/20'
                        )}
                        aria-label="Resume sale"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>{isConfirmingResume ? 'Confirm Replace' : 'Resume'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemove(sale.id, sale.label)}
                        className={cn(
                          'h-9 px-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center active:scale-95',
                          isConfirmingDelete
                            ? 'bg-destructive text-destructive-foreground animate-pulse'
                            : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                        )}
                        aria-label="Delete held sale"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Confirmation Hints */}
                  {isConfirmingResume && (
                    <div className="text-[11px] text-primary font-medium bg-primary/5 px-2.5 py-1.5 rounded-lg border border-primary/20">
                      Tap Resume again to replace the {currentCartCount} item(s) in your cart.
                    </div>
                  )}

                  {isConfirmingDelete && (
                    <div className="text-[11px] text-destructive font-medium bg-destructive/5 px-2.5 py-1.5 rounded-lg border border-destructive/20">
                      Tap the trash icon again to permanently discard this sale.
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}