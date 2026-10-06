import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart, Package, Warehouse, Users, BarChart3,
  Settings, LayoutDashboard, Lock, Store, MoreHorizontal,
  Tags, Receipt, X,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';

type NavItem = {
  to: string;
  label: string;
  icon: any;
  primary: boolean;
  desktop: boolean;
};

const navItems: NavItem[] = [
  // Primary mobile tabs
  { to: '/pos',         label: 'POS',        icon: ShoppingCart,    primary: true,  desktop: true },
  { to: '/products',    label: 'Products',   icon: Package,         primary: true,  desktop: true },
  { to: '/inventory',   label: 'Inventory',  icon: Warehouse,       primary: true,  desktop: true },
  { to: '/customers',   label: 'Customers',  icon: Users,           primary: true,  desktop: true },

  // Secondary items (More Drawer / Desktop Sidebar)
  { to: '/dashboard',   label: 'Dashboard',  icon: LayoutDashboard, primary: false, desktop: true },
  { to: '/categories',  label: 'Categories', icon: Tags,             primary: false, desktop: true },
  { to: '/sales',       label: 'Sales',      icon: Receipt,          primary: false, desktop: true },
  { to: '/reports',     label: 'Reports',    icon: BarChart3,        primary: false, desktop: true },
  { to: '/settings',    label: 'Settings',   icon: Settings,         primary: false, desktop: true },
];

export function AppShell() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { storeName, lock } = useAuthStore();
  const cartCount = useCartStore((s) => s.getItemCount());
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryItems = navItems.filter((i) => i.primary);
  const secondaryItems = navItems.filter((i) => !i.primary);
  const isSecondaryActive = secondaryItems.some((item) => location.pathname.startsWith(item.to));

  if (isMobile) {
    return (
      <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-background">
        {/* Top Header */}
        <header className="flex items-center justify-between px-4 h-13 bg-card border-b border-border shrink-0 z-20">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Store className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-sm truncate">{storeName || 'Sari-Sari POS'}</span>
          </div>
          <button
            type="button"
            onClick={lock}
            className="p-2 rounded-xl text-muted-foreground hover:bg-muted active:scale-95 transition-all"
            aria-label="Lock Register"
          >
            <Lock className="h-4 w-4" />
          </button>
        </header>

        {/* Dynamic Route Content (Notice pb safe calculation to reserve bottom nav height) */}
        <main className="flex-1 overflow-hidden relative pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))]">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation Bar with Safe Area Inset Support */}
        <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-40 flex items-center justify-around px-1 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-all relative flex-1 active:scale-95',
                    isActive ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
                  )
                }
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {item.to === '/pos' && cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center shadow-xs">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] leading-tight">{item.label}</span>
              </NavLink>
            );
          })}

          {/* More Drawer Trigger */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-all relative flex-1 active:scale-95',
              isSecondaryActive ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] leading-tight">More</span>
            {isSecondaryActive && (
              <span className="absolute bottom-0 w-1 h-1 rounded-full bg-primary" />
            )}
          </button>
        </nav>

        {/* More Bottom Sheet */}
        {moreOpen && (
          <div 
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end animate-in fade-in duration-150"
            onClick={() => setMoreOpen(false)}
          >
            <div
              className="bg-card w-full rounded-t-3xl border-t border-border flex flex-col max-h-[80dvh] overflow-hidden pb-[max(1rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-muted-foreground/20 rounded-full mx-auto mt-3" />
              
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <span className="font-bold text-base">Store Management</span>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 grid grid-cols-3 gap-2.5 overflow-y-auto">
                {secondaryItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.to);
                  return (
                    <button
                      key={item.to}
                      type="button"
                      onClick={() => {
                        navigate(item.to);
                        setMoreOpen(false);
                      }}
                      className={cn(
                        'flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border text-center transition-all active:scale-95',
                        isActive
                          ? 'border-primary bg-primary/5 text-primary font-semibold'
                          : 'border-border bg-background hover:bg-muted text-foreground'
                      )}
                    >
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-xs">{item.label}</span>
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

  // Desktop Layout
  return (
    <div className="flex h-screen bg-background">
      <aside className="w-60 bg-card border-r border-border flex flex-col shrink-0 select-none">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-xs">
            <Store className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm truncate">{storeName || 'Sari-Sari POS'}</div>
            <div className="text-xs text-muted-foreground">Register Panel</div>
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
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
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
            type="button"
            onClick={lock}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full"
          >
            <Lock className="h-5 w-5 shrink-0" />
            <span>Lock Register</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}