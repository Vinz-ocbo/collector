import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';
import { Toaster } from '@/shared/ui';
import { AuthBackendProvider } from '@/features/auth';
import {
  SearchBackendProvider,
  createMockSearchBackend,
  createScryfallSearchBackend,
  type SearchBackend,
} from '@/features/search';

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

  return (
    <QueryClientProvider client={queryClient}>
      <AuthBackendProvider>
        <SearchBackendProvider backend={searchBackend}>
          <Toaster>{children}</Toaster>
        </SearchBackendProvider>
      </AuthBackendProvider>
    </QueryClientProvider>
  );
}
