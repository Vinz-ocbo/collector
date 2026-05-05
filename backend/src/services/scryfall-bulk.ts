/**
 * Bulk ingest service. Pulls Scryfall's `default_cards` bulk dump (~80 MB
 * uncompressed, ~30 MB gzipped over the wire) and upserts it into the local
 * `cards` table. Sets are pulled from the `/sets` endpoint and upserted into
 * `sets`.
 *
 * The mapping function is exported for unit tests so we can verify the
 * Scryfall→DB shape without standing up Postgres.
 */

import { Readable } from 'node:stream';
import { sql } from 'drizzle-orm';
import type { FastifyBaseLogger } from 'fastify';
import { withParserAsStream } from 'stream-json/streamers/stream-array.js';
import type { Db } from '../db/index.js';
import { cards, sets, type CardInsert, type SetInsert } from '../db/schema.js';
import {
  ScryfallNotFoundError,
  ScryfallUpstreamError,
  type ScryfallCard,
  type ScryfallClient,
  type ScryfallImageUris,
} from './scryfall.js';
import type { SetDto } from '../schemas/sets.js';

const CARD_BATCH_SIZE = 500;
const EMPTY_IMAGES: ScryfallImageUris = {
  small: '',
  normal: '',
  large: '',
  png: '',
  art_crop: '',
  border_crop: '',
};

function getImageUris(card: ScryfallCard): ScryfallImageUris {
  if (card.image_uris) return card.image_uris;
  return card.card_faces?.[0]?.image_uris ?? EMPTY_IMAGES;
}

/** Pure mapper — exported for unit tests. */
export function mapScryfallCardToInsert(card: ScryfallCard, now: Date = new Date()): CardInsert {
  const images = getImageUris(card);
  return {
    id: card.id,
    oracleId: card.oracle_id ?? null,
    game: 'magic',
    name: card.name,
    setCode: card.set.toLowerCase(),
    setName: card.set_name,
    collectorNumber: card.collector_number,
    rarity: card.rarity,
    language: card.lang,
    imageSmall: images.small,
    imageNormal: images.normal,
    imageLarge: images.large,
    imagePng: images.png,
    artist: card.artist ?? null,
    releasedAt: card.released_at,
    priceEur: card.prices?.eur ?? null,
    priceUsd: card.prices?.usd ?? null,
    pricesUpdatedAt: now,
    meta: {
      manaCost: card.mana_cost,
      cmc: card.cmc ?? 0,
      colors: card.colors ?? [],
      colorIdentity: card.color_identity ?? [],
      typeLine: card.type_line ?? '',
      oracleText: card.oracle_text,
      power: card.power,
      toughness: card.toughness,
      loyalty: card.loyalty,
      layout: card.layout,
    },
    updatedAt: now,
  };
}

/** Pure mapper — exported for unit tests. */
export function mapSetDtoToInsert(set: SetDto, now: Date = new Date()): SetInsert {
  return {
    id: set.id,
    game: set.game,
    code: set.code,
    name: set.name,
    setType: set.setType,
    cardCount: set.cardCount,
    printedSize: set.printedSize ?? null,
    releasedAt: set.releasedAt ?? null,
    digital: set.digital,
    iconSvgUri: set.iconSvgUri,
    blockCode: set.blockCode ?? null,
    block: set.block ?? null,
    parentSetCode: set.parentSetCode ?? null,
    updatedAt: now,
  };
}

export type SyncCardsStats = {
  processed: number;
  batches: number;
  durationMs: number;
};

export type SyncSetsStats = {
  upserted: number;
  durationMs: number;
};

export type IngestStats = {
  sets: SyncSetsStats;
  cards: SyncCardsStats;
};

export type BulkIngestService = {
  syncSets(): Promise<SyncSetsStats>;
  syncCards(): Promise<SyncCardsStats>;
  syncAll(): Promise<IngestStats>;
};

export type BulkIngestDeps = {
  db: Db;
  scryfall: ScryfallClient;
  logger: FastifyBaseLogger;
  /** Override the file fetcher (tests). Defaults to global fetch. */
  fetcher?: typeof fetch;
  /** Override the User-Agent (defaults to the same one as the proxy). */
  userAgent: string;
};

