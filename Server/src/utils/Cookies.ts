import { Response } from 'express';
import crypto from 'crypto';
import { config } from '../config';

export const AUTH_COOKIE_NAME = 'auth_token';
export const CSRF_COOKIE_NAME = 'csrf_token';

const isProduction = process.env.NODE_ENV === 'production';

function parseDurationMs(value: string): number {
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const match = /^(\d+)\s*(s|m|h|d)$/.exec(value.trim());
  if (!match) return SEVEN_DAYS_MS;

  const amount = Number(match[1]);
  const unitMs: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return amount * unitMs[match[2]];
}

const maxAge = parseDurationMs(config.jwtExpiresIn);

function baseCookieOptions() {
  return {
    secure: isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
    maxAge,
    path: '/',
  };
}

export function setAuthCookies(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, { ...baseCookieOptions(), httpOnly: true });

  const csrfToken = crypto.randomBytes(32).toString('hex');
  res.cookie(CSRF_COOKIE_NAME, csrfToken, { ...baseCookieOptions(), httpOnly: false });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, { path: '/' });
  res.clearCookie(CSRF_COOKIE_NAME, { path: '/' });
}
