import express from 'express';

import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { createCorsMiddleware } from './middleware/cors.js';
import { requestLogger } from './middleware/request-logger.js';
import { createRateLimitMiddleware } from './middleware/rate-limit.js';
import router from './routes.js';

export const createApp = () => {
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
   app.use(requestLogger);
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

   return app;
};
