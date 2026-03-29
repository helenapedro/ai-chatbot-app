import type { NextFunction, Request, Response } from 'express';

type CorsOptions = {
   allowedOrigins: string[];
};

const normalizeOrigin = (origin: string) => origin.trim().replace(/\/+$/, '');

export const createCorsMiddleware = ({ allowedOrigins }: CorsOptions) => {
   const normalizedOrigins = allowedOrigins
      .map(normalizeOrigin)
      .filter(Boolean);

   return (req: Request, res: Response, next: NextFunction) => {
      const origin = req.headers.origin;

      if (!origin) {
         next();
         return;
      }

      const normalizedRequestOrigin = normalizeOrigin(origin);

      if (!normalizedOrigins.includes(normalizedRequestOrigin)) {
         res.status(403).json({ error: 'Origin not allowed.' });
         return;
      }

      res.header('Access-Control-Allow-Origin', origin);
      res.header('Vary', 'Origin');
      res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
         res.sendStatus(204);
         return;
      }

      next();
   };
};
