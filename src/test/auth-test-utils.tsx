import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { Toaster } from '@/shared/ui';
import { AuthBackendProvider, type AuthBackend, type Session } from '@/features/auth';

export function makeFakeBackend(overrides: Partial<AuthBackend> = {}): AuthBackend {
  let session: Session | null = null;
  return {
    getSession: () => Promise.resolve(session),
    signInWithPassword: (email) => {
      session = {
        userId: 'u1',
        email,
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      };
      return Promise.resolve(session);
    },
    signUpWithPassword: () => Promise.resolve({ requiresVerification: false }),
    signOut: () => {
      session = null;
      return Promise.resolve();
    },
    requestPasswordReset: () => Promise.resolve(),
    ...overrides,
  };
}

export function renderWithProviders(
  ui: ReactNode,
  options: { backend?: AuthBackend; initialEntries?: string[] } = {},
) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const backend = options.backend ?? makeFakeBackend();
  return {
    qc,
    backend,
    Wrapper: () => (
      <QueryClientProvider client={qc}>
        <AuthBackendProvider backend={backend}>
          <Toaster>
            <MemoryRouter initialEntries={options.initialEntries ?? ['/']}>{ui}</MemoryRouter>
          </Toaster>
        </AuthBackendProvider>
      </QueryClientProvider>
    ),
  };
}
