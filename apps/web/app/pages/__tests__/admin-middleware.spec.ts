/**
 * Unit test for apps/web/app/middleware/admin.ts
 *
 * Verifies:
 * 1. Non-admin users (confirmed session, wrong role) are redirected to /
 * 2. Admin users (both 'admin' and 'ADMIN' roles) pass through
 * 3. Role-unknown (live token, session not yet confirmed — #695) passes
 *    through rather than being treated as "not an admin"
 * 4. Confirmed "no session" (no token, no user) still redirects to /
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockNavigateTo = vi.fn();

// defineNuxtRouteMiddleware and navigateTo are Nuxt compiler macros (global
// auto-imports). Stub them globally so the middleware module can be imported
// in a plain Vitest env without the Nuxt runtime.
vi.stubGlobal('defineNuxtRouteMiddleware', (fn: (...args: unknown[]) => unknown) => fn);
vi.stubGlobal('navigateTo', (...args: unknown[]) => mockNavigateTo(...args));

let mockUser: { role?: string } | null = null;
let mockToken: string | null = null;

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({
    get user() {
      return mockUser;
    },
    get token() {
      return mockToken;
    },
    get isAuthenticated() {
      return mockUser !== null;
    },
  }),
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

type MiddlewareFn = () => unknown;

async function getMiddleware(): Promise<MiddlewareFn> {
  // Dynamic import with cache bypass ensures each test gets fresh mock state
  const mod = await import('../../middleware/admin');
  return mod.default as unknown as MiddlewareFn;
}

describe('admin middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockUser = null;
    mockToken = null;
  });

  it('redirects to / on a confirmed "no session" (no user, no token)', async () => {
    mockUser = null;
    mockToken = null;
    const middleware = await getMiddleware();
    await middleware();
    expect(mockNavigateTo).toHaveBeenCalledWith('/');
  });

  it('passes through when role is unknown (live token, session not yet confirmed)', async () => {
    mockUser = null;
    mockToken = 'stale-but-live-token';
    const middleware = await getMiddleware();
    await middleware();
    expect(mockNavigateTo).not.toHaveBeenCalled();
  });

  it('redirects to / when role is "user"', async () => {
    mockUser = { role: 'user' };
    const middleware = await getMiddleware();
    await middleware();
    expect(mockNavigateTo).toHaveBeenCalledWith('/');
  });

  it('does NOT redirect when role is "admin" (lowercase)', async () => {
    mockUser = { role: 'admin' };
    const middleware = await getMiddleware();
    middleware();
    expect(mockNavigateTo).not.toHaveBeenCalled();
  });

  it('does NOT redirect when role is "ADMIN" (uppercase — backend historical stamp)', async () => {
    mockUser = { role: 'ADMIN' };
    const middleware = await getMiddleware();
    middleware();
    expect(mockNavigateTo).not.toHaveBeenCalled();
  });
});
