import { defineConfig, devices } from '@playwright/test';

/**
 * E2E smoke config. Runs against the local Docker stack or whatever is
 * exposed on :3000 (backend) and :3001 (web). We do NOT start the stack
 * from Playwright — CI is responsible for `docker compose up -d` before
 * the run, local devs either have it running or get a clear failure.
 *
 * This config exists so e2e infrastructure is ready the moment the first
 * real user flow lands. The one smoke spec is intentionally minimal —
 * extend `tests/e2e/*.spec.ts` as real features appear.
 */
export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: process.env.E2E_WEB_URL ?? 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
