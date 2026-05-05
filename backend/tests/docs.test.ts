import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.ts';
import { loadConfig } from '../src/config.ts';
import {
  ScryfallNotFoundError,
  type ScryfallClient,
} from '../src/services/scryfall.ts';

function makeStubClient(): ScryfallClient {
  return {
    searchCards: vi.fn().mockResolvedValue({ cards: [], total: 0, hasMore: false }),
    getCardById: vi.fn().mockRejectedValue(new ScryfallNotFoundError('No stub')),
    getSets: vi.fn().mockResolvedValue({ sets: [] }),
    getSetByCode: vi.fn().mockRejectedValue(new ScryfallNotFoundError('No stub')),
    getBulkDataInfo: vi.fn().mockRejectedValue(new ScryfallNotFoundError('No stub')),
  };
}

describe('OpenAPI docs', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    // NODE_ENV=test still mounts swagger; production is the only env where it's hidden.
    app = await buildApp({
      config: loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'silent' }),
      scryfallClient: makeStubClient(),
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('exposes the OpenAPI document at /docs/json', async () => {
    const response = await app.inject({ method: 'GET', url: '/docs/json' });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.openapi).toMatch(/^3\./);
    expect(body.info.title).toBe('TCG Collector API');

    const paths = Object.keys(body.paths);
    expect(paths).toContain('/health');
    expect(paths).toContain('/v1/cards/search');
    expect(paths).toContain('/v1/cards/{id}');
    expect(paths).toContain('/v1/sets');
    expect(paths).toContain('/v1/sets/{code}');
  });

  it('mounts the Swagger UI at /docs (redirects or serves)', async () => {
    const response = await app.inject({ method: 'GET', url: '/docs/' });
    // swagger-ui responds 200 with its index page, or 302 to a sub-path.
    // Either is fine — we just want to confirm the prefix is mounted.
    expect([200, 302]).toContain(response.statusCode);
  });
});

describe('OpenAPI docs (production)', () => {
  it('does not mount /docs in production', async () => {
    const prodApp = await buildApp({
      config: loadConfig({ NODE_ENV: 'production', LOG_LEVEL: 'silent' }),
      scryfallClient: makeStubClient(),
    });
    const response = await prodApp.inject({ method: 'GET', url: '/docs/json' });
    expect(response.statusCode).toBe(404);
    await prodApp.close();
  });
});
