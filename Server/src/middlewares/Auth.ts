import { Request, Response, NextFunction } from 'express';
import { verifyAuthToken, AuthTokenPayload } from '../utils/Jwt';
import { getErrorMessage } from '../utils/errors';
import { AUTH_COOKIE_NAME } from '../utils/Cookies';

function extractToken(req: Request): string | null {
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
  if (cookieToken) return cookieToken;

  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice('Bearer '.length).trim();
  }

  return null;
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({ message: 'Missing or invalid authentication' });
    return;
  }

  try {
    req.user = verifyAuthToken(token);
    next();
  } catch (error: unknown) {
    res.status(401).json({ message: 'Invalid or expired token', error: getErrorMessage(error) });
  }
}

export function authorize(...allowedTypes: AuthTokenPayload['type'][]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    if (!allowedTypes.includes(req.user.type)) {
      res.status(403).json({ message: 'You do not have permission to perform this action' });
      return;
    }

    next();
  };
}