import { useState, useEffect, useMemo } from 'react';
import { 
  Banknote, Smartphone, User as UserIcon, X, 
  Delete, Check, Copy, ArrowRight 
} from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { useCreateSale } from '@/hooks/useSales';
import { useSettings } from '@/hooks/useSettings';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { formatCurrency } from '@/utils/format';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { PaymentMethod } from '@/types';

export function PaymentModal() {
  const isMobile = useIsMobile();
  const items = useCartStore((s) => s.items);
  const customer = useCartStore((s) => s.customer);
  const discount = useCartStore((s) => s.discount);
  const paymentMethod = useCartStore((s) => s.paymentMethod);
  const setPaymentMethod = useCartStore((s) => s.setPaymentMethod);
  const getTotal = useCartStore((s) => s.getTotal);
  const clear = useCartStore((s) => s.clear);
  const setPaymentOpen = useUIStore((s) => s.setPaymentOpen);
  const setReceiptData = useUIStore((s) => s.setReceiptData);
  const createSale = useCreateSale();
  const { data: settings } = useSettings();

  const [amountPaid, setAmountPaid] = useState('');
  const [reference, setReference] = useState('');
  const [processing, setProcessing] = useState(false);

  const total = getTotal();

  useEffect(() => {
    setAmountPaid(total.toFixed(2));
  }, [total]);

  const parsedPaid = parseFloat(amountPaid) || 0;
  const change = Math.max(0, parsedPaid - total);
  const isUnderpaid = paymentMethod === 'cash' && parsedPaid < total;

  const handleKeypad = (key: string) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }

    if (key === 'del') {
      setAmountPaid((p) => p.slice(0, -1));
      return;
    }
    if (key === 'clear') {
      setAmountPaid('');
      return;
    }
    if (key === '.') {
      if (amountPaid.includes('.')) return;
      setAmountPaid((p) => (p === '' ? '0.' : p + '.'));
      return;
    }
    setAmountPaid((p) => {
      if (p === '0') return key;
      if (p.includes('.') && p.split('.')[1].length >= 2) return p;
      return p + key;
    });
  };

  // Common Philippine currency bill increments
  const quickAmounts = useMemo(() => {
    const list = [
      total,
      Math.ceil(total / 50) * 50,
      Math.ceil(total / 100) * 100,
      Math.ceil(total / 500) * 500,
      100,
      200,
      500,
      1000,
    ];
    return Array.from(new Set(list)).filter((v) => v >= total && v > 0);
  }, [total]);

  const handleCopyNumber = (num?: string | null) => {
    if (!num) return;
    navigator.clipboard.writeText(num);
    toast.success('Account number copied');
  };

  const handleConfirm = async () => {
    if (isUnderpaid) {
      toast.error('Amount paid is less than total');
      return;
    }
    if (paymentMethod === 'utang' && !customer) {
      toast.error('Select a customer for utang');
      return;
    }
    if ((paymentMethod === 'gcash' || paymentMethod === 'maya') && !reference.trim()) {
      toast.error('Enter reference number');
      return;
    }

    setProcessing(true);
    try {
      const result = await createSale.mutateAsync({
        items: items.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          qty: i.qty,
          unitPrice: i.product.price,
        })),
        customerId: customer?.id || null,
        paymentMethod,
        amountPaid: paymentMethod === 'utang' ? 0 : parsedPaid,
        discount,
        note: (paymentMethod === 'gcash' || paymentMethod === 'maya') ? `Ref: ${reference.trim()}` : null,
      });

      setPaymentOpen(false);
      setReceiptData({ ...result, storeName: settings?.store_name || 'Sari-Sari Store' });
      clear();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 30, 60]);
      }
      toast.success('Sale completed!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to process sale');
    } finally {
      setProcessing(false);
    }
  };

  const methods: { value: PaymentMethod; label: string; icon: any; color: string }[] = [
    { value: 'cash',  label: 'Cash',  icon: Banknote,   color: 'bg-success/15 border-success text-success' },
    { value: 'gcash', label: 'GCash', icon: Smartphone, color: 'bg-primary/15 border-primary text-primary' },
    { value: 'maya',  label: 'Maya',  icon: Smartphone, color: 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400' },
    { value: 'utang', label: 'Utang', icon: UserIcon,   color: 'bg-warning/15 border-warning text-warning' },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center animate-in fade-in duration-150"
      onClick={() => setPaymentOpen(false)}
    >
      <div
        className={cn(
          'bg-card w-full sm:max-w-md flex flex-col overflow-hidden shadow-2xl transition-all',
          // Mobile bottom-sheet presentation vs Desktop centered modal
          isMobile
            ? 'rounded-t-3xl max-h-[92dvh] pb-[max(1rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-200'
            : 'rounded-2xl max-h-[90vh]'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        {isMobile && (
          <div className="w-12 h-1 bg-muted-foreground/20 rounded-full mx-auto mt-2.5 shrink-0" />
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-base sm:text-lg">Checkout Payment</h2>
          </div>
          <button 
            type="button"
            onClick={() => setPaymentOpen(false)} 
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted active:scale-90"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 space-y-3.5 overflow-y-auto">
          {/* Total Banner */}
          <div className="text-center py-2.5 bg-secondary/70 rounded-2xl border border-border">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Amount Due</div>
            <div className="text-3xl font-extrabold text-primary tabular-nums tracking-tight mt-0.5">
              {formatCurrency(total)}
            </div>
            {customer && paymentMethod === 'utang' && (
              <div className="text-xs text-warning font-semibold mt-1">
                Existing Balance: {formatCurrency(customer.balance)}
              </div>
            )}
          </div>

          {/* Payment Method Selector Grid */}
          <div className="grid grid-cols-4 gap-2">
            {methods.map((m) => {
              const Icon = m.icon;
              const isSelected = paymentMethod === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(m.value);
                    if (typeof navigator !== 'undefined' && navigator.vibrate) {
                      navigator.vibrate(15);
                    }
                  }}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl border-2 transition-all active:scale-95 select-none',
                    isSelected
                      ? cn(m.color, 'shadow-xs font-bold ring-1 ring-primary/20')
                      : 'border-border bg-background text-muted-foreground hover:border-muted-foreground/40'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* CASH MODE */}
          {paymentMethod === 'cash' && (
            <div className="space-y-3">
              {/* Quick Cash Chips */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 touch-pan-x">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmountPaid(amt.toFixed(2))}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-bold tabular-nums whitespace-nowrap border shrink-0 transition-transform active:scale-95',
                      parsedPaid === amt
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-secondary border-border text-foreground hover:bg-secondary/80'
                    )}
                  >
                    {amt === total ? 'Exact' : formatCurrency(amt)}
                  </button>
                ))}
              </div>

              {/* Tendered & Change Card */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-muted/40 border border-border">
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Tendered</div>
                  <div className={cn(
                    'text-lg font-bold tabular-nums truncate',
                    isUnderpaid ? 'text-destructive' : 'text-foreground'
                  )}>
                    {formatCurrency(parsedPaid)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Change</div>
                  <div className={cn(
                    'text-lg font-bold tabular-nums truncate',
                    change > 0 ? 'text-success' : 'text-muted-foreground'
                  )}>
                    {formatCurrency(change)}
                  </div>
                </div>
              </div>

              {/* Ergonomic Mobile Keypad */}
              <div className="grid grid-cols-3 gap-1.5 select-none">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => handleKeypad(k)}
                    className="h-12 rounded-xl bg-secondary hover:bg-secondary/70 active:scale-95 active:bg-primary/20 transition-all text-lg font-bold text-foreground shadow-2xs"
                  >
                    {k}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleKeypad('.')}
                  className="h-12 rounded-xl bg-secondary hover:bg-secondary/70 active:scale-95 transition-all text-xl font-bold"
                >
                  .
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypad('0')}
                  className="h-12 rounded-xl bg-secondary hover:bg-secondary/70 active:scale-95 transition-all text-lg font-bold"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypad('del')}
                  className="h-12 rounded-xl bg-secondary hover:bg-secondary/70 active:scale-95 active:text-destructive transition-all flex items-center justify-center text-muted-foreground"
                  aria-label="Delete"
                >
                  <Delete className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* GCASH / MAYA MODE */}
          {(paymentMethod === 'gcash' || paymentMethod === 'maya') && (
            <div className="space-y-3">
              {settings && (
                <div className="p-3.5 rounded-2xl bg-secondary/70 border border-border text-center relative">
                  <div className="text-[11px] font-semibold text-muted-foreground">
                    Send to {paymentMethod === 'gcash' ? 'GCash' : 'Maya'} Account
                  </div>
                  <div className="text-xl font-bold font-mono tracking-wider mt-0.5 text-foreground">
                    {paymentMethod === 'gcash'
                      ? settings.gcash_number || 'No number set'
                      : settings.maya_number || 'No number set'}
                  </div>
                  {(settings.gcash_number || settings.maya_number) && (
                    <button
                      type="button"
                      onClick={() => handleCopyNumber(paymentMethod === 'gcash' ? settings.gcash_number : settings.maya_number)}
                      className="inline-flex items-center gap-1 text-xs text-primary font-semibold mt-1 px-2.5 py-1 rounded-lg hover:bg-primary/10 active:scale-95"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy Number
                    </button>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Reference Number (Last 4 or Full Ref)
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. 102492..."
                  /* text-base prevents iOS Safari zoom */
                  className="w-full h-12 px-4 rounded-xl border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs font-mono"
                />
              </div>
            </div>
          )}

          {/* UTANG MODE */}
          {paymentMethod === 'utang' && (
            <div className="space-y-3">
              {customer ? (
                <div className="p-4 rounded-2xl bg-warning/10 border border-warning/30 space-y-1.5">
                  <div className="text-sm font-bold text-foreground">{customer.name}</div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Current Credit:</span>
                    <span className="font-semibold tabular-nums">{formatCurrency(customer.balance)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-warning pt-1 border-t border-warning/20">
                    <span>New Total Balance:</span>
                    <span className="tabular-nums">{formatCurrency(customer.balance + total)}</span>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl border-2 border-dashed border-warning/40 text-center space-y-1">
                  <p className="text-sm font-semibold text-warning">No Customer Selected</p>
                  <p className="text-xs text-muted-foreground">
                    Please tag a customer from the Quick Shortcuts before choosing Utang.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Confirm Button */}
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={processing || (paymentMethod === 'utang' && !customer) || isUnderpaid}
            className="w-full h-13 rounded-xl text-base font-bold shadow-md active:scale-[0.99] mt-2"
          >
            {processing ? (
              'Processing Transaction...'
            ) : (
              <span className="inline-flex items-center gap-2">
                <Check className="h-5 w-5" />
                Complete Sale ({formatCurrency(total)})
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}