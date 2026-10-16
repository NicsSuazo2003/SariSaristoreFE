import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Camera, Zap, Package, ArrowRight, Check,
  Smartphone, Wallet, TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function DemoLanding() {
  const navigate = useNavigate();

  const features = [
    { icon: ShoppingCart, title: 'Lightning-fast POS', desc: 'Ring up sales in seconds with tap-to-add and instant cart updates' },
    { icon: Camera,       title: 'Barcode scanning',   desc: 'Scan product barcodes with your phone camera — no hardware needed' },
    { icon: Wallet,       title: 'Utang tracking',     desc: 'Keep a per-customer credit ledger and never lose track of who owes what' },
    { icon: Smartphone,   title: 'GCash & Maya',       desc: 'Accept digital payments with QR — perfect for the modern sari-sari' },
    { icon: Package,      title: 'Live inventory',     desc: 'Stock counts update automatically. Get low-stock warnings before you run out' },
    { icon: TrendingUp,   title: 'Sales insights',     desc: 'See today\'s totals, top products, and profit at a glance' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-background to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Top nav */}
      <header className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <ShoppingCart className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-bold text-sm">Kita POS</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Sari-Sari Edition</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200 font-bold">
            DEMO
          </span>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-6 py-8 sm:py-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
            <Zap className="h-3.5 w-3.5" />
            No signup required
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            The POS built for <span className="text-primary">sari-sari stores</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Try it now with sample products. Sell, scan, and see receipts — no account needed.
            Works on any phone, tablet, or computer.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate('/demo/pos')}
              className="h-12 px-8 rounded-xl text-sm font-bold shadow-md active:scale-[0.98]"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Start Demo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Nothing is saved. Refresh closes the demo.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-12">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="p-4 rounded-2xl border-border bg-card shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </Card>
            );
          })}
        </div>

        {/* What works in demo */}
        <Card className="mt-8 p-5 rounded-2xl border-border bg-card">
          <h3 className="text-sm font-bold text-foreground mb-3">What you can try</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-xs">
            {[
              'Add products to cart',
              'Scan barcodes with your camera',
              'Apply favorites & categories',
              'Adjust quantities',
              'Take cash payment',
              'Take GCash / Maya payment',
              'Sell on utang (credit)',
              'Print / view receipt',
              'Void the last sale',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-success shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Bottom CTA */}
        <div className="mt-12 text-center space-y-3">
          <h2 className="text-xl font-extrabold text-foreground">Ready to set up your own store?</h2>
          <p className="text-sm text-muted-foreground">
            Get in touch and we'll help you onboard in minutes.
          </p>
          <Button
            onClick={() => navigate('/demo/pos')}
            variant="outline"
            className="h-11 px-6 rounded-xl text-sm font-semibold"
          >
            Or keep exploring the demo
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </main>

      <footer className="max-w-4xl mx-auto px-6 py-8 text-center text-[11px] text-muted-foreground">
        Kita POS · Made for Filipino sari-sari stores
      </footer>
    </div>
  );
}