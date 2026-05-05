import { useMemo } from 'react';
import { useCollectionItems } from '@/features/collection';
import { useSets } from '@/features/search';
import {
  computeByColor,
  computeByRarity,
  computeBySet,
  computeByType,
  computeOverview,
  type ColorRow,
  type RarityRow,
  type SetRow,
  type StatsOverview,
  type TypeRow,
} from './selectors';

type Wrapped<T> = {
  data: T | null;
  isPending: boolean;
  isError: boolean;
};

export function useStatsOverview(): Wrapped<StatsOverview> {
  const items = useCollectionItems({}, 'addedAt-desc');
  const data = useMemo(() => (items.data ? computeOverview(items.data) : null), [items.data]);
  return { data, isPending: items.isPending, isError: items.isError };
}

export function useStatsByColor(): Wrapped<ColorRow[]> {
  const items = useCollectionItems({}, 'addedAt-desc');
  const data = useMemo(() => (items.data ? computeByColor(items.data) : null), [items.data]);
  return { data, isPending: items.isPending, isError: items.isError };
}

export function useStatsByType(): Wrapped<TypeRow[]> {
  const items = useCollectionItems({}, 'addedAt-desc');
  const data = useMemo(() => (items.data ? computeByType(items.data) : null), [items.data]);
  return { data, isPending: items.isPending, isError: items.isError };
}

export function useStatsByRarity(): Wrapped<RarityRow[]> {
  const items = useCollectionItems({}, 'addedAt-desc');
  const data = useMemo(() => (items.data ? computeByRarity(items.data) : null), [items.data]);
  return { data, isPending: items.isPending, isError: items.isError };
}

/**
 * Per-set completion stats. Joins the user's items with the global set list
 * (proxied from Scryfall via `useSets`). Pending until BOTH queries resolve;
 * errors if either failed. Sets the user owns nothing in are not in the rows.
 */
export function useStatsBySet(): Wrapped<SetRow[]> {
  const items = useCollectionItems({}, 'addedAt-desc');
  const sets = useSets();
  const data = useMemo(
    () => (items.data && sets.data ? computeBySet(items.data, sets.data) : null),
    [items.data, sets.data],
  );
  return {
    data,
    isPending: items.isPending || sets.isPending,
    isError: items.isError || sets.isError,
  };
}
