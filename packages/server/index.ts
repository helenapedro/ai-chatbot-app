import dotenv from 'dotenv';

import { createApp } from './app';
import { env } from './config/env';
import { initializeDatabase } from './db/mysql';
import { logger } from './lib/logger';

dotenv.config();

const app = createApp();

const startServer = async () => {
   await initializeDatabase();

   app.listen(env.PORT, () => {
      logger.info('Server started', {
         port: env.PORT,
         clientOrigin: env.CLIENT_ORIGIN,
         trustProxy: env.TRUST_PROXY,
      });
   });
};

void startServer().catch((error) => {
   logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : String(error),
   });
   process.exit(1);
});
