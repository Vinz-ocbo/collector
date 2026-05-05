/**
 * Standalone migration runner. `npm run db:migrate` applies all pending
 * migrations under `./drizzle` to the database pointed to by DATABASE_URL.
 *
 * The drizzle-kit CLI handles migration *generation* (`db:generate`); this
 * script handles application, so we don't need a separate dev dep for it.
 */

import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createDb } from './index.js';

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is required to run migrations.');
    process.exit(1);
  }

  const handle = createDb(databaseUrl);
  console.log('Applying migrations…');
  await migrate(handle.db, { migrationsFolder: './drizzle' });
  console.log('Migrations applied.');
  await handle.close();
}

void main().catch((error: unknown) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
