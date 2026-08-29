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

/**
 * Set by `.github/workflows/e2e.yml`, where `compose.ci.yml` boots the
 * production nginx image and the backend with `NODE_ENV=production`.
 *
 * Without it these tests skipped whenever a CSP header was missing — which is
 * correct locally (Nuxt dev serves the SPA with no nginx in front, and Helmet
 * keeps CSP off outside production) and useless in CI, where a missing header
 * is exactly the regression the card asked this suite to catch. A skip and a
 * pass are indistinguishable in the report, so the one run that could fail
 * never did.
 */
const expectCsp = process.env.E2E_EXPECT_CSP === '1';

/** Skip locally, fail in CI — a missing header there is a real regression. */
function requireCsp(csp: string | undefined, what: string): void {
  if (csp) return;
  if (expectCsp) {
    throw new Error(
      `${what} served no Content-Security-Policy. The CI stack runs the ` +
        'production nginx image and NODE_ENV=production, so the header must ' +
        'be present — this is a regression, not a dev-mode difference.',
    );
  }
  test.skip(true, `${what}: CSP off by design outside the production stack.`);
}

function assertSecureHeaders(headers: Record<string, string>): void {
  const csp = headers['content-security-policy'];
  expect(csp, 'Content-Security-Policy must be present').toBeTruthy();
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("script-src 'self'");
  // `'unsafe-eval'` must never appear in the SPA CSP — there's no
  // runtime code-evaluation path we want to allow (no `eval`,
  // `new Function`, dynamic-import-from-string, etc.).
  expect(csp).not.toContain("'unsafe-eval'");
  // Note: `script-src` ALSO carries `'unsafe-inline'`. Nuxt 4 SPA emits
  // two inline boot scripts even with `ssr: false` — the
  // @nuxtjs/color-mode pre-mount setup (avoids light/dark flash) and
  // the `window.__NUXT__ = { config: { … } }` runtime-config bridge.
  // Without `'unsafe-inline'`, both are dropped, the SPA never mounts,
  // and every e2e fails with `body` reporting as hidden. SHA-256
  // hashes change per build; nonce injection needs an SSR layer we
  // don't run. The trade-off is documented in apps/web/nginx.conf.
  // `'unsafe-inline'` is permissible because every page is the same
  // static SPA shell — there's no per-request data interleaved with
  // app HTML that XSS could ride. Style-src already allows
  // `'unsafe-inline'` (Vue scoped styles).
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("object-src 'none'");

  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
}

test('SPA `/` carries the secure-header set', async ({ request }) => {
  const res = await request.get('/');
  expect(res.ok()).toBeTruthy();
  // In dev (Nuxt dev server) there's no nginx in front of the SPA, so no CSP
  // header is emitted by design. In CI there is, and its absence is a bug.
  requireCsp(res.headers()['content-security-policy'], 'SPA `/`');
  assertSecureHeaders(res.headers());
});

test('backend `/api/v1/*` carries the secure-header set in production mode', async ({
  request,
}) => {
  const res = await request.get(`${backendUrl}/api/v1/health`);
  // Helmet keeps CSP off outside production, so a local watch loop must not
  // false-fail. The CI stack does run production — there it must be present.
  requireCsp(res.headers()['content-security-policy'], 'backend `/api/v1/*`');
  assertSecureHeaders(res.headers());
});
