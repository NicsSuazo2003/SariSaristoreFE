import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes: Keeps catalog fresh without excess mobile network hits
      gcTime: 1000 * 60 * 30, // 30 minutes: Preserves store cache across app switching
      retry: 2,
      refetchOnWindowFocus: false, // Prevents unwanted refetch churn when switching to SMS/banking apps
      refetchOnReconnect: true,
      networkMode: 'offlineFirst', // Serves local cache first if mobile signal flickers
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {/* Toast optimized for mobile notch/island & thumb reach */}
      <Toaster
        richColors
        position="top-center"
        visibleToasts={2}
        duration={1600}
        toastOptions={{
          className: 'text-xs sm:text-sm font-semibold rounded-2xl shadow-lg border border-border',
          style: {
            // Respects iPhone Dynamic Island / notch and Android status bar in PWA/browser mode
            marginTop: 'max(0.5rem, env(safe-area-inset-top))',
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;