import { describe, expect, it } from 'vitest';
import type { CollectionItemWithCard } from '@/features/collection';
import { computeByColor, computeByRarity, computeByType, computeOverview } from './selectors';

function item(
  partial: Partial<CollectionItemWithCard> & { name: string },
  overrides: { quantity?: number; addedAt?: string } = {},
): CollectionItemWithCard {
  return {
    id: partial.id ?? `item-${partial.name}`,
    cardId: partial.cardId ?? `card-${partial.name}`,
    game: 'magic',
    quantity: overrides.quantity ?? 1,
    condition: 'NM',
    foil: false,
    language: 'en',
    binderId: null,
    addedAt: overrides.addedAt ?? '2026-04-01T00:00:00.000Z',
    updatedAt: overrides.addedAt ?? '2026-04-01T00:00:00.000Z',
    syncStatus: 'synced',
    card: {
      id: partial.cardId ?? `card-${partial.name}`,
      game: 'magic',
      name: partial.name,
      setCode: 'M21',
      setName: 'Core 2021',
      collectorNumber: '1',
      rarity: 'common',
      language: 'en',
      imageUris: { small: '', normal: '', large: '', png: '' },
      releasedAt: '2020-07-03',
      prices: { eur: 1, updatedAt: '2026-01-01' },
      meta: {},
      ...((partial.card ?? {}) as Partial<CollectionItemWithCard['card']>),
    },
    ...partial,
  };
}

describe('computeOverview', () => {
  it('handles empty input', () => {
    const o = computeOverview([]);
    expect(o.totalQuantity).toBe(0);
    expect(o.uniqueCards).toBe(0);
    expect(o.totalValueEur).toBe(0);
    expect(o.topByValue).toEqual([]);
  });

  it('sums quantity, unique ids and value', () => {
    const items = [
      item({ name: 'A', cardId: 'a' }, { quantity: 3 }),
      item({ name: 'A2', cardId: 'a' }, { quantity: 2 }),
      item({ name: 'B', cardId: 'b' }, { quantity: 1 }),
    ];
    const o = computeOverview(items);
    expect(o.totalQuantity).toBe(6);
    expect(o.uniqueCards).toBe(2);
    expect(o.totalValueEur).toBe(6); // 1€ each
  });

  it('counts only items added this calendar month', () => {
    const now = new Date('2026-05-15T12:00:00Z');
    const items = [
      item({ name: 'old' }, { addedAt: '2026-03-15T00:00:00Z', quantity: 5 }),
      item({ name: 'new1' }, { addedAt: '2026-05-01T00:00:00Z', quantity: 2 }),
      item({ name: 'new2' }, { addedAt: '2026-05-10T00:00:00Z', quantity: 1 }),
    ];
    const o = computeOverview(items, now);
    expect(o.thisMonthAddedQuantity).toBe(3);
  });

  it('returns top N items sorted by total value', () => {
    const items = [
      item(
        {
          name: 'Cheap',
          cardId: 'cheap',
          card: {
            id: 'cheap',
            game: 'magic',
            name: 'Cheap',
            setCode: 'X',
            setName: 'X',
            collectorNumber: '1',
            rarity: 'common',
            language: 'en',
            imageUris: { small: '', normal: '', large: '', png: '' },
            releasedAt: '2020-01-01',
            prices: { eur: 1, updatedAt: '2026-01-01' },
            meta: {},
          },
        },
        { quantity: 1 },
      ),
      item(
        {
          name: 'Expensive',
          cardId: 'exp',
          card: {
            id: 'exp',
            game: 'magic',
            name: 'Expensive',
            setCode: 'X',
            setName: 'X',
            collectorNumber: '1',
            rarity: 'mythic',
            language: 'en',
            imageUris: { small: '', normal: '', large: '', png: '' },
            releasedAt: '2020-01-01',
            prices: { eur: 100, updatedAt: '2026-01-01' },
            meta: {},
          },
        },
        { quantity: 1 },
      ),
    ];
    const o = computeOverview(items, new Date(), 1);
    expect(o.topByValue).toHaveLength(1);
    expect(o.topByValue[0]!.item.card.name).toBe('Expensive');
  });
});

