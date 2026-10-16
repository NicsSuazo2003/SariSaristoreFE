import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { X, Mail, Sparkles, ArrowRight, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDemoCartStore } from '@/stores/demoCartStore';

export function DemoShell() {
  const navigate = useNavigate();
  const [signupOpen, setSignupOpen] = useState(false);

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-background">
      {/* Demo banner */}
      <div className="shrink-0 bg-amber-500 text-amber-950 px-3 py-2 flex items-center justify-between gap-2 z-50">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span className="text-xs font-bold truncate">
            DEMO MODE — Nothing is saved
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            onClick={() => setSignupOpen(true)}
            className="h-7 px-2.5 rounded-lg text-[11px] font-bold bg-amber-950 text-amber-50 hover:bg-amber-900 active:scale-95"
          >
            Sign Up Free
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
          <button
            type="button"
            onClick={() => navigate('/demo')}
            className="p-1.5 rounded-lg hover:bg-amber-950/20 active:scale-95"
            aria-label="Exit demo"
            title="Exit demo"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>

      {/* Sign-up modal */}
      {signupOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSignupOpen(false)}
        >
          <div
            className="bg-card rounded-3xl shadow-2xl border border-border w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-primary/15 via-primary/10 to-transparent px-6 pt-6 pb-4">
              <button
                type="button"
                onClick={() => setSignupOpen(false)}
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

            {/* Body */}
            <div className="px-6 pb-6 space-y-3">
              <div className="rounded-2xl border border-border bg-secondary/40 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <Mail className="h-3.5 w-3.5" />
                  Contact us
                </div>
                <a
                  href="mailto:admin@sarisari.app?subject=Kita%20POS%20Signup&body=Hi%2C%20I'd%20like%20to%20set%20up%20Kita%20POS%20for%20my%20sari-sari%20store.%0A%0AStore%20name%3A%20%0AOwner%20name%3A%20%0APhone%3A%20"
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
                  window.location.href =
                    'mailto:admin@sarisari.app?subject=Kita%20POS%20Signup&body=Hi%2C%20I%27d%20like%20to%20set%20up%20Kita%20POS%20for%20my%20sari-sari%20store.%0A%0AStore%20name%3A%20%0AOwner%20name%3A%20%0APhone%3A%20';
                }}
                className="w-full h-11 rounded-xl text-sm font-bold shadow-md active:scale-[0.99]"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email Us Now
              </Button>

              <button
                type="button"
                onClick={() => setSignupOpen(false)}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-2 font-medium"
              >
                Continue exploring demo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}