/**
 * Sync domain types and provider interface.
 *
 * The interface is intentionally narrow for v0 — it covers the only direction
 * we ship today (local → server pushes for items the user has added or
 * edited). Deletes need a tombstone pattern that's not implemented yet, so
 * they stay local-only for now and the queue ignores them.
 *
 * The mock implementation in `mockBackend.ts` returns success without doing
 * anything. When the real backend lands, write `createHttpSyncBackend` and
 * pass it to `<SyncBackendProvider>` in `providers.tsx`. The UI doesn't
 * change — only the queue's effect on the server does.
 */

import type { CollectionItem } from '@/shared/domain';

export type SyncBackend = {
  /**
   * Pushes a single item that was created or modified locally. The server
   * is expected to upsert by `id` (the client owns the id space — Scryfall-
   * style UUIDs). Returns the server's view of the item so the client can
   * reconcile (e.g. updatedAt rewriting). Throws on unrecoverable failures.
   */
  pushItem(item: CollectionItem): Promise<CollectionItem>;
};

export type SyncRunResult = {
  attempted: number;
  succeeded: number;
  failed: number;
};
