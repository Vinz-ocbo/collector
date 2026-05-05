import { z } from 'zod';

export const setCodeParamSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(10)
    .regex(/^[a-z0-9]+$/i, 'Set code must be alphanumeric'),
});

export const setSchema = z.object({
  id: z.string(),
  game: z.literal('magic'),
  code: z.string(),
  name: z.string(),
  setType: z.string(),
  cardCount: z.number().int(),
  /** Official set size when it differs from cardCount (counts all variants). */
  printedSize: z.number().int().optional(),
  releasedAt: z.string().optional(),
  digital: z.boolean(),
  iconSvgUri: z.string().url(),
  blockCode: z.string().optional(),
  block: z.string().optional(),
  parentSetCode: z.string().optional(),
});

export const setListSchema = z.object({
  sets: z.array(setSchema),
});

export type SetDto = z.infer<typeof setSchema>;
export type SetListDto = z.infer<typeof setListSchema>;
