import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addItem,
  createBinder,
  deleteBinder,
  deleteItem,
  getBinder,
  getItem,
  getOwnedCountByCardId,
  getSummary,
  listBinderSummaries,
  listBinders,
  listItems,
  seedDemoData,
  updateBinder,
  updateItem,
  type AddItemInput,
  type BinderSummary,
  type CollectionItemWithCard,
  type CollectionSummary,
  type ItemFilter,
  type ItemSort,
  type UpdateBinderInput,
  type UpdateItemInput,
} from './repository';
import type { Binder } from '@/shared/domain';
import {
  DEFAULT_VIEW_PREFS,
  getCollectionViewPrefs,
  setCollectionViewPrefs,
  type CollectionViewPrefs,
} from './preferences';

const KEYS = {
  items: (filter: ItemFilter, sort: ItemSort) => ['collection', 'items', filter, sort] as const,
  item: (id: string) => ['collection', 'item', id] as const,
  summary: () => ['collection', 'summary'] as const,
  binders: () => ['collection', 'binders'] as const,
  binderSummaries: () => ['collection', 'binderSummaries'] as const,
  binder: (id: string) => ['collection', 'binder', id] as const,
  ownedCounts: () => ['collection', 'ownedCounts'] as const,
  viewPrefs: () => ['collection', 'viewPrefs'] as const,
};

export function useCollectionItems(filter: ItemFilter = {}, sort: ItemSort = 'addedAt-desc') {
  return useQuery<CollectionItemWithCard[]>({
    queryKey: KEYS.items(filter, sort),
    queryFn: () => listItems(filter, sort),
  });
}

export function useCollectionItem(id: string | undefined) {
  return useQuery<CollectionItemWithCard | null>({
    queryKey: id ? KEYS.item(id) : ['collection', 'item', null],
    queryFn: () => (id ? getItem(id) : Promise.resolve(null)),
    enabled: !!id,
  });
}

export function useCollectionSummary() {
  return useQuery<CollectionSummary>({
    queryKey: KEYS.summary(),
    queryFn: () => getSummary(),
  });
}

export function useBinders() {
  return useQuery<Binder[]>({
    queryKey: KEYS.binders(),
    queryFn: () => listBinders(),
  });
}

export function useBinder(id: string | undefined) {
  return useQuery<Binder | null>({
    queryKey: id ? KEYS.binder(id) : ['collection', 'binder', null],
    queryFn: () => (id ? getBinder(id) : Promise.resolve(null)),
    enabled: !!id,
  });
}

export function useBinderSummaries() {
  return useQuery<BinderSummary[]>({
    queryKey: KEYS.binderSummaries(),
    queryFn: () => listBinderSummaries(),
  });
}

/**
 * Returns a map of cardId → total owned quantity. Useful for "déjà possédée"
 * indicators in the search catalog.
 */
export function useOwnedCounts() {
  return useQuery<Map<string, number>>({
    queryKey: KEYS.ownedCounts(),
    queryFn: () => getOwnedCountByCardId(),
  });
}

function invalidateCollection(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['collection'] });
}

export function useAddItem() {
  const qc = useQueryClient();
  return useMutation<string, Error, AddItemInput>({
    mutationFn: (input) => addItem(input),
    onSuccess: () => invalidateCollection(qc),
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; patch: UpdateItemInput }>({
    mutationFn: ({ id, patch }) => updateItem(id, patch),
    onSuccess: () => invalidateCollection(qc),
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) => deleteItem(id),
    onSuccess: () => invalidateCollection(qc),
  });
}

export function useCreateBinder() {
  const qc = useQueryClient();
  return useMutation<string, Error, { name: string; icon: string; description?: string }>({
    mutationFn: ({ name, icon, description }) =>
      createBinder({
        name,
        icon,
        position: 0,
        ...(description ? { description } : {}),
      }),
    onSuccess: () => invalidateCollection(qc),
  });
}

export function useUpdateBinder() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; patch: UpdateBinderInput }>({
    mutationFn: ({ id, patch }) => updateBinder(id, patch),
    onSuccess: () => invalidateCollection(qc),
  });
}

export function useDeleteBinder() {
  const qc = useQueryClient();
  return useMutation<{ orphaned: number }, Error, { id: string }>({
    mutationFn: ({ id }) => deleteBinder(id),
    onSuccess: () => invalidateCollection(qc),
  });
}

export function useSeedDemoData() {
  const qc = useQueryClient();
  return useMutation<{ cards: number; items: number }, Error, void>({
    mutationFn: () => seedDemoData(),
    onSuccess: () => invalidateCollection(qc),
  });
}

/**
 * Persisted sort + view-mode preferences for the Collection page.
 * `staleTime: Infinity` because the only writer is `useSaveCollectionViewPrefs`,
 * which seeds the cache itself via `onMutate`.
 */
export function useCollectionViewPrefs() {
  return useQuery<CollectionViewPrefs>({
    queryKey: KEYS.viewPrefs(),
    queryFn: () => getCollectionViewPrefs(),
    staleTime: Infinity,
  });
}

export function useSaveCollectionViewPrefs() {
  const qc = useQueryClient();
  return useMutation<void, Error, CollectionViewPrefs>({
    mutationFn: (prefs) => setCollectionViewPrefs(prefs),
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: KEYS.viewPrefs() });
      qc.setQueryData<CollectionViewPrefs>(KEYS.viewPrefs(), next);
    },
  });
}

export { DEFAULT_VIEW_PREFS };
