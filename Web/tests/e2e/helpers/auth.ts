import { Page } from '@playwright/test';
import { mockApi } from './mock-api';

export type UserType = 'ADMIN' | 'EMPLOYEE' | 'PATRON';

export interface AuthUser {
  id: string;
  type: UserType;
  firstname: string;
  lastname: string;
  email: string;
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
  await mockApi(page, '/auth/me', {
    method: 'GET',
    body: { message: 'Session valid', user },
  });
}
