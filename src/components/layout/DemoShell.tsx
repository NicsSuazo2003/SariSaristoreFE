import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart, Package, Warehouse, Users, BarChart3,
  Settings, LayoutDashboard, Store, MoreHorizontal, Tags,
  Receipt, X, Mail, Sparkles, ArrowRight, LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useDemoCartStore } from '@/stores/demoCartStore';

type NavItem = {
  to: string;
  label: string;
  icon: any;
  primary: boolean;
  desktop: boolean;
};

const navItems: NavItem[] = [
  // Primary mobile tabs
  { to: '/demo/pos',         label: 'POS',        icon: ShoppingCart,    primary: true,  desktop: true },
  { to: '/demo/products',    label: 'Products',   icon: Package,         primary: true,  desktop: true },
  { to: '/demo/inventory',   label: 'Inventory',  icon: Warehouse,       primary: true,  desktop: true },
  { to: '/demo/customers',   label: 'Customers',  icon: Users,           primary: true,  desktop: true },

  // Secondary (More drawer / desktop sidebar)
  { to: '/demo/dashboard',   label: 'Dashboard',  icon: LayoutDashboard, primary: false, desktop: true },
  { to: '/demo/categories',  label: 'Categories', icon: Tags,            primary: false, desktop: true },
  { to: '/demo/sales',       label: 'Sales',      icon: Receipt,         primary: false, desktop: true },
  { to: '/demo/reports',     label: 'Reports',    icon: BarChart3,       primary: false, desktop: true },
  { to: '/demo/settings',    label: 'Settings',   icon: Settings,        primary: false, desktop: true },
];

export function DemoShell() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const cartCount = useDemoCartStore((s) => s.getItemCount());

  const primaryItems = navItems.filter((i) => i.primary);
  const secondaryItems = navItems.filter((i) => !i.primary);
  const isSecondaryActive = secondaryItems.some((item) =>
    location.pathname.startsWith(item.to)
  );

  // ─────────────────────────────────────────────
  // MOBILE LAYOUT
  // ─────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-background">
        {/* Demo banner */}
        <DemoBanner
          onSignup={() => setSignupOpen(true)}
          onExit={() => navigate('/demo')}
        />

        {/* Store header */}
        <header className="flex items-center justify-between px-4 h-13 bg-card border-b border-border shrink-0 z-20">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Store className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-sm truncate">
              Demo Sari-Sari Store
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-hidden relative pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))]">
          <Outlet />
        </main>

        {/* Bottom nav */}
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
                    isActive
                      ? 'text-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  )
                }
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {item.to === '/demo/pos' && cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center shadow-xs">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] leading-tight">{item.label}</span>
              </NavLink>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-all relative flex-1 active:scale-95',
              isSecondaryActive
                ? 'text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] leading-tight">More</span>
            {isSecondaryActive && (
              <span className="absolute bottom-0 w-1 h-1 rounded-full bg-primary" />
            )}
          </button>
        </nav>

        {/* More drawer */}
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

        <SignupModal open={signupOpen} onClose={() => setSignupOpen(false)} />
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // DESKTOP LAYOUT
  // ─────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-background">
      <aside className="w-60 bg-card border-r border-border flex flex-col shrink-0 select-none">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-xs">
            <Store className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm truncate">Demo Store</div>
            <div className="text-xs text-muted-foreground">Register Panel</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems
            .filter((item) => item.desktop)
            .map((item) => {
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
                  {item.to === '/demo/pos' && cartCount > 0 && (
                    <span className="ml-auto bg-primary-foreground text-primary text-xs font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </NavLink>
              );
            })}
        </nav>

        {/* Exit footer */}
        <div className="p-3 border-t border-border">
          <button
            type="button"
            onClick={() => navigate('/demo')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Exit Demo</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Demo banner (desktop) */}
        <DemoBanner
          onSignup={() => setSignupOpen(true)}
          onExit={() => navigate('/demo')}
          hideExit
        />
        <Outlet />
      </div>

      <SignupModal open={signupOpen} onClose={() => setSignupOpen(false)} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Demo Banner
// ─────────────────────────────────────────────
function DemoBanner({
  onSignup,
  onExit,
  hideExit = false,
}: {
  onSignup: () => void;
  onExit: () => void;
  hideExit?: boolean;
}) {
  return (
    <div className="sticky top-0 z-50 bg-amber-500 text-amber-950 px-3 py-2 flex items-center justify-between gap-2 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <Sparkles className="h-4 w-4 shrink-0" />
        <span className="text-xs font-bold truncate">
          DEMO MODE — Nothing is saved
        </span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          size="sm"
          onClick={onSignup}
          className="h-7 px-2.5 rounded-lg text-[11px] font-bold bg-amber-950 text-amber-50 hover:bg-amber-900 active:scale-95"
        >
          Sign Up Free
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
        {!hideExit && (
          <button
            type="button"
            onClick={onExit}
            className="p-1.5 rounded-lg hover:bg-amber-950/20 active:scale-95"
            aria-label="Exit demo"
            title="Exit demo"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Signup Modal
// ─────────────────────────────────────────────
function SignupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  const mailto =
    'mailto:admin@sarisari.app?subject=Kita%20POS%20Signup&body=Hi%2C%20I%27d%20like%20to%20set%20up%20Kita%20POS%20for%20my%20sari-sari%20store.%0A%0AStore%20name%3A%20%0AOwner%20name%3A%20%0APhone%3A%20';

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-3xl shadow-2xl border border-border w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-br from-primary/15 via-primary/10 to-transparent px-6 pt-6 pb-4">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:bg-muted active:scale-90"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-3 shadow-md shadow-primary/20">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <h2 className="text-lg font-extrabold text-foreground leading-tight">
            Ready to set up your store?
          </h2>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            We'll get you onboarded in minutes — no technical setup required.
          </p>
        </div>

        <div className="px-6 pb-6 space-y-3">
          <div className="rounded-2xl border border-border bg-secondary/40 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <Mail className="h-3.5 w-3.5" />
              Contact us
            </div>
            <a
              href={mailto}
              className="block text-sm font-mono font-bold text-primary hover:underline break-all"
            >
              admin@sarisari.app
            </a>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Send us an email with your store name and we'll set up your account.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => {
              window.location.href = mailto;
            }}
            className="w-full h-11 rounded-xl text-sm font-bold shadow-md active:scale-[0.99]"
          >
            <Mail className="h-4 w-4 mr-2" />
            Email Us Now
          </Button>

          <button
            type="button"
            onClick={onClose}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-2 font-medium"
          >
            Continue exploring demo
          </button>
        </div>
      </div>
    </div>
  );
}