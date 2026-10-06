import { useState, useMemo } from 'react';
import { useReports, useOutstandingUtang } from '@/hooks/useSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, Receipt, DollarSign, Wallet, 
  ArrowRight, PieChart as PieIcon 
} from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { 
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, 
  Tooltip, CartesianGrid, PieChart, Pie, Cell 
} from 'recharts';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const PIE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function Reports() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const { data: sales, isLoading } = useReports(period);
  const { data: utangCustomers } = useOutstandingUtang();

  const validSales = useMemo(() => sales || [], [sales]);

  // Aggregate sales by date
  const chartData = useMemo(() => {
    const grouped = new Map<string, number>();

    for (const s of validSales as any[]) {
      let key: string;
      const d = new Date(s.created_at);
      if (period === 'daily') {
        key = d.toISOString().slice(0, 10);
      } else if (period === 'weekly') {
        const monday = new Date(d);
        monday.setDate(d.getDate() - d.getDay() + 1);
        key = monday.toISOString().slice(0, 10);
      } else {
        key = d.toISOString().slice(0, 7);
      }
      grouped.set(key, (grouped.get(key) || 0) + Number(s.total_amount));
    }

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, total]) => ({
        date:
          period === 'monthly'
            ? new Date(date).toLocaleDateString('en-PH', { month: 'short', year: '2-digit' })
            : new Date(date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
        total,
      }));
  }, [validSales, period]);

  // Payment method breakdown
  const pieData = useMemo(() => {
    const methodTotals = new Map<string, number>();
    for (const s of validSales as any[]) {
      const key = s.payment_method?.toUpperCase() || 'OTHER';
      methodTotals.set(key, (methodTotals.get(key) || 0) + Number(s.total_amount));
    }
    return Array.from(methodTotals.entries()).map(([name, value]) => ({ name, value }));
  }, [validSales]);

  const totalRevenue = useMemo(
    () => validSales.reduce((s: number, r: any) => s + Number(r.total_amount), 0),
    [validSales]
  );
  const totalTransactions = validSales.length;
  const avgSale = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  const totalUtangOutstanding = useMemo(
    () => (utangCustomers || []).reduce((s: number, c: any) => s + Number(c.balance || 0), 0),
    [utangCustomers]
  );

  return (
    <div className="p-4 sm:p-6 space-y-4 overflow-y-auto h-full select-none pb-[calc(4rem+env(safe-area-inset-bottom,0px))]">
      {/* Header and Period Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">Reports & Insights</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Sales performance and revenue distribution</p>
        </div>

        <div className="flex gap-1 p-1 bg-secondary/80 rounded-xl self-start sm:self-auto">
          {[
            { key: 'daily', label: 'Daily' },
            { key: 'weekly', label: 'Weekly' },
            { key: 'monthly', label: 'Monthly' },
          ].map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key as any)}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95',
                period === p.key
                  ? 'bg-card text-foreground shadow-2xs font-extrabold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        <Card className="p-4 rounded-2xl border-border bg-card shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Total Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-foreground tabular-nums tracking-tight">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Across {period} period</div>
        </Card>

        <Card className="p-4 rounded-2xl border-border bg-card shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Transactions</span>
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center text-success">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-foreground tabular-nums tracking-tight">
            {totalTransactions}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Completed orders</div>
        </Card>

        <Card className="p-4 rounded-2xl border-border bg-card shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Average Basket</span>
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-foreground tabular-nums tracking-tight">
            {formatCurrency(avgSale)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Per transaction</div>
        </Card>
      </div>

      {/* Sales Trend Chart */}
      <Card className="rounded-2xl border-border shadow-2xs">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Sales Trend ({period.charAt(0).toUpperCase() + period.slice(1)})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          {isLoading ? (
            <div className="h-60 flex items-center justify-center text-xs text-muted-foreground animate-pulse">
              Loading report charts...
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-xs text-muted-foreground">
              No sales records found for this period.
            </div>
          ) : (
            <div className="w-full h-60 sm:h-72">
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
                    tickFormatter={(val) => (val >= 1000 ? `₱${(val / 1000).toFixed(0)}k` : `₱${val}`)}
                  />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Revenue']}
                    cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
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
          )}
        </CardContent>
      </Card>

      {/* Payment Methods Distribution */}
      {pieData.length > 0 && (
        <Card className="rounded-2xl border-border shadow-2xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-primary" />
              Payment Methods Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="flex flex-col sm:flex-row items-center justify-around gap-4">
              <div className="w-48 h-48 sm:w-56 sm:h-56 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Total']}
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Clean breakdown list */}
              <div className="w-full sm:max-w-xs space-y-2">
                {pieData.map((item, idx) => {
                  const percentage = totalRevenue > 0 ? ((item.value / totalRevenue) * 100).toFixed(1) : '0';
                  return (
                    <div key={item.name} className="flex items-center justify-between text-xs p-2 rounded-xl bg-secondary/50">
                      <div className="flex items-center gap-2 min-w-0">
                        <span 
                          className="w-3 h-3 rounded-full shrink-0" 
                          style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} 
                        />
                        <span className="font-bold text-foreground truncate">{item.name}</span>
                        <span className="text-muted-foreground text-[10px]">({percentage}%)</span>
                      </div>
                      <span className="font-extrabold text-foreground tabular-nums shrink-0">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outstanding Utang Ledger Preview */}
      <Card className="rounded-2xl border-border shadow-2xs">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <Wallet className="h-4 w-4 text-warning" />
              Outstanding Utang
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Total collectible: <span className="font-bold text-warning">{formatCurrency(totalUtangOutstanding)}</span>
            </p>
          </div>
          <Link
            to="/customers"
            className="text-xs font-bold text-primary flex items-center gap-1 hover:underline shrink-0"
          >
            View All
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          {(utangCustomers || []).length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              No outstanding balances recorded.
            </div>
          ) : (
            <div className="space-y-1.5">
              {(utangCustomers || []).slice(0, 5).map((c: any) => (
                <Link
                  key={c.id}
                  to="/customers"
                  className="flex justify-between items-center p-2.5 rounded-xl border border-border bg-background hover:border-warning/50 active:scale-[0.99] transition-all"
                >
                  <span className="text-xs font-bold text-foreground truncate">{c.name}</span>
                  <span className="text-xs font-extrabold text-warning tabular-nums shrink-0 ml-2">
                    {formatCurrency(c.balance)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}