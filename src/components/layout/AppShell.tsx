import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Package, Warehouse, Users, BarChart3,
  Settings, LayoutDashboard, Lock, Store, MoreHorizontal,
  Tags, Receipt, X,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useHeldStore } from '@/stores/heldStore';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useUIStore } from '@/stores/uiStore';

type NavItem = {
  to: string;
  label: string;
  icon: any;
  primary: boolean;    // shown in mobile bottom nav
  desktop: boolean;    // shown in desktop sidebar
};

const navItems: NavItem[] = [
  // Primary (bottom nav + sidebar)
  { to: '/pos',         label: 'POS',        icon: ShoppingCart,    primary: true,  desktop: true },
  { to: '/products',    label: 'Products',   icon: Package,         primary: true,  desktop: true },
  { to: '/inventory',   label: 'Inventory',  icon: Warehouse,       primary: true,  desktop: true },
  { to: '/customers',   label: 'Customers',  icon: Users,           primary: true,  desktop: true },

  // Secondary (sidebar + mobile "More" drawer)
  { to: '/dashboard',   label: 'Dashboard',  icon: LayoutDashboard, primary: false, desktop: true },
  { to: '/categories',  label: 'Categories', icon: Tags,            primary: false, desktop: true },
  { to: '/sales',       label: 'Sales',      icon: Receipt,         primary: false, desktop: true },
  { to: '/reports',     label: 'Reports',    icon: BarChart3,       primary: false, desktop: true },
  { to: '/settings',    label: 'Settings',   icon: Settings,        primary: false, desktop: true },
];

export function AppShell() {
  const isMobile = useIsMobile();
  const { storeName, lock } = useAuthStore();
  const cartCount = useCartStore((s) => s.getItemCount());
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryItems = navItems.filter((i) => i.primary);
  const secondaryItems = navItems.filter((i) => !i.primary);

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-background">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-4 h-14 bg-card border-b border-border shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Store className="h-5 w-5 text-primary shrink-0" />
            <span className="font-semibold text-sm truncate">{storeName}</span>
          </div>
          <button
            onClick={lock}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Lock"
          >
            <Lock className="h-4 w-4 text-muted-foreground" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-16">
          <Outlet />
        </main>

        {/* Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around z-40">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors relative flex-1',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )
                }
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
                {item.to === '/pos' && cartCount > 0 && (
                  <span className="absolute top-0 right-1/4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </NavLink>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors text-muted-foreground flex-1"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </nav>

        {/* More drawer */}
        {moreOpen && (
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setMoreOpen(false)}>
            <div
              className="absolute bottom-0 left-0 right-0 max-h-[70vh] bg-card rounded-t-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="font-semibold">More</span>
                <button onClick={() => setMoreOpen(false)} className="p-2 rounded-lg hover:bg-muted">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2 overflow-y-auto">
                {secondaryItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.to}
                      onClick={() => { navigate(item.to); setMoreOpen(false); }}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-background hover:border-primary active:scale-95 transition-all"
                    >
                      <Icon className="h-6 w-6 text-primary" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-60 bg-card border-r border-border flex flex-col shrink-0">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Store className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">{storeName}</div>
            <div className="text-xs text-muted-foreground">POS System</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.filter((item) => item.desktop).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
                {item.to === '/pos' && cartCount > 0 && (
                  <span className="ml-auto bg-primary-foreground text-primary text-xs font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={lock}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full"
          >
            <Lock className="h-5 w-5 shrink-0" />
            <span>Lock</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}