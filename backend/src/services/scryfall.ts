/**
 * Scryfall client. Enforces the constraints from .clinerules-dev §2:
 *  - identifiable User-Agent
 *  - server-side rate limit (Scryfall asks ≤ 10 req/s — we use 8 to leave headroom)
 *  - in-memory LRU cache (search 5 min, individual cards 1 hour)
 */

import { LRUCache } from 'lru-cache';
import type { FastifyBaseLogger } from 'fastify';
import type { Config } from '../config.js';
import type { CardDto, SearchResultDto, SearchSort } from '../schemas/cards.js';
import type { SetDto, SetListDto } from '../schemas/sets.js';

export type ScryfallImageUris = {
  small: string;
  normal: string;
  large: string;
  png: string;
  art_crop: string;
  border_crop: string;
};

export type ScryfallCard = {
  id: string;
  /**
   * Shared across language printings — stable per logical card. Absent on
   * reversible cards, tokens, and art-series printings.
   */
  oracle_id?: string;
  name: string;
  set: string;
  set_name: string;
  collector_number: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'mythic' | 'special' | 'bonus';
  lang: string;
  image_uris?: ScryfallImageUris;
  card_faces?: { image_uris?: ScryfallImageUris }[];
  artist?: string;
  released_at: string;
  mana_cost?: string;
  cmc?: number;
  colors?: string[];
  color_identity?: string[];
  type_line?: string;
  oracle_text?: string;
  power?: string;
  toughness?: string;
  loyalty?: string;
  layout: string;
  prices?: { eur?: string | null; usd?: string | null };
};

export type ScryfallBulkDataEntry = {
  id: string;
  type: 'oracle_cards' | 'unique_artwork' | 'default_cards' | 'all_cards' | 'rulings';
  download_uri: string;
  updated_at: string;
  size: number;
  content_type: string;
};

type ScryfallBulkDataListResponse = {
  object: 'list';
  data: ScryfallBulkDataEntry[];
};

type ScryfallSearchResponse = {
  object: 'list';
  total_cards: number;
  has_more: boolean;
  next_page?: string;
  data: ScryfallCard[];
};

type ScryfallSet = {
  id: string;
  code: string;
  name: string;
  set_type: string;
  card_count: number;
  printed_size?: number;
  released_at?: string;
  digital: boolean;
  icon_svg_uri: string;
  block_code?: string;
  block?: string;
  parent_set_code?: string;
};

type ScryfallSetListResponse = {
  object: 'list';
  has_more: boolean;
  data: ScryfallSet[];
};

type ScryfallError = {
  object: 'error';
  status: number;
  code: string;
  details: string;
};

export class ScryfallNotFoundError extends Error {
  readonly status = 404;
  constructor(message = 'Card not found') {
    super(message);
    this.name = 'ScryfallNotFoundError';
  }
}

export class ScryfallUpstreamError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ScryfallUpstreamError';
  }
}

/**
 * Simple FIFO throttle: each request waits its turn so we never exceed
 * `requestsPerSecond` outgoing calls.
 */
function createThrottle(requestsPerSecond: number) {
  const minIntervalMs = 1000 / requestsPerSecond;
  let nextAvailable = 0;
  return async function throttle<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const wait = Math.max(0, nextAvailable - now);
    nextAvailable = Math.max(now, nextAvailable) + minIntervalMs;
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    return fn();
  };
}

export type SearchCardsInput = {
  q: string;
  page: number;
  limit: number;
  sort?: SearchSort | undefined;
  setCodes?: string[] | undefined;
  rarities?: string[] | undefined;
  colors?: string[] | undefined;
};

export type ScryfallClient = {
  searchCards(input: SearchCardsInput): Promise<SearchResultDto>;
  getCardById(id: string): Promise<CardDto>;
  getSets(): Promise<SetListDto>;
  getSetByCode(code: string): Promise<SetDto>;
  /** Fetches the bulk-data manifest entry for the given dump type. */
  getBulkDataInfo(type: ScryfallBulkDataEntry['type']): Promise<ScryfallBulkDataEntry>;
};

/**
 * Map our sort enum to Scryfall's `order` + `dir` query params.
 * See https://scryfall.com/docs/syntax — order accepts:
 * name, set, released, rarity, color, usd, eur, tix, cmc, power, toughness…
 * EUR is preferred over USD for the EU-targeted UI.
 *
 * Exported for unit tests.
 */
