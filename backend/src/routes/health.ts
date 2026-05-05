import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

// eslint-disable-next-line @typescript-eslint/require-await -- Fastify plugin signature requires async
export const healthRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get(
    '/health',
    {
      schema: {
        tags: ['health'],
        summary: 'Liveness probe',
        response: {
          200: z.object({
            status: z.literal('ok'),
            uptime: z.number(),
            timestamp: z.string(),
          }),
        },
      },
    },
    () => ({
      status: 'ok' as const,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }),
  );
};
