/**
 * Environment configuration. Centralizes all env access so the rest of the
 * code reads typed values, not raw strings.
 */

import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['silent', 'fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  SCRYFALL_BASE_URL: z.string().url().default('https://api.scryfall.com'),
  SCRYFALL_USER_AGENT: z
    .string()
    .min(1)
    .default('TCGCollector/0.1.0 (dev contact: noreply@tcg-collector.local)'),
  SCRYFALL_RATE_LIMIT_PER_SECOND: z.coerce.number().int().positive().default(8),
  /** Postgres connection string. Optional: only DB-backed features need it. */
  DATABASE_URL: z.string().optional(),
  /** Bearer token gating /admin/* routes. Required when calling them. */
  ADMIN_TOKEN: z.string().optional(),
});

export type Config = z.infer<typeof envSchema> & { corsOrigins: string[] };

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = envSchema.parse(env);
  return {
    ...parsed,
    corsOrigins: parsed.CORS_ORIGINS.split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };
}
