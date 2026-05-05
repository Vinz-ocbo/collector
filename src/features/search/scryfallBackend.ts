/**
 * HTTP search backend — talks to our Fastify Scryfall proxy.
 *
 * The proxy enforces rate limits, sets the User-Agent and caches responses.
 * The frontend never calls api.scryfall.com directly (per .clinerules-dev §2).
 *
 * `sort`, `setCodes`, `rarities`, and `colors` are pushed down to the proxy.
 * `hideOwned` is applied client-side because ownership lives in the local
 * Dexie `items` table; `filter.game` is ignored (the proxy only knows Magic).
 */

import { db } from '@/shared/db';
import type { Card, CardSet } from '@/shared/domain';
import type { Ruling, SearchBackend, SearchInput, SearchResult } from './types';

type ApiSearchResult = {
  cards: Card[];
  total: number;
  hasMore: boolean;
  nextPage?: number;
};

export type ScryfallSearchBackendOptions = {
  baseUrl: string;
  /** Override fetch for tests. Defaults to the global `fetch`. */
  fetcher?: typeof fetch;
};

export class SearchBackendError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'SearchBackendError';
  }
}

const MIN_QUERY_LENGTH = 2;
const MAX_LIMIT = 50;

export function createScryfallSearchBackend(opts: ScryfallSearchBackendOptions): SearchBackend {
  const baseUrl = opts.baseUrl.replace(/\/$/, '');
  const doFetch = opts.fetcher ?? globalThis.fetch.bind(globalThis);

  async function call<T>(path: string): Promise<T> {
    const response = await doFetch(`${baseUrl}${path}`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new SearchBackendError(response.status, `${response.status} ${response.statusText}`);
    }
    return (await response.json()) as T;
  }

  return {
    async searchCards(input: SearchInput): Promise<SearchResult> {
      const q = input.query.trim();
      // Backend requires q.length >= 2; guard here to avoid a wasted 400.
      if (q.length < MIN_QUERY_LENGTH) return { cards: [], total: 0 };

      const limit = Math.min(input.limit ?? MAX_LIMIT, MAX_LIMIT);
      const page = input.cursor ? Math.max(1, Number.parseInt(input.cursor, 10) || 1) : 1;
      const params = new URLSearchParams({
        q,
        page: String(page),
        limit: String(limit),
      });
      // 'relevance' is the default — omit it to keep cache keys aligned and URLs clean.
      if (input.sort && input.sort !== 'relevance') params.set('sort', input.sort);
      const filter = input.filter;
      if (filter?.setCodes?.length) params.set('setCodes', filter.setCodes.join(','));
      if (filter?.rarities?.length) params.set('rarities', filter.rarities.join(','));
      if (filter?.colors?.length) params.set('colors', filter.colors.join(','));
      if (filter?.priceMin !== undefined) params.set('priceMin', String(filter.priceMin));
      if (filter?.priceMax !== undefined) params.set('priceMax', String(filter.priceMax));

      const data = await call<ApiSearchResult>(`/v1/cards/search?${params.toString()}`);

      let cards = data.cards;
      if (filter?.hideOwned) {
        const items = await db.items.toArray();
        const ownedIds = new Set(items.map((i) => i.cardId));
        cards = cards.filter((c) => !ownedIds.has(c.id));
      }

      return {
        cards,
        total: data.total,
        ...(data.hasMore && data.nextPage !== undefined
          ? { nextCursor: String(data.nextPage) }
          : {}),
      };
    },

    async getCardById(id: string): Promise<Card | null> {
      try {
        return await call<Card>(`/v1/cards/${encodeURIComponent(id)}`);
      } catch (error) {
        if (error instanceof SearchBackendError && error.status === 404) return null;
        throw error;
      }
    },

    async getSets(): Promise<CardSet[]> {
      const data = await call<{ sets: CardSet[] }>('/v1/sets');
      return data.sets;
    },

    async getCardRulings(id: string): Promise<Ruling[]> {
      try {
        const data = await call<{ rulings: Ruling[] }>(
          `/v1/cards/${encodeURIComponent(id)}/rulings`,
        );
        return data.rulings;
      } catch (error) {
        // 404 → no rulings (treat as empty list rather than error)
        if (error instanceof SearchBackendError && error.status === 404) return [];
        throw error;
      }
    },
  };
}
