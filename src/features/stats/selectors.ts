/**
 * Stats selectors — pure functions over a list of CollectionItemWithCard.
 *
 * No Dexie, no React, no I/O. Trivially testable. Hooks call these via
 * useMemo on top of useCollectionItems.
 */

import type { Card, CardSet, CollectionItem } from '@/shared/domain';
import type { CollectionItemWithCard } from '@/features/collection';

export type ColorBucket = 'W' | 'U' | 'B' | 'R' | 'G' | 'C' | 'M';

export const COLOR_LABELS: Record<ColorBucket, string> = {
  W: 'Blanc',
  U: 'Bleu',
  B: 'Noir',
  R: 'Rouge',
  G: 'Vert',
  C: 'Incolore',
  M: 'Multicolore',
};

export const COLOR_HEX: Record<ColorBucket, string> = {
  W: '#f4e9c1',
  U: '#3b82f6',
  B: '#374151',
  R: '#dc2626',
  G: '#16a34a',
  C: '#94a3b8',
  M: '#a855f7',
};

const MAGIC_PRIMARY_TYPES = [
  'Creature',
  'Planeswalker',
  'Battle',
  'Enchantment',
  'Artifact',
  'Land',
  'Instant',
  'Sorcery',
  'Tribal',
] as const;
export type PrimaryType = (typeof MAGIC_PRIMARY_TYPES)[number] | 'Other';

const RARITY_ORDER: Card['rarity'][] = ['mythic', 'rare', 'uncommon', 'common', 'special', 'bonus'];

const RARITY_LABELS: Record<Card['rarity'], string> = {
  mythic: 'Mythic',
  rare: 'Rare',
  uncommon: 'Uncommon',
  common: 'Common',
  special: 'Special',
  bonus: 'Bonus',
};

const RARITY_HEX: Record<Card['rarity'], string> = {
  mythic: '#ea580c',
  rare: '#ca8a04',
  uncommon: '#94a3b8',
  common: '#64748b',
  special: '#a855f7',
  bonus: '#a855f7',
};

function getColorBucket(card: Card): ColorBucket {
  const meta = card.meta as { colors?: string[] } | undefined;
  const colors = meta?.colors ?? [];
  if (colors.length === 0) return 'C';
  if (colors.length > 1) return 'M';
  return colors[0] as ColorBucket;
}

function getPrimaryType(card: Card): PrimaryType {
  const meta = card.meta as { typeLine?: string } | undefined;
  const line = meta?.typeLine ?? '';
  for (const type of MAGIC_PRIMARY_TYPES) {
    if (line.includes(type)) return type;
  }
  return 'Other';
}

function itemValueEur(item: CollectionItemWithCard): number {
  return (item.card.prices.eur ?? 0) * item.quantity;
}

// ---------------------------------------------------------------------------

export type StatsOverview = {
  totalQuantity: number;
  uniqueCards: number;
  totalValueEur: number;
  thisMonthAddedQuantity: number;
  topByValue: { item: CollectionItemWithCard; valueEur: number }[];
};

export function computeOverview(
  items: CollectionItemWithCard[],
  now: Date = new Date(),
  topN = 5,
): StatsOverview {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  let totalQuantity = 0;
  let totalValueEur = 0;
  let thisMonthAddedQuantity = 0;
  const cardIds = new Set<string>();
  const valued: { item: CollectionItemWithCard; valueEur: number }[] = [];

  for (const item of items) {
    totalQuantity += item.quantity;
    cardIds.add(item.cardId);
    const value = itemValueEur(item);
    totalValueEur += value;
    if (item.addedAt >= monthStart) thisMonthAddedQuantity += item.quantity;
    valued.push({ item, valueEur: value });
  }

  valued.sort((a, b) => b.valueEur - a.valueEur);

  return {
    totalQuantity,
    uniqueCards: cardIds.size,
    totalValueEur,
    thisMonthAddedQuantity,
    topByValue: valued.slice(0, topN),
  };
}

// ---------------------------------------------------------------------------

export type ColorRow = {
  bucket: ColorBucket;
  label: string;
  color: string;
  count: number;
  totalValueEur: number;
  topCards: CollectionItemWithCard[];
};

export function computeByColor(items: CollectionItemWithCard[], topPerBucket = 3): ColorRow[] {
  const buckets = new Map<
    ColorBucket,
    { count: number; valueEur: number; items: CollectionItemWithCard[] }
  >();
  for (const item of items) {
    const b = getColorBucket(item.card);
    const entry = buckets.get(b) ?? { count: 0, valueEur: 0, items: [] };
    entry.count += item.quantity;
    entry.valueEur += itemValueEur(item);
    entry.items.push(item);
    buckets.set(b, entry);
  }
  const rows: ColorRow[] = [];
  for (const [bucket, entry] of buckets) {
    const sorted = [...entry.items].sort((a, b) => itemValueEur(b) - itemValueEur(a));
    rows.push({
      bucket,
      label: COLOR_LABELS[bucket],
      color: COLOR_HEX[bucket],
      count: entry.count,
      totalValueEur: entry.valueEur,
      topCards: sorted.slice(0, topPerBucket),
    });
  }
  rows.sort((a, b) => b.count - a.count);
  return rows;
}

