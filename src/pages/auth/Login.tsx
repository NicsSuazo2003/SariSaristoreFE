import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Delete, Lock } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';


export function Login() {
  const navigate = useNavigate();
  const { unlock, storeName } = useAuthStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const [loading, setLoading] = useState(false);

const handleKey = async (key: string) => {
  setError('');
  if (key === 'del') { setPin((p) => p.slice(0, -1)); return; }
  if (pin.length >= 6 || loading) return;
  const newPin = pin + key;
  setPin(newPin);

  if (newPin.length >= 4) {
    setLoading(true);
    try {
      await unlock(newPin);
      navigate('/pos');
    } catch {
      setError('Wrong PIN. Try again.');
      setTimeout(() => { setPin(''); setError(''); }, 1000);
    } finally {
      setLoading(false);
    }
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-3">
              <Store className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">{storeName}</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter your PIN to continue</p>
          </div>

          {/* PIN dots */}
          <div className="flex justify-center gap-3 mb-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={cn(
                  'w-3.5 h-3.5 rounded-full transition-colors',
                  i < pin.length ? 'bg-primary' : 'bg-muted',
                  error && 'bg-destructive animate-pulse'
                )}
              />
            ))}
          </div>
          <div className="text-center text-sm text-destructive h-5 mb-4">
            {error}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((key) => (
              <button
                key={key}
                onClick={() => handleKey(key)}
                className="h-16 rounded-xl bg-secondary hover:bg-secondary/70 active:scale-95 transition-all text-xl font-semibold flex items-center justify-center"
              >
                {key}
              </button>
            ))}
            <button
              onClick={() => handleKey('del')}
              className="h-16 rounded-xl hover:bg-muted active:scale-95 transition-all flex items-center justify-center text-muted-foreground"
            >
              <Delete className="h-6 w-6" />
            </button>
            <button
              onClick={() => handleKey('0')}
              className="h-16 rounded-xl bg-secondary hover:bg-secondary/70 active:scale-95 transition-all text-xl font-semibold flex items-center justify-center"
            >
              0
            </button>
            <div className="h-16 flex items-center justify-center">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
