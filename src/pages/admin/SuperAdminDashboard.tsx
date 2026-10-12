import { Link } from 'react-router-dom';
import { PlusCircle, Store, Package, Receipt, Users, Loader2 } from 'lucide-react';
import { useStores } from '@/hooks/useAdmin';
import { cn } from '@/lib/utils';

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: any;
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <div className="flex items-center gap-3">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', accent)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
            {label}
          </div>
          <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100 leading-none mt-0.5">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SuperAdminDashboard() {
  const { data: stores, isLoading, error } = useStores();

  const totalStores = stores?.length ?? 0;
  const totalProducts = stores?.reduce((s, x) => s + x.productCount, 0) ?? 0;
  const totalSales = stores?.reduce((s, x) => s + x.saleCount, 0) ?? 0;
  const totalUsers = stores?.reduce((s, x) => s + x.userCount, 0) ?? 0;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Platform Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            All tenants on SariSari POS
          </p>
        </div>
        <Link
          to="/admin/onboard"
          className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors active:scale-[0.99]"
        >
          <PlusCircle className="h-4 w-4" />
          Onboard Store
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Store} label="Stores" value={totalStores} accent="bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400" />
        <StatCard icon={Users} label="Users" value={totalUsers} accent="bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400" />
        <StatCard icon={Package} label="Products" value={totalProducts} accent="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" />
        <StatCard icon={Receipt} label="Sales" value={totalSales} accent="bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400" />
      </div>

      {/* Store list */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Stores</h2>
        </div>

        {isLoading && (
          <div className="p-12 flex items-center justify-center text-slate-500 dark:text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading stores...
          </div>
        )}

        {error && (
          <div className="p-6 text-center text-sm text-red-600 dark:text-red-400">
            Failed to load stores.
          </div>
        )}

        {!isLoading && !error && stores?.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              No stores yet.
            </p>
            <Link
              to="/admin/onboard"
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <PlusCircle className="h-4 w-4" />
              Onboard your first store
            </Link>
          </div>
        )}

        {!isLoading && stores && stores.length > 0 && (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {stores.map((store) => (
              <div
                key={store.id}
                className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <Store className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                      {store.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      {store.code}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="text-center">
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {store.userCount}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                      Users
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {store.productCount}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                      Products
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {store.saleCount}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                      Sales
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}