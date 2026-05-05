import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { createMockSyncBackend } from './mockBackend';
import type { SyncBackend } from './types';

const SyncBackendContext = createContext<SyncBackend | null>(null);

export function SyncBackendProvider({
  backend,
  children,
}: {
  /** Pass a real backend in `providers.tsx`. Defaults to the no-op mock. */
  backend?: SyncBackend;
  children: ReactNode;
}) {
  const value = useMemo<SyncBackend>(() => backend ?? createMockSyncBackend(), [backend]);
  return <SyncBackendContext.Provider value={value}>{children}</SyncBackendContext.Provider>;
}

export function useSyncBackend(): SyncBackend {
  const ctx = useContext(SyncBackendContext);
  if (!ctx) throw new Error('useSyncBackend must be used inside <SyncBackendProvider />');
  return ctx;
}
