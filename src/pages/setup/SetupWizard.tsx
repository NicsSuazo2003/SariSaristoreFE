import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ArrowRight, ArrowLeft, Check, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function SetupWizard() {
  const navigate = useNavigate();
  const { setup } = useAuthStore();

  const [step, setStep] = useState(0);
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canProceed =
    step === 0
      ? storeName.trim().length > 0
      : step === 1
        ? ownerName.trim().length > 0 && pin.length >= 4 && confirmPin.length >= 4
        : true;

  const handleNext = () => {
    if (step === 0) {
      if (!storeName.trim()) {
        toast.error('Please enter a store name');
        return;
      }
      setStep(1);
    } else if (step === 1) {
      if (pin !== confirmPin) {
        toast.error('PINs do not match');
        return;
      }
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      await setup(storeName.trim(), ownerName.trim(), pin);
      toast.success('Store configured successfully!');
      navigate('/pos');
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e.message || 'Setup failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-gradient-to-br from-sky-50 via-background to-slate-100 flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] overflow-y-auto select-none">
      <div className="w-full max-w-sm my-auto">
        <div className="bg-card rounded-3xl shadow-xl border border-border p-6 sm:p-8 transition-all">
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary flex items-center justify-center mb-2.5 shadow-md shadow-primary/20">
              <Store className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-center text-foreground">
              Sari-Sari Store POS
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Initial Store Setup</p>
          </div>

          {/* Step Progress Bar */}
          <div className="flex items-center gap-1.5 mb-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-all duration-300',
                  i <= step ? 'bg-primary' : 'bg-muted'
                )}
              />
            ))}
          </div>

          {/* STEP 0: Store Name */}
          {step === 0 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-foreground">Store Name</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  What is your sari-sari store or retail kiosk called?
                </p>
              </div>

              <div className="space-y-1">
                <Input
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g., Aling Nena's Store"
                  autoFocus
                  enterKeyHint="next"
                  onKeyDown={(e) => e.key === 'Enter' && canProceed && handleNext()}
                  /* text-base prevents iOS Safari zoom */
                  className="h-12 text-base rounded-xl font-medium"
                />
              </div>

              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed}
                className="w-full h-12 rounded-xl text-sm font-bold shadow-sm active:scale-[0.99]"
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          )}

          {/* STEP 1: Owner Profile & Security PIN */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-foreground">Owner & Security PIN</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Set the administrator name and register lock PIN (4–6 digits).
                </p>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">
                    Owner / Manager Name
                  </label>
                  <Input
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Your name"
                    autoFocus
                    enterKeyHint="next"
                    className="h-11 text-base rounded-xl mt-1"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase">
                      Register PIN (4-6 Digits)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="text-xs text-primary flex items-center gap-1 font-semibold"
                    >
                      {showPin ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {showPin ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Input
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="PIN"
                      type={showPin ? 'text' : 'password'}
                      inputMode="numeric"
                      enterKeyHint="next"
                      className="h-11 text-base font-mono text-center tracking-widest rounded-xl"
                    />
                    <Input
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Confirm"
                      type={showPin ? 'text' : 'password'}
                      inputMode="numeric"
                      enterKeyHint="done"
                      onKeyDown={(e) => e.key === 'Enter' && canProceed && handleNext()}
                      className="h-11 text-base font-mono text-center tracking-widest rounded-xl"
                    />
                  </div>

                  {confirmPin.length > 0 && pin !== confirmPin && (
                    <p className="text-[11px] text-destructive font-medium mt-1">
                      PINs do not match
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="h-12 px-4 rounded-xl text-xs font-semibold"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed || pin !== confirmPin}
                  className="flex-1 h-12 rounded-xl text-sm font-bold shadow-sm active:scale-[0.99]"
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Finish & Ready to Sell */}
          {step === 2 && (
            <div className="space-y-4 text-center animate-in fade-in duration-150">
              <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto text-success">
                <Check className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-foreground">You're All Set!</h2>
                <p className="text-xs text-muted-foreground leading-relaxed px-2">
                  <span className="font-semibold text-foreground">{storeName}</span> is ready for business under{' '}
                  <span className="font-semibold text-foreground">{ownerName}</span>.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={submitting}
                  className="h-12 px-4 rounded-xl text-xs font-semibold"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  onClick={handleFinish}
                  disabled={submitting}
                  className="flex-1 h-12 rounded-xl text-sm font-bold shadow-md active:scale-[0.99]"
                >
                  {submitting ? 'Launching...' : 'Start Selling'}
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}