import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { createMockAuthBackend } from './mockBackend';
import type { AuthBackend } from './types';

const AuthBackendContext = createContext<AuthBackend | null>(null);

export function AuthBackendProvider({
  backend,
  children,
}: {
  /** Pass a custom backend (eg. for tests). Defaults to the mock implementation. */
  backend?: AuthBackend;
  children: ReactNode;
}) {
  const value = useMemo<AuthBackend>(() => backend ?? createMockAuthBackend(), [backend]);
  return <AuthBackendContext.Provider value={value}>{children}</AuthBackendContext.Provider>;
}

export function useAuthBackend(): AuthBackend {
  const ctx = useContext(AuthBackendContext);
  if (!ctx) throw new Error('useAuthBackend must be used inside <AuthBackendProvider />');
  return ctx;
}
