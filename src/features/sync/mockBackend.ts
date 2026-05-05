/**
 * No-op sync backend — used when no real backend is wired. Echoes the item
 * back so callers can rely on the same contract without branching. Useful
 * during dev so the rest of the queue plumbing keeps working before the
 * server-side endpoints exist.
 */

import type { CollectionItem } from '@/shared/domain';
import type { SyncBackend } from './types';

export function createMockSyncBackend(): SyncBackend {
  return {
    pushItem(item: CollectionItem): Promise<CollectionItem> {
      return Promise.resolve(item);
    },
  };
}
