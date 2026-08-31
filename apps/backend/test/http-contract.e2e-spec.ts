/**
 * Backend e2e — the two things every request passes through before a handler
 * ever sees it (#266): `express-openapi-validator` and Helmet.
 *
 * The validator is mounted with `app.use('/api', …)`, so it runs *ahead* of
 * the Nest router and therefore ahead of `SessionGuard`. That ordering is the
 * behaviour under test here as much as the status codes are — a body that
 * violates the spec is rejected before authentication is even considered.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';

import request from 'supertest';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createE2eApp, type E2eApp } from './e2e-app';

let ctx: E2eApp;

afterEach(async () => {
  await ctx?.close();
});

beforeAll(() => {
  // `registerOpenApiValidator` degrades to a warning when the bundle is
  // missing, which would turn every assertion below into a silent pass.
  const bundle = path.resolve(process.cwd(), '../../packages/specs/dist/openapi.json');
  if (!existsSync(bundle)) {
    throw new Error(
      `OpenAPI bundle not found at ${bundle}. Run \`pnpm spec:bundle\` before the backend tests — ` +
        'without it the runtime validator is not armed and these tests would pass vacuously.',
    );
  }
});

describe('express-openapi-validator', () => {
  it('rejects a body with an undeclared property as RFC 9457 problem+json', async () => {
    ctx = await createE2eApp();

    // `UpdateMeRequest` is `additionalProperties: false`.
    const res = await request(ctx.server).patch('/api/v1/me').send({ notAField: 'nope' });

    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toContain('application/problem+json');
    const problem = res.body as {
      type: string;
      title: string;
      status: number;
      instance: string;
      errors?: unknown[];
    };
    expect(problem.status).toBe(400);
    expect(problem.title).toBeTruthy();
    expect(problem.type).toBeTruthy();
    expect(problem.instance).toBe('/api/v1/me');
    expect(Array.isArray(problem.errors)).toBe(true);
  });

  it('rejects a wrongly-typed property', async () => {
    ctx = await createE2eApp();

    const res = await request(ctx.server).patch('/api/v1/me').send({ displayName: 42 });

    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toContain('application/problem+json');
  });

  it('runs before SessionGuard — a malformed body is 400, not 401', async () => {
    ctx = await createE2eApp();

    // No credentials at all. If the guard ran first this would be 401.
    const res = await request(ctx.server).patch('/api/v1/me').send({ notAField: 'nope' });

    expect(res.status).toBe(400);
  });

  it('405 with an Allow header for a method the path does not define', async () => {
    ctx = await createE2eApp();

    const res = await request(ctx.server).put('/api/v1/me').send({ displayName: 'Elena' });

    expect(res.status).toBe(405);
    expect(res.headers['allow']).toContain('PATCH');
    expect(res.headers['content-type']).toContain('application/problem+json');
  });

  it('404 problem+json for a path the spec does not describe', async () => {
    ctx = await createE2eApp();

    const res = await request(ctx.server).get('/api/v1/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toContain('application/problem+json');
  });
});

describe('secure headers', () => {
  it('production responses carry the CSP and the rest of the Helmet set', async () => {
    ctx = await createE2eApp({ nodeEnv: 'production' });

    const res = await request(ctx.server).post('/api/v1/realtime/token');

    const csp = res.headers['content-security-policy'];
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    // No code-evaluation path exists in the API surface — keep it that way.
    expect(csp).not.toContain("'unsafe-eval'");

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(res.headers['cross-origin-resource-policy']).toBe('same-origin');
    // Helmet removes the Express fingerprint.
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('development responses deliberately ship no CSP', async () => {
    ctx = await createE2eApp({ nodeEnv: 'development' });

    const res = await request(ctx.server).post('/api/v1/realtime/token');

    expect(res.headers['content-security-policy']).toBeUndefined();
    // The rest of the Helmet set stays on regardless of environment.
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});
