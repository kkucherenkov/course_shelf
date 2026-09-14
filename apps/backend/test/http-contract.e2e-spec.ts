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

/** `GET /api/v1/catalog/instructors/{slug}` — the `slug` path param is an `EntitySlug`. */
function bySlug(slug: string): string {
  return `/api/v1/catalog/instructors/${encodeURIComponent(slug)}`;
}

/** Validation errors that point inside the request body, ignoring response-schema ones. */
function bodyErrorPaths(res: { body: unknown }): string[] {
  const problem = res.body as { errors?: { path?: string }[] };
  return (problem.errors ?? []).map((e) => e.path ?? '').filter((p) => p.startsWith('/body'));
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

  // -------------------------------------------------------------------------
  // tuxedo 132: the slug charset is Unicode, and `\p{L}` is inert in a regex
  // compiled without the `u` flag. A unit test on the domain regex cannot
  // prove the VALIDATOR honours it — only a real request through the real
  // middleware can, and getting that wrong would reject every slug in the API
  // rather than fix the bug it was written for.
  // -------------------------------------------------------------------------
  describe('the Unicode slug pattern as the running validator compiles it', () => {
    // `GET /api/v1/catalog/instructors/{slug}` types its path parameter as
    // `EntitySlug`, so the request never reaches a handler without the
    // validator having applied the pattern. This harness mounts no catalog
    // controller, so a slug the validator ACCEPTS falls through to 404 — which
    // that operation declares, unlike 405/500, so the response validator is
    // satisfied too and the 400/404 split is exactly the pattern's verdict.
    it.each([
      ['Cyrillic', 'андрей-нягой'],
      ['Han', '李伟'],
      ['Greek', 'αλγόριθμοι'],
      ['Japanese with a prolonged sound mark', 'コンピューター'],
      ['Devanagari with combining vowel signs', 'कंप्यूटर'],
      ['accented Latin', 'ólafur-arnalds'],
      ['plain ASCII', 'andrei-neagoie'],
    ])('accepts a %s slug', async (_label, slug) => {
      ctx = await createE2eApp();

      const res = await request(ctx.server).get(bySlug(slug));

      expect(res.status).toBe(404);
    });

    it.each([
      ['uppercase', 'Андрей-Нягой'],
      ['a leading hyphen', '-андрей'],
      ['a trailing hyphen', 'андрей-'],
      ['a space', 'андрей нягой'],
      ['an underscore', 'андрей_нягой'],
      ['101 characters', 'а'.repeat(101)],
    ])('still rejects a slug with %s', async (_label, slug) => {
      ctx = await createE2eApp();

      const res = await request(ctx.server).get(bySlug(slug));

      expect(res.status).toBe(400);
      expect(res.headers['content-type']).toContain('application/problem+json');
    });

    // `UpsertInstructorRequest.displayName` carries its own `[\p{L}\p{N}]`
    // search — the rule that made a Cyrillic instructor unrecordable while it
    // was `[A-Za-z0-9]`. This harness mounts no admin controller either, and
    // that operation declares no 404, so the reply is a 400 about the RESPONSE
    // whichever way the body goes. Read the error paths instead of the status:
    // only a rejected body produces an error pointing inside `/body`.
    it.each(['Андрей Нягой', '李伟', 'Ólafur Arnalds 2', 'Andrei Neagoie'])(
      'accepts the display name %s',
      async (displayName) => {
        ctx = await createE2eApp();

        const res = await request(ctx.server)
          .post('/api/v1/admin/instructors')
          .send({ displayName });

        expect(bodyErrorPaths(res)).toEqual([]);
      },
    );

    it('rejects a display name with no letter or digit in any script', async () => {
      ctx = await createE2eApp();

      // slugify() throws on this, so the contract must not promise to take it.
      const res = await request(ctx.server)
        .post('/api/v1/admin/instructors')
        .send({ displayName: '«»' });

      expect(bodyErrorPaths(res)).toContain('/body/displayName');
    });
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
    // tuxedo 117: Helmet merges `directives` over its own defaults unless
    // `useDefaults: false` is passed, so this directive came back even though
    // it never appears in the list in `bootstrap.ts` — it forces every
    // subresource fetch to https:// and breaks plain-HTTP deployments.
    expect(csp).not.toContain('upgrade-insecure-requests');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(res.headers['cross-origin-resource-policy']).toBe('same-origin');
    // Helmet removes the Express fingerprint.
    expect(res.headers['x-powered-by']).toBeUndefined();
    // tuxedo 117: this app never terminates TLS, so it cannot know whether the
    // deployment is behind one. Helmet enables HSTS by default; left on, the
    // API answered `Strict-Transport-Security` over plain HTTP, the browser
    // recorded it for a year, and every subsequent request got rewritten to
    // https://, where nothing listens. TLS termination — and HSTS — belong to
    // the reverse proxy.
    expect(res.headers['strict-transport-security']).toBeUndefined();
  });

  it('development responses deliberately ship no CSP', async () => {
    ctx = await createE2eApp({ nodeEnv: 'development' });

    const res = await request(ctx.server).post('/api/v1/realtime/token');

    expect(res.headers['content-security-policy']).toBeUndefined();
    // The rest of the Helmet set stays on regardless of environment.
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['strict-transport-security']).toBeUndefined();
  });
});
