import { useDashboard } from '@/hooks/useSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Banknote, Smartphone, User as UserIcon, TrendingUp, 
  Package, AlertTriangle, ArrowRight, Wallet 
} from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function Dashboard() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <div className="h-6 w-32 bg-muted rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
        <div className="h-24 rounded-2xl bg-muted animate-pulse" />
        <div className="h-64 rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        Unable to load dashboard data.
      </div>
    );
  }

  const cards = [
    { 
      label: "Today's Sales", 
      value: formatCurrency(data.todayTotal), 
      icon: TrendingUp, 
      color: 'text-primary', 
      bg: 'bg-primary/10',
      to: '/sales'
    },
    { 
      label: 'Transactions', 
      value: data.todayCount.toString(), 
      icon: Banknote, 
      color: 'text-success', 
      bg: 'bg-success/10',
      to: '/sales'
    },
    { 
      label: 'Outstanding Utang', 
      value: formatCurrency(data.outstandingUtang), 
      icon: UserIcon, 
      color: 'text-warning', 
      bg: 'bg-warning/10',
      to: '/customers'
    },
    { 
      label: 'Low Stock Items', 
      value: data.lowStockCount.toString(), 
      icon: AlertTriangle, 
      color: 'text-destructive', 
      bg: 'bg-destructive/10',
      to: '/inventory'
    },
  ];

  const chartData = data.dailyData.map((d: { date: string; total: number }) => ({
    date: new Date(d.date).toLocaleDateString('en-PH', { weekday: 'short' }),
    total: d.total,
  }));

  const paymentBreakdown = [
    { label: 'Cash', value: data.cashTotal, icon: Banknote, color: 'text-success', bg: 'bg-success/15' },
    { label: 'GCash / Maya', value: data.gcashTotal, icon: Smartphone, color: 'text-primary', bg: 'bg-primary/15' },
    { label: 'Utang Credit', value: data.utangTotal, icon: UserIcon, color: 'text-warning', bg: 'bg-warning/15' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-5 overflow-y-auto h-full select-none pb-[calc(4rem+env(safe-area-inset-bottom,0px))]">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Overview of today's store performance</p>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} to={card.to} className="group">
              <Card className="p-3.5 sm:p-4 rounded-2xl border-border bg-card hover:border-primary/50 transition-all shadow-2xs active:scale-[0.98]">
                <div className="flex items-center justify-between mb-2">
                  <div className={cn('w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0', card.bg)}>
                    <Icon className={cn('h-5 w-5', card.color)} />
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="text-lg sm:text-2xl font-extrabold text-foreground tabular-nums tracking-tight truncate">
                  {card.value}
                </div>
                <div className="text-[11px] font-medium text-muted-foreground truncate mt-0.5">
                  {card.label}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Payment Method Breakdown */}
      <div>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
          Payment Breakdown (Today)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {paymentBreakdown.map((pm) => {
            const Icon = pm.icon;
            return (
              <Card key={pm.label} className="p-3.5 rounded-2xl border-border bg-card shadow-2xs flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', pm.bg)}>
                  <Icon className={cn('h-5 w-5', pm.color)} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-medium text-muted-foreground">{pm.label}</div>
                  <div className="text-base sm:text-lg font-bold text-foreground tabular-nums truncate">
                    {formatCurrency(pm.value)}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 7-Day Performance Chart */}
      <Card className="rounded-2xl border-border shadow-2xs">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Sales Trend — Last 7 Days
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="w-full h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }} 
                  stroke="hsl(var(--muted-foreground))"
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11 }} 
                  stroke="hsl(var(--muted-foreground))"
                  tickLine={false}
                  tickFormatter={(val) => val >= 1000 ? `₱${(val / 1000).toFixed(0)}k` : `₱${val}`}
                />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Sales']}
                  cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                />
                <Bar 
                  dataKey="total" 
                  fill="hsl(var(--primary))" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={38}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Direct Quick Shortcuts */}
      <div className="grid grid-cols-2 gap-2.5">
        <Link 
          to="/inventory" 
          className="p-3.5 rounded-2xl border border-border bg-card hover:border-primary active:scale-[0.98] transition-all flex items-center gap-3 shadow-2xs"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Package className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-foreground truncate">Inventory</div>
            <div className="text-[10px] text-muted-foreground">Audit & Restock</div>
          </div>
        </Link>

        <Link 
          to="/customers" 
          className="p-3.5 rounded-2xl border border-border bg-card hover:border-primary active:scale-[0.98] transition-all flex items-center gap-3 shadow-2xs"
        >
          <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
            <Wallet className="h-4.5 w-4.5 text-warning" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-foreground truncate">Utang Ledger</div>
            <div className="text-[10px] text-muted-foreground">Collect Payments</div>
          </div>
        </Link>
      </div>
    </div>
  );
}