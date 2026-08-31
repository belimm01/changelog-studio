import { timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// Returns a guard for write endpoints. When no token is configured the guard is
// a no-op, keeping local development and the public demo open; when API_TOKEN is
// set, mutations require a matching `Authorization: Bearer <token>` header.
export function bearerAuth(token: string | undefined): RequestHandler {
  if (!token) return (_req, _res, next) => next();

  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.header('authorization') ?? '';
    const provided = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!provided || !safeEqual(provided, token)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    next();
  };
}
