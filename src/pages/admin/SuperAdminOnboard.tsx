import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ArrowLeft, Check, Copy, Store, User, KeyRound } from 'lucide-react';
import { useCreateStore } from '@/hooks/useAdmin';
import { toast } from 'sonner';
import type { CreateStoreResponse } from '@/types';

export function SuperAdminOnboard() {
  const navigate = useNavigate();
  const createStore = useCreateStore();

  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPin, setOwnerPin] = useState('');
  const [created, setCreated] = useState<CreateStoreResponse | null>(null);

  const canSubmit =
    storeName.trim().length >= 2 &&
    ownerName.trim().length >= 2 &&
    /^\d{4,6}$/.test(ownerPin);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      const res = await createStore.mutateAsync({
        storeName: storeName.trim(),
        ownerName: ownerName.trim(),
        ownerPin,
      });
      setCreated(res);
    } catch {
      // toast already shown by useCreateStore hook
    }
  };

  const handleCopy = async () => {
    if (!created) return;
    await navigator.clipboard.writeText(created.storeCode);
    toast.success('Store code copied');
  };

  const handleOnboardAnother = () => {
    setCreated(null);
    setStoreName('');
    setOwnerName('');
    setOwnerPin('');
  };

  // ── Success view ─────────────────────────────
  if (created) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 p-6 md:p-8">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-4 mx-auto">
            <Check className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          </div>

          <h2 className="text-xl font-extrabold text-center text-slate-900 dark:text-slate-100 mb-1">
            Store Created
          </h2>
          <p className="text-sm text-center text-slate-600 dark:text-slate-400 mb-6">
            Give the code and PIN to the owner.
          </p>

          <div className="rounded-xl border-2 border-dashed border-emerald-400 dark:border-emerald-700 bg-white dark:bg-slate-900 p-6 text-center mb-4">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold mb-2">
              Store Code
            </div>
            <div className="text-3xl font-mono font-extrabold tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
              {created.storeCode}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy code
            </button>
          </div>

          <div className="space-y-1 text-sm text-center mb-6">
            <p className="text-slate-900 dark:text-slate-100 font-bold">
              {created.storeName}
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              Owner: {created.ownerName}
            </p>
          </div>

          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-3 text-xs text-amber-800 dark:text-amber-200 mb-6">
            <strong>Reminder:</strong> The owner will use this code + the PIN you set to log in. They should change the PIN after first login.
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleOnboardAnother}
              className="flex-1 h-11 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Onboard Another
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="flex-1 h-11 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
            >
              Back to Stores
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form view ────────────────────────────────
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <button
        type="button"
        onClick={() => navigate('/admin')}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Stores
      </button>

      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
        Onboard New Store
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
        Create a new tenant and its owner account.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Store name */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-1.5">
            Store Name
          </label>
          <div className="relative">
            <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g., Aling Nena's Sari-Sari Store"
              autoFocus
              maxLength={200}
              className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
            />
          </div>
        </div>

        {/* Owner name */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-1.5">
            Owner Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="e.g., Nena Mendez"
              maxLength={200}
              className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
            />
          </div>
        </div>

        {/* Owner PIN */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-1.5">
            Initial PIN (4-6 digits)
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              inputMode="numeric"
              value={ownerPin}
              onChange={(e) => setOwnerPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="e.g., 1234"
              maxLength={6}
              className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 font-mono tracking-widest"
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
            Share this PIN with the owner. They can change it later.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit || createStore.isPending}
          className="w-full h-12 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold inline-flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
        >
          {createStore.isPending ? (
            'Creating...'
          ) : (
            <>
              <PlusCircle className="h-4 w-4" />
              Create Store
            </>
          )}
        </button>
      </form>
    </div>
  );
}