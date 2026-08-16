import { Request, Response, NextFunction } from 'express';
import { verifyAuthToken, AuthTokenPayload } from '../utils/Jwt';

/**
 * Verifies the `Authorization: Bearer <token>` header and attaches the
 * decoded payload to `req.user`. Responds 401 if the header is missing or
 * the token is invalid/expired. Does not check role - use `authorize` for that.
 */
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
    } catch (error: any) {
        res.status(401).json({ message: 'Invalid or expired token', error: error.message });
    }
}

/**
 * Role gate - must run after `authenticate`. Responds 403 if the
 * authenticated user's type isn't in the allowed list.
 */
export function authorize(...allowedTypes: AuthTokenPayload['type'][]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            // Defensive - should never happen if `authenticate` ran first.
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