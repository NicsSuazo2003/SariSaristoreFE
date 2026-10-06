import { useState, useEffect } from 'react';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  Store, User, Receipt, Phone, Moon, 
  ShieldAlert, Check, Clock, Sparkles 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Settings() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const [form, setForm] = useState({
    store_name: '',
    owner_name: '',
    gcash_number: '',
    maya_number: '',
    receipt_header: '',
    receipt_footer: '',
    idle_timeout_minutes: 5,
    dark_mode: false,
  });

  const [isDirty, setIsDirty] = useState(false);

  const triggerHaptic = (pattern: number | number[] = 20) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        (navigator.vibrate as any)(pattern);
      } catch {}
    }
  };

  useEffect(() => {
    if (settings) {
      setForm({
        store_name: settings.store_name || '',
        owner_name: settings.owner_name || '',
        gcash_number: settings.gcash_number || '',
        maya_number: settings.maya_number || '',
        receipt_header: settings.receipt_header || '',
        receipt_footer: settings.receipt_footer || '',
        idle_timeout_minutes: settings.idle_timeout_minutes || 5,
        dark_mode: settings.dark_mode || false,
      });
      setIsDirty(false);
    }
  }, [settings]);

  // Handle immediate visual theme toggle
  const handleToggleDarkMode = (checked: boolean) => {
    setForm((prev) => ({ ...prev, dark_mode: checked }));
    setIsDirty(true);
    triggerHaptic(15);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleChange = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!form.store_name.trim()) {
      toast.error('Store name cannot be empty');
      return;
    }

    try {
      await updateSettings.mutateAsync({
        store_name: form.store_name.trim(),
        owner_name: form.owner_name.trim(),
        gcash_number: form.gcash_number.trim() || null,
        maya_number: form.maya_number.trim() || null,
        receipt_header: form.receipt_header.trim() || null,
        receipt_footer: form.receipt_footer.trim() || null,
        idle_timeout_minutes: Number(form.idle_timeout_minutes) || 5,
        dark_mode: form.dark_mode,
      });

      // Synchronize auth state with newly saved store details
      const authState = useAuthStore.getState() as any;
      if (authState.setStoreInfo) {
        authState.setStoreInfo(form.store_name.trim(), form.owner_name.trim());
      }

      setIsDirty(false);
      triggerHaptic([30, 40]);
      toast.success('Store settings saved successfully');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save settings');
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4 max-w-2xl animate-pulse">
        <div className="h-6 w-32 bg-muted rounded-lg" />
        <div className="h-40 rounded-2xl bg-muted" />
        <div className="h-40 rounded-2xl bg-muted" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        No settings found. Please run the setup wizard first.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden select-none relative pb-[calc(5rem+env(safe-area-inset-bottom,0px))]">
      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-2xl w-full mx-auto">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">Settings</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage store details, payments, and receipt branding
          </p>
        </div>

        {/* 1. Store Information */}
        <Card className="rounded-2xl border-border bg-card shadow-2xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" /> Store Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3">
            <div>
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Store Name *
              </Label>
              <Input
                value={form.store_name}
                onChange={(e) => handleChange('store_name', e.target.value)}
                placeholder="e.g., Aling Nena's Sari-Sari Store"
                className="h-11 text-base rounded-xl font-medium"
              />
            </div>
            <div>
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Owner / Manager Name
              </Label>
              <Input
                value={form.owner_name}
                onChange={(e) => handleChange('owner_name', e.target.value)}
                placeholder="e.g., Nena Mendez"
                className="h-11 text-base rounded-xl font-medium"
              />
            </div>
          </CardContent>
        </Card>

        {/* 2. Digital Payments (GCash & Maya) */}
        <Card className="rounded-2xl border-border bg-card shadow-2xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" /> E-Wallet Payment Accounts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3">
            <div>
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                GCash Registered Mobile Number
              </Label>
              <Input
                value={form.gcash_number}
                onChange={(e) => handleChange('gcash_number', e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="09XXXXXXXXX"
                type="tel"
                inputMode="numeric"
                className="h-11 text-base font-mono rounded-xl tracking-wider"
              />
            </div>
            <div>
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Maya Registered Mobile Number
              </Label>
              <Input
                value={form.maya_number}
                onChange={(e) => handleChange('maya_number', e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="09XXXXXXXXX"
                type="tel"
                inputMode="numeric"
                className="h-11 text-base font-mono rounded-xl tracking-wider"
              />
            </div>
          </CardContent>
        </Card>

        {/* 3. Receipt Customization */}
        <Card className="rounded-2xl border-border bg-card shadow-2xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" /> Receipt Slip Customization
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3">
            <div>
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Receipt Header Note
              </Label>
              <Input
                value={form.receipt_header}
                onChange={(e) => handleChange('receipt_header', e.target.value)}
                placeholder="e.g., Salamat sa pagpalit!"
                className="h-11 text-base rounded-xl"
              />
            </div>
            <div>
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Receipt Footer Note
              </Label>
              <Input
                value={form.receipt_footer}
                onChange={(e) => handleChange('receipt_footer', e.target.value)}
                placeholder="e.g., Balik-balik kamo!"
                className="h-11 text-base rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        {/* 4. Security & Register Lock */}
        <Card className="rounded-2xl border-border bg-card shadow-2xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Security & Inactivity Lock
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold">Auto-Lock Idle Timeout</Label>
                <p className="text-[11px] text-muted-foreground">Locks the register after inactivity</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Input
                  value={form.idle_timeout_minutes}
                  onChange={(e) => handleChange('idle_timeout_minutes', parseInt(e.target.value) || 1)}
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="60"
                  className="w-16 h-10 text-center font-bold font-mono rounded-xl"
                />
                <span className="text-xs font-semibold text-muted-foreground">min</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. Appearance Theme */}
        <Card className="rounded-2xl border-border bg-card shadow-2xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <Moon className="h-4 w-4 text-primary" /> Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-semibold">Dark Mode</Label>
                <p className="text-[11px] text-muted-foreground">High contrast theme for evening cashiering</p>
              </div>
              <Switch checked={form.dark_mode} onCheckedChange={handleToggleDarkMode} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sticky Bottom Save Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border p-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] z-30 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button
            type="button"
            onClick={handleSave}
            disabled={updateSettings.isPending || (!isDirty && !updateSettings.isPending)}
            className={cn(
              'w-full h-12 rounded-xl text-sm font-bold shadow-md transition-all active:scale-[0.99]',
              isDirty ? 'bg-primary text-primary-foreground animate-pulse' : 'bg-primary'
            )}
          >
            {updateSettings.isPending ? (
              'Saving Configuration...'
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Check className="h-4 w-4" />
                {isDirty ? 'Save Changes' : 'Settings Saved'}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}