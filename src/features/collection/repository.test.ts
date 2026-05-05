import { beforeEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '@/shared/db';
import {
  addItem,
  createBinder,
  deleteItem,
  getItem,
  getSummary,
  listBinders,
  listItems,
  seedDemoData,
  updateItem,
  upsertCards,
} from './repository';
import { buildSeedCards } from './seed';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('collection repository', () => {
  it('adds and lists items', async () => {
    const cards = buildSeedCards();
    await upsertCards(cards);
    const card = cards[0]!;
    await addItem({
      cardId: card.id,
      game: 'magic',
      quantity: 2,
      condition: 'NM',
      foil: false,
      language: 'en',
      binderId: null,
    });
    const items = await listItems();
    expect(items).toHaveLength(1);
    expect(items[0]!.card.name).toBe(card.name);
    expect(items[0]!.quantity).toBe(2);
  });

  it('updates an item', async () => {
    const cards = buildSeedCards();
    await upsertCards(cards);
    const id = await addItem({
      cardId: cards[0]!.id,
      game: 'magic',
      quantity: 1,
      condition: 'NM',
      foil: false,
      language: 'en',
      binderId: null,
    });
    await updateItem(id, { quantity: 4, condition: 'LP', foil: true });
    const item = await getItem(id);
    expect(item?.quantity).toBe(4);
    expect(item?.condition).toBe('LP');
    expect(item?.foil).toBe(true);
    expect(item?.syncStatus).toBe('pending');
  });

  it('deletes an item', async () => {
    const cards = buildSeedCards();
    await upsertCards(cards);
    const id = await addItem({
      cardId: cards[0]!.id,
      game: 'magic',
      quantity: 1,
      condition: 'NM',
      foil: false,
      language: 'en',
      binderId: null,
    });
    await deleteItem(id);
    expect(await getItem(id)).toBeNull();
  });

  it('upserts the card when it is passed along (catalog flow)', async () => {
    // Regression: cards added from a Scryfall search would land in `items`
    // but never in `cards`, so the listItems join silently dropped them.
    const remoteCard = buildSeedCards()[0]!;
    expect(await db.cards.toArray()).toHaveLength(0);

    await addItem({
      card: remoteCard,
      cardId: remoteCard.id,
      game: 'magic',
      quantity: 1,
      condition: 'NM',
      foil: false,
      language: 'en',
      binderId: null,
    });

    const items = await listItems();
    expect(items).toHaveLength(1);
    expect(items[0]!.card.name).toBe(remoteCard.name);
    expect(await db.cards.get(remoteCard.id)).toBeTruthy();
  });

  it('filters by color', async () => {
    await seedDemoData();
    const onlyRed = await listItems({ colors: ['R'] });
    expect(onlyRed.length).toBeGreaterThan(0);
    onlyRed.forEach((i) => {
      const meta = i.card.meta as { colors?: string[] } | undefined;
      expect(meta?.colors ?? []).toContain('R');
    });
  });

  it('filters foil-only', async () => {
    await seedDemoData();
    const foils = await listItems({ foil: 'foil' });
    foils.forEach((i) => expect(i.foil).toBe(true));
  });

  it('searches by name', async () => {
    await seedDemoData();
    const lightning = await listItems({ search: 'lightning' });
    expect(lightning.length).toBeGreaterThan(0);
    lightning.forEach((i) => expect(i.card.name.toLowerCase()).toContain('lightning'));
  });

  it('sorts by price descending', async () => {
    await seedDemoData();
    const sorted = await listItems({}, 'price-desc');
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1]!.card.prices.eur ?? 0).toBeGreaterThanOrEqual(
        sorted[i]!.card.prices.eur ?? 0,
      );
    }
  });

  it('sorts by name ascending', async () => {
    await seedDemoData();
    const sorted = await listItems({}, 'name-asc');
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1]!.card.name.localeCompare(sorted[i]!.card.name)).toBeLessThanOrEqual(0);
    }
  });

  it('seeds demo data idempotently', async () => {
    const first = await seedDemoData();
    expect(first.items).toBeGreaterThan(0);
    const second = await seedDemoData();
    expect(second.items).toBe(0); // already in collection
  });

  it('summarizes the collection', async () => {
    await seedDemoData();
    const summary = await getSummary();
    expect(summary.uniqueCards).toBeGreaterThan(0);
    expect(summary.totalQuantity).toBeGreaterThanOrEqual(summary.uniqueCards);
    expect(summary.totalValueEur).toBeGreaterThan(0);
  });

  it('creates and lists binders', async () => {
    const id = await createBinder({
      name: 'Deck Yuriko',
      icon: '📕',
      position: 0,
    });
    const list = await listBinders();
    expect(list).toHaveLength(1);
    expect(list[0]!.id).toBe(id);
  });
});
