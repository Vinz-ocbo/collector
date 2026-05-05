/**
 * Collection repository — thin layer over Dexie. Pure data, no React.
 *
 * The repository works locally only for now. Once the backend lands, write
 * mutations will also enqueue a SyncTask (see docs/design/specs/transverse.md).
 */

import { db } from '@/shared/db';
import type { Binder, Card, CollectionItem } from '@/shared/domain';
import { buildSeedCards } from './seed';

export type ItemFilter = {
  binderId?: string | null | undefined;
  game?: 'magic' | 'pokemon' | undefined;
  search?: string | undefined;
  colors?: string[] | undefined;
  rarities?: Card['rarity'][] | undefined;
  conditions?: CollectionItem['condition'][] | undefined;
  foil?: 'all' | 'foil' | 'non-foil' | undefined;
  setCodes?: string[] | undefined;
  /** Substring match on `meta.typeLine` — e.g. ["Creature","Land"]. */
  types?: string[] | undefined;
};

export type ItemSort =
  | 'addedAt-desc'
  | 'addedAt-asc'
  | 'name-asc'
  | 'name-desc'
  | 'price-desc'
  | 'price-asc'
  | 'rarity-desc';

export type CollectionItemWithCard = CollectionItem & { card: Card };

function newId(): string {
  return crypto.randomUUID();
}

const rarityOrder: Record<Card['rarity'], number> = {
  mythic: 4,
  rare: 3,
  uncommon: 2,
  common: 1,
  special: 0,
  bonus: 0,
};

function compareItems(
  a: CollectionItemWithCard,
  b: CollectionItemWithCard,
  sort: ItemSort,
): number {
  switch (sort) {
    case 'addedAt-desc':
      return b.addedAt.localeCompare(a.addedAt);
    case 'addedAt-asc':
      return a.addedAt.localeCompare(b.addedAt);
    case 'name-asc':
      return a.card.name.localeCompare(b.card.name);
    case 'name-desc':
      return b.card.name.localeCompare(a.card.name);
    case 'price-desc':
      return (b.card.prices.eur ?? 0) - (a.card.prices.eur ?? 0);
    case 'price-asc':
      return (a.card.prices.eur ?? 0) - (b.card.prices.eur ?? 0);
    case 'rarity-desc':
      return rarityOrder[b.card.rarity] - rarityOrder[a.card.rarity];
    default:
      return 0;
  }
}

function matchesFilter(item: CollectionItemWithCard, filter: ItemFilter): boolean {
  if (filter.game && item.game !== filter.game) return false;
  if (filter.binderId !== undefined) {
    if (filter.binderId === null && item.binderId !== null) return false;
    if (filter.binderId !== null && item.binderId !== filter.binderId) return false;
  }
  if (filter.conditions?.length && !filter.conditions.includes(item.condition)) return false;
  if (filter.foil === 'foil' && !item.foil) return false;
  if (filter.foil === 'non-foil' && item.foil) return false;
  if (filter.setCodes?.length && !filter.setCodes.includes(item.card.setCode)) return false;
  if (filter.rarities?.length && !filter.rarities.includes(item.card.rarity)) {
    return false;
  }
  if (filter.colors?.length) {
    const meta = item.card.meta as { colors?: string[] } | undefined;
    const cardColors = meta?.colors ?? [];
    const wantColorless = filter.colors.includes('C');
    if (cardColors.length === 0) {
      if (!wantColorless) return false;
    } else {
      const hasMatch = cardColors.some((c) => filter.colors!.includes(c));
      if (!hasMatch) return false;
    }
  }
  if (filter.types?.length) {
    const meta = item.card.meta as { typeLine?: string } | undefined;
    const line = meta?.typeLine ?? '';
    if (!filter.types.some((t) => line.includes(t))) return false;
  }
  if (filter.search) {
    const q = filter.search.toLowerCase();
    if (!item.card.name.toLowerCase().includes(q) && !item.card.setCode.toLowerCase().includes(q)) {
      return false;
    }
  }
  return true;
}

export async function listItems(
  filter: ItemFilter = {},
  sort: ItemSort = 'addedAt-desc',
): Promise<CollectionItemWithCard[]> {
  const [items, cards] = await Promise.all([db.items.toArray(), db.cards.toArray()]);
  const cardMap = new Map(cards.map((c) => [c.id, c]));
  const enriched: CollectionItemWithCard[] = [];
  for (const item of items) {
    const card = cardMap.get(item.cardId);
    if (!card) continue;
    enriched.push({ ...item, card });
  }
  return enriched.filter((i) => matchesFilter(i, filter)).sort((a, b) => compareItems(a, b, sort));
}

export async function getItem(id: string): Promise<CollectionItemWithCard | null> {
  const item = await db.items.get(id);
  if (!item) return null;
  const card = await db.cards.get(item.cardId);
  if (!card) return null;
  return { ...item, card };
}

export type AddItemInput = Omit<CollectionItem, 'id' | 'addedAt' | 'updatedAt' | 'syncStatus'> & {
  /**
   * Card metadata to upsert into the local catalog before creating the item.
   * Required when the cardId comes from a remote source (e.g. Scryfall search)
   * — otherwise the Collection list join fails silently and the item appears
   * to be missing.
   */
  card?: Card;
};

export async function addItem(input: AddItemInput): Promise<string> {
  const { card, ...item } = input;
  if (card) {
    await db.cards.put(card);
  }
  const now = new Date().toISOString();
  const id = newId();
  await db.items.add({
    ...item,
    id,
    addedAt: now,
    updatedAt: now,
    syncStatus: 'pending',
  });
  return id;
}

