import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, Printer, Share2, Check, Copy, 
  RotateCcw, Sparkles 
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Sale, SaleItem } from '@/types';

export function ReceiptView() {
  const isMobile = useIsMobile();
  const receiptData = useUIStore((s) => s.receiptData);
  const setReceiptData = useUIStore((s) => s.setReceiptData);
  const [copied, setCopied] = useState(false);

  if (!receiptData) return null;

  const sale = receiptData as Sale & { sale_items: SaleItem[]; storeName?: string };
  const storeTitle = sale.storeName || 'Sari-Sari Store';
  const receiptContent = `${storeTitle}|${sale.receipt_no}|${sale.total_amount}|${sale.created_at}`;
  const paymentLabel = sale.payment_method.charAt(0).toUpperCase() + sale.payment_method.slice(1);
  const isUtang = sale.payment_method === 'utang';

  // Build clean text receipt for digital sharing (SMS, Messenger, Viber, WhatsApp)
  const buildShareText = () => {
    const itemsList = (sale.sale_items || [])
      .map((i) => `• ${i.product_name} x${i.qty} = ${formatCurrency(i.subtotal)}`)
      .join('\n');

    let text = `🧾 ${storeTitle.toUpperCase()}\n`;
    text += `Receipt No: ${sale.receipt_no}\n`;
    text += `Date: ${formatDateTime(sale.created_at)}\n`;
    text += `--------------------------------\n`;
    text += `${itemsList}\n`;
    text += `--------------------------------\n`;
    if (sale.discount > 0) {
      text += `Discount: -${formatCurrency(sale.discount)}\n`;
    }
    text += `TOTAL: ${formatCurrency(sale.total_amount)}\n`;
    text += `Payment: ${paymentLabel}\n`;
    if (!isUtang) {
      text += `Paid: ${formatCurrency(sale.amount_paid)}\n`;
      text += `Change: ${formatCurrency(sale.change_amount)}\n`;
    } else {
      text += `Status: Utang (Unpaid)\n`;
    }
    text += `\nThank you for your purchase!`;
    return text;
  };

  const handleShare = async () => {
    const receiptText = buildShareText();

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Receipt #${sale.receipt_no}`,
          text: receiptText,
        });
        return;
      } catch {
        // User cancelled or share failed, proceed to fallback
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(receiptText);
      setCopied(true);
      toast.success('Receipt copied to clipboard for sharing!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Failed to copy receipt');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    setReceiptData(null);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center animate-in fade-in duration-150 no-print select-none"
      onClick={handleClose}
    >
      <div 
        className={cn(
          'bg-card w-full sm:max-w-sm flex flex-col overflow-hidden shadow-2xl transition-all',
          isMobile
            ? 'rounded-t-3xl max-h-[92dvh] pb-[max(1rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-200'
            : 'rounded-2xl max-h-[90vh]'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile grab handle */}
        {isMobile && (
          <div className="w-12 h-1 bg-muted-foreground/25 rounded-full mx-auto mt-2.5 shrink-0" />
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-success/15 flex items-center justify-center text-success">
              <Check className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">Sale Complete</h2>
              <p className="text-[11px] text-muted-foreground">Receipt #{sale.receipt_no}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleClose} 
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted active:scale-90"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Thermal / Paper Receipt Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 select-text">
          <div className="print-receipt bg-background p-5 rounded-2xl border border-dashed border-border shadow-xs text-center">
            {/* Store Name & Timestamp */}
            <div className="font-extrabold text-base tracking-tight text-foreground">{storeTitle}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{formatDateTime(sale.created_at)}</div>

            {/* Receipt Meta */}
            <div className="border-t border-b border-dashed border-border/80 py-2.5 my-3 text-left space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Receipt No:</span>
                <span className="font-mono font-medium text-foreground">{sale.receipt_no}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Payment Method:</span>
                <span className={cn(
                  'font-semibold',
                  isUtang ? 'text-warning' : 'text-foreground'
                )}>
                  {paymentLabel}
                </span>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2 py-1 text-left">
              {(sale.sale_items || []).map((item) => (
                <div key={item.id} className="flex justify-between items-start text-xs sm:text-sm">
                  <div className="flex-1 min-w-0 pr-2">
                    <span className="font-medium text-foreground truncate block leading-tight">
                      {item.product_name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {item.qty} × {formatCurrency(item.unit_price || item.subtotal / item.qty)}
                    </span>
                  </div>
                  <span className="tabular-nums font-bold text-foreground shrink-0">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="border-t border-dashed border-border/80 pt-2.5 mt-2.5 space-y-1 text-xs">
              {sale.discount > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Discount</span>
                  <span className="tabular-nums font-semibold">-{formatCurrency(sale.discount)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-baseline font-extrabold text-base pt-1">
                <span className="text-foreground">Total</span>
                <span className="tabular-nums text-primary text-lg">{formatCurrency(sale.total_amount)}</span>
              </div>

              {!isUtang ? (
                <>
                  <div className="flex justify-between text-muted-foreground pt-1">
                    <span>Tendered</span>
                    <span className="tabular-nums font-medium">{formatCurrency(sale.amount_paid)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Change</span>
                    <span className="tabular-nums font-bold text-success">{formatCurrency(sale.change_amount)}</span>
                  </div>
                </>
              ) : (
                <div className="p-2 rounded-xl bg-warning/10 border border-warning/20 text-warning text-center text-xs font-bold mt-2">
                  CHARGED TO UTANG ACCOUNT
                </div>
              )}
            </div>

            {/* QR Code Verification */}
            <div className="flex flex-col items-center justify-center mt-5 pt-3 border-t border-dashed border-border">
              <div className="p-2 bg-white rounded-xl shadow-xs border border-border">
                <QRCodeSVG value={receiptContent} size={110} level="M" />
              </div>
              <span className="text-[10px] text-muted-foreground tracking-wide mt-2">
                Scan QR to verify authentic receipt
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 border-t border-border bg-card flex flex-col gap-2 shrink-0 no-print select-none">
          <div className="flex gap-2">
            <Button 
              type="button"
              variant="outline" 
              onClick={handleShare} 
              className="flex-1 rounded-xl h-11 text-xs font-bold"
            >
              {copied ? <Check className="h-4 w-4 mr-1.5 text-success" /> : <Share2 className="h-4 w-4 mr-1.5" />}
              {copied ? 'Copied!' : 'Share Slip'}
            </Button>

            <Button 
              type="button"
              variant="outline" 
              onClick={handlePrint} 
              className="flex-1 rounded-xl h-11 text-xs font-bold"
            >
              <Printer className="h-4 w-4 mr-1.5" />
              Print
            </Button>
          </div>

          <Button 
            type="button"
            onClick={handleClose} 
            className="w-full rounded-xl h-12 text-sm font-bold shadow-md active:scale-[0.99]"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Start Next Sale
          </Button>
        </div>
      </div>
    </div>
  );
}