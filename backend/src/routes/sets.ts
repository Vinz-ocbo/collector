import type { FastifyReply } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { setCodeParamSchema, setListSchema, setSchema } from '../schemas/sets.js';
import {
  ScryfallNotFoundError,
  ScryfallUpstreamError,
  type ScryfallClient,
} from '../services/scryfall.js';

export function buildSetsRoutes(scryfall: ScryfallClient): FastifyPluginAsyncZod {
  // eslint-disable-next-line @typescript-eslint/require-await -- Fastify plugin signature requires async
  return async function setsRoutes(fastify) {
    fastify.get(
      '/v1/sets',
      {
        schema: {
          tags: ['sets'],
          summary: 'List all Magic sets known to Scryfall',
          response: { 200: setListSchema },
        },
      },
      async (_request, reply) => {
        try {
          return await scryfall.getSets();
        } catch (error) {
          return mapScryfallError(error, reply);
        }
      },
    );

    fastify.get(
      '/v1/sets/:code',
      {
        schema: {
          tags: ['sets'],
          summary: 'Fetch a single set by code',
          params: setCodeParamSchema,
          response: { 200: setSchema },
        },
      },
      async (request, reply) => {
        try {
          return await scryfall.getSetByCode(request.params.code);
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
