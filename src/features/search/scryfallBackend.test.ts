import 'fake-indexeddb/auto';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { db } from '@/shared/db';
import type { Card } from '@/shared/domain';
import { createScryfallSearchBackend, SearchBackendError } from './scryfallBackend';

const BASE_URL = 'http://api.test';

const sampleCard: Card = {
  id: 'card-1',
  game: 'magic',
  name: 'Lightning Bolt',
  setCode: 'M10',
  setName: 'Magic 2010',
  collectorNumber: '146',
  rarity: 'common',
  language: 'en',
  imageUris: {
    small: 'https://img.test/s.jpg',
    normal: 'https://img.test/n.jpg',
    large: 'https://img.test/l.jpg',
    png: 'https://img.test/p.png',
  },
  releasedAt: '2009-07-17',
  prices: { eur: 1.5, updatedAt: '2026-01-01T00:00:00Z' },
  meta: {
    cmc: 1,
    colors: ['R'],
    colorIdentity: ['R'],
    typeLine: 'Instant',
    layout: 'normal',
  },
};

const otherCard: Card = { ...sampleCard, id: 'card-2', name: 'Counterspell' };

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('createScryfallSearchBackend.searchCards', () => {
  it('hits /v1/cards/search and returns the result', async () => {
    server.use(
      http.get(`${BASE_URL}/v1/cards/search`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('q')).toBe('lightning');
        expect(url.searchParams.get('page')).toBe('1');
        expect(url.searchParams.get('limit')).toBe('50');
        return HttpResponse.json({
          cards: [sampleCard],
          total: 1,
          hasMore: false,
        });
      }),
    );

    const backend = createScryfallSearchBackend({ baseUrl: BASE_URL });
    const result = await backend.searchCards({ query: 'lightning' });
    expect(result.cards).toEqual([sampleCard]);
    expect(result.total).toBe(1);
    expect(result.nextCursor).toBeUndefined();
  });

  it('forwards sort and CSV filters to the backend', async () => {
    server.use(
      http.get(`${BASE_URL}/v1/cards/search`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('sort')).toBe('price-desc');
        expect(url.searchParams.get('setCodes')).toBe('m21,znr');
        expect(url.searchParams.get('rarities')).toBe('rare,mythic');
        expect(url.searchParams.get('colors')).toBe('R,U');
        return HttpResponse.json({ cards: [sampleCard], total: 1, hasMore: false });
      }),
    );

    const backend = createScryfallSearchBackend({ baseUrl: BASE_URL });
    await backend.searchCards({
      query: 'bolt',
      sort: 'price-desc',
      filter: {
        setCodes: ['m21', 'znr'],
        rarities: ['rare', 'mythic'],
        colors: ['R', 'U'],
      },
    });
  });

  it('omits sort when it is "relevance"', async () => {
    server.use(
      http.get(`${BASE_URL}/v1/cards/search`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.has('sort')).toBe(false);
        return HttpResponse.json({ cards: [], total: 0, hasMore: false });
      }),
    );

    const backend = createScryfallSearchBackend({ baseUrl: BASE_URL });
    await backend.searchCards({ query: 'bolt', sort: 'relevance' });
  });

  it('does not send empty filter arrays', async () => {
    server.use(
      http.get(`${BASE_URL}/v1/cards/search`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.has('setCodes')).toBe(false);
        expect(url.searchParams.has('rarities')).toBe(false);
        expect(url.searchParams.has('colors')).toBe(false);
        return HttpResponse.json({ cards: [], total: 0, hasMore: false });
      }),
    );

    const backend = createScryfallSearchBackend({ baseUrl: BASE_URL });
    await backend.searchCards({
      query: 'bolt',
      filter: { setCodes: [], rarities: [], colors: [] },
    });
  });

  it('translates cursor to page and exposes nextCursor when hasMore', async () => {
    server.use(
      http.get(`${BASE_URL}/v1/cards/search`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('page')).toBe('2');
        return HttpResponse.json({
          cards: [sampleCard],
          total: 100,
          hasMore: true,
          nextPage: 3,
        });
      }),
    );

    const backend = createScryfallSearchBackend({ baseUrl: BASE_URL });
    const result = await backend.searchCards({ query: 'lightning', cursor: '2' });
    expect(result.nextCursor).toBe('3');
  });

  it('returns an empty result for queries shorter than 2 chars without calling the backend', async () => {
    let called = false;
    server.use(
      http.get(`${BASE_URL}/v1/cards/search`, () => {
        called = true;
        return HttpResponse.json({ cards: [], total: 0, hasMore: false });
      }),
    );

    const backend = createScryfallSearchBackend({ baseUrl: BASE_URL });
    const result = await backend.searchCards({ query: 'a' });
    expect(result).toEqual({ cards: [], total: 0 });
    expect(called).toBe(false);
  });

  it('applies hideOwned client-side', async () => {
    server.use(
      http.get(`${BASE_URL}/v1/cards/search`, () =>
        HttpResponse.json({
          cards: [sampleCard, otherCard],
          total: 2,
          hasMore: false,
        }),
      ),
    );

    await db.items.add({
      id: 'item-1',
      cardId: sampleCard.id,
      game: 'magic',
      quantity: 1,
      condition: 'NM',
      foil: false,
      language: 'en',
      binderId: null,
      addedAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      syncStatus: 'synced',
    });

    const backend = createScryfallSearchBackend({ baseUrl: BASE_URL });
    const result = await backend.searchCards({
      query: 'lightning',
      filter: { hideOwned: true },
    });
    expect(result.cards.map((c) => c.id)).toEqual([otherCard.id]);
    // total reflects the server side, not the post-filter count — known
    // limitation, documented for the eventual filter pushdown.
    expect(result.total).toBe(2);
  });

  it('throws SearchBackendError on non-2xx other than 404', async () => {
    server.use(
      http.get(`${BASE_URL}/v1/cards/search`, () =>
        HttpResponse.json({ message: 'Boom' }, { status: 502 }),
      ),
    );

    const backend = createScryfallSearchBackend({ baseUrl: BASE_URL });
    await expect(backend.searchCards({ query: 'lightning' })).rejects.toBeInstanceOf(
      SearchBackendError,
    );
  });
});

