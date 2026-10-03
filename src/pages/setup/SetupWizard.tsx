import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ArrowRight, Check } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';


export function SetupWizard() {
  const navigate = useNavigate();
  const { setup } = useAuthStore();
  
  const [step, setStep] = useState(0);
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const canProceed =
    step === 0
      ? storeName.trim().length > 0
      : step === 1
        ? ownerName.trim().length > 0 && pin.length >= 4
        : true;

  const handleNext = () => {
    if (step === 0) {
      setStep(1);
    } else if (step === 1) {
      if (pin !== confirmPin) {
        toast.error('PINs do not match');
        return;
      }
      setStep(2);
    }
  };

  const handleFinish = async () => {
  try {
    await setup(storeName.trim(), ownerName.trim(), pin);
    toast.success('Store created!');
    navigate('/pos');
  } catch (e: any) {
    toast.error(e?.response?.data?.error || e.message || 'Setup failed');
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-3">
              <Store className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">Sari-Sari POS</h1>
            <p className="text-sm text-muted-foreground mt-1">Let's set up your store</p>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Step 0: Store Name */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">Store Name</h2>
                <p className="text-sm text-muted-foreground">What's your sari-sari store called?</p>
              </div>
              <Input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g., Aling Nena's Store"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && canProceed && handleNext()}
                className="h-12 text-base"
              />
              <Button
                onClick={handleNext}
                disabled={!canProceed}
                className="w-full h-12 text-base"
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 1: Owner + PIN */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">Owner & PIN</h2>
                <p className="text-sm text-muted-foreground">
                  Set your name and a 4-6 digit PIN to secure your register.
                </p>
              </div>
              <Input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Your name"
                className="h-12 text-base"
              />
              <div className="space-y-2">
                <Input
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter PIN (4-6 digits)"
                  type="password"
                  inputMode="numeric"
                  className="h-12 text-base tracking-widest"
                />
                <Input
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Confirm PIN"
                  type="password"
                  inputMode="numeric"
                  className="h-12 text-base tracking-widest"
                />
              </div>
              <Button onClick={handleNext} disabled={!canProceed} className="w-full h-12 text-base">
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Done */}
          {step === 2 && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-success" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">All Set!</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Your store is ready. You can now start selling.
                </p>
              </div>
              <Button onClick={handleFinish} className="w-full h-12 text-base">
  Start Selling
  <ArrowRight className="h-4 w-4 ml-2" />
</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
