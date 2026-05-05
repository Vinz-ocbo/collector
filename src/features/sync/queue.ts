/**
 * Sync queue. Reads `CollectionItem`s flagged `syncStatus: 'pending'` from
 * Dexie and pushes them through the configured `SyncBackend` one by one.
 *
 * v0 caveats:
 * - Push-only. Deletes don't propagate (we'd need tombstones).
 * - Sequential per call so the rate-limited backend isn't overrun.
 * - Failures flip `syncStatus` to `'error'` so the user can see them in
 *   future UI; the next run will retry every still-pending row but won't
 *   automatically re-attempt errored ones (manual re-edit triggers it).
 */

import { db } from '@/shared/db';
import type { SyncBackend, SyncRunResult } from './types';

export async function runSync(backend: SyncBackend): Promise<SyncRunResult> {
  const pending = await db.items.where('syncStatus').equals('pending').toArray();
  let succeeded = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      const echoed = await backend.pushItem(item);
      // Server may rewrite updatedAt or other fields — store the echo and
      // mark as synced. We only update on success to keep the queue
      // idempotent.
      await db.items.put({ ...echoed, syncStatus: 'synced' });
      succeeded++;
    } catch {
      // Persist the error state so future runs / UIs can show it. We don't
      // capture the error message yet (would need a new column); the user
      // sees it via toast at the call site.
      await db.items.update(item.id, { syncStatus: 'error' });
      failed++;
    }
  }

  return { attempted: pending.length, succeeded, failed };
}
