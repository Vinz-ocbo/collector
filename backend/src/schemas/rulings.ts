import { z } from 'zod';

/**
 * One Scryfall ruling. `source` is "wotc" for Wizards of the Coast official
 * rulings and "scryfall" for community-curated notes. `publishedAt` is
 * `YYYY-MM-DD`. `comment` is the rendered ruling text (HTML-free).
 */
export const rulingSchema = z.object({
  source: z.string(),
  publishedAt: z.string(),
  comment: z.string(),
});

export const rulingListSchema = z.object({
  rulings: z.array(rulingSchema),
});

export type RulingDto = z.infer<typeof rulingSchema>;
export type RulingListDto = z.infer<typeof rulingListSchema>;
