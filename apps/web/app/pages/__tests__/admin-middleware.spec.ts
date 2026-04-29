/**
 * Unit test for apps/web/app/middleware/admin.ts
 *
 * Verifies:
 * 1. Non-admin users are redirected to /
 * 2. Admin users (both 'admin' and 'ADMIN' roles) pass through
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

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({
    get user() {
      return mockUser;
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
  });

  it('redirects to / when user is null (unauthenticated)', async () => {
    mockUser = null;
    const middleware = await getMiddleware();
    await middleware();
    expect(mockNavigateTo).toHaveBeenCalledWith('/');
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
