import { beforeEach, describe, expect, it, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '@/shared/db';
import { addItem, upsertCards } from '@/features/collection';
import type { Card } from '@/shared/domain';
import { runSync } from './queue';
import { createMockSyncBackend } from './mockBackend';
import type { SyncBackend } from './types';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

const stubCard: Card = {
  id: 'card-stub',
  game: 'magic',
  name: 'Stub',
  setCode: 'tst',
  setName: 'Test',
  collectorNumber: '1',
  rarity: 'common',
  language: 'en',
  imageUris: { small: '', normal: '', large: '', png: '' },
  releasedAt: '2026-01-01',
  prices: { updatedAt: '2026-01-01T00:00:00Z' },
  meta: {},
};

let counter = 0;
async function seedOnePendingItem(): Promise<string> {
  counter += 1;
  await upsertCards([stubCard]);
  return addItem({
    cardId: stubCard.id,
    game: 'magic',
    quantity: counter,
    condition: 'NM',
    foil: false,
    language: 'en',
    binderId: null,
  });
}

describe('runSync', () => {
  it('returns zeros when there is nothing pending', async () => {
    const result = await runSync(createMockSyncBackend());
    expect(result).toEqual({ attempted: 0, succeeded: 0, failed: 0 });
  });

  it('marks pushed items as synced and counts them', async () => {
    await seedOnePendingItem();
    const result = await runSync(createMockSyncBackend());
    expect(result).toEqual({ attempted: 1, succeeded: 1, failed: 0 });
    const items = await db.items.toArray();
    expect(items[0]!.syncStatus).toBe('synced');
  });

  it('flags failures and keeps trying the rest of the queue', async () => {
    await seedOnePendingItem();
    await seedOnePendingItem();
    let calls = 0;
    const flaky: SyncBackend = {
      pushItem: vi.fn().mockImplementation((item) => {
        calls++;
        if (calls === 1) return Promise.reject(new Error('upstream down'));
        return Promise.resolve(item);
      }),
    };
    const result = await runSync(flaky);
    expect(result).toEqual({ attempted: 2, succeeded: 1, failed: 1 });
    const errored = await db.items.where('syncStatus').equals('error').count();
    const synced = await db.items.where('syncStatus').equals('synced').count();
    expect(errored).toBe(1);
    expect(synced).toBe(1);
  });

  it('stores the server echo on success (so updatedAt rewrites land)', async () => {
    const id = await seedOnePendingItem();
    const rewritten: SyncBackend = {
      pushItem: (item) => Promise.resolve({ ...item, updatedAt: '2030-01-01T00:00:00.000Z' }),
    };
    await runSync(rewritten);
    const item = await db.items.get(id);
    expect(item?.updatedAt).toBe('2030-01-01T00:00:00.000Z');
    expect(item?.syncStatus).toBe('synced');
  });
});