describe('createScryfallSearchBackend.getCardById', () => {
  it('returns the card on 200', async () => {
    server.use(http.get(`${BASE_URL}/v1/cards/card-1`, () => HttpResponse.json(sampleCard)));

    const backend = createScryfallSearchBackend({ baseUrl: BASE_URL });
    expect(await backend.getCardById('card-1')).toEqual(sampleCard);
  });

  it('returns null on 404', async () => {
    server.use(
      http.get(`${BASE_URL}/v1/cards/missing`, () =>
        HttpResponse.json({ message: 'Not found' }, { status: 404 }),
      ),
    );

    const backend = createScryfallSearchBackend({ baseUrl: BASE_URL });
    expect(await backend.getCardById('missing')).toBeNull();
  });

  it('throws on 5xx', async () => {
    server.use(
      http.get(`${BASE_URL}/v1/cards/boom`, () =>
        HttpResponse.json({ message: 'Down' }, { status: 502 }),
      ),
    );

    const backend = createScryfallSearchBackend({ baseUrl: BASE_URL });
    await expect(backend.getCardById('boom')).rejects.toBeInstanceOf(SearchBackendError);
  });

  it('encodes ids with special characters', async () => {
    server.use(
      http.get(`${BASE_URL}/v1/cards/:id`, ({ params }) => {
        expect(params.id).toBe('foo/bar');
        return HttpResponse.json(sampleCard);
      }),
    );

    const backend = createScryfallSearchBackend({ baseUrl: BASE_URL });
    await backend.getCardById('foo/bar');
  });

  it('strips trailing slash from baseUrl', async () => {
    server.use(http.get(`${BASE_URL}/v1/cards/card-1`, () => HttpResponse.json(sampleCard)));
    const backend = createScryfallSearchBackend({ baseUrl: `${BASE_URL}/` });
    expect(await backend.getCardById('card-1')).toEqual(sampleCard);
  });
});
