import { describe, expect, it } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import 'fake-indexeddb/auto';
import { AuthBackendProvider } from './AuthBackendProvider';
import { useSession, useSignIn, useSignOut, useSignUp } from './hooks';
import type { AuthBackend, Session } from './types';

function makeBackend(overrides: Partial<AuthBackend> = {}): AuthBackend {
  let session: Session | null = null;
  return {
    getSession: () => Promise.resolve(session),
    signInWithPassword: (email) => {
      session = { userId: 'u1', email, expiresAt: new Date(Date.now() + 3600_000).toISOString() };
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

function wrapper(backend: AuthBackend) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <AuthBackendProvider backend={backend}>{children}</AuthBackendProvider>
      </QueryClientProvider>
    );
  };
}

describe('auth hooks', () => {
  it('useSession returns null when signed out', async () => {
    const { result } = renderHook(() => useSession(), { wrapper: wrapper(makeBackend()) });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.data).toBeNull();
  });

  it('useSignIn populates the session cache on success', async () => {
    const backend = makeBackend();
    const { result } = renderHook(() => ({ session: useSession(), signIn: useSignIn() }), {
      wrapper: wrapper(backend),
    });
    await waitFor(() => expect(result.current.session.isPending).toBe(false));
    await act(async () => {
      await result.current.signIn.mutateAsync({ email: 'foo@x.com', password: 'Strong123' });
    });
    await waitFor(() => expect(result.current.session.data?.email).toBe('foo@x.com'));
  });

  it('useSignOut clears the session', async () => {
    const backend = makeBackend();
    await backend.signInWithPassword('foo@x.com', 'Strong123');
    const { result } = renderHook(() => ({ session: useSession(), signOut: useSignOut() }), {
      wrapper: wrapper(backend),
    });
    await waitFor(() => expect(result.current.session.data?.email).toBe('foo@x.com'));
    await act(async () => {
      await result.current.signOut.mutateAsync();
    });
    await waitFor(() => expect(result.current.session.data).toBeNull());
  });

  it('useSignUp resolves with verification info', async () => {
    const { result } = renderHook(() => useSignUp(), { wrapper: wrapper(makeBackend()) });
    let outcome: { requiresVerification: boolean } | undefined;
    await act(async () => {
      outcome = await result.current.mutateAsync({ email: 'a@b.com', password: 'Strong123' });
    });
    expect(outcome?.requiresVerification).toBe(false);
  });
});
