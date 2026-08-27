import { Request, Response, NextFunction } from 'express';
import { AUTH_COOKIE_NAME, CSRF_COOKIE_NAME } from '../utils/Cookies';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_HEADER = 'x-csrf-token';
const CSRF_EXEMPT_PATHS = new Set(['/auth/login', '/auth/register', '/auth/logout']);

export function verifyCsrf(req: Request, res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  if (CSRF_EXEMPT_PATHS.has(req.path)) {
    next();
    return;
  }

  const hasAuthCookie = Boolean(req.cookies?.[AUTH_COOKIE_NAME]);
  if (!hasAuthCookie) {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({ message: 'Invalid or missing CSRF token' });
    return;
  }

  next();
}