export function createBulkIngestService(deps: BulkIngestDeps): BulkIngestService {
  const { db, scryfall, logger, userAgent } = deps;
  const doFetch = deps.fetcher ?? globalThis.fetch.bind(globalThis);

  async function upsertCards(batch: CardInsert[]): Promise<void> {
    if (batch.length === 0) return;
    await db
      .insert(cards)
      .values(batch)
      .onConflictDoUpdate({
        target: cards.id,
        set: {
          oracleId: sql`excluded.oracle_id`,
          game: sql`excluded.game`,
          name: sql`excluded.name`,
          setCode: sql`excluded.set_code`,
          setName: sql`excluded.set_name`,
          collectorNumber: sql`excluded.collector_number`,
          rarity: sql`excluded.rarity`,
          language: sql`excluded.language`,
          imageSmall: sql`excluded.image_small`,
          imageNormal: sql`excluded.image_normal`,
          imageLarge: sql`excluded.image_large`,
          imagePng: sql`excluded.image_png`,
          artist: sql`excluded.artist`,
          releasedAt: sql`excluded.released_at`,
          priceEur: sql`excluded.price_eur`,
          priceUsd: sql`excluded.price_usd`,
          pricesUpdatedAt: sql`excluded.prices_updated_at`,
          meta: sql`excluded.meta`,
          updatedAt: sql`now()`,
        },
      });
  }

  return {
    async syncSets() {
      const start = Date.now();
      const list = await scryfall.getSets();
      const now = new Date();
      const rows = list.sets.map((s) => mapSetDtoToInsert(s, now));
      if (rows.length > 0) {
        await db
          .insert(sets)
          .values(rows)
          .onConflictDoUpdate({
            target: sets.id,
            set: {
              game: sql`excluded.game`,
              code: sql`excluded.code`,
              name: sql`excluded.name`,
              setType: sql`excluded.set_type`,
              cardCount: sql`excluded.card_count`,
              printedSize: sql`excluded.printed_size`,
              releasedAt: sql`excluded.released_at`,
              digital: sql`excluded.digital`,
              iconSvgUri: sql`excluded.icon_svg_uri`,
              blockCode: sql`excluded.block_code`,
              block: sql`excluded.block`,
              parentSetCode: sql`excluded.parent_set_code`,
              updatedAt: sql`now()`,
            },
          });
      }
      const durationMs = Date.now() - start;
      logger.info({ count: rows.length, durationMs }, 'sets ingest done');
      return { upserted: rows.length, durationMs };
    },

    async syncCards() {
      const start = Date.now();
      const info = await scryfall.getBulkDataInfo('default_cards');
      logger.info(
        { url: info.download_uri, sizeBytes: info.size, updatedAt: info.updated_at },
        'downloading bulk cards dump',
      );

      const response = await doFetch(info.download_uri, {
        headers: { 'User-Agent': userAgent, Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new ScryfallUpstreamError(
          `Bulk download failed: ${String(response.status)}`,
          response.status,
        );
      }
      if (!response.body) {
        throw new ScryfallUpstreamError('Bulk download returned no body', 502);
      }

      // The dump is a single JSON array of ~500 MB+. We stream-parse it
      // (stream-json) so we never hold the whole text in memory — Node's max
      // string length (~512 MB) would otherwise blow up on response.json().
      const now = new Date();
      const nodeStream = Readable.fromWeb(response.body);
      const pipeline = nodeStream.pipe(withParserAsStream());

      let processed = 0;
      let batches = 0;
      let buffer: CardInsert[] = [];

      const flush = async (): Promise<void> => {
        if (buffer.length === 0) return;
        const rows = buffer;
        buffer = [];
        await upsertCards(rows);
        processed += rows.length;
        batches += 1;
        if (batches % 20 === 0) {
          logger.info({ processed, batches }, 'cards ingest progress');
        }
      };

      try {
        for await (const chunk of pipeline as AsyncIterable<{ key: number; value: ScryfallCard }>) {
          buffer.push(mapScryfallCardToInsert(chunk.value, now));
          if (buffer.length >= CARD_BATCH_SIZE) {
            await flush();
          }
        }
        await flush();
      } finally {
        nodeStream.destroy();
      }

      const durationMs = Date.now() - start;
      logger.info({ processed, batches, durationMs }, 'cards ingest done');
      return { processed, batches, durationMs };
    },

    async syncAll() {
      const setsStats = await this.syncSets();
      const cardsStats = await this.syncCards();
      return { sets: setsStats, cards: cardsStats };
    },
  };
}

export { ScryfallNotFoundError, ScryfallUpstreamError };
