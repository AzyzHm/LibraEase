import { Page } from '@playwright/test';

export type UserType = 'ADMIN' | 'EMPLOYEE' | 'PATRON';

export interface AuthUser {
  id: string;
  type: UserType;
  firstname: string;
  lastname: string;
  email: string;
}

function base64url(input: string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function fakeJwt(userId: string): string {
  const header = base64url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = base64url(
    JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + 24 * 3600 }),
  );
  return `${header}.${payload}.fake-signature`;
}

export function makeAuthUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user-1',
    type: 'PATRON',
    firstname: 'Jane',
    lastname: 'Doe',
    email: 'jane@example.com',
    ...overrides,
  };
}

export async function loginAs(page: Page, user: AuthUser): Promise<void> {
  const token = fakeJwt(user.id);
  const userJson = JSON.stringify(user);

  await page.addInitScript(
    ({ tokenValue, userValue }) => {
      window.localStorage.setItem('libraease.token', tokenValue);
      window.localStorage.setItem('libraease.user', userValue);
    },
    { tokenValue: token, userValue: userJson },
  );
}
