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
  // Every page — authenticated (AppNavigationShell) or not (sign-in via
  // AuthLayout) — has exactly one <main> landmark now (#590). Used to check
  // '#__nuxt, #app, main' as a "did the SPA mount at all" proxy; now that
  // <main> is guaranteed, that combined selector matches both the Nuxt root
  // and <main> at once and fails Playwright's strict mode.
  await expect(page.locator('main')).toBeVisible();
});
