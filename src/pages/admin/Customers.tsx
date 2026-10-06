import { useState } from 'react';
import { 
  Plus, Search, Pencil, Trash2, X, Star, 
  Banknote, Phone, Users, Check, ArrowRight 
} from 'lucide-react';
import { 
  useCustomers, useCreateCustomer, useUpdateCustomer, 
  useDeleteCustomer, useToggleShortcut, useRecordPayment 
} from '@/hooks/useCustomers';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/utils/format';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Customer } from '@/types';

export function Customers() {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Customer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [payCustomer, setPayCustomer] = useState<Customer | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: customers, isLoading } = useCustomers({ search: search || undefined });
  const createCust = useCreateCustomer();
  const updateCust = useUpdateCustomer();
  const deleteCust = useDeleteCustomer();
  const toggleShortcut = useToggleShortcut();
  const recordPayment = useRecordPayment();

  // Haptic feedback helper supporting both single ms and pattern arrays
  const triggerHaptic = (pattern: number | number[] = 20) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        (navigator.vibrate as any)(pattern);
      } catch {}
    }
  };

  const handleOpenAdd = () => {
    setEditing(null);
    setShowForm(true);
    triggerHaptic(15);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditing(c);
    setShowForm(true);
    triggerHaptic(15);
  };

  const handleSave = async (data: Partial<Customer>) => {
    try {
      if (editing) {
        await updateCust.mutateAsync({ id: editing.id, ...data });
        toast.success(`Customer "${data.name}" updated`);
      } else {
        await createCust.mutateAsync(data);
        toast.success(`Customer "${data.name}" created`);
      }
      setShowForm(false);
      setEditing(null);
      triggerHaptic(30);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save customer');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      triggerHaptic(20);
      return;
    }

    try {
      await deleteCust.mutateAsync(id);
      setConfirmDeleteId(null);
      triggerHaptic(30);
      toast.info(`Deleted ${name}`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete customer');
    }
  };

  const totalOutstanding = (customers || []).reduce((s, c) => s + c.balance, 0);

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-border shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">Customers</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {customers?.length || 0} accounts ·{' '}
            <span className={cn('font-bold', totalOutstanding > 0 ? 'text-warning' : 'text-success')}>
              {formatCurrency(totalOutstanding)} utang
            </span>
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="h-11 px-4 rounded-xl text-xs sm:text-sm font-bold shadow-sm active:scale-95"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Customer
        </Button>
      </div>

      {/* Search Input */}
      <div className="py-3 shrink-0">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer name or phone..."
            className="pl-10 h-11 text-base sm:text-sm rounded-xl bg-background border-input shadow-2xs"
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
      </div>

      {/* Customer List */}
      <div className="flex-1 overflow-y-auto pb-4 space-y-2.5">
        {isLoading ? (
          <div className="text-center py-16 text-sm text-muted-foreground">
            Loading customers...
          </div>
        ) : (customers || []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground/60">
              <Users className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {search ? `No customers matching "${search}"` : 'No customers recorded'}
              </p>
              <p className="text-xs max-w-[240px]">
                Add customer profiles to track store credit (utang) and pin shortcut accounts.
              </p>
            </div>
            {!search && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenAdd}
                className="rounded-xl mt-2 text-xs font-semibold"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add First Customer
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {(customers || []).map((c) => {
              const isConfirmingDelete = confirmDeleteId === c.id;

              return (
                <Card
                  key={c.id}
                  className={cn(
                    'p-3.5 flex items-center gap-3 rounded-2xl border transition-all bg-card shadow-2xs',
                    isConfirmingDelete ? 'border-destructive ring-1 ring-destructive/30' : 'border-border'
                  )}
                >
                  {/* Shortcut Pin Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      toggleShortcut.mutate({ id: c.id, isShortcut: !c.is_shortcut });
                      triggerHaptic(15);
                    }}
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 active:scale-90',
                      c.is_shortcut
                        ? 'bg-warning/15 text-warning font-bold'
                        : 'bg-secondary/70 text-muted-foreground hover:text-warning'
                    )}
                    aria-label={c.is_shortcut ? 'Remove shortcut' : 'Tag as shortcut'}
                  >
                    <Star className={cn('h-4.5 w-4.5', c.is_shortcut && 'fill-warning')} />
                  </button>

                  {/* Customer Details */}
                  <div className="flex-1 min-w-0 select-text">
                    <div className="text-sm font-bold text-foreground truncate">
                      {c.name}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      {c.phone ? (
                        <a
                          href={`tel:${c.phone}`}
                          className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1 leading-none"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="h-3 w-3" />
                          <span>{c.phone}</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/60 italic">No phone</span>
                      )}
                    </div>

                    <div className="mt-1">
                      <span className={cn(
                        'text-xs font-extrabold tabular-nums',
                        c.balance > 0 ? 'text-warning' : 'text-success'
                      )}>
                        {c.balance > 0 ? `Utang: ${formatCurrency(c.balance)}` : 'No Balance'}
                      </span>
                    </div>

                    {isConfirmingDelete && (
                      <span className="text-[11px] text-destructive font-medium block mt-1 animate-pulse">
                        Tap trash again to confirm delete
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Record Payment Button */}
                    {c.balance > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setPayCustomer(c);
                          triggerHaptic(20);
                        }}
                        className="w-10 h-10 rounded-xl bg-success/15 text-success hover:bg-success/25 active:scale-90 transition-all flex items-center justify-center shadow-2xs font-semibold"
                        title="Record Payment"
                        aria-label={`Record payment for ${c.name}`}
                      >
                        <Banknote className="h-4.5 w-4.5" />
                      </button>
                    )}

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(c)}
                      className="w-9 h-9 rounded-xl bg-secondary/80 hover:bg-secondary active:scale-90 transition-all flex items-center justify-center text-muted-foreground hover:text-foreground"
                      aria-label={`Edit ${c.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    {/* Delete with inline confirmation */}
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id, c.name)}
                      className={cn(
                        'w-9 h-9 rounded-xl transition-all flex items-center justify-center active:scale-90',
                        isConfirmingDelete
                          ? 'bg-destructive text-destructive-foreground animate-pulse shadow-xs'
                          : 'bg-secondary/80 hover:bg-destructive/10 text-muted-foreground hover:text-destructive'
                      )}
                      aria-label={`Delete ${c.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer Form Sheet */}
      {showForm && (
        <CustomerForm
          customer={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
          saving={createCust.isPending || updateCust.isPending}
        />
      )}

      {/* Utang Repayment Sheet */}
      {payCustomer && (
        <PaymentForm
          customer={payCustomer}
          onClose={() => setPayCustomer(null)}
          onConfirm={async (amount) => {
            try {
              await recordPayment.mutateAsync({ customerId: payCustomer.id, amount });
              triggerHaptic([30, 40]);
              toast.success(`Payment of ${formatCurrency(amount)} recorded`);
              setPayCustomer(null);
            } catch (e: any) {
              toast.error(e?.message || 'Failed to record payment');
            }
          }}
          saving={recordPayment.isPending}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CUSTOMER ADD/EDIT BOTTOM SHEET
// ─────────────────────────────────────────────────────────────
function CustomerForm({
  customer,
  onSave,
  onClose,
  saving,
}: {
  customer: Customer | null;
  onSave: (data: Partial<Customer>) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const isMobile = useIsMobile();
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');

  const handleSubmit = () => {
    if (!name.trim() || saving) return;
    onSave({
      name: name.trim(),
      phone: phone.trim() || null,
    });
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
          <h2 className="font-bold text-base text-foreground">
            {customer ? 'Edit Customer' : 'New Customer Profile'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted active:scale-90"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-3.5">
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Customer Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aling Nena, Kuya Jun"
              autoFocus
              className="h-12 text-base rounded-xl font-medium"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Contact / Mobile Number (Optional)
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 09171234567"
              type="tel"
              inputMode="tel"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="h-12 text-base rounded-xl font-mono"
            />
          </div>

          <div className="flex gap-2 pt-2">
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
              onClick={handleSubmit}
              disabled={!name.trim() || saving}
              className="flex-1 h-12 rounded-xl text-xs font-bold shadow-sm active:scale-[0.99]"
            >
              {saving ? 'Saving...' : (
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4" />
                  Save
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
// RECORD PAYMENT (UTANG REPAYMENT) BOTTOM SHEET
// ─────────────────────────────────────────────────────────────
function PaymentForm({
  customer,
  onClose,
  onConfirm,
  saving,
}: {
  customer: Customer;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  saving: boolean;
}) {
  const isMobile = useIsMobile();
  const [amount, setAmount] = useState(customer.balance.toString());

  const parsedAmount = parseFloat(amount) || 0;
  const remainingBalance = Math.max(0, customer.balance - parsedAmount);
  const changeAmount = Math.max(0, parsedAmount - customer.balance);

  // Quick payment presets capped intelligently
  const presets = [
    { label: 'Full Balance', value: customer.balance },
    { label: '₱50', value: 50 },
    { label: '₱100', value: 100 },
    { label: '₱200', value: 200 },
    { label: '₱500', value: 500 },
  ].filter((p) => p.value <= customer.balance || p.label === 'Full Balance');

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
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-success/15 flex items-center justify-center text-success">
              <Banknote className="h-4 w-4" />
            </div>
            <h2 className="font-bold text-base text-foreground">Record Utang Payment</h2>
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
          {/* Customer Balance Banner */}
          <div className="p-3.5 rounded-2xl bg-warning/10 border border-warning/20 text-center">
            <div className="text-xs font-bold text-muted-foreground">{customer.name}</div>
            <div className="text-2xl font-black text-warning tabular-nums mt-0.5">
              {formatCurrency(customer.balance)}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase font-semibold">Current Utang</div>
          </div>

          {/* Quick Amount Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Quick Settle Presets
            </span>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAmount(p.value.toString())}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border shrink-0 transition-transform active:scale-95',
                    parsedAmount === p.value
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-secondary border-border text-foreground hover:bg-secondary/80'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Amount Received (PHP)
            </label>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              autoFocus
              className="h-12 text-lg font-bold font-mono rounded-xl"
            />
          </div>

          {/* Ledger Calculation Display */}
          <div className="space-y-1 p-3 rounded-xl bg-muted/40 border border-border text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Remaining Utang:</span>
              <span className={cn('font-black text-sm tabular-nums', remainingBalance === 0 ? 'text-success' : 'text-warning')}>
                {formatCurrency(remainingBalance)}
              </span>
            </div>
            {changeAmount > 0 && (
              <div className="flex justify-between items-center pt-1 border-t border-border/60">
                <span className="text-success font-semibold">Change to Return:</span>
                <span className="font-black text-sm text-success tabular-nums">
                  {formatCurrency(changeAmount)}
                </span>
              </div>
            )}
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
              onClick={() => onConfirm(parsedAmount)}
              disabled={saving || parsedAmount <= 0}
              className="flex-1 h-12 rounded-xl text-xs font-bold shadow-sm active:scale-[0.99]"
            >
              {saving ? 'Processing...' : (
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4" />
                  Confirm Payment
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}