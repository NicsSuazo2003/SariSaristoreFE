import { useRef, useEffect } from 'react';
import { ShoppingCart, Banknote } from 'lucide-react';
import { ProductArea } from '@/components/pos/ProductArea';
import { CartPanel } from '@/components/pos/CartPanel';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { ReceiptView } from '@/components/pos/ReceiptView';
import { HeldSalesList } from '@/components/pos/HeldSalesList';
import { ScannerModal } from '@/components/pos/ScannerModal';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useCartStore } from '@/stores/cartStore';
import { useHeldStore } from '@/stores/heldStore';
import { useUIStore } from '@/stores/uiStore';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function POS() {
  const isMobile = useIsMobile();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const cartOpen = useUIStore((s) => s.cartOpen);
  const paymentOpen = useUIStore((s) => s.paymentOpen);
  const scannerOpen = useUIStore((s) => s.scannerOpen);
  const heldListOpen = useUIStore((s) => s.heldListOpen);
  const receiptData = useUIStore((s) => s.receiptData);
  const setCartOpen = useUIStore((s) => s.setCartOpen);
  const setPaymentOpen = useUIStore((s) => s.setPaymentOpen);

  const items = useCartStore((s) => s.items);
  const getTotal = useCartStore((s) => s.getTotal);
  const getItemCount = useCartStore((s) => s.getItemCount);
  const clear = useCartStore((s) => s.clear);
  const hold = useHeldStore((s) => s.hold);

  const total = getTotal();
  const count = getItemCount();

  const triggerHaptic = (ms = 25) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };

  // Desktop keyboard shortcuts (F1 = Pay, F4 = Hold, F5 = Clear, Esc = Close Modal)
  useEffect(() => {
    if (isMobile) return;

    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'F1') {
        e.preventDefault();
        if (items.length > 0) setPaymentOpen(true);
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (items.length > 0) {
          const timestamp = new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
          hold(`Sale ${timestamp}`, items, null);
          clear();
          toast.success('Sale held');
        }
      } else if (e.key === 'F5') {
        e.preventDefault();
        if (items.length > 0) {
          clear();
          toast.info('Cart cleared');
        }
      } else if (e.key === 'Escape') {
        if (paymentOpen) setPaymentOpen(false);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isMobile, items, paymentOpen, setPaymentOpen, hold, clear]);

  // ─────────────────────────────────────────────────────────────
  // MOBILE VIEW
  // ─────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="flex flex-col h-full w-full overflow-hidden select-none relative">
        {/* Main Product Catalog Area */}
        <div className="flex-1 overflow-hidden pb-16">
          <ProductArea searchInputRef={searchInputRef} />
        </div>

        {/* Anchored Bottom Checkout Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border px-3.5 py-2.5 flex items-center justify-between gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] z-30">
          {/* Quick Cart Drawer Trigger */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              setCartOpen(true);
            }}
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

          {/* Quick Pay Action */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic(30);
              setPaymentOpen(true);
            }}
            disabled={count === 0}
            className={cn(
              'h-12 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm shrink-0',
              count > 0
                ? 'bg-primary text-primary-foreground shadow-primary/25 active:brightness-95'
                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
            )}
          >
            <Banknote className="h-5 w-5" />
            <span>Pay</span>
          </button>
        </div>

        {/* Dynamic Modals & Drawers */}
        {cartOpen && <CartPanel variant="mobile" />}
        {paymentOpen && <PaymentModal />}
        {scannerOpen && <ScannerModal />}
        {heldListOpen && <HeldSalesList />}
        {receiptData && <ReceiptView />}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // DESKTOP / TABLET LANDSCAPE VIEW
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full w-full overflow-hidden relative">
      <div className="flex-1 overflow-hidden">
        <ProductArea searchInputRef={searchInputRef} />
      </div>

      <CartPanel variant="desktop" />

      {/* Desktop Hotkey Badges */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 hidden xl:flex items-center gap-4 text-xs text-muted-foreground bg-card/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-border shadow-sm pointer-events-none">
        <span><kbd className="font-mono bg-muted px-1.5 py-0.5 rounded text-[11px] mr-1">F1</kbd>Pay</span>
        <span><kbd className="font-mono bg-muted px-1.5 py-0.5 rounded text-[11px] mr-1">F4</kbd>Hold</span>
        <span><kbd className="font-mono bg-muted px-1.5 py-0.5 rounded text-[11px] mr-1">F5</kbd>Clear</span>
        <span><kbd className="font-mono bg-muted px-1.5 py-0.5 rounded text-[11px] mr-1">/</kbd>Search</span>
        <span><kbd className="font-mono bg-muted px-1.5 py-0.5 rounded text-[11px] mr-1">Esc</kbd>Close</span>
      </div>

      {/* Modals */}
      {paymentOpen && <PaymentModal />}
      {scannerOpen && <ScannerModal />}
      {heldListOpen && <HeldSalesList />}
      {receiptData && <ReceiptView />}
    </div>
  );
}