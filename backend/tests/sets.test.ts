import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.ts';
import { loadConfig } from '../src/config.ts';
import {
  ScryfallNotFoundError,
  ScryfallUpstreamError,
  type ScryfallClient,
} from '../src/services/scryfall.ts';
import type { CardDto } from '../src/schemas/cards.ts';
import type { SetDto } from '../src/schemas/sets.ts';

const sampleSet: SetDto = {
  id: 'set-uuid-1',
  game: 'magic',
  code: 'dom',
  name: 'Dominaria',
  setType: 'expansion',
  cardCount: 280,
  printedSize: 269,
  releasedAt: '2018-04-27',
  digital: false,
  iconSvgUri: 'https://svgs.scryfall.io/sets/dom.svg',
};

const sampleCard: CardDto = {
  id: 'card-1',
  game: 'magic',
  name: 'Lightning Bolt',
  setCode: 'M10',
  setName: 'Magic 2010',
  collectorNumber: '146',
  rarity: 'common',
  language: 'en',
  imageUris: {
    small: 'https://example.test/s.jpg',
    normal: 'https://example.test/n.jpg',
    large: 'https://example.test/l.jpg',
    png: 'https://example.test/p.png',
  },
  releasedAt: '2009-07-17',
  prices: { updatedAt: '2026-01-01T00:00:00Z' },
  meta: {
    cmc: 1,
    colors: ['R'],
    colorIdentity: ['R'],
    typeLine: 'Instant',
    layout: 'normal',
  },
};

function makeStubClient(overrides: Partial<ScryfallClient> = {}): ScryfallClient {
  return {
    searchCards: vi.fn().mockResolvedValue({ cards: [sampleCard], total: 1, hasMore: false }),
    getCardById: vi.fn().mockResolvedValue(sampleCard),
    getSets: vi.fn().mockResolvedValue({ sets: [sampleSet] }),
    getSetByCode: vi.fn().mockResolvedValue(sampleSet),
    getBulkDataInfo: vi.fn().mockRejectedValue(new ScryfallNotFoundError('No stub')),
    ...overrides,
  };
}

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp({
    config: loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'silent' }),
    scryfallClient: makeStubClient(),
  });
});

afterAll(async () => {
  await app.close();
});

describe('GET /v1/sets', () => {
  it('returns the list of sets', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/sets' });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.sets).toHaveLength(1);
    expect(body.sets[0].code).toBe('dom');
  });
});

describe('GET /v1/sets/:code', () => {
  it('returns the set for a known code', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/sets/dom' });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.code).toBe('dom');
    expect(body.printedSize).toBe(269);
  });

  it('rejects malformed codes', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/sets/!!!' });
    expect(response.statusCode).toBe(400);
  });

  it('maps NotFoundError to 404', async () => {
    const failingApp = await buildApp({
      config: loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'silent' }),
      scryfallClient: makeStubClient({
        getSetByCode: vi.fn().mockRejectedValue(new ScryfallNotFoundError('Unknown set')),
      }),
    });
    const response = await failingApp.inject({ method: 'GET', url: '/v1/sets/zzz' });
    expect(response.statusCode).toBe(404);
    expect(response.json().message).toBe('Unknown set');
    await failingApp.close();
  });

  it('maps upstream 5xx to 502', async () => {
    const failingApp = await buildApp({
      config: loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'silent' }),
      scryfallClient: makeStubClient({
        getSetByCode: vi.fn().mockRejectedValue(new ScryfallUpstreamError('Down', 503)),
      }),
    });
    const response = await failingApp.inject({ method: 'GET', url: '/v1/sets/dom' });
    expect(response.statusCode).toBe(502);
    await failingApp.close();
  });
});
