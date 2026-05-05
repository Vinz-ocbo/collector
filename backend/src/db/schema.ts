/**
 * Drizzle schema. The `game` column is mandatory on every domain table from
 * day one (per .clinerules-dev §3) so adding a second TCG never requires a
 * structural migration.
 */

import { boolean, index, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const sets = pgTable(
  'sets',
  {
    /** Scryfall id (uuid string). */
    id: text('id').primaryKey(),
    game: text('game').notNull(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    setType: text('set_type').notNull(),
    cardCount: integer('card_count').notNull(),
    /** Official set size when it differs from cardCount. */
    printedSize: integer('printed_size'),
    releasedAt: text('released_at'),
    digital: boolean('digital').notNull(),
    iconSvgUri: text('icon_svg_uri').notNull(),
    blockCode: text('block_code'),
    block: text('block'),
    parentSetCode: text('parent_set_code'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    byGameCode: index('sets_game_code_idx').on(t.game, t.code),
  }),
);

export const cards = pgTable(
  'cards',
  {
    /** Scryfall printing id — language-specific. */
    id: text('id').primaryKey(),
    /**
     * Scryfall oracle id — shared across language printings. Used for
     * cross-language "already owned" matching once the multilingual feature
     * lands (see memory/multilingual-cards.md). Nullable because reversible
     * cards, tokens, and art-series printings don't carry one.
     */
    oracleId: text('oracle_id'),
    game: text('game').notNull(),
    name: text('name').notNull(),
    setCode: text('set_code').notNull(),
    setName: text('set_name').notNull(),
    collectorNumber: text('collector_number').notNull(),
    rarity: text('rarity').notNull(),
    language: text('language').notNull(),
    imageSmall: text('image_small').notNull(),
    imageNormal: text('image_normal').notNull(),
    imageLarge: text('image_large').notNull(),
    imagePng: text('image_png').notNull(),
    artist: text('artist'),
    releasedAt: text('released_at').notNull(),
    /** Stored as text to preserve Scryfall's exact decimal representation. */
    priceEur: text('price_eur'),
    priceUsd: text('price_usd'),
    pricesUpdatedAt: timestamp('prices_updated_at', { withTimezone: true }).notNull(),
    /** Game-specific metadata as JSONB so other TCGs can reuse the table. */
    meta: jsonb('meta').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    byGameName: index('cards_game_name_idx').on(t.game, t.name),
    byGameOracle: index('cards_game_oracle_idx').on(t.game, t.oracleId),
    byGameSetLang: index('cards_game_set_lang_idx').on(t.game, t.setCode, t.language),
  }),
);

export type SetRow = typeof sets.$inferSelect;
export type SetInsert = typeof sets.$inferInsert;
export type CardRow = typeof cards.$inferSelect;
export type CardInsert = typeof cards.$inferInsert;
