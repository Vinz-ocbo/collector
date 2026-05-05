import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Card, CardSet } from '@/shared/domain';
import { useSearchBackend } from './SearchBackendProvider';
import { clearRecentSearches, getRecentSearches, pushRecentSearch } from './recentSearches';
import type { SearchInput, SearchResult } from './types';

const KEYS = {
  search: (input: SearchInput) => ['search', 'cards', input] as const,
  card: (id: string) => ['search', 'card', id] as const,
  sets: () => ['search', 'sets'] as const,
  recent: () => ['search', 'recent'] as const,
};

/**
 * Debounce helper. Returns the value only after `delay` ms of stability.
 */
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(handle);
  }, [value, delay]);
  return debounced;
}

/**
 * Live-search hook. Debounces the query (default 250 ms per design spec)
 * and skips queries shorter than `minLength` (default 2).
 */
export function useSearchCards(
  input: SearchInput,
  options: { debounceMs?: number; minLength?: number } = {},
) {
  const backend = useSearchBackend();
  const debounceMs = options.debounceMs ?? 250;
  const minLength = options.minLength ?? 2;
  const debouncedQuery = useDebouncedValue(input.query, debounceMs);
  const effectiveInput: SearchInput = { ...input, query: debouncedQuery };
  const enabled = debouncedQuery.trim().length >= minLength;

  return useQuery<SearchResult>({
    queryKey: KEYS.search(effectiveInput),
    queryFn: () => backend.searchCards(effectiveInput),
    enabled,
  });
}

export function useCatalogCard(id: string | undefined) {
  const backend = useSearchBackend();
  return useQuery<Card | null>({
    queryKey: id ? KEYS.card(id) : ['search', 'card', null],
    queryFn: () => (id ? backend.getCardById(id) : Promise.resolve(null)),
    enabled: !!id,
  });
}

/**
 * Sets list — used by the filter sheet's set picker. Cached for an hour
 * since sets rarely change; the backend already does its own LRU caching.
 */
export function useSets() {
  const backend = useSearchBackend();
  return useQuery<CardSet[]>({
    queryKey: KEYS.sets(),
    queryFn: () => backend.getSets(),
    staleTime: 60 * 60 * 1000,
  });
}

export function useRecentSearches() {
  return useQuery<string[]>({
    queryKey: KEYS.recent(),
    queryFn: () => getRecentSearches(),
  });
}

export function usePushRecentSearch() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (q) => pushRecentSearch(q),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEYS.recent() });
    },
  });
}

export function useClearRecentSearches() {
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => clearRecentSearches(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEYS.recent() });
    },
  });
}