// ---------------------------------------------------------------------------

export type TypeRow = {
  type: PrimaryType;
  count: number;
};

export function computeByType(items: CollectionItemWithCard[]): TypeRow[] {
  const counts = new Map<PrimaryType, number>();
  for (const item of items) {
    const t = getPrimaryType(item.card);
    counts.set(t, (counts.get(t) ?? 0) + item.quantity);
  }
  const rows: TypeRow[] = [];
  for (const [type, count] of counts) rows.push({ type, count });
  rows.sort((a, b) => b.count - a.count);
  return rows;
}

// ---------------------------------------------------------------------------

export type RarityRow = {
  rarity: Card['rarity'];
  label: string;
  color: string;
  count: number;
  totalValueEur: number;
};

export function computeByRarity(items: CollectionItemWithCard[]): RarityRow[] {
  const counts = new Map<Card['rarity'], { count: number; valueEur: number }>();
  for (const item of items) {
    const entry = counts.get(item.card.rarity) ?? { count: 0, valueEur: 0 };
    entry.count += item.quantity;
    entry.valueEur += itemValueEur(item);
    counts.set(item.card.rarity, entry);
  }
  const rows: RarityRow[] = [];
  for (const [rarity, entry] of counts) {
    rows.push({
      rarity,
      label: RARITY_LABELS[rarity],
      color: RARITY_HEX[rarity],
      count: entry.count,
      totalValueEur: entry.valueEur,
    });
  }
  rows.sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));
  return rows;
}

// ---------------------------------------------------------------------------

export type SetRow = {
  setCode: string;
  setName: string;
  iconSvgUri: string;
  /** Official set size from Scryfall (distinct cards in the printed checklist). */
  totalCards: number;
  /** Distinct cards (by `cardId`) the user owns from this set. */
  ownedUnique: number;
  /** Total quantity owned (sum of `item.quantity`) across all those cards. */
  ownedQuantity: number;
  /** 0–1. `ownedUnique / totalCards`, clamped to 1 in case of weirdness. */
  completion: number;
  /** Estimated EUR value for the items the user owns from this set. */
  totalValueEur: number;
};

/**
 * Joins collection items with the global set catalogue and returns one row
 * per set the user owns at least one card from. Sets the user has nothing in
 * are dropped to keep the list signal-heavy. The denominator uses Scryfall's
 * official `cardCount`; sets whose `cardCount` is 0 or missing are excluded
 * because the percentage would be meaningless.
 */
export function computeBySet(items: CollectionItemWithCard[], sets: CardSet[]): SetRow[] {
  // Scryfall returns set codes in lowercase; the local seed historically used
  // uppercase. Normalize both sides so legacy seed data still joins cleanly.
  const setsByCode = new Map<string, CardSet>();
  for (const s of sets) setsByCode.set(s.code.toLowerCase(), s);

  type Bucket = { uniqueIds: Set<string>; quantity: number; valueEur: number };
  const buckets = new Map<string, Bucket>();
  for (const item of items) {
    const code = item.card.setCode.toLowerCase();
    const bucket = buckets.get(code) ?? { uniqueIds: new Set(), quantity: 0, valueEur: 0 };
    bucket.uniqueIds.add(item.cardId);
    bucket.quantity += item.quantity;
    bucket.valueEur += itemValueEur(item);
    buckets.set(code, bucket);
  }

  const rows: SetRow[] = [];
  for (const [code, bucket] of buckets) {
    const set = setsByCode.get(code);
    // Item references a set we don't know about (e.g. seed data with a fake
    // setCode, or set ingest hasn't run yet) — emit a row but mark it so the
    // UI can render gracefully.
    const totalCards = set?.cardCount ?? 0;
    if (totalCards === 0) {
      rows.push({
        setCode: code,
        setName: set?.name ?? code.toUpperCase(),
        iconSvgUri: set?.iconSvgUri ?? '',
        totalCards: 0,
        ownedUnique: bucket.uniqueIds.size,
        ownedQuantity: bucket.quantity,
        completion: 0,
        totalValueEur: bucket.valueEur,
      });
      continue;
    }
    rows.push({
      setCode: code,
      setName: set!.name,
      iconSvgUri: set!.iconSvgUri,
      totalCards,
      ownedUnique: bucket.uniqueIds.size,
      ownedQuantity: bucket.quantity,
      completion: Math.min(1, bucket.uniqueIds.size / totalCards),
      totalValueEur: bucket.valueEur,
    });
  }

  // Sort: highest completion first, then more cards owned, then alphabetical.
  rows.sort(
    (a, b) =>
      b.completion - a.completion ||
      b.ownedUnique - a.ownedUnique ||
      a.setName.localeCompare(b.setName),
  );
  return rows;
}

// Re-export for tests/consumers
export const __helpers = { getColorBucket, getPrimaryType, itemValueEur };
export type { CollectionItem };
