/**
 * Search domain types and provider interface.
 *
 * Provider-agnostic — the mock implementation searches the local Dexie cards
 * table; a real implementation will hit the backend Scryfall proxy.
 */

import type { Card, CardSet, Game } from '@/shared/domain';

export type Ruling = {
  source: string;
  publishedAt: string;
  comment: string;
};

export type SearchSort = 'relevance' | 'name-asc' | 'name-desc' | 'price-desc' | 'price-asc';

export type SearchFilter = {
  game?: Game | undefined;
  setCodes?: string[] | undefined;
  rarities?: Card['rarity'][] | undefined;
  colors?: string[] | undefined;
  /** Inclusive lower bound on `prices.eur`, in EUR. Cards without a price are excluded when either bound is set. */
  priceMin?: number | undefined;
  /** Inclusive upper bound on `prices.eur`, in EUR. */
  priceMax?: number | undefined;
  /** Hide cards already owned by the current user. */
  hideOwned?: boolean | undefined;
};

export type SearchInput = {
  query: string;
  filter?: SearchFilter | undefined;
  sort?: SearchSort | undefined;
  limit?: number | undefined;
  cursor?: string | undefined;
};

export type SearchResult = {
  cards: Card[];
  nextCursor?: string | undefined;
  total: number;
};

export type SearchBackend = {
  searchCards(input: SearchInput): Promise<SearchResult>;
  getCardById(id: string): Promise<Card | null>;
  /** Lists known sets — used by the set picker in filters. */
  getSets(): Promise<CardSet[]>;
  /** Returns Scryfall rulings for the given card, oldest first. */
  getCardRulings(id: string): Promise<Ruling[]>;
};
