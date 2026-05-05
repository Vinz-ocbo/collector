import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { ZodError } from 'zod';
import type { Config } from './config.js';
import { createDb, type Db, type DbHandle } from './db/index.js';
import { createScryfallClient, type ScryfallClient } from './services/scryfall.js';
import { createBulkIngestService, type BulkIngestService } from './services/scryfall-bulk.js';
import { createCardsRepository, type CardsRepository } from './services/cards-repository.js';
import { healthRoutes } from './routes/health.js';
import { buildCardsRoutes } from './routes/cards.js';
import { buildSetsRoutes } from './routes/sets.js';
import { buildAdminRoutes } from './routes/admin.js';

export type BuildAppOptions = {
  config: Config;
  /** Override the default Scryfall client (useful in tests). */
  scryfallClient?: ScryfallClient;
  /**
   * Override the database. When omitted, a pool is created from
   * `config.DATABASE_URL` if set; otherwise the app boots in proxy-only mode
   * and admin routes are not registered.
   */
  db?: Db;
  /** Override the ingest service (tests). */
  ingest?: BulkIngestService;
  /** Override the cards repository (tests). When set, search hits the DB. */
  cardsRepository?: CardsRepository;
};

export async function buildApp(options: BuildAppOptions): Promise<FastifyInstance> {
  const { config } = options;

  const fastify = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      ...(config.NODE_ENV === 'development'
        ? { transport: { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss' } } }
        : {}),
      // Never log secrets or large bodies
      redact: ['req.headers.authorization', 'req.headers.cookie'],
    },
  }).withTypeProvider<ZodTypeProvider>();

  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  await fastify.register(cors, {
    origin: config.corsOrigins,
    credentials: true,
  });

  // OpenAPI docs — only mounted outside production. The Zod schemas attached
  // to each route are converted to JSON Schema by `jsonSchemaTransform`.
  if (config.NODE_ENV !== 'production') {
    await fastify.register(swagger, {
      openapi: {
        info: {
          title: 'TCG Collector API',
          description: 'Scryfall proxy + future collection sync. Dev/staging only.',
          version: '0.1.0',
        },
        servers: [
          {
            url: `http://${config.HOST === '0.0.0.0' ? 'localhost' : config.HOST}:${String(config.PORT)}`,
          },
        ],
        tags: [
          { name: 'health', description: 'Liveness probe' },
          { name: 'cards', description: 'Card lookup and search (Scryfall proxy)' },
          { name: 'sets', description: 'Set listing and lookup (Scryfall proxy)' },
          { name: 'admin', description: 'Bearer-protected admin operations (DB ingest)' },
        ],
      },
      transform: jsonSchemaTransform,
    });
    await fastify.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: { docExpansion: 'list', deepLinking: true },
    });
  }

  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid request',
        issues: error.issues,
      });
    }
    request.log.error({ err: error }, 'unhandled error');
    const statusCodeRaw = (error as { statusCode?: unknown }).statusCode;
    const status = typeof statusCodeRaw === 'number' ? statusCodeRaw : 500;
    const message = error instanceof Error ? error.message : 'Unknown error';
    return reply.code(status).send({
      statusCode: status,
      error: status >= 500 ? 'Internal Server Error' : 'Error',
      message: status >= 500 && config.NODE_ENV === 'production' ? 'Something went wrong' : message,
    });
  });

  const scryfall = options.scryfallClient ?? createScryfallClient(config, fastify.log);

  // DB-backed features. Optional: when DATABASE_URL is unset, the app stays
  // in proxy-only mode and admin routes are not exposed.
  let dbHandle: DbHandle | undefined;
  let db: Db | undefined = options.db;
  if (!db && config.DATABASE_URL) {
    dbHandle = createDb(config.DATABASE_URL);
    db = dbHandle.db;
    fastify.addHook('onClose', async () => {
      await dbHandle?.close();
    });
  }

  // When a DB is wired, route search exclusively through the cards
  // repository; getCardById falls back to Scryfall on miss inside the route.
  const cardsRepository: CardsRepository | undefined =
    options.cardsRepository ?? (db ? createCardsRepository(db) : undefined);

  await fastify.register(healthRoutes);
  await fastify.register(
    buildCardsRoutes({
      scryfall,
      ...(cardsRepository ? { repository: cardsRepository } : {}),
    }),
  );
  await fastify.register(buildSetsRoutes(scryfall));

  if (db && config.ADMIN_TOKEN) {
    const ingest =
      options.ingest ??
      createBulkIngestService({
        db,
        scryfall,
        logger: fastify.log,
        userAgent: config.SCRYFALL_USER_AGENT,
      });
    await fastify.register(buildAdminRoutes({ ingest, adminToken: config.ADMIN_TOKEN }));
  } else if (config.ADMIN_TOKEN && !db) {
    fastify.log.warn(
      'ADMIN_TOKEN is set but DATABASE_URL is not — admin routes will not be mounted',
    );
  }

  return fastify;
}
