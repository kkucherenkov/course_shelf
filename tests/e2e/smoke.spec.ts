import { test, expect } from '@playwright/test';

const backendUrl = process.env.E2E_BACKEND_URL ?? 'http://localhost:3000';

test('backend health endpoint responds', async ({ request }) => {
  const res = await request.get(`${backendUrl}/api/v1/health`);
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body).toHaveProperty('status');
});

test('web app renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
  // Nuxt renders the __nuxt root — if it's there, the SPA mounted.
  await expect(page.locator('#__nuxt, #app, main')).toBeVisible();
});
