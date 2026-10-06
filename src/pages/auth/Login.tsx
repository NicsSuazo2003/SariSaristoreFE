import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Delete, Check, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';

export function Login() {
  const navigate = useNavigate();
  const { unlock, storeName } = useAuthStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const triggerHaptic = (pattern: number | number[] = 20) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  const handleSubmit = useCallback(async (pinToSubmit?: string) => {
    const value = pinToSubmit || pin;
    if (value.length < 4 || loading) return;

    setLoading(true);
    setError('');
    try {
      await unlock(value);
      triggerHaptic([30, 40, 30]);
      navigate('/pos');
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
  }, [pin, loading, unlock, navigate]);

  const handleKey = useCallback((key: string) => {
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
      // Auto-submit standard 6-digit PINs immediately
      if (next.length === 6) {
        setTimeout(() => handleSubmit(next), 50);
      }
      return next;
    });
  }, [loading, handleSubmit]);

  // Global keyboard listener for hardware numpads and desktop hotkeys
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (loading) return;

      if (/^[0-9]$/.test(e.key)) {
        handleKey(e.key);
      } else if (e.key === 'Backspace') {
        handleKey('del');
      } else if (e.key === 'Escape') {
        handleKey('clear');
      } else if (e.key === 'Enter' && pin.length >= 4) {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleKey, handleSubmit, loading, pin.length]);

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
              {storeName || 'Sari-Sari Store POS'}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">Enter PIN to access register</p>
          </div>

          {/* PIN Indicators with Error Shake */}
          <div
            className={cn(
              'flex justify-center gap-3 mb-2 transition-transform',
              shake && 'animate-shake'
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
                  error && 'bg-destructive scale-100'
                )}
              />
            ))}
          </div>

          {/* Feedback & Status Message */}
          <div className="text-center text-xs font-semibold text-destructive h-5 mb-2">
            {error || '\u00A0'}
          </div>

          {/* Large Thumb-Friendly Keypad */}
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

            {/* Clear All Key */}
            <button
              type="button"
              onClick={() => handleKey('clear')}
              disabled={loading || pin.length === 0}
              className="h-14 sm:h-16 rounded-2xl hover:bg-muted active:scale-95 transition-all flex flex-col items-center justify-center text-muted-foreground disabled:opacity-30"
              aria-label="Clear all"
            >
              <RotateCcw className="h-5 w-5" />
              <span className="text-[10px] font-semibold mt-0.5">Clear</span>
            </button>

            {/* Zero Key */}
            <button
              type="button"
              onClick={() => handleKey('0')}
              disabled={loading}
              className="h-14 sm:h-16 rounded-2xl bg-secondary hover:bg-secondary/80 active:bg-primary/20 active:scale-95 transition-all text-xl font-bold flex items-center justify-center text-foreground shadow-2xs disabled:opacity-40"
            >
              0
            </button>

            {/* Backspace Key */}
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

          {/* Manual Unlock Button (Useful for 4 or 5 digit PINs) */}
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
        </div>
      </div>
    </div>
  );
}