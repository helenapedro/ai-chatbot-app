import type { NextFunction, Request, Response } from 'express';

type RateLimitOptions = {
   limit: number;
   windowMs: number;
};

type RateLimitEntry = {
   count: number;
   expiresAt: number;
};

export const createRateLimitMiddleware = ({
   limit,
   windowMs,
}: RateLimitOptions) => {
   const requestsByIp = new Map<string, RateLimitEntry>();

   return (req: Request, res: Response, next: NextFunction) => {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const now = Date.now();
      const currentEntry = requestsByIp.get(ip);

      if (!currentEntry || currentEntry.expiresAt <= now) {
         requestsByIp.set(ip, {
            count: 1,
            expiresAt: now + windowMs,
         });
         next();
         return;
      }

      if (currentEntry.count >= limit) {
         const retryAfterSeconds = Math.ceil(
            (currentEntry.expiresAt - now) / 1000
         );
         res.setHeader('Retry-After', retryAfterSeconds.toString());
         res.status(429).json({
            error: 'Too many requests. Please try again later.',
         });
         return;
      }

      currentEntry.count += 1;
      next();
   };
};
