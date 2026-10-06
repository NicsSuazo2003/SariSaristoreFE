import { Link, useNavigate } from 'react-router-dom';
import { Store, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-background via-secondary/20 to-muted/40 select-none pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        {/* Visual Brand Icon */}
        <div className="relative mb-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
            <Store className="h-8 w-8 sm:h-10 sm:w-10" />
          </div>
          <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
            404
          </span>
        </div>

        {/* Messaging */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mb-2">
          Page Not Found
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-[280px] mb-8">
          The page or route you requested doesn't exist or may have been moved.
        </p>

        {/* Thumb-Friendly Action Buttons */}
        <div className="w-full flex flex-col gap-2.5 sm:flex-row sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            className="w-full sm:flex-1 h-12 rounded-xl text-xs sm:text-sm font-semibold active:scale-95 transition-transform"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Go Back
          </Button>

          <Link
            to="/pos"
            className="w-full sm:flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-primary/25 active:scale-95 hover:bg-primary/90 transition-all"
          >
            <Home className="h-4 w-4" />
            Back to POS
          </Link>
        </div>
      </div>
    </div>
  );
}