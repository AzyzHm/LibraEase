const CSRF_COOKIE_NAME = 'csrf_token';

export function readCsrfToken(): string | null {
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${CSRF_COOKIE_NAME}=`));

  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
}
