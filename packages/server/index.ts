import express from 'express';
import dotenv from 'dotenv';

import { env } from './config/env';
import { initializeDatabase } from './db/mysql';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { createCorsMiddleware } from './middleware/cors';
import { createRateLimitMiddleware } from './middleware/rate-limit';
import router from './routes';

dotenv.config();

const app = express();
app.disable('x-powered-by');

if (env.TRUST_PROXY) {
   app.set('trust proxy', 1);
}

app.use(
   createCorsMiddleware({
      allowedOrigins: env.CLIENT_ORIGIN.split(','),
   })
);
app.use(express.json({ limit: env.JSON_BODY_LIMIT }));
app.use(
   createRateLimitMiddleware({
      limit: env.RATE_LIMIT_MAX_REQUESTS,
      windowMs: env.RATE_LIMIT_WINDOW_MS,
   })
);
app.use(router);
app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
   await initializeDatabase();

   app.listen(env.PORT, () => {
      console.log(`Server is running on http://localhost:${env.PORT}`);
   });
};

void startServer().catch((error) => {
   console.error('Failed to start server:', error);
   process.exit(1);
});