export function sortToScryfall(sort: SearchSort | undefined): {
  order: string;
  dir?: 'asc' | 'desc';
} {
  switch (sort) {
    case 'name-desc':
      return { order: 'name', dir: 'desc' };
    case 'price-desc':
      return { order: 'eur', dir: 'desc' };
    case 'price-asc':
      return { order: 'eur', dir: 'asc' };
    case 'name-asc':
    case 'relevance':
    case undefined:
    default:
      return { order: 'name' };
  }
}

/**
 * Compose a Scryfall search query string from the user query plus filters.
 * Multiple values inside a category are OR'd; categories are AND'd.
 * E.g. q="lightning", setCodes=[m21,znr], rarities=[rare,mythic] →
 *   "lightning (set:m21 OR set:znr) (r:rare OR r:mythic)"
 *
 * Exported for unit tests.
 */
export function composeQuery(input: SearchCardsInput): string {
  const parts: string[] = [input.q];
  const ors = (field: string, values: string[] | undefined): void => {
    if (!values?.length) return;
    parts.push(`(${values.map((v) => `${field}:${v}`).join(' OR ')})`);
  };
  ors('set', input.setCodes);
  ors('r', input.rarities);
  ors('c', input.colors);
  return parts.join(' ');
}

export function createScryfallClient(config: Config, logger: FastifyBaseLogger): ScryfallClient {
  const throttle = createThrottle(config.SCRYFALL_RATE_LIMIT_PER_SECOND);
  const searchCache = new LRUCache<string, SearchResultDto>({
    max: 500,
    ttl: 5 * 60 * 1000,
  });
  const cardCache = new LRUCache<string, CardDto>({
    max: 5000,
    ttl: 60 * 60 * 1000,
  });
  // Sets rarely change — long TTL, small cap (one entry for the full list,
  // a few hundred for individual sets).
  const setListCache = new LRUCache<string, SetListDto>({
    max: 1,
    ttl: 24 * 60 * 60 * 1000,
  });
  const setCache = new LRUCache<string, SetDto>({
    max: 1000,
    ttl: 24 * 60 * 60 * 1000,
  });

  async function fetchJson<T>(path: string, params?: URLSearchParams): Promise<T> {
    const url = new URL(path, config.SCRYFALL_BASE_URL);
    if (params) url.search = params.toString();

    const response = await throttle(() =>
      fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': config.SCRYFALL_USER_AGENT,
        },
      }),
    );

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as Partial<ScryfallError>;
      if (response.status === 404) throw new ScryfallNotFoundError(body.details);
      throw new ScryfallUpstreamError(
        body.details ?? response.statusText,
        response.status,
        body.code,
      );
    }

    return (await response.json()) as T;
  }

  function getImageUris(card: ScryfallCard): ScryfallImageUris {
    if (card.image_uris) return card.image_uris;
    const face = card.card_faces?.[0];
    if (face?.image_uris) return face.image_uris;
    // Fallback: empty strings — frontend will show a placeholder.
    return { small: '', normal: '', large: '', png: '', art_crop: '', border_crop: '' };
  }

  function toDto(card: ScryfallCard): CardDto {
    const images = getImageUris(card);
    const eurStr = card.prices?.eur;
    const usdStr = card.prices?.usd;
    return {
      id: card.id,
      game: 'magic',
      name: card.name,
      setCode: card.set.toUpperCase(),
      setName: card.set_name,
      collectorNumber: card.collector_number,
      rarity: card.rarity,
      language: card.lang,
      imageUris: {
        small: images.small,
        normal: images.normal,
        large: images.large,
        png: images.png,
      },
      ...(card.artist ? { artist: card.artist } : {}),
      releasedAt: card.released_at,
      prices: {
        ...(eurStr ? { eur: Number(eurStr) } : {}),
        ...(usdStr ? { usd: Number(usdStr) } : {}),
        updatedAt: new Date().toISOString(),
      },
      meta: {
        ...(card.mana_cost ? { manaCost: card.mana_cost } : {}),
        cmc: card.cmc ?? 0,
        colors: card.colors ?? [],
        colorIdentity: card.color_identity ?? [],
        typeLine: card.type_line ?? '',
        ...(card.oracle_text ? { oracleText: card.oracle_text } : {}),
        ...(card.power ? { power: card.power } : {}),
        ...(card.toughness ? { toughness: card.toughness } : {}),
        ...(card.loyalty ? { loyalty: card.loyalty } : {}),
        layout: card.layout,
      },
    };
  }

  function setToDto(set: ScryfallSet): SetDto {
    return {
      id: set.id,
      game: 'magic',
      code: set.code.toLowerCase(),
      name: set.name,
      setType: set.set_type,
      cardCount: set.card_count,
      ...(set.printed_size !== undefined ? { printedSize: set.printed_size } : {}),
      ...(set.released_at ? { releasedAt: set.released_at } : {}),
      digital: set.digital,
      iconSvgUri: set.icon_svg_uri,
      ...(set.block_code ? { blockCode: set.block_code } : {}),
      ...(set.block ? { block: set.block } : {}),
      ...(set.parent_set_code ? { parentSetCode: set.parent_set_code } : {}),
    };
  }

  return {
    async searchCards(input) {
      const { page, limit } = input;
      const composedQuery = composeQuery(input);
      const { order, dir } = sortToScryfall(input.sort);
      const cacheKey = [
        composedQuery,
        order,
        dir ?? '',
        String(page),
        String(limit),
      ].join('|');
      const cached = searchCache.get(cacheKey);
      if (cached) {
        logger.debug({ cacheKey }, 'scryfall search cache hit');
        return cached;
      }

      const params = new URLSearchParams({
        q: composedQuery,
        page: String(page),
        order,
        unique: 'cards',
      });
      if (dir) params.set('dir', dir);

      let scryfallResult: ScryfallSearchResponse;
      try {
        scryfallResult = await fetchJson<ScryfallSearchResponse>('/cards/search', params);
      } catch (error) {
        if (error instanceof ScryfallNotFoundError) {
          // Empty search → return empty result rather than 404
          const empty: SearchResultDto = { cards: [], total: 0, hasMore: false };
          searchCache.set(cacheKey, empty);
          return empty;
        }
        throw error;
      }

      const cards = scryfallResult.data.slice(0, limit).map(toDto);
      // Side-effect: prime the per-card cache while we have the data
      for (const card of cards) cardCache.set(card.id, card);

      const result: SearchResultDto = {
        cards,
        total: scryfallResult.total_cards,
        hasMore: scryfallResult.has_more,
        ...(scryfallResult.has_more ? { nextPage: page + 1 } : {}),
      };
      searchCache.set(cacheKey, result);
      return result;
    },

    async getCardById(id) {
      const cached = cardCache.get(id);
      if (cached) {
        logger.debug({ id }, 'scryfall card cache hit');
        return cached;
      }
      const scryfallCard = await fetchJson<ScryfallCard>(`/cards/${id}`);
      const dto = toDto(scryfallCard);
      cardCache.set(id, dto);
      return dto;
    },

    async getSets() {
      const cached = setListCache.get('all');
      if (cached) {
        logger.debug('scryfall sets list cache hit');
        return cached;
      }
      const response = await fetchJson<ScryfallSetListResponse>('/sets');
      const sets = response.data.map(setToDto);
      // Prime the per-set cache while we have the data
      for (const set of sets) setCache.set(set.code, set);
      const dto: SetListDto = { sets };
      setListCache.set('all', dto);
      return dto;
    },

    async getSetByCode(code) {
      const key = code.toLowerCase();
      const cached = setCache.get(key);
      if (cached) {
        logger.debug({ code: key }, 'scryfall set cache hit');
        return cached;
      }
      const scryfallSet = await fetchJson<ScryfallSet>(`/sets/${encodeURIComponent(key)}`);
      const dto = setToDto(scryfallSet);
      setCache.set(key, dto);
      return dto;
    },

    async getBulkDataInfo(type) {
      // Not cached: callers (bulk ingest) want the freshest manifest.
      const response = await fetchJson<ScryfallBulkDataListResponse>('/bulk-data');
      const entry = response.data.find((e) => e.type === type);
      if (!entry) {
        throw new ScryfallNotFoundError(`Bulk data type "${type}" not found`);
      }
      return entry;
    },
  };
}
