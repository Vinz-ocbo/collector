import type { FastifyReply } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { cardIdParamSchema, cardSchema, searchQuerySchema, searchResultSchema } from '../schemas/cards.js';
import {
  ScryfallNotFoundError,
  ScryfallUpstreamError,
  type ScryfallClient,
} from '../services/scryfall.js';
import type { CardsRepository } from '../services/cards-repository.js';

export type CardsRoutesDeps = {
  scryfall: ScryfallClient;
  /**
   * Optional Postgres-backed repository. When set, `searchCards` is served
   * exclusively from the DB (DB is the source of truth once ingested).
   * `getCardById` tries the DB first and falls back to Scryfall on miss so
   * cards released after the last sync still resolve.
   */
  repository?: CardsRepository;
};

export function buildCardsRoutes(deps: CardsRoutesDeps): FastifyPluginAsyncZod {
  const { scryfall, repository } = deps;
  // eslint-disable-next-line @typescript-eslint/require-await -- Fastify plugin signature requires async
  return async function cardsRoutes(fastify) {
    fastify.get(
      '/v1/cards/search',
      {
        schema: {
          tags: ['cards'],
          summary: 'Search cards (DB when ingested, Scryfall proxy otherwise)',
          querystring: searchQuerySchema,
          response: { 200: searchResultSchema },
        },
      },
      async (request, reply) => {
        try {
          if (repository) return await repository.searchCards(request.query);
          return await scryfall.searchCards(request.query);
        } catch (error) {
          return mapScryfallError(error, reply);
        }
      },
    );

    fastify.get(
      '/v1/cards/:id',
      {
        schema: {
          tags: ['cards'],
          summary: 'Fetch a single card by id (DB first, Scryfall fallback)',
          params: cardIdParamSchema,
          response: { 200: cardSchema },
        },
      },
      async (request, reply) => {
        try {
          if (repository) {
            const fromDb = await repository.getCardById(request.params.id);
            if (fromDb) return fromDb;
          }
          return await scryfall.getCardById(request.params.id);
        } catch (error) {
          return mapScryfallError(error, reply);
        }
      },
    );
  };
}

function mapScryfallError(error: unknown, reply: FastifyReply) {
  if (error instanceof ScryfallNotFoundError) {
    return reply.code(404).send({ statusCode: 404, error: 'Not Found', message: error.message });
  }
  if (error instanceof ScryfallUpstreamError) {
    const code = error.status >= 500 ? 502 : error.status;
    return reply
      .code(code)
      .send({ statusCode: code, error: 'Bad Gateway', message: error.message });
  }
  throw error;
}
