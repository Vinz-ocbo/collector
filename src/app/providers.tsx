import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, useMemo, useState, type ReactNode } from 'react';
import { Toaster } from '@/shared/ui';
import {
  AuthBackendProvider,
  createMockAuthBackend,
  createSupabaseAuthBackend,
  type AuthBackend,
} from '@/features/auth';
import {
  SearchBackendProvider,
  createMockSearchBackend,
  createScryfallSearchBackend,
  type SearchBackend,
} from '@/features/search';
import { SyncBackendProvider } from '@/features/sync';

// Lazy + dev-only — the devtools bundle (~50 KB) should never ship to prod.
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((m) => ({ default: m.ReactQueryDevtools })),
    )
  : null;

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  const searchBackend = useMemo<SearchBackend>(() => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    return baseUrl ? createScryfallSearchBackend({ baseUrl }) : createMockSearchBackend();
  }, []);

  // Auth backend: Supabase when both URL + anon key are set, otherwise the
  // dev mock. Picking by env keeps the import-time bundle the same shape.
  const authBackend = useMemo<AuthBackend>(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseAnonKey) {
      return createSupabaseAuthBackend({ supabaseUrl, supabaseAnonKey });
    }
    return createMockAuthBackend();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthBackendProvider backend={authBackend}>
        <SearchBackendProvider backend={searchBackend}>
          <SyncBackendProvider>
            <Toaster>{children}</Toaster>
          </SyncBackendProvider>
        </SearchBackendProvider>
      </AuthBackendProvider>
      {ReactQueryDevtools ? (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        </Suspense>
      ) : null}
    </QueryClientProvider>
  );
}
