import { beforeEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '@/shared/db';
import { seedDemoData } from '@/features/collection';
import { createMockSearchBackend } from './mockBackend';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('mockSearchBackend', () => {
  it('returns no results when the catalog is empty', async () => {
    const backend = createMockSearchBackend();
    const result = await backend.searchCards({ query: 'lightning' });
    expect(result.cards).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('finds cards by name', async () => {
    await seedDemoData();
    const backend = createMockSearchBackend();
    const result = await backend.searchCards({ query: 'lightning' });
    expect(result.cards.length).toBeGreaterThan(0);
    expect(result.cards.map((c) => c.name)).toContain('Lightning Bolt');
  });

  it('finds cards by oracle text', async () => {
    await seedDemoData();
    const backend = createMockSearchBackend();
    const result = await backend.searchCards({ query: 'counter target spell' });
    expect(result.cards.map((c) => c.name)).toContain('Counterspell');
  });

  it('orders by relevance: exact name beats partial', async () => {
    await seedDemoData();
    const backend = createMockSearchBackend();
    const result = await backend.searchCards({ query: 'Lightning Bolt' });
    expect(result.cards[0]?.name).toBe('Lightning Bolt');
  });

  it('respects hideOwned filter', async () => {
    await seedDemoData();
    const backend = createMockSearchBackend();
    const all = await backend.searchCards({ query: 'lightning' });
    const filtered = await backend.searchCards({
      query: 'lightning',
      filter: { hideOwned: true },
    });
    // seedDemoData adds a collection item per card → all are owned
    expect(all.total).toBeGreaterThan(0);
    expect(filtered.total).toBe(0);
  });

  it('sorts by price descending', async () => {
    await seedDemoData();
    const backend = createMockSearchBackend();
    const result = await backend.searchCards({ query: '', sort: 'price-desc' });
    for (let i = 1; i < result.cards.length; i++) {
      expect(result.cards[i - 1]?.prices.eur ?? 0).toBeGreaterThanOrEqual(
        result.cards[i]?.prices.eur ?? 0,
      );
    }
  });

  it('returns null for unknown card id', async () => {
    const backend = createMockSearchBackend();
    expect(await backend.getCardById('not-a-real-id')).toBeNull();
  });

  it('returns the card by id', async () => {
    await seedDemoData();
    const backend = createMockSearchBackend();
    const card = await backend.getCardById('seed-lightning-bolt');
    expect(card?.name).toBe('Lightning Bolt');
  });

  it('paginates by limit', async () => {
    await seedDemoData();
    const backend = createMockSearchBackend();
    const result = await backend.searchCards({ query: '', limit: 3 });
    expect(result.cards).toHaveLength(3);
    expect(result.total).toBeGreaterThan(3);
  });
});
