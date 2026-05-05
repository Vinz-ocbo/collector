import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addItem,
  createBinder,
  deleteItem,
  getItem,
  getOwnedCountByCardId,
  getSummary,
  listBinders,
  listItems,
  seedDemoData,
  updateItem,
  type AddItemInput,
  type CollectionItemWithCard,
  type CollectionSummary,
  type ItemFilter,
  type ItemSort,
  type UpdateItemInput,
} from './repository';
import type { Binder } from '@/shared/domain';

const KEYS = {
  items: (filter: ItemFilter, sort: ItemSort) => ['collection', 'items', filter, sort] as const,
  item: (id: string) => ['collection', 'item', id] as const,
  summary: () => ['collection', 'summary'] as const,
  binders: () => ['collection', 'binders'] as const,
  ownedCounts: () => ['collection', 'ownedCounts'] as const,
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

export function useSeedDemoData() {
  const qc = useQueryClient();
  return useMutation<{ cards: number; items: number }, Error, void>({
    mutationFn: () => seedDemoData(),
    onSuccess: () => invalidateCollection(qc),
  });
}
