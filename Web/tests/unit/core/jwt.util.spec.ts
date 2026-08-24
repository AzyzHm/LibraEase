import { decodeJwtExpiry, isJwtExpired } from '../../../src/app/core/utils/jwt.util';

function makeToken(payload: Record<string, unknown>): string {
  const base64url = (obj: Record<string, unknown>) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const header = base64url({ alg: 'HS256', typ: 'JWT' });
  const body = base64url(payload);
  return `${header}.${body}.fake-signature`;
}

describe('decodeJwtExpiry', () => {
  it('returns the exp claim converted from seconds to milliseconds', () => {
    const expSeconds = 1_800_000_000;
    const token = makeToken({ exp: expSeconds, sub: 'user-1' });

    expect(decodeJwtExpiry(token)).toBe(expSeconds * 1000);
  });

  it('returns null when the token has no exp claim', () => {
    const token = makeToken({ sub: 'user-1' });

    expect(decodeJwtExpiry(token)).toBeNull();
  });

  it('returns null for a token with no payload segment', () => {
    expect(decodeJwtExpiry('not-a-jwt')).toBeNull();
  });

  it('returns null for a payload segment that is not valid base64/JSON', () => {
    expect(decodeJwtExpiry('header.%%%invalid%%%.signature')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(decodeJwtExpiry('')).toBeNull();
  });
});

describe('isJwtExpired', () => {
  it('returns true when exp is in the past', () => {
    const pastSeconds = Math.floor((Date.now() - 60_000) / 1000);
    const token = makeToken({ exp: pastSeconds });

    expect(isJwtExpired(token)).toBe(true);
  });

  it('returns false when exp is in the future', () => {
    const futureSeconds = Math.floor((Date.now() + 60_000) / 1000);
    const token = makeToken({ exp: futureSeconds });

    expect(isJwtExpired(token)).toBe(false);
  });

  it('treats a token with no exp claim as not expired (fails open, matching decodeJwtExpiry returning null)', () => {
    const token = makeToken({ sub: 'user-1' });

    expect(isJwtExpired(token)).toBe(false);
  });

  it('treats an unparseable token as not expired', () => {
    expect(isJwtExpired('garbage')).toBe(false);
  });
});
