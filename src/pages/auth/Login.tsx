import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store, Delete, Check, RotateCcw, ArrowRight, ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Mode = 'code' | 'pin';

export function Login() {
  const navigate = useNavigate();
  const {
    unlock,
    storeName,
    storeCode: savedStoreCode,
  } = useAuthStore();

  // If a store code is already saved on this device, jump straight to PIN.
  const [mode, setMode] = useState<Mode>(savedStoreCode ? 'pin' : 'code');
  const [storeCodeInput, setStoreCodeInput] = useState(savedStoreCode || '');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  // Re-sync when savedStoreCode changes (e.g., after logout)
  useEffect(() => {
    if (savedStoreCode) {
      setStoreCodeInput(savedStoreCode);
      setMode('pin');
    }
  }, [savedStoreCode]);

  const triggerHaptic = (pattern: number | number[] = 20) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  // ── Submit PIN ─────────────────────────────────────
  const handleSubmit = useCallback(
    async (pinToSubmit?: string) => {
      const value = pinToSubmit || pin;
      if (value.length < 4 || loading) return;
      if (!storeCodeInput.trim()) {
        setError('Store code missing');
        return;
      }

      setLoading(true);
      setError('');
      try {
        await unlock(storeCodeInput.trim().toUpperCase(), value);
        triggerHaptic([30, 40, 30]);

        // ⭐ Role-based landing
        const role = useAuthStore.getState().user?.role;
        navigate(role === 'PlatformAdmin' ? '/admin' : '/pos');
      } catch (e: any) {
        triggerHaptic([60, 50, 60]);
        setError('Wrong PIN. Try again.');
        setShake(true);
        setPin('');
        setTimeout(() => setShake(false), 500);
        setTimeout(() => setError(''), 2000);
      } finally {
        setLoading(false);
      }
    },
    [pin, loading, unlock, navigate, storeCodeInput],
  );

  // ── Submit store code ─────────────────────────────
  const handleCodeSubmit = () => {
    const code = storeCodeInput.trim().toUpperCase();
    if (code.length < 4) {
      setError('Enter a valid store code');
      return;
    }
    triggerHaptic(20);
    setError('');
    setMode('pin');
  };

  // ── Keypad handler ────────────────────────────────
  const handleKey = useCallback(
    (key: string) => {
      setError('');
      if (loading) return;
      triggerHaptic(15);

      if (key === 'del') {
        setPin((p) => p.slice(0, -1));
        return;
      }
      if (key === 'clear') {
        setPin('');
        return;
      }

      setPin((prev) => {
        if (prev.length >= 6) return prev;
        const next = prev + key;
        // Auto-submit 6-digit PINs
        if (next.length === 6) {
          setTimeout(() => handleSubmit(next), 50);
        }
        return next;
      });
    },
    [loading, handleSubmit],
  );

  // ── Global keyboard listener (num pad / desktop) ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (mode !== 'pin') return;
      if (loading) return;

      if (/^[0-9]$/.test(e.key)) handleKey(e.key);
      else if (e.key === 'Backspace') handleKey('del');
      else if (e.key === 'Escape') handleKey('clear');
      else if (e.key === 'Enter' && pin.length >= 4) handleSubmit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleKey, handleSubmit, loading, pin.length, mode]);

  // ── Render ─────────────────────────────────────────
  return (
    <div className="h-[100dvh] w-full bg-gradient-to-br from-sky-50 via-background to-slate-100 flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] select-none">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-3xl shadow-xl border border-border p-6 sm:p-8">
          {/* Logo & Store Branding */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-3 shadow-md shadow-primary/20">
              <Store className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-center text-foreground">
              {storeName || 'Kita'}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {mode === 'code'
                ? 'Enter your store code'
                : 'Enter PIN to access register'}
            </p>
          </div>

          {/* ── MODE: Store Code Entry ───────────────── */}
          {mode === 'code' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Store Code
                </label>
                <Input
                  value={storeCodeInput}
                  onChange={(e) =>
                    setStoreCodeInput(
                      e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
                    )
                  }
                  onKeyDown={(e) =>
                    e.key === 'Enter' &&
                    storeCodeInput.length >= 4 &&
                    handleCodeSubmit()
                  }
                  placeholder="e.g., SARY4BP"
                  autoFocus
                  enterKeyHint="go"
                  maxLength={16}
                  className="h-14 text-center text-xl font-mono font-bold tracking-widest rounded-2xl uppercase"
                />
                <p className="text-[11px] text-muted-foreground text-center">
                  Ask your store owner for this code
                </p>
              </div>

              {error && (
                <div className="text-center text-xs font-semibold text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="button"
                onClick={handleCodeSubmit}
                disabled={storeCodeInput.trim().length < 4}
                className="w-full h-12 rounded-2xl text-sm font-bold shadow-md active:scale-[0.99]"
              >
                <span className="flex items-center gap-2">
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Button>

              {savedStoreCode && (
                <button
                  type="button"
                  onClick={() => {
                    setStoreCodeInput(savedStoreCode);
                    setMode('pin');
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground w-full text-center"
                >
                  Use saved store:{' '}
                  <span className="font-mono font-semibold">
                    {savedStoreCode}
                  </span>
                </button>
              )}
            </div>
          )}

          {/* ── MODE: PIN Entry ──────────────────────── */}
          {mode === 'pin' && (
            <>
              {/* Back link — switch store code */}
              <button
                type="button"
                onClick={() => {
                  setMode('code');
                  setPin('');
                  setError('');
                }}
                className="mb-4 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium mx-auto"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Store:{' '}
                <span className="font-mono font-bold">{storeCodeInput}</span>
              </button>

              {/* PIN Indicators */}
              <div
                className={cn(
                  'flex justify-center gap-3 mb-2 transition-transform',
                  shake && 'animate-shake',
                )}
              >
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-3.5 h-3.5 rounded-full transition-all duration-150',
                      i < pin.length
                        ? 'bg-primary scale-110 shadow-xs shadow-primary/40'
                        : 'bg-muted-foreground/20',
                      error && 'bg-destructive scale-100',
                    )}
                  />
                ))}
              </div>

              {/* Error message */}
              <div className="text-center text-xs font-semibold text-destructive h-5 mb-2">
                {error || '\u00A0'}
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-2.5">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleKey(key)}
                    disabled={loading}
                    className="h-14 sm:h-16 rounded-2xl bg-secondary hover:bg-secondary/80 active:bg-primary/20 active:scale-95 transition-all text-xl font-bold flex items-center justify-center text-foreground shadow-2xs disabled:opacity-40"
                  >
                    {key}
                  </button>
                ))}

                {/* Clear All */}
                <button
                  type="button"
                  onClick={() => handleKey('clear')}
                  disabled={loading || pin.length === 0}
                  className="h-14 sm:h-16 rounded-2xl hover:bg-muted active:scale-95 transition-all flex flex-col items-center justify-center text-muted-foreground disabled:opacity-30"
                  aria-label="Clear all"
                >
                  <RotateCcw className="h-5 w-5" />
                  <span className="text-[10px] font-semibold mt-0.5">
                    Clear
                  </span>
                </button>

                {/* Zero */}
                <button
                  type="button"
                  onClick={() => handleKey('0')}
                  disabled={loading}
                  className="h-14 sm:h-16 rounded-2xl bg-secondary hover:bg-secondary/80 active:bg-primary/20 active:scale-95 transition-all text-xl font-bold flex items-center justify-center text-foreground shadow-2xs disabled:opacity-40"
                >
                  0
                </button>

                {/* Backspace */}
                <button
                  type="button"
                  onClick={() => handleKey('del')}
                  disabled={loading || pin.length === 0}
                  className="h-14 sm:h-16 rounded-2xl hover:bg-muted active:scale-95 transition-all flex items-center justify-center text-muted-foreground active:text-destructive disabled:opacity-30"
                  aria-label="Backspace"
                >
                  <Delete className="h-6 w-6" />
                </button>
              </div>

              {/* Manual Unlock */}
              <Button
                type="button"
                onClick={() => handleSubmit()}
                disabled={pin.length < 4 || loading}
                className="w-full h-12 rounded-2xl mt-4 text-sm font-bold shadow-md active:scale-[0.99]"
              >
                {loading ? (
                  'Verifying...'
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Unlock Register
                  </span>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}