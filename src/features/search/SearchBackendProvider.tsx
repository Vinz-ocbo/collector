import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { createMockSearchBackend } from './mockBackend';
import type { SearchBackend } from './types';

const SearchBackendContext = createContext<SearchBackend | null>(null);

export function SearchBackendProvider({
  backend,
  children,
}: {
  backend?: SearchBackend;
  children: ReactNode;
}) {
  const value = useMemo<SearchBackend>(() => backend ?? createMockSearchBackend(), [backend]);
  return <SearchBackendContext.Provider value={value}>{children}</SearchBackendContext.Provider>;
}

export function useSearchBackend(): SearchBackend {
  const ctx = useContext(SearchBackendContext);
  if (!ctx) throw new Error('useSearchBackend must be used inside <SearchBackendProvider />');
  return ctx;
}
