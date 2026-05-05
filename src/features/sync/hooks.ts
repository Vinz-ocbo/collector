import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/shared/db';
import { runSync } from './queue';
import { useSyncBackend } from './SyncBackendProvider';
import type { SyncRunResult } from './types';

const KEYS = {
  pendingCount: ['sync', 'pendingCount'] as const,
};

/**
 * Number of items currently in the pending sync queue. Used by the UI to
 * surface "X items not synced yet" indicators. Cheap on Dexie, refreshed
 * by collection mutations through query invalidation.
 */
export function usePendingSyncCount() {
  return useQuery<number>({
    queryKey: KEYS.pendingCount,
    queryFn: async () => db.items.where('syncStatus').equals('pending').count(),
  });
}

/**
 * Triggers one full pass over the pending queue. The hook returns a
 * mutation so callers can disable buttons while it's in flight, surface
 * toasts on completion, etc.
 */
export function useRunSync() {
  const backend = useSyncBackend();
  const qc = useQueryClient();
  return useMutation<SyncRunResult, Error, void>({
    mutationFn: () => runSync(backend),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['collection'] });
      void qc.invalidateQueries({ queryKey: KEYS.pendingCount });
    },
  });
}
