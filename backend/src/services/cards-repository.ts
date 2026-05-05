/**
 * Postgres-backed card lookup. Used by the cards routes when DATABASE_URL is
 * configured and the bulk ingest has been run at least once. Falls back to
 * the Scryfall client for ids unknown to the DB (cards released after the
 * last sync) but never for search — search is DB-authoritative once enabled.
 */

import { and, asc, count, desc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';
import type { Db } from '../db/index.js';
import { cards, type CardRow } from '../db/schema.js';
import type { CardDto, SearchResultDto } from '../schemas/cards.js';
import type { SearchCardsInput } from './scryfall.js';

type StoredMeta = {
  manaCost?: string;
  cmc: number;
  colors: string[];
  colorIdentity: string[];
  typeLine: string;
  oracleText?: string;
  power?: string;
  toughness?: string;
  loyalty?: string;
  layout: string;
};

/** Exported for unit tests. */
export function rowToDto(row: CardRow): CardDto {
  const meta = row.meta as StoredMeta;
  return {
    id: row.id,
    game: 'magic',
    name: row.name,
    setCode: row.setCode.toUpperCase(),
    setName: row.setName,
    collectorNumber: row.collectorNumber,
    rarity: row.rarity as CardDto['rarity'],
    language: row.language,
    imageUris: {
      small: row.imageSmall,
      normal: row.imageNormal,
      large: row.imageLarge,
      png: row.imagePng,
    },
    ...(row.artist ? { artist: row.artist } : {}),
    releasedAt: row.releasedAt,
    prices: {
      ...(row.priceEur ? { eur: Number(row.priceEur) } : {}),
      ...(row.priceUsd ? { usd: Number(row.priceUsd) } : {}),
      updatedAt: row.pricesUpdatedAt.toISOString(),
    },
    meta: {
      ...(meta.manaCost ? { manaCost: meta.manaCost } : {}),
      cmc: meta.cmc,
      colors: meta.colors,
      colorIdentity: meta.colorIdentity,
      typeLine: meta.typeLine,
      ...(meta.oracleText ? { oracleText: meta.oracleText } : {}),
      ...(meta.power ? { power: meta.power } : {}),
      ...(meta.toughness ? { toughness: meta.toughness } : {}),
      ...(meta.loyalty ? { loyalty: meta.loyalty } : {}),
      layout: meta.layout,
    },
  };
}

export type CardsRepository = {
  searchCards(input: SearchCardsInput): Promise<SearchResultDto>;
  getCardById(id: string): Promise<CardDto | null>;
};

export function createCardsRepository(db: Db): CardsRepository {
  return {
    async searchCards(input) {
      const { q, page, limit } = input;
      const offset = (page - 1) * limit;

      const conditions: SQL[] = [eq(cards.game, 'magic')];
      const trimmed = q.trim();
      if (trimmed) {
        conditions.push(ilike(cards.name, `%${trimmed}%`));
      }
      if (input.setCodes?.length) {
        conditions.push(
          inArray(
            cards.setCode,
            input.setCodes.map((s) => s.toLowerCase()),
          ),
        );
      }
      if (input.rarities?.length) {
        conditions.push(inArray(cards.rarity, input.rarities));
      }
      if (input.colors?.length) {
        // OR-join: "card has at least one of the requested colors". Each clause
        // uses the JSONB containment operator so the planner can use a GIN
        // index on `meta` later if we add one.
        const clauses: SQL[] = input.colors.map(
          (c) => sql`${cards.meta}->'colors' @> ${JSON.stringify([c])}::jsonb`,
        );
        const combined = or(...clauses);
        if (combined) conditions.push(combined);
      }

      const where = and(...conditions);

      const orderBy: SQL[] = (() => {
        switch (input.sort) {
          case 'name-desc':
            return [desc(cards.name), desc(cards.id)];
          case 'price-desc':
            return [sql`${cards.priceEur}::numeric DESC NULLS LAST`, asc(cards.name)];
          case 'price-asc':
            return [sql`${cards.priceEur}::numeric ASC NULLS LAST`, asc(cards.name)];
          case 'name-asc':
          case 'relevance':
          case undefined:
          default:
            // True relevance ranking would need a tsvector — for now we mirror
            // Scryfall's default `order=name` so behaviour is predictable.
            return [asc(cards.name), asc(cards.id)];
        }
      })();

      const [{ total } = { total: 0 }, rows] = await Promise.all([
        db
          .select({ total: count() })
          .from(cards)
          .where(where)
          .then((r) => r[0]),
        db
          .select()
          .from(cards)
          .where(where)
          .orderBy(...orderBy)
          .limit(limit)
          .offset(offset),
      ]);

      const dto = rows.map(rowToDto);
      const totalCount = Number(total);
      const hasMore = offset + dto.length < totalCount;
      return {
        cards: dto,
        total: totalCount,
        hasMore,
        ...(hasMore ? { nextPage: page + 1 } : {}),
      };
    },

    async getCardById(id) {
      const rows = await db.select().from(cards).where(eq(cards.id, id)).limit(1);
      const row = rows[0];
      return row ? rowToDto(row) : null;
    },
  };
}
