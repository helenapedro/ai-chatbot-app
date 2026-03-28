import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../errors/app-error';

export const notFoundHandler = (req: Request, res: Response) => {
   res.status(404).json({
      error: `Route not found: ${req.method} ${req.originalUrl}`,
   });
};

export const errorHandler = (
   error: unknown,
   _req: Request,
   res: Response,
   _next: NextFunction
) => {
   if (error instanceof SyntaxError && 'body' in error) {
      res.status(400).json({ error: 'Invalid JSON payload.' });
      return;
   }

   if (error instanceof AppError) {
      res.status(error.statusCode).json({
         error: error.message,
         details: error.details,
      });
      return;
   }

   console.error('Unhandled server error:', error);
   res.status(500).json({ error: 'Internal server error.' });
};
