import { Request, Response, NextFunction } from 'express';
import { verifyAuthToken, AuthTokenPayload } from '../utils/Jwt';
import { getErrorMessage } from '../utils/errors';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or malformed Authorization header' });
    return;
  }

  const token = header.slice('Bearer '.length).trim();

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
