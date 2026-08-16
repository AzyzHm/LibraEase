/**
 * Decodes a JWT's payload without verifying its signature. Never trust this
 * for authorization decisions - the backend re-verifies every request. This
 * is only used to avoid restoring a session we already know is expired.
 */
export function decodeJwtExpiry(token: string): number | null {
  try {
    const [, payloadSegment] = token.split('.');
    if (!payloadSegment) return null;

    const json = atob(payloadSegment.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json) as { exp?: number };

    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string): boolean {
  const expiryMs = decodeJwtExpiry(token);
  return expiryMs === null ? false : Date.now() >= expiryMs;
}