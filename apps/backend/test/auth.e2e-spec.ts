/**
 * Backend e2e — the Better Auth surface and the guard that consumes it (#266).
 *
 * These go through the booted HTTP server: supertest → express → helmet →
 * openapi-validator → Nest router → SessionGuard → controller. Nothing about
 * the auth flow is stubbed; only the database behind Better Auth is
 * in-memory. See `test/e2e-app.ts`.
 *
 * Covered:
 *   1. sign-up → session cookie, and the first account is promoted to ADMIN.
 *   2. sign-in → `get-session` echoes the user.
 *   3. the issued bearer token authenticates a protected route.
 *   4. sign-out → the cookie stops resolving to a session.
 *   5. `SessionGuard` answers 401 problem+json with no credentials.
 *   6. a garbage bearer token is 401, not 500.
 *   7. the sign-in rate limiter caps repeated failures at 429.
 *   8. `AUTH_SELF_REGISTRATION=false` actually blocks sign-up — but not the
 *      owner account on a fresh instance.
 */
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createE2eApp, type E2eApp } from './e2e-app';

const CREDENTIALS = {
  email: 'elena@example.com',
  password: 'correct-horse-battery-staple',
  name: 'Elena',
};

const PROTECTED_ROUTE = '/api/v1/realtime/token';

let ctx: E2eApp;

beforeEach(async () => {
  ctx = await createE2eApp();
});

afterEach(async () => {
  await ctx?.close();
});

/** The `better-auth.session_token=…` pairs from a Set-Cookie header list. */
function cookieHeader(res: request.Response): string {
  const raw = res.headers['set-cookie'];
  const cookies = Array.isArray(raw) ? raw : raw === undefined ? [] : [raw];
  return cookies.map((c) => c.split(';')[0]).join('; ');
}

async function signUp(): Promise<request.Response> {
  return request(ctx.server).post('/api/v1/auth/sign-up/email').send(CREDENTIALS);
}

async function signInWithWrongPassword(): Promise<request.Response> {
  return request(ctx.server)
    .post('/api/v1/auth/sign-in/email')
    .send({ email: CREDENTIALS.email, password: 'wrong-password' });
}

describe('Better Auth round trip', () => {
  it('sign-up issues a session cookie and a bearer token, and the first user is ADMIN', async () => {
    const res = await signUp();

    expect(res.status).toBe(200);
    const body = res.body as { user?: { id?: string; email?: string; role?: string } };
    expect(body.user?.email).toBe(CREDENTIALS.email);
    // `databaseHooks.user.create.before` promotes the first account on a fresh
    // install. The stubbed `user.count()` returns 0, so this is that path.
    expect(body.user?.role).toBe('ADMIN');
    expect(cookieHeader(res)).toContain('better-auth.session_token=');
    expect(res.headers['set-auth-token']).toBeTruthy();
  });

  it('sign-in then get-session returns the signed-in user', async () => {
    await signUp();

    const signIn = await request(ctx.server)
      .post('/api/v1/auth/sign-in/email')
      .send({ email: CREDENTIALS.email, password: CREDENTIALS.password });
    expect(signIn.status).toBe(200);

    const session = await request(ctx.server)
      .get('/api/v1/auth/get-session')
      .set('Cookie', cookieHeader(signIn));

    expect(session.status).toBe(200);
    const body = session.body as { user?: { email?: string } } | null;
    expect(body?.user?.email).toBe(CREDENTIALS.email);
  });

  it('the bearer token from sign-in authenticates a SessionGuard-protected route', async () => {
    await signUp();
    const signIn = await request(ctx.server)
      .post('/api/v1/auth/sign-in/email')
      .send({ email: CREDENTIALS.email, password: CREDENTIALS.password });
    const token = signIn.headers['set-auth-token'] as string;
    expect(token).toBeTruthy();

    const res = await request(ctx.server)
      .post(PROTECTED_ROUTE)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const body = res.body as { token: string; expiresAt: string };
    expect(body.token.split('.')).toHaveLength(3);
    // Realtime tokens are short-lived by contract (≤5 min).
    const ttlMs = new Date(body.expiresAt).getTime() - Date.now();
    expect(ttlMs).toBeGreaterThan(0);
    expect(ttlMs).toBeLessThanOrEqual(5 * 60 * 1000);
  });

  it('sign-out invalidates the session cookie', async () => {
    const signedUp = await signUp();
    const cookie = cookieHeader(signedUp);

    const before = await request(ctx.server).post(PROTECTED_ROUTE).set('Cookie', cookie);
    expect(before.status).toBe(200);

    const signOut = await request(ctx.server).post('/api/v1/auth/sign-out').set('Cookie', cookie);
    expect(signOut.status).toBe(200);

    const after = await request(ctx.server).post(PROTECTED_ROUTE).set('Cookie', cookie);
    expect(after.status).toBe(401);
  });
});

describe('SessionGuard', () => {
  it('401 problem+json on a protected route with no credentials', async () => {
    const res = await request(ctx.server).post(PROTECTED_ROUTE);

    expect(res.status).toBe(401);
    expect(res.headers['content-type']).toContain('application/problem+json');
    const problem = res.body as { title: string; status: number; instance: string };
    expect(problem.status).toBe(401);
    expect(problem.title).toBeTruthy();
    expect(problem.instance).toBe(PROTECTED_ROUTE);
  });

  it('401, not 500, for a bearer token that is not a token at all', async () => {
    const res = await request(ctx.server)
      .post(PROTECTED_ROUTE)
      .set('Authorization', 'Bearer not-a-real-token');

    expect(res.status).toBe(401);
  });
});

describe('AuthModule middlewares', () => {
  // Both of these mounted at `/api/api/v1/auth/...` until this suite existed,
  // because Nest prepends `setGlobalPrefix('api')` to middleware routes and
  // the paths spelled `api/` themselves. They therefore never ran: sign-in was
  // unlimited and AUTH_SELF_REGISTRATION=false was cosmetic. Keep both
  // assertions — the failure mode is silent.
  it('AUTH_SELF_REGISTRATION=false blocks sign-up with 403 problem+json', async () => {
    await ctx.close();
    ctx = await createE2eApp({
      env: { AUTH_SELF_REGISTRATION: 'false' },
      existingUserCount: 1,
    });

    const res = await request(ctx.server).post('/api/v1/auth/sign-up/email').send(CREDENTIALS);

    expect(res.status).toBe(403);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect((res.body as { code?: string }).code).toBe('self-registration-disabled');
  });

  it('the owner account can still be created on a fresh instance with the toggle off', async () => {
    await ctx.close();
    ctx = await createE2eApp({
      env: { AUTH_SELF_REGISTRATION: 'false' },
      existingUserCount: 0,
    });

    const res = await request(ctx.server).post('/api/v1/auth/sign-up/email').send(CREDENTIALS);

    expect(res.status).toBe(200);
    expect((res.body as { user?: { role?: string } }).user?.role).toBe('ADMIN');
  });

  it('sign-up still works when self-registration is enabled', async () => {
    const res = await signUp();
    expect(res.status).toBe(200);
  });

  it('429 with Retry-After after the 5th sign-in attempt from the same IP', async () => {
    await signUp();

    for (let i = 0; i < 5; i++) {
      const res = await signInWithWrongPassword();
      expect(res.status).not.toBe(429);
    }

    const blocked = await signInWithWrongPassword();
    expect(blocked.status).toBe(429);
    expect(blocked.headers['retry-after']).toBeTruthy();
  });
});