describe('computeByColor', () => {
  function colored(name: string, colors: string[], qty = 1) {
    return item(
      {
        name,
        cardId: name,
        card: {
          id: name,
          game: 'magic',
          name,
          setCode: 'X',
          setName: 'X',
          collectorNumber: '1',
          rarity: 'common',
          language: 'en',
          imageUris: { small: '', normal: '', large: '', png: '' },
          releasedAt: '2020-01-01',
          prices: { eur: 1, updatedAt: '2026-01-01' },
          meta: { colors },
        },
      },
      { quantity: qty },
    );
  }

  it('buckets by single color, multicolor, colorless', () => {
    const rows = computeByColor([
      colored('Bolt', ['R'], 2),
      colored('Helix', ['R', 'W']),
      colored('Forest', [], 4),
      colored('Counterspell', ['U']),
    ]);
    const map = Object.fromEntries(rows.map((r) => [r.bucket, r.count]));
    expect(map.R).toBe(2);
    expect(map.U).toBe(1);
    expect(map.M).toBe(1); // multicolor
    expect(map.C).toBe(4); // colorless
  });

  it('sorts buckets by descending count', () => {
    const rows = computeByColor([colored('A', ['U']), colored('B', ['U']), colored('C', ['R'])]);
    expect(rows[0]!.bucket).toBe('U');
    expect(rows[1]!.bucket).toBe('R');
  });

  it('limits topCards per bucket', () => {
    const rows = computeByColor(
      Array.from({ length: 5 }, (_, i) => colored(`R${String(i)}`, ['R'])),
      2,
    );
    expect(rows[0]!.topCards).toHaveLength(2);
  });
});

describe('computeByType', () => {
  function typed(name: string, typeLine: string) {
    return item({
      name,
      cardId: name,
      card: {
        id: name,
        game: 'magic',
        name,
        setCode: 'X',
        setName: 'X',
        collectorNumber: '1',
        rarity: 'common',
        language: 'en',
        imageUris: { small: '', normal: '', large: '', png: '' },
        releasedAt: '2020-01-01',
        prices: { eur: 1, updatedAt: '2026-01-01' },
        meta: { typeLine },
      },
    });
  }

  it('extracts primary type from typeLine', () => {
    const rows = computeByType([
      typed('a', 'Creature — Goblin Scout'),
      typed('b', 'Instant'),
      typed('c', 'Basic Land — Forest'),
      typed('d', 'Artifact Creature — Construct'), // Creature wins (declared first)
    ]);
    const map = Object.fromEntries(rows.map((r) => [r.type, r.count]));
    expect(map.Creature).toBe(2);
    expect(map.Instant).toBe(1);
    expect(map.Land).toBe(1);
  });

  it('returns sorted by descending count', () => {
    const rows = computeByType([
      typed('a', 'Instant'),
      typed('b', 'Instant'),
      typed('c', 'Sorcery'),
    ]);
    expect(rows[0]!.type).toBe('Instant');
  });
});

describe('computeByRarity', () => {
  function withRarity(
    name: string,
    rarity: 'common' | 'uncommon' | 'rare' | 'mythic',
    priceEur = 1,
    qty = 1,
  ) {
    return item(
      {
        name,
        cardId: name,
        card: {
          id: name,
          game: 'magic',
          name,
          setCode: 'X',
          setName: 'X',
          collectorNumber: '1',
          rarity,
          language: 'en',
          imageUris: { small: '', normal: '', large: '', png: '' },
          releasedAt: '2020-01-01',
          prices: { eur: priceEur, updatedAt: '2026-01-01' },
          meta: {},
        },
      },
      { quantity: qty },
    );
  }

  it('aggregates count and value per rarity', () => {
    const rows = computeByRarity([
      withRarity('a', 'common', 0.1, 4),
      withRarity('b', 'mythic', 100),
      withRarity('c', 'rare', 5, 2),
    ]);
    const map = Object.fromEntries(rows.map((r) => [r.rarity, r] as const));
    expect(map.common!.count).toBe(4);
    expect(map.common!.totalValueEur).toBeCloseTo(0.4);
    expect(map.mythic!.totalValueEur).toBe(100);
    expect(map.rare!.totalValueEur).toBe(10);
  });

  it('orders mythic → rare → uncommon → common', () => {
    const rows = computeByRarity([
      withRarity('c', 'common'),
      withRarity('m', 'mythic'),
      withRarity('u', 'uncommon'),
      withRarity('r', 'rare'),
    ]);
    expect(rows.map((r) => r.rarity)).toEqual(['mythic', 'rare', 'uncommon', 'common']);
  });
});
