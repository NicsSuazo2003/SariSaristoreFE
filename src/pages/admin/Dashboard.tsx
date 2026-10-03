import { useDashboard } from '@/hooks/useSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Banknote, Smartphone, User as UserIcon, TrendingUp, Package, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-lg font-semibold">Dashboard</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-6 text-muted-foreground">Unable to load dashboard data.</div>;
  }

  const cards = [
    { label: "Today's Sales", value: formatCurrency(data.todayTotal), icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Transactions', value: data.todayCount.toString(), icon: Banknote, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Outstanding Utang', value: formatCurrency(data.outstandingUtang), icon: UserIcon, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Low Stock Items', value: data.lowStockCount.toString(), icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
  ];

  const chartData = data.dailyData.map((d: { date: string; total: number }) => ({
    date: new Date(d.date).toLocaleDateString('en-PH', { weekday: 'short' }),
    total: d.total,
  }));

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of today's performance</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold tabular-nums">{card.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{card.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Banknote className="h-8 w-8 text-success" />
            <div>
              <div className="text-xs text-muted-foreground">Cash</div>
              <div className="text-lg font-bold tabular-nums">{formatCurrency(data.cashTotal)}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Smartphone className="h-8 w-8 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">GCash/Maya</div>
              <div className="text-lg font-bold tabular-nums">{formatCurrency(data.gcashTotal)}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <UserIcon className="h-8 w-8 text-warning" />
            <div>
              <div className="text-xs text-muted-foreground">Utang</div>
              <div className="text-lg font-bold tabular-nums">{formatCurrency(data.utangTotal)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sales - Last 7 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                formatter={(value: any) => formatCurrency(value)}
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              />
              <Bar dataKey="total" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="flex gap-3">
        <Link to="/products" className="flex-1 p-4 rounded-xl border border-border bg-card hover:border-primary transition-colors flex items-center gap-3">
          <Package className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Manage Products</span>
        </Link>
        <Link to="/customers" className="flex-1 p-4 rounded-xl border border-border bg-card hover:border-primary transition-colors flex items-center gap-3">
          <UserIcon className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">View Customers</span>
        </Link>
      </div>
    </div>
  );
}
