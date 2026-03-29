import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../errors/app-error.js';
import { logger } from '../lib/logger.js';

export const notFoundHandler = (req: Request, res: Response) => {
   res.status(404).json({
      error: `Route not found: ${req.method} ${req.originalUrl}`,
   });
};

export const errorHandler = (
   error: unknown,
   req: Request,
   res: Response,
   _next: NextFunction
) => {
   if (error instanceof SyntaxError && 'body' in error) {
      logger.warn('Invalid JSON payload received', {
         requestId: res.locals.requestId,
         method: req.method,
         path: req.originalUrl,
      });
      res.status(400).json({ error: 'Invalid JSON payload.' });
      return;
   }

   if (error instanceof AppError) {
      logger.warn('Handled application error', {
         requestId: res.locals.requestId,
         method: req.method,
         path: req.originalUrl,
         statusCode: error.statusCode,
         error: error.message,
      });
      res.status(error.statusCode).json({
         error: error.message,
         details: error.details,
      });
      return;
   }

   logger.error('Unhandled server error', {
      requestId: res.locals.requestId,
      method: req.method,
      path: req.originalUrl,
      error: error instanceof Error ? error.message : String(error),
   });
   res.status(500).json({ error: 'Internal server error.' });
};
