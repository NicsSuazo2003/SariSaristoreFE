import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { DemoShell } from '@/components/layout/DemoShell';
import { DemoLanding } from '@/pages/demo/DemoLanding';
import { DemoPOS } from '@/pages/demo/DemoPOS';
import { SetupWizard } from '@/pages/setup/SetupWizard';
import { Login } from '@/pages/auth/Login';
import { POS } from '@/pages/pos/POS';
import { Dashboard } from '@/pages/admin/Dashboard';
import { Products } from '@/pages/admin/Products';
import { Categories } from '@/pages/admin/Categories';
import { Inventory } from '@/pages/admin/Inventory';
import { Customers } from '@/pages/admin/Customers';
import { Sales } from '@/pages/admin/Sales';
import { Reports } from '@/pages/admin/Reports';
import { Settings } from '@/pages/admin/Settings';
import { SuperAdminDashboard } from '@/pages/admin/SuperAdminDashboard';
import { SuperAdminOnboard } from '@/pages/admin/SuperAdminOnboard';
import { NotFound } from '@/pages/NotFound';
import { useAuthStore } from '@/stores/authStore';
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isSetup = useAuthStore((s) => s.isSetup);
  const isLocked = useAuthStore((s) => s.isLocked);

  if (!isSetup) return <Navigate to="/setup" replace />;
  if (isLocked) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const isSetup = useAuthStore((s) => s.isSetup);
  const isLocked = useAuthStore((s) => s.isLocked);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const checkSetup = useAuthStore((s) => s.checkSetup);
  const loadMe = useAuthStore((s) => s.loadMe);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    (async () => {
      await checkSetup();
      await loadMe();
      setChecked(true);
    })();
  }, [checkSetup, loadMe]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isSetup) return <SetupWizard />;
  if (isLocked || !token) return <Login />;

  return (
    <>
      <AppShell />
      <Toaster richColors position="top-center" />
    </>
  );
}

export const router = createBrowserRouter([
  // ── DEMO (public — no auth) ──────────────────
  {
    path: '/demo',
    element: <DemoShell />,
    children: [
      { index: true,      element: <DemoLanding /> },
      { path: 'pos',      element: <DemoPOS /> },
    ],
  },

  // ── Auth ─────────────────────────────────────
  { path: '/setup', element: <SetupWizard /> },
  { path: '/login', element: <Login /> },

  // ── Main app (with auth gate) ────────────────
  {
    element: <AppRoutes />,
    children: [
      { path: '/pos',        element: <ProtectedRoute><POS /></ProtectedRoute> },
      { path: '/dashboard',  element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
      { path: '/products',   element: <ProtectedRoute><Products /></ProtectedRoute> },
      { path: '/categories', element: <ProtectedRoute><Categories /></ProtectedRoute> },
      { path: '/inventory',  element: <ProtectedRoute><Inventory /></ProtectedRoute> },
      { path: '/customers',  element: <ProtectedRoute><Customers /></ProtectedRoute> },
      { path: '/sales',      element: <ProtectedRoute><Sales /></ProtectedRoute> },
      { path: '/reports',    element: <ProtectedRoute><Reports /></ProtectedRoute> },
      { path: '/settings',   element: <ProtectedRoute><Settings /></ProtectedRoute> },

      { path: '/admin',          element: <ProtectedRoute><SuperAdminDashboard /></ProtectedRoute> },
      { path: '/admin/onboard',  element: <ProtectedRoute><SuperAdminOnboard /></ProtectedRoute> },

      { path: '/', element: <Navigate to="/pos" replace /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);