import { defineConfig } from 'drizzle-kit';

// `generate` only reads the schema, so DATABASE_URL is optional here. The
// migrate / push / studio commands will fail loudly if it's actually missing.
const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://placeholder:placeholder@localhost:5432/placeholder';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: databaseUrl },
  strict: true,
  verbose: true,
});
