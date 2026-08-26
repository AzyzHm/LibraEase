import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { IUserModel } from '../daos/UserDao';

export interface AuthTokenPayload {
  id: string;
  type: 'ADMIN' | 'EMPLOYEE' | 'PATRON';
  email: string;
}

const EXPIRES_IN: SignOptions['expiresIn'] = config.jwtExpiresIn as SignOptions['expiresIn'];

export function signAuthToken(user: IUserModel): string {
  const payload: AuthTokenPayload = {
    id: user.id,
    type: user.type,
    email: user.email,
  };

  return jwt.sign(payload, config.jwtSecret, { expiresIn: EXPIRES_IN });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
}
