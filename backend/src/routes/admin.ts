import { z } from 'zod';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import type { BulkIngestService } from '../services/scryfall-bulk.js';

const syncBodySchema = z
  .object({
    kind: z.enum(['sets', 'cards', 'all']).default('all'),
  })
  .default({});

const syncResponseSchema = z.object({
  kind: z.enum(['sets', 'cards', 'all']),
  sets: z
    .object({
      upserted: z.number().int(),
      durationMs: z.number().int(),
    })
    .optional(),
  cards: z
    .object({
      processed: z.number().int(),
      batches: z.number().int(),
      durationMs: z.number().int(),
    })
    .optional(),
});

const errorSchema = z.object({
  statusCode: z.number(),
  error: z.string(),
  message: z.string(),
});

export type AdminRoutesDeps = {
  ingest: BulkIngestService;
  /** Bearer token; requests without a matching `Authorization: Bearer …` header are rejected. */
  adminToken: string;
};

export function buildAdminRoutes(deps: AdminRoutesDeps): FastifyPluginAsyncZod {
  // eslint-disable-next-line @typescript-eslint/require-await -- Fastify plugin signature requires async
  return async function adminRoutes(fastify) {
    fastify.addHook('onRequest', (request, reply, done) => {
      const header = request.headers.authorization;
      if (!header || !header.startsWith('Bearer ')) {
        void reply
          .code(401)
          .send({ statusCode: 401, error: 'Unauthorized', message: 'Missing bearer token' });
        return;
      }
      const token = header.slice('Bearer '.length).trim();
      if (token !== deps.adminToken) {
        void reply
          .code(403)
          .send({ statusCode: 403, error: 'Forbidden', message: 'Invalid bearer token' });
        return;
      }
      done();
    });

    fastify.post(
      '/admin/scryfall/sync',
      {
        schema: {
          tags: ['admin'],
          summary: 'Trigger a Scryfall bulk-data ingest into the local DB',
          body: syncBodySchema,
          response: {
            200: syncResponseSchema,
            401: errorSchema,
            403: errorSchema,
          },
        },
      },
      async (request) => {
        const { kind } = request.body;
        if (kind === 'sets') {
          const stats = await deps.ingest.syncSets();
          return { kind, sets: stats };
        }
        if (kind === 'cards') {
          const stats = await deps.ingest.syncCards();
          return { kind, cards: stats };
        }
        const all = await deps.ingest.syncAll();
        return { kind, sets: all.sets, cards: all.cards };
      },
    );
  };
}
