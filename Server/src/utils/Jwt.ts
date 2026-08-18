import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { IUserModel } from '../daos/UserDao';

export interface AuthTokenPayload {
    id: string;
    type: 'ADMIN' | 'EMPLOYEE' | 'PATRON';
    email: string;
}

const EXPIRES_IN: SignOptions['expiresIn'] =
    (process.env.JWT_EXPIRES_IN as SignOptions['expiresIn']) || '7d';

export function signAuthToken(user: IUserModel): string {
    const payload: AuthTokenPayload = {
        id: user.id,
        type: user.type,
        email: user.email
    };

    return jwt.sign(payload, config.jwtSecret, { expiresIn: EXPIRES_IN });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
    // jwt.verify throws (TokenExpiredError / JsonWebTokenError) on any
    // invalid/expired token - callers are expected to catch that.
    return jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
}