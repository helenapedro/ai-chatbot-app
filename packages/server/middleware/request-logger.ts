import type { NextFunction, Request, Response } from 'express';

import { logger } from '../lib/logger.js';

const getClientIp = (req: Request) =>
   req.ip || req.socket.remoteAddress || 'unknown';

export const requestLogger = (
   req: Request,
   res: Response,
   next: NextFunction
) => {
   const requestId = crypto.randomUUID();
   const startedAt = Date.now();

   res.locals.requestId = requestId;
   res.setHeader('X-Request-Id', requestId);

   res.on('finish', () => {
      logger.info('HTTP request completed', {
         requestId,
         method: req.method,
         path: req.originalUrl,
         statusCode: res.statusCode,
         durationMs: Date.now() - startedAt,
         ip: getClientIp(req),
      });
   });

   next();
};
