import { useState, useMemo } from 'react';
import { 
  X, Ban, Eye, Search, Receipt, ArrowRight, 
  RotateCcw, Share2, Check, AlertTriangle, Calendar 
} from 'lucide-react';
import { useSales, useSale, useVoidSale } from '@/hooks/useSales';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDateTime, formatRelativeDate } from '@/utils/format';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Sale } from '@/types';

type FilterType = 'all' | 'cash' | 'gcash' | 'utang' | 'voided';

export function Sales() {
  const isMobile = useIsMobile();
  const { data: sales, isLoading } = useSales();
  const voidSale = useVoidSale();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [viewing, setViewing] = useState<string | null>(null);
  const { data: saleDetail } = useSale(viewing);

  const [confirmVoidId, setConfirmVoidId] = useState<string | null>(null);

  const triggerHaptic = (pattern: number | number[] = 20) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        (navigator.vibrate as any)(pattern);
      } catch {}
    }
  };

  const filteredSales = useMemo(() => {
    if (!sales) return [];
    const q = search.trim().toLowerCase();

    return (sales as Sale[]).filter((s) => {
      // Payment / Void Status Filter
      if (filter === 'voided' && !s.is_voided) return false;
      if (filter !== 'all' && filter !== 'voided') {
        if (s.is_voided || s.payment_method?.toLowerCase() !== filter) return false;
      }

      // Search Query
      if (q) {
        const matchesReceipt = s.receipt_no.toLowerCase().includes(q);
        const matchesMethod = s.payment_method.toLowerCase().includes(q);
        const matchesAmount = s.total_amount.toString().includes(q);
        return matchesReceipt || matchesMethod || matchesAmount;
      }

      return true;
    });
  }, [sales, search, filter]);

  const handleExecuteVoid = async (id: string) => {
    try {
      await voidSale.mutateAsync(id);
      triggerHaptic([40, 50]);
      toast.info('Sale voided & inventory restored');
      setConfirmVoidId(null);
      setViewing(null);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to void sale');
    }
  };

  const handleShareReceipt = async (sale: any) => {
    const text = `🧾 RECEIPT #${sale.receipt_no}\nTotal: ${formatCurrency(sale.total_amount)}\nDate: ${formatDateTime(sale.created_at)}\nPayment: ${sale.payment_method.toUpperCase()}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: `Receipt ${sale.receipt_no}`, text });
        return;
      } catch {}
    }
    navigator.clipboard.writeText(text);
    toast.success('Receipt summary copied to clipboard');
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 overflow-hidden select-none pb-[calc(4rem+env(safe-area-inset-bottom,0px))]">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-border shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">Sales History</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {sales?.length || 0} recorded orders
          </p>
        </div>
      </div>

      {/* Search Bar & Filter Chips */}
      <div className="py-2.5 space-y-2 shrink-0">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by receipt # or amount..."
            className="pl-10 pr-9 h-11 text-base sm:text-sm rounded-xl bg-background border-input shadow-2xs font-mono sm:font-sans"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:bg-muted rounded-md"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 touch-pan-x">
          {[
            { key: 'all', label: 'All Orders' },
            { key: 'cash', label: 'Cash' },
            { key: 'gcash', label: 'GCash / Maya' },
            { key: 'utang', label: 'Utang' },
            { key: 'voided', label: 'Voided' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setFilter(item.key as FilterType);
                triggerHaptic(10);
              }}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border shrink-0 transition-all active:scale-95',
                filter === item.key
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-secondary border-border text-foreground hover:bg-secondary/80'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sales List */}
      <div className="flex-1 overflow-y-auto pb-4 space-y-2">
        {isLoading ? (
          <div className="text-center py-16 text-sm text-muted-foreground animate-pulse">
            Loading sales log...
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground/60">
              <Receipt className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">No transactions found</p>
            <p className="text-xs max-w-[220px]">
              {search ? 'Try adjusting your search criteria.' : 'Transactions will appear here as you make sales.'}
            </p>
          </div>
        ) : (
          filteredSales.map((sale) => {
            const isVoid = sale.is_voided;
            const isCash = sale.payment_method === 'cash';
            const isUtang = sale.payment_method === 'utang';

            return (
              <Card
                key={sale.id}
                onClick={() => {
                  setViewing(sale.id);
                  triggerHaptic(15);
                }}
                className={cn(
                  'p-3.5 flex items-center gap-3 rounded-2xl border transition-all cursor-pointer bg-card shadow-2xs hover:border-primary/50 active:scale-[0.99]',
                  isVoid && 'opacity-60 bg-muted/30 border-dashed'
                )}
              >
                {/* Payment Method Badge */}
                <div
                  className={cn(
                    'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-xs uppercase',
                    isVoid
                      ? 'bg-muted text-muted-foreground'
                      : isCash
                        ? 'bg-success/15 text-success'
                        : isUtang
                          ? 'bg-warning/15 text-warning'
                          : 'bg-primary/15 text-primary'
                  )}
                >
                  {isVoid ? 'VOID' : sale.payment_method.slice(0, 3)}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 select-text">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-mono text-foreground truncate">
                      {sale.receipt_no}
                    </span>
                    {isVoid && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-destructive/15 text-destructive uppercase">
                        Voided
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {formatRelativeDate(sale.created_at)} ·{' '}
                    <span className="capitalize">{sale.payment_method}</span>
                  </div>
                </div>

                {/* Amount & Inspection Action */}
                <div className="text-right shrink-0">
                  <div className={cn(
                    'text-sm sm:text-base font-extrabold tabular-nums',
                    isVoid ? 'line-through text-muted-foreground' : 'text-foreground'
                  )}>
                    {formatCurrency(sale.total_amount)}
                  </div>
                  <div className="text-[10px] text-primary flex items-center justify-end gap-0.5 mt-0.5 font-semibold">
                    <span>View</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Sale Detail / Receipt Bottom Sheet */}
      {viewing && saleDetail && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center animate-in fade-in duration-150 select-none"
          onClick={() => {
            setViewing(null);
            setConfirmVoidId(null);
          }}
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

            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
              <div>
                <h2 className="font-bold text-base text-foreground font-mono">
                  Receipt #{saleDetail.receipt_no}
                </h2>
                <p className="text-xs text-muted-foreground">{formatDateTime(saleDetail.created_at)}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setViewing(null);
                  setConfirmVoidId(null);
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted active:scale-90"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Receipt Content */}
            <div className="p-5 space-y-4 flex-1 overflow-y-auto select-text">
              {saleDetail.is_voided && (
                <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold text-center flex items-center justify-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>This transaction has been voided.</span>
                </div>
              )}

              {/* Items Table */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Purchased Items
                </div>
                <div className="divide-y divide-border/60 rounded-xl border border-border bg-background p-2">
                  {(saleDetail as any).sale_items?.map((item: any) => (
                    <div key={item.id} className="py-2 flex justify-between items-start text-xs sm:text-sm first:pt-1 last:pb-1">
                      <div className="flex-1 pr-2">
                        <div className="font-bold text-foreground leading-tight">{item.product_name}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {item.qty} × {formatCurrency(item.unit_price || item.subtotal / item.qty)}
                        </div>
                      </div>
                      <span className="tabular-nums font-bold text-foreground shrink-0">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Breakdowns */}
              <div className="p-3 rounded-xl bg-secondary/60 border border-border space-y-1.5 text-xs">
                {saleDetail.discount > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>Discount</span>
                    <span className="tabular-nums font-bold">-{formatCurrency(saleDetail.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline font-black text-base pt-0.5">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary tabular-nums text-lg">{formatCurrency(saleDetail.total_amount)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground pt-1 border-t border-border/80">
                  <span>Payment Mode:</span>
                  <span className="font-bold uppercase text-foreground">{saleDetail.payment_method}</span>
                </div>
                {saleDetail.payment_method !== 'utang' && (
                  <>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tendered:</span>
                      <span className="tabular-nums font-medium">{formatCurrency(saleDetail.amount_paid)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Change:</span>
                      <span className="tabular-nums font-bold text-success">{formatCurrency(saleDetail.change_amount)}</span>
                    </div>
                  </>
                )}
                {saleDetail.note && (
                  <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                    {saleDetail.note}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-border flex flex-col gap-2 shrink-0">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleShareReceipt(saleDetail)}
                  className="flex-1 h-12 rounded-xl text-xs font-bold active:scale-95"
                >
                  <Share2 className="h-4 w-4 mr-1.5" />
                  Share Slip
                </Button>

                {!saleDetail.is_voided && (
                  <Button
                    type="button"
                    variant={confirmVoidId === saleDetail.id ? 'destructive' : 'outline'}
                    onClick={() => {
                      if (confirmVoidId === saleDetail.id) {
                        handleExecuteVoid(saleDetail.id);
                      } else {
                        setConfirmVoidId(saleDetail.id);
                        triggerHaptic(20);
                      }
                    }}
                    className={cn(
                      'flex-1 h-12 rounded-xl text-xs font-bold active:scale-95 transition-all',
                      confirmVoidId !== saleDetail.id && 'text-destructive hover:bg-destructive/10 border-destructive/30'
                    )}
                  >
                    <Ban className="h-4 w-4 mr-1.5" />
                    {confirmVoidId === saleDetail.id ? 'Confirm Void?' : 'Void Order'}
                  </Button>
                )}
              </div>

              {confirmVoidId === saleDetail.id && (
                <p className="text-[11px] text-destructive text-center font-medium animate-pulse">
                  Voiding will restore stock counts and cannot be undone. Tap again to execute.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}