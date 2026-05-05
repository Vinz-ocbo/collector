import { z } from 'zod';

const csvList = z
  .string()
  .optional()
  .transform((s) =>
    s
      ? s
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean)
      : undefined,
  );

export const searchSortSchema = z.enum([
  'relevance',
  'name-asc',
  'name-desc',
  'price-asc',
  'price-desc',
]);

export const searchQuerySchema = z.object({
  q: z.string().trim().min(2).max(200),
  page: z.coerce.number().int().min(1).max(50).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sort: searchSortSchema.optional(),
  /** Comma-separated set codes — e.g. `setCodes=m21,znr`. */
  setCodes: csvList,
  /** Comma-separated rarities — e.g. `rarities=rare,mythic`. */
  rarities: csvList,
  /** Comma-separated single-letter colors (W/U/B/R/G/C) — e.g. `colors=R,U`. */
  colors: csvList,
  /** Inclusive lower bound on `prices.eur`, in EUR. Cards without a price are filtered out when either bound is set. */
  priceMin: z.coerce.number().min(0).optional(),
  /** Inclusive upper bound on `prices.eur`, in EUR. */
  priceMax: z.coerce.number().min(0).optional(),
});

export type SearchSort = z.infer<typeof searchSortSchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;

export const cardIdParamSchema = z.object({
  id: z.string().trim().min(1).max(64),
});

const imageUrisSchema = z.object({
  small: z.string().url(),
  normal: z.string().url(),
  large: z.string().url(),
  png: z.string().url(),
});

const priceSchema = z.object({
  eur: z.number().optional(),
  usd: z.number().optional(),
  updatedAt: z.string(),
});

const magicMetaSchema = z.object({
  manaCost: z.string().optional(),
  cmc: z.number(),
  colors: z.array(z.string()),
  colorIdentity: z.array(z.string()),
  typeLine: z.string(),
  oracleText: z.string().optional(),
  power: z.string().optional(),
  toughness: z.string().optional(),
  loyalty: z.string().optional(),
  layout: z.string(),
});

export const cardSchema = z.object({
  id: z.string(),
  game: z.literal('magic'),
  name: z.string(),
  setCode: z.string(),
  setName: z.string(),
  collectorNumber: z.string(),
  rarity: z.enum(['common', 'uncommon', 'rare', 'mythic', 'special', 'bonus']),
  language: z.string(),
  imageUris: imageUrisSchema,
  artist: z.string().optional(),
  releasedAt: z.string(),
  prices: priceSchema,
  meta: magicMetaSchema,
});

export const searchResultSchema = z.object({
  cards: z.array(cardSchema),
  total: z.number(),
  hasMore: z.boolean(),
  nextPage: z.number().optional(),
});

export type CardDto = z.infer<typeof cardSchema>;
export type SearchResultDto = z.infer<typeof searchResultSchema>;
