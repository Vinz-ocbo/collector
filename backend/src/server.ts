/**
 * Entry point. `npm run dev` boots this via `tsx watch`.
 */

import { buildApp } from './app.js';
import { loadConfig } from './config.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const app = await buildApp({ config });

  try {
    await app.listen({ port: config.PORT, host: config.HOST });
  } catch (error) {
    app.log.error({ err: error }, 'failed to start');
    process.exit(1);
  }

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => {
      app.log.info({ signal }, 'received signal, closing');
      void app.close().then(() => process.exit(0));
    });
  }
}

void main();
