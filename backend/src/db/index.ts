/**
 * Database client. Imports must stay side-effect-free — the pool is created
 * lazily so `app.ts` can boot without a DATABASE_URL set (proxy-only mode).
 */

import pg from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';

export type Db = NodePgDatabase<typeof schema>;

export type DbHandle = {
  db: Db;
  pool: pg.Pool;
  close: () => Promise<void>;
};

export function createDb(databaseUrl: string): DbHandle {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema });
  return {
    db,
    pool,
    close: () => pool.end(),
  };
}

export { schema };
export * from './schema.js';
