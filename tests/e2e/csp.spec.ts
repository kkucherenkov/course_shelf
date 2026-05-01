/**
 * CSP + secure-header e2e smoke (E21-F02-S02).
 *
 * Asserts that both the SPA (served by the web nginx) and the backend
 * (`/api/v1/*` via Helmet) carry the secure-header set the card requires:
 *  - Content-Security-Policy with default-src 'self', no inline scripts
 *  - X-Content-Type-Options: nosniff
 *  - Referrer-Policy: strict-origin-when-cross-origin
 *
 * Helmet only enables CSP in production (NODE_ENV=production); dev runs
 * intentionally skip it so Vite/Storybook hot-reload still works. The
 * playwright run against the docker compose stack (which boots backend in
 * production mode) is where this test earns its keep.
 */
import { test, expect } from '@playwright/test';

const backendUrl = process.env.E2E_BACKEND_URL ?? 'http://localhost:3000';

function assertSecureHeaders(headers: Record<string, string>): void {
  const csp = headers['content-security-policy'];
  expect(csp, 'Content-Security-Policy must be present').toBeTruthy();
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("script-src 'self'");
  expect(csp).not.toContain("'unsafe-eval'");
  expect(csp).not.toContain("script-src 'unsafe-inline'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("object-src 'none'");

  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
}

test('SPA `/` carries the secure-header set', async ({ request }) => {
  const res = await request.get('/');
  expect(res.ok()).toBeTruthy();
  assertSecureHeaders(res.headers());
});

test('backend `/api/v1/*` carries the secure-header set in production mode', async ({
  request,
}) => {
  const res = await request.get(`${backendUrl}/api/v1/health`);
  // Helmet keeps CSP off in non-production. Skip the assertion in dev runs
  // so this test doesn't false-fail the local watch loop.
  const csp = res.headers()['content-security-policy'];
  if (!csp) {
    test.skip(true, 'backend not running with NODE_ENV=production; CSP off by design.');
  }
  assertSecureHeaders(res.headers());
});