export type UpdateItemInput = {
  quantity?: number | undefined;
  condition?: CollectionItem['condition'] | undefined;
  foil?: boolean | undefined;
  language?: string | undefined;
  binderId?: string | null | undefined;
  pricePaid?: number | undefined;
  notes?: string | undefined;
};

export async function updateItem(id: string, patch: UpdateItemInput): Promise<void> {
  const updatedAt = new Date().toISOString();
  // Dexie's UpdateSpec rejects explicit `undefined` under exactOptionalPropertyTypes.
  // Strip undefined fields before passing.
  const cleaned: Record<string, unknown> = { updatedAt, syncStatus: 'pending' };
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) cleaned[key] = value;
  }
  await db.items.update(id, cleaned);
}

export async function deleteItem(id: string): Promise<void> {
  await db.items.delete(id);
}

export async function upsertCards(cards: Card[]): Promise<void> {
  await db.cards.bulkPut(cards);
}

export async function listBinders(): Promise<Binder[]> {
  return db.binders.orderBy('position').toArray();
}

export async function getOwnedCardIds(): Promise<Set<string>> {
  const items = await db.items.toArray();
  return new Set(items.map((i) => i.cardId));
}

export async function getOwnedCountByCardId(): Promise<Map<string, number>> {
  const items = await db.items.toArray();
  const map = new Map<string, number>();
  for (const item of items) {
    map.set(item.cardId, (map.get(item.cardId) ?? 0) + item.quantity);
  }
  return map;
}

export async function createBinder(
  input: Omit<Binder, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const now = new Date().toISOString();
  const id = newId();
  await db.binders.add({ ...input, id, createdAt: now, updatedAt: now });
  return id;
}

export async function getBinder(id: string): Promise<Binder | null> {
  return (await db.binders.get(id)) ?? null;
}

export type UpdateBinderInput = {
  name?: string | undefined;
  description?: string | undefined;
  icon?: string | undefined;
  position?: number | undefined;
};

export async function updateBinder(id: string, patch: UpdateBinderInput): Promise<void> {
  const existing = await db.binders.get(id);
  if (!existing) throw new Error(`Binder ${id} not found`);
  const next: Binder = {
    ...existing,
    ...(patch.name !== undefined ? { name: patch.name } : {}),
    ...(patch.description !== undefined ? { description: patch.description } : {}),
    ...(patch.icon !== undefined ? { icon: patch.icon } : {}),
    ...(patch.position !== undefined ? { position: patch.position } : {}),
    updatedAt: new Date().toISOString(),
  };
  await db.binders.put(next);
}

/**
 * Deletes a binder and orphans every item that referenced it (sets
 * `binderId` to null). The cards stay in the user's collection — only the
 * grouping disappears, per design spec #14.
 */
export async function deleteBinder(id: string): Promise<{ orphaned: number }> {
  return db.transaction('rw', db.binders, db.items, async () => {
    const orphans = await db.items.where('binderId').equals(id).toArray();
    const now = new Date().toISOString();
    for (const item of orphans) {
      await db.items.update(item.id, { binderId: null, updatedAt: now, syncStatus: 'pending' });
    }
    await db.binders.delete(id);
    return { orphaned: orphans.length };
  });
}

export type BinderSummary = {
  binder: Binder;
  itemCount: number;
  totalQuantity: number;
  totalValueEur: number;
};

/**
 * Returns one row per binder with quick aggregates over its items. Used by
 * the binder list page so each row can show "X cartes · Y €".
 */
export async function listBinderSummaries(): Promise<BinderSummary[]> {
  const [binders, items, cards] = await Promise.all([
    db.binders.orderBy('position').toArray(),
    db.items.toArray(),
    db.cards.toArray(),
  ]);
  const cardsById = new Map(cards.map((c) => [c.id, c]));
  return binders.map((binder) => {
    const owned = items.filter((i) => i.binderId === binder.id);
    const totalQuantity = owned.reduce((sum, i) => sum + i.quantity, 0);
    const totalValueEur = owned.reduce(
      (sum, i) => sum + (cardsById.get(i.cardId)?.prices.eur ?? 0) * i.quantity,
      0,
    );
    return { binder, itemCount: owned.length, totalQuantity, totalValueEur };
  });
}

export type CollectionSummary = {
  totalQuantity: number;
  uniqueCards: number;
  totalValueEur: number;
};

export async function getSummary(): Promise<CollectionSummary> {
  const items = await listItems();
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
  const uniqueCards = new Set(items.map((i) => i.cardId)).size;
  const totalValueEur = items.reduce((sum, i) => sum + (i.card.prices.eur ?? 0) * i.quantity, 0);
  return { totalQuantity, uniqueCards, totalValueEur };
}

/**
 * Dev helper: populate the local DB with a small curated set of cards and
 * one example item for each. Idempotent.
 */
export async function seedDemoData(): Promise<{ cards: number; items: number }> {
  const cards = buildSeedCards();
  await upsertCards(cards);
  const existingItems = await db.items.toArray();
  const existingCardIds = new Set(existingItems.map((i) => i.cardId));
  const now = new Date().toISOString();
  const newItems: CollectionItem[] = cards
    .filter((c) => !existingCardIds.has(c.id))
    .map((c, idx) => ({
      id: newId(),
      cardId: c.id,
      game: 'magic',
      quantity: c.rarity === 'common' ? 4 : c.rarity === 'mythic' ? 1 : 2,
      condition: 'NM',
      foil: idx % 7 === 0,
      language: 'en',
      binderId: null,
      addedAt: now,
      updatedAt: now,
      syncStatus: 'synced',
    }));
  if (newItems.length) await db.items.bulkAdd(newItems);
  return { cards: cards.length, items: newItems.length };
}
