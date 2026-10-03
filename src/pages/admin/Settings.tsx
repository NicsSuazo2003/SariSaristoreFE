import { useState, useEffect } from 'react';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Store, User, Receipt, Phone, Moon } from 'lucide-react';

export function Settings() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { storeName, ownerName } = useAuthStore();

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
    }
  }, [settings]);

  // Apply dark mode
  useEffect(() => {
    if (form.dark_mode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [form.dark_mode]);

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Loading settings...</div>;
  }

  if (!settings) {
    return <div className="p-6 text-muted-foreground">No settings found. Run setup first.</div>;
  }

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        store_name: form.store_name,
        owner_name: form.owner_name,
        gcash_number: form.gcash_number || null,
        maya_number: form.maya_number || null,
        receipt_header: form.receipt_header || null,
        receipt_footer: form.receipt_footer || null,
        idle_timeout_minutes: form.idle_timeout_minutes,
        dark_mode: form.dark_mode,
      });
      toast.success('Settings saved');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save settings');
    }
  };

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-full max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your store</p>
      </div>

      {/* Store Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="h-4 w-4" /> Store Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Store Name</Label>
            <Input value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} />
          </div>
          <div>
            <Label>Owner Name</Label>
            <Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Idle Lock Timeout (minutes)</Label>
            <Input
              value={form.idle_timeout_minutes}
              onChange={(e) => setForm({ ...form, idle_timeout_minutes: parseInt(e.target.value) || 5 })}
              type="number"
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-4 w-4" /> Payment Numbers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>GCash Number</Label>
            <Input value={form.gcash_number} onChange={(e) => setForm({ ...form, gcash_number: e.target.value })} placeholder="09XX XXX XXXX" />
          </div>
          <div>
            <Label>Maya Number</Label>
            <Input value={form.maya_number} onChange={(e) => setForm({ ...form, maya_number: e.target.value })} placeholder="09XX XXX XXXX" />
          </div>
        </CardContent>
      </Card>

      {/* Receipt */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" /> Receipt Customization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Receipt Header</Label>
            <Input value={form.receipt_header} onChange={(e) => setForm({ ...form, receipt_header: e.target.value })} placeholder="e.g., Thank you for shopping!" />
          </div>
          <div>
            <Label>Receipt Footer</Label>
            <Input value={form.receipt_footer} onChange={(e) => setForm({ ...form, receipt_footer: e.target.value })} placeholder="e.g., Come again soon!" />
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Moon className="h-4 w-4" /> Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label>Dark Mode</Label>
              <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
            </div>
            <Switch checked={form.dark_mode} onCheckedChange={(v) => setForm({ ...form, dark_mode: v })} />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={updateSettings.isPending} className="w-full h-12">
        {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}