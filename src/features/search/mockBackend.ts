/**
 * Mock search backend — searches the local Dexie `cards` table. Dev-only.
 *
 * Replaced by a real backend Scryfall proxy implementation later. The
 * `SearchBackend` interface stays the same.
 */

import { db } from '@/shared/db';
import type { Card, CardSet } from '@/shared/domain';
import type { SearchBackend, SearchFilter, SearchInput, SearchResult, SearchSort } from './types';

function score(card: Card, q: string): number {
  if (!q) return 0;
  const name = card.name.toLowerCase();
  const meta = card.meta as { typeLine?: string; oracleText?: string } | undefined;
  const oracle = (meta?.oracleText ?? '').toLowerCase();
  const typeLine = (meta?.typeLine ?? '').toLowerCase();
  let s = 0;
  if (name === q) s += 100;
  else if (name.startsWith(q)) s += 60;
  else if (name.includes(q)) s += 40;
  if (typeLine.includes(q)) s += 10;
  if (oracle.includes(q)) s += 5;
  if (card.setCode.toLowerCase().includes(q)) s += 5;
  return s;
}

function passesFilter(
  card: Card,
  filter: SearchFilter | undefined,
  ownedIds: Set<string>,
): boolean {
  if (!filter) return true;
  if (filter.game && card.game !== filter.game) return false;
  if (filter.setCodes?.length && !filter.setCodes.includes(card.setCode)) return false;
  if (filter.rarities?.length && !filter.rarities.includes(card.rarity)) return false;
  if (filter.colors?.length) {
    const meta = card.meta as { colors?: string[] } | undefined;
    const colors = meta?.colors ?? [];
    const wantColorless = filter.colors.includes('C');
    if (colors.length === 0) {
      if (!wantColorless) return false;
    } else if (!colors.some((c) => filter.colors!.includes(c))) {
      return false;
    }
  }
  if (filter.hideOwned && ownedIds.has(card.id)) return false;
  return true;
}

function compare(a: Card, b: Card, q: string, sort: SearchSort): number {
  switch (sort) {
    case 'relevance':
      return score(b, q) - score(a, q) || a.name.localeCompare(b.name);
    case 'name-asc':
      return a.name.localeCompare(b.name);
    case 'name-desc':
      return b.name.localeCompare(a.name);
    case 'price-desc':
      return (b.prices.eur ?? 0) - (a.prices.eur ?? 0);
    case 'price-asc':
      return (a.prices.eur ?? 0) - (b.prices.eur ?? 0);
    default:
      return 0;
  }
}

export function createMockSearchBackend(): SearchBackend {
  return {
    async searchCards(input: SearchInput): Promise<SearchResult> {
      const q = input.query.trim().toLowerCase();
      const sort = input.sort ?? 'relevance';
      const limit = input.limit ?? 50;

      const [cards, items] = await Promise.all([db.cards.toArray(), db.items.toArray()]);
      const ownedIds = new Set(items.map((i) => i.cardId));

      const candidates = cards.filter((c) => passesFilter(c, input.filter, ownedIds));
      const matched = q
        ? candidates.filter((c) => score(c, q) > 0)
        : // No query → return everything, useful for "browse" / suggestions
          candidates;
      matched.sort((a, b) => compare(a, b, q, sort));

      return {
        cards: matched.slice(0, limit),
        total: matched.length,
      };
    },

    async getCardById(id: string): Promise<Card | null> {
      return (await db.cards.get(id)) ?? null;
    },

    async getSets(): Promise<CardSet[]> {
      // The mock has no separate `sets` table — synthesize stubs from the
      // distinct setCodes present in the local cards table. Used by the
      // filter sheet so the dev UX stays close to production.
      const cards = await db.cards.toArray();
      const seen = new Map<string, CardSet>();
      for (const card of cards) {
        if (seen.has(card.setCode)) continue;
        seen.set(card.setCode, {
          id: `mock-${card.setCode}`,
          game: card.game,
          code: card.setCode,
          name: card.setName,
          setType: 'expansion',
          cardCount: 0,
          digital: false,
          iconSvgUri: '',
        });
      }
      return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
    },
  };
}
