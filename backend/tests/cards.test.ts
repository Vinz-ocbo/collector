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
  artist: 'Test Artist',
  releasedAt: '2009-07-17',
  prices: { eur: 1.5, updatedAt: '2026-01-01T00:00:00Z' },
  meta: {
    manaCost: '{R}',
    cmc: 1,
    colors: ['R'],
    colorIdentity: ['R'],
    typeLine: 'Instant',
    oracleText: 'Lightning Bolt deals 3 damage to any target.',
    layout: 'normal',
  },
};

function makeStubClient(overrides: Partial<ScryfallClient> = {}): ScryfallClient {
  return {
    searchCards: vi.fn().mockResolvedValue({ cards: [sampleCard], total: 1, hasMore: false }),
    getCardById: vi.fn().mockResolvedValue(sampleCard),
    getCardRulings: vi.fn().mockResolvedValue({ rulings: [] }),
    getSets: vi.fn().mockResolvedValue({ sets: [] }),
    getSetByCode: vi.fn().mockRejectedValue(new ScryfallNotFoundError('No stub')),
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

describe('GET /v1/cards/search', () => {
  it('returns the search result', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/cards/search?q=lightning',
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.cards).toHaveLength(1);
    expect(body.cards[0].name).toBe('Lightning Bolt');
    expect(body.total).toBe(1);
    expect(body.hasMore).toBe(false);
  });

  it('rejects too-short queries', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/cards/search?q=a' });
    expect(response.statusCode).toBe(400);
  });

  it('rejects missing query', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/cards/search' });
    expect(response.statusCode).toBe(400);
  });

  it('parses csv filters and sort and forwards them to the client', async () => {
    const searchCards = vi
      .fn()
      .mockResolvedValue({ cards: [sampleCard], total: 1, hasMore: false });
    const filteredApp = await buildApp({
      config: loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'silent' }),
      scryfallClient: makeStubClient({ searchCards }),
    });
    const response = await filteredApp.inject({
      method: 'GET',
      url: '/v1/cards/search?q=bolt&setCodes=m21,znr&rarities=rare,mythic&colors=R&sort=price-desc',
    });
    expect(response.statusCode).toBe(200);
    expect(searchCards).toHaveBeenCalledTimes(1);
    expect(searchCards).toHaveBeenCalledWith(
      expect.objectContaining({
        q: 'bolt',
        setCodes: ['m21', 'znr'],
        rarities: ['rare', 'mythic'],
        colors: ['R'],
        sort: 'price-desc',
      }),
    );
    await filteredApp.close();
  });

  it('rejects an invalid sort value', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/cards/search?q=bolt&sort=oldest',
    });
    expect(response.statusCode).toBe(400);
  });

  it('uses the cards repository instead of Scryfall when provided', async () => {
    const repoSearch = vi.fn().mockResolvedValue({
      cards: [{ ...sampleCard, name: 'From DB' }],
      total: 1,
      hasMore: false,
    });
    const repoApp = await buildApp({
      config: loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'silent' }),
      scryfallClient: makeStubClient(),
      cardsRepository: {
        searchCards: repoSearch,
        getCardById: vi.fn().mockResolvedValue(null),
      },
    });
    const response = await repoApp.inject({
      method: 'GET',
      url: '/v1/cards/search?q=bolt',
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().cards[0].name).toBe('From DB');
    expect(repoSearch).toHaveBeenCalledTimes(1);
    await repoApp.close();
  });
});

describe('GET /v1/cards/:id', () => {
  it('returns the card', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/cards/card-1' });
    expect(response.statusCode).toBe(200);
    expect(response.json().name).toBe('Lightning Bolt');
  });

  it('serves from the repository when a hit, skipping Scryfall', async () => {
    const repoGet = vi.fn().mockResolvedValue({ ...sampleCard, name: 'From DB' });
    const scryfallGet = vi.fn().mockResolvedValue(sampleCard);
    const repoApp = await buildApp({
      config: loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'silent' }),
      scryfallClient: makeStubClient({ getCardById: scryfallGet }),
      cardsRepository: {
        searchCards: vi.fn().mockResolvedValue({ cards: [], total: 0, hasMore: false }),
        getCardById: repoGet,
      },
    });
    const response = await repoApp.inject({ method: 'GET', url: '/v1/cards/card-1' });
    expect(response.statusCode).toBe(200);
    expect(response.json().name).toBe('From DB');
    expect(scryfallGet).not.toHaveBeenCalled();
    await repoApp.close();
  });

  it('falls back to Scryfall when the repository misses', async () => {
    const repoGet = vi.fn().mockResolvedValue(null);
    const scryfallGet = vi.fn().mockResolvedValue({ ...sampleCard, name: 'From Scryfall' });
    const repoApp = await buildApp({
      config: loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'silent' }),
      scryfallClient: makeStubClient({ getCardById: scryfallGet }),
      cardsRepository: {
        searchCards: vi.fn().mockResolvedValue({ cards: [], total: 0, hasMore: false }),
        getCardById: repoGet,
      },
    });
    const response = await repoApp.inject({ method: 'GET', url: '/v1/cards/card-2' });
    expect(response.statusCode).toBe(200);
    expect(response.json().name).toBe('From Scryfall');
    expect(repoGet).toHaveBeenCalledTimes(1);
    expect(scryfallGet).toHaveBeenCalledTimes(1);
    await repoApp.close();
  });

  it('maps NotFoundError to 404', async () => {
    const failingApp = await buildApp({
      config: loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'silent' }),
      scryfallClient: makeStubClient({
        getCardById: vi.fn().mockRejectedValue(new ScryfallNotFoundError('Nope')),
      }),
    });
    const response = await failingApp.inject({ method: 'GET', url: '/v1/cards/missing' });
    expect(response.statusCode).toBe(404);
    expect(response.json().message).toBe('Nope');
    await failingApp.close();
  });

  it('maps upstream 5xx to 502', async () => {
    const failingApp = await buildApp({
      config: loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'silent' }),
      scryfallClient: makeStubClient({
        getCardById: vi.fn().mockRejectedValue(new ScryfallUpstreamError('Boom', 503)),
      }),
    });
    const response = await failingApp.inject({ method: 'GET', url: '/v1/cards/anything' });
    expect(response.statusCode).toBe(502);
    await failingApp.close();
  });
});

describe('GET /v1/cards/:id/rulings', () => {
  it('returns the rulings list', async () => {
    const getCardRulings = vi.fn().mockResolvedValue({
      rulings: [
        { source: 'wotc', publishedAt: '2009-10-01', comment: 'Ruling 1' },
        { source: 'wotc', publishedAt: '2010-01-15', comment: 'Ruling 2' },
      ],
    });
    const rulingsApp = await buildApp({
      config: loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'silent' }),
      scryfallClient: makeStubClient({ getCardRulings }),
    });
    const response = await rulingsApp.inject({
      method: 'GET',
      url: '/v1/cards/abc/rulings',
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.rulings).toHaveLength(2);
    expect(body.rulings[0].comment).toBe('Ruling 1');
    expect(getCardRulings).toHaveBeenCalledWith('abc');
    await rulingsApp.close();
  });

  it('returns 404 when the card is unknown to Scryfall', async () => {
    const failingApp = await buildApp({
      config: loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'silent' }),
      scryfallClient: makeStubClient({
        getCardRulings: vi.fn().mockRejectedValue(new ScryfallNotFoundError('No card')),
      }),
    });
    const response = await failingApp.inject({
      method: 'GET',
      url: '/v1/cards/missing/rulings',
    });
    expect(response.statusCode).toBe(404);
    await failingApp.close();
  });
});
