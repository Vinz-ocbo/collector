import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.ts';
import { loadConfig } from '../src/config.ts';
import {
  ScryfallNotFoundError,
  type ScryfallClient,
} from '../src/services/scryfall.ts';
import type { BulkIngestService } from '../src/services/scryfall-bulk.ts';

function makeStubScryfall(): ScryfallClient {
  return {
    searchCards: vi.fn().mockResolvedValue({ cards: [], total: 0, hasMore: false }),
    getCardById: vi.fn().mockRejectedValue(new ScryfallNotFoundError('No stub')),
    getSets: vi.fn().mockResolvedValue({ sets: [] }),
    getSetByCode: vi.fn().mockRejectedValue(new ScryfallNotFoundError('No stub')),
    getBulkDataInfo: vi.fn().mockRejectedValue(new ScryfallNotFoundError('No stub')),
  };
}

const stubIngest: BulkIngestService = {
  syncSets: vi.fn().mockResolvedValue({ upserted: 12, durationMs: 5 }),
  syncCards: vi.fn().mockResolvedValue({ processed: 1234, batches: 3, durationMs: 99 }),
  syncAll: vi
    .fn()
    .mockResolvedValue({
      sets: { upserted: 12, durationMs: 5 },
      cards: { processed: 1234, batches: 3, durationMs: 99 },
    }),
};

const ADMIN_TOKEN = 'test-token';
// Fake Db proxy so app.ts mounts admin routes without spinning up Postgres.
// The route uses only the injected `ingest` stub, never the db directly.
const fakeDb = {} as never;

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp({
    config: {
      ...loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'silent' }),
      ADMIN_TOKEN,
    },
    scryfallClient: makeStubScryfall(),
    db: fakeDb,
    ingest: stubIngest,
  });
});

afterAll(async () => {
  await app.close();
});

describe('POST /admin/scryfall/sync — auth', () => {
  it('rejects requests without an Authorization header (401)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/admin/scryfall/sync',
      payload: {},
    });
    expect(response.statusCode).toBe(401);
  });

  it('rejects requests with the wrong token (403)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/admin/scryfall/sync',
      headers: { Authorization: 'Bearer wrong' },
      payload: {},
    });
    expect(response.statusCode).toBe(403);
  });
});

describe('POST /admin/scryfall/sync — body', () => {
  it('runs syncAll by default and returns the combined stats', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/admin/scryfall/sync',
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      payload: {},
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.kind).toBe('all');
    expect(body.sets.upserted).toBe(12);
    expect(body.cards.processed).toBe(1234);
  });

  it('runs only the sets sync when kind=sets', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/admin/scryfall/sync',
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      payload: { kind: 'sets' },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.kind).toBe('sets');
    expect(body.cards).toBeUndefined();
    expect(body.sets.upserted).toBe(12);
  });

  it('runs only the cards sync when kind=cards', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/admin/scryfall/sync',
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      payload: { kind: 'cards' },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.kind).toBe('cards');
    expect(body.sets).toBeUndefined();
    expect(body.cards.processed).toBe(1234);
  });

  it('rejects an invalid kind', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/admin/scryfall/sync',
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      payload: { kind: 'oops' },
    });
    expect(response.statusCode).toBe(400);
  });
});

describe('admin routes mount conditions', () => {
  it('does not register admin routes when ADMIN_TOKEN is unset', async () => {
    const noAdminApp = await buildApp({
      config: loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'silent' }),
      scryfallClient: makeStubScryfall(),
      db: fakeDb,
      ingest: stubIngest,
    });
    const response = await noAdminApp.inject({
      method: 'POST',
      url: '/admin/scryfall/sync',
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      payload: {},
    });
    expect(response.statusCode).toBe(404);
    await noAdminApp.close();
  });
});
