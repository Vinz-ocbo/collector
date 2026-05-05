import { useMemo } from 'react';
import { useCollectionItems } from '@/features/collection';
import {
  computeByColor,
  computeByRarity,
  computeByType,
  computeOverview,
  type ColorRow,
  type RarityRow,
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
