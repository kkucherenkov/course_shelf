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

/** A `RunIdentifyRequest` that is valid apart from whatever the date says. */
function identifyBody(releaseDate: string): Record<string, unknown> {
  return { source: 'youtube', fragment: { title: 'Fixture', releaseDate } };
}

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

  it('rejects a calendar-impossible date, not just a date-shaped string', async () => {
    ctx = await createE2eApp();

    // ajv-formats' `fast` mode — the validator's default — checks `format: date`
    // with `\d{4}-\d{2}-\d{2}` and nothing else, so month 13 used to be stored
    // and then handed back by a response schema that promises a real date.
    const ok = await request(ctx.server)
      .post('/api/v1/admin/courses/some-course/identify')
      .send(identifyBody('2024-03-15'));
    // Not 400: the payload itself is fine, so this gets as far as the guard.
    expect(ok.status).not.toBe(400);

    const res = await request(ctx.server)
      .post('/api/v1/admin/courses/some-course/identify')
      .send(identifyBody('2024-13-01'));

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

describe('NUL bytes in the payload', () => {
  // `"\u0000"` is legal JSON and satisfies `type: string`, so the OpenAPI
  // validator passes it — and Postgres then refuses the byte with a
  // DriverAdapterError that maps to nothing, so the write answered 500. Found
  // by the first authenticated schemathesis run on POST /admin/studios (#321);
  // the guard is global because the hole is.
  it('400 problem+json for a NUL inside a string value', async () => {
    ctx = await createE2eApp();

    const res = await request(ctx.server).patch('/api/v1/me').send({ displayName: 'Ele\u0000na' });

    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect((res.body as { code?: string }).code).toBe('null-byte-in-payload');
  });

  it('400 for a NUL inside an object key', async () => {
    ctx = await createE2eApp();

    const res = await request(ctx.server)
      .patch('/api/v1/me')
      .send({ 'display\u0000Name': 'Elena' });

    // On a closed schema (`UpdateMeRequest` is `additionalProperties: false`)
    // the OpenAPI validator gets there first and rejects the unknown property —
    // also a correct 400. The guard's own key branch is pinned in
    // `src/common/http/reject-null-bytes.middleware.spec.ts`; it is the backstop
    // for the payloads the spec leaves open.
    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toContain('application/problem+json');
  });

  it('lets a clean body through to the handler', async () => {
    ctx = await createE2eApp({
      commandBusExecute: () => ({ id: 'user-1', email: 'e@example.com', displayName: 'Elena' }),
    });

    const res = await request(ctx.server).patch('/api/v1/me').send({ displayName: 'Elena' });

    expect(res.status).not.toBe(400);
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
