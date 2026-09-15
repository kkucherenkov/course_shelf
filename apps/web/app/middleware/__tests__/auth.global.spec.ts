import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — declared before importing the middleware so Vitest hoisting works.
// ---------------------------------------------------------------------------

// Nuxt auto-imports `defineNuxtRouteMiddleware`/`navigateTo` at build time;
// under plain vitest they're bare globals, so stub them directly.
const mockNavigateTo = vi.fn((to: string) => ({ __navigateTo: to }));
vi.stubGlobal('defineNuxtRouteMiddleware', (fn: unknown) => fn);
vi.stubGlobal('navigateTo', mockNavigateTo);

const mockGetAdminHasUsers = vi.fn();
vi.mock('@app/api-client-ts', () => ({
  getAdminHasUsers: (...args: unknown[]) => mockGetAdminHasUsers(...args),
  client: {},
}));

// A plain mutable object stands in for the auth store — the middleware only
// reads `isAuthenticated`/`token` and calls `refresh()`.
const authState = {
  isAuthenticated: false,
  token: null as string | null,
  refresh: vi.fn(),
};
vi.mock('~/stores/auth', () => ({
  useAuthStore: () => authState,
}));

// ---------------------------------------------------------------------------
// Import after mocks are in place. `auth.global.ts` calls
// `defineNuxtRouteMiddleware` at module-eval time, and static imports are
// hoisted above the `vi.stubGlobal` calls above regardless of source order —
// a dynamic import here runs after them instead.
// ---------------------------------------------------------------------------
import { resetHasUsersCache } from '~/composables/useHasUsersCache';
import { resetRefreshCooldown } from '~/composables/useSessionRefreshCooldown';

const { default: middleware } = await import('../auth.global');

function to(path: string) {
  return { path } as unknown as Parameters<typeof middleware>[0];
}

describe('auth.global middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetHasUsersCache();
    resetRefreshCooldown();
    authState.isAuthenticated = false;
    authState.token = null;
    mockGetAdminHasUsers.mockResolvedValue({ data: { hasUsers: true }, error: null });
  });

  it('redirects to /sign-in when there is no token at all', async () => {
    await middleware(to('/dashboard'), to('/dashboard'));

    expect(mockNavigateTo).toHaveBeenCalledWith('/sign-in');
  });

  it('passes through without redirecting when a transient refresh() failure leaves the token in place (#581)', async () => {
    // Mirrors stores/auth.ts's refresh(): a network/5xx/429 failure clears
    // `user` but leaves `token` — the old middleware redirected regardless,
    // silently signing a live session out.
    authState.token = 'tok-live';
    authState.refresh.mockImplementation(async () => {
      authState.isAuthenticated = false;
      // token intentionally left untouched
      return false;
    });

    await middleware(to('/dashboard'), to('/dashboard'));

    expect(authState.refresh).toHaveBeenCalledOnce();
    expect(mockNavigateTo).not.toHaveBeenCalled();
  });

  it('redirects to /sign-in when refresh() confirms the session is gone', async () => {
    authState.token = 'tok-dead';
    authState.refresh.mockImplementation(async () => {
      authState.isAuthenticated = false;
      authState.token = null; // confirmed "no session" — refresh() drops it
      return false;
    });

    await middleware(to('/dashboard'), to('/dashboard'));

    expect(mockNavigateTo).toHaveBeenCalledWith('/sign-in');
  });

  it('skips retrying refresh() while a previous transient failure is cooling down', async () => {
    authState.token = 'tok-live';
    authState.refresh.mockImplementation(async () => {
      authState.isAuthenticated = false;
      return false;
    });

    await middleware(to('/dashboard'), to('/dashboard'));
    expect(authState.refresh).toHaveBeenCalledOnce();

    await middleware(to('/library'), to('/library'));

    // Still only the one call from the first navigation — the second
    // navigation hit the cooldown instead of re-hitting the rate limiter.
    expect(authState.refresh).toHaveBeenCalledOnce();
    expect(mockNavigateTo).not.toHaveBeenCalled();
  });

  it('passes through when already authenticated, without calling refresh()', async () => {
    authState.isAuthenticated = true;
    authState.token = 'tok-ok';

    await middleware(to('/dashboard'), to('/dashboard'));

    expect(authState.refresh).not.toHaveBeenCalled();
    expect(mockNavigateTo).not.toHaveBeenCalled();
  });
});
