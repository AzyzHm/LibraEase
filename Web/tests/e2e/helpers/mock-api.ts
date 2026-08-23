import { Page, Route } from '@playwright/test';

export const API_BASE = 'http://localhost:8000';

export interface MockRoute {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  status?: number;
  body?: unknown;
}

export async function mockApi(page: Page, urlPattern: string, mock: MockRoute): Promise<void> {
  await page.route(`${API_BASE}${urlPattern}`, async (route: Route) => {
    const method = route.request().method();

    if (method === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization,Content-Type',
        },
      });
      return;
    }

    if (method !== mock.method) {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: mock.status ?? 200,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(mock.body ?? {}),
    });
  });
}