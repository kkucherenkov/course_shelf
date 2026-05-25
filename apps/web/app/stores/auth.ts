import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { createAuthClient } from 'better-auth/vue';
// useRuntimeConfig is a Nuxt auto-import; explicit import keeps the test
// environment able to resolve it through the #imports shim.
import { useRuntimeConfig } from '#imports';

export interface SessionUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  displayName?: string;
}

// Key used to persist the bearer token in localStorage across page reloads.
// Named to avoid collisions with any internal better-auth key.
const TOKEN_STORAGE_KEY = 'cs.web.bearer';

/** Guard: true in real browsers and in test environments that polyfill Storage. */
function hasStorage(): boolean {
  // typeof check is sufficient — Storage is never null when the global is defined.
  return typeof localStorage !== 'undefined';
}

export const useAuthStore = defineStore('auth', () => {
  // Lazily created Better Auth client. Scoped to the store instance so that
  // test environments can reset it by calling `setActivePinia(createPinia())`.
  let _authClient: ReturnType<typeof createAuthClient> | null = null;

  function getAuthClient(): ReturnType<typeof createAuthClient> {
    if (_authClient) return _authClient;
    const { public: pub } = useRuntimeConfig();
    _authClient = createAuthClient({
      baseURL: `${pub.authBaseUrl}/api/v1/auth`,
      fetchOptions: {
        // Keep credentials for same-origin dev; bearer token is sent via the
        // Authorization header by the api.client plugin, not cookies.
        credentials: 'include',
      },
    });
    return _authClient;
  }

  const user = ref<SessionUser | null>(null);
  const token = ref<string | null>(null);
  const isPending = ref(false);
  const error = ref<string | null>(null);

  // Hydrate token from localStorage on store creation (SPA only).
  if (hasStorage()) {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) token.value = stored;
  }

  const isAuthenticated = computed(() => user.value !== null);

  /**
   * Sign in with email + password.
   * On success the `set-auth-token` response header is captured and stored
   * in localStorage (the server-side `bearer` plugin sets this header).
   */
  async function signIn(
    email: string,
    password: string,
    rememberMe = true,
  ): Promise<{ ok: boolean; error?: string; code?: string; statusCode?: number; retryAfter?: number }> {
    error.value = null;
    isPending.value = true;

    let capturedToken: string | null = null;
    // `Retry-After` (seconds) captured from a 429 response so the page can
    // drive the rate-limit countdown.
    let retryAfter: number | undefined;

    try {
      const auth = getAuthClient();

      const result = await auth.signIn.email(
        // `rememberMe: false` issues a non-persistent session (cleared on
        // browser close); Better Auth defaults it to true.
        { email, password, rememberMe },
        {
          // @better-fetch/fetch onSuccess hook — the Response object carries
          // the `set-auth-token` header set by the server's `bearer` plugin.
          onSuccess(ctx) {
            const raw = ctx.response.headers.get('set-auth-token');
            if (raw) capturedToken = raw;
          },
          onError(ctx) {
            const raw = ctx.response.headers.get('retry-after');
            const n = raw === null ? Number.NaN : Number(raw);
            if (!Number.isNaN(n)) retryAfter = n;
          },
        },
      );

      if (result.error) {
        const message = result.error.message ?? 'Sign-in failed';
        error.value = message;
        const { status: statusCode, code } = result.error as { status?: number; code?: string };
        return { ok: false, error: message, code, statusCode, retryAfter };
      }

      // capturedToken is mutated inside the onSuccess callback above; TypeScript
      // cannot see the mutation through the closure, hence the eslint-disable.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (capturedToken !== null) {
        token.value = capturedToken;
        if (hasStorage()) {
          localStorage.setItem(TOKEN_STORAGE_KEY, capturedToken);
        }
      }

      // Hydrate user from the session returned by sign-in.
      // `result.data` contains the session on the base email+password path.
      const sessionData = result.data as { user?: SessionUser } | null;
      if (sessionData?.user) {
        user.value = sessionData.user;
      } else {
        // Fallback: fetch session explicitly if sign-in didn't return it inline.
        await refresh();
      }

      return { ok: true };
    } catch (error_) {
      const message = error_ instanceof Error ? error_.message : 'Unexpected error';
      error.value = message;
      return { ok: false, error: message };
    } finally {
      isPending.value = false;
    }
  }

  /**
   * Sign out and clear all local auth state.
   * The server call is best-effort — local state is always cleared even if
   * the server call fails.
   */
  async function signOut(): Promise<void> {
    const auth = getAuthClient();
    try {
      await auth.signOut();
    } catch {
      // Server sign-out failed; proceed with local cleanup.
    } finally {
      clear();
    }
  }

  /**
   * Re-fetch the current session from the auth server.
   * Returns `true` when a valid session was found.
   */
  async function refresh(): Promise<boolean> {
    const auth = getAuthClient();
    const result = await auth.getSession();
    const sessionData = result.data as { user?: SessionUser } | null;
    if (sessionData?.user) {
      user.value = sessionData.user;
      return true;
    }
    user.value = null;
    return false;
  }

  /**
   * Clear local auth state without calling the server.
   */
  function clear(): void {
    user.value = null;
    token.value = null;
    if (hasStorage()) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }

  /**
   * Register a new account with email + password.
   * On success the `set-auth-token` response header is captured and stored
   * in localStorage (mirrors the same hook used for sign-in).
   */
  async function signUp(
    email: string,
    password: string,
    displayName?: string,
  ): Promise<{ ok: boolean; error?: string; code?: string }> {
    error.value = null;
    isPending.value = true;

    let capturedToken: string | null = null;

    try {
      const auth = getAuthClient();

      const result = await auth.signUp.email(
        {
          email,
          password,
          name: displayName ?? email.split('@')[0] ?? email,
          // Pass additional fields through to Better Auth's schema.
          ...(displayName ? { displayName } : {}),
        } as Parameters<typeof auth.signUp.email>[0],
        {
          onSuccess(ctx: { response: Response }) {
            const raw = ctx.response.headers.get('set-auth-token');
            if (raw) capturedToken = raw;
          },
        },
      );

      if (result.error) {
        const message = result.error.message ?? 'Sign-up failed';
        error.value = message;
        const { code } = result.error as { code?: string };
        return { ok: false, error: message, code };
      }

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (capturedToken !== null) {
        token.value = capturedToken;
        if (hasStorage()) {
          localStorage.setItem(TOKEN_STORAGE_KEY, capturedToken);
        }
      }

      const sessionData = result.data as { user?: SessionUser } | null;
      if (sessionData?.user) {
        user.value = sessionData.user;
      } else {
        await refresh();
      }

      return { ok: true };
    } catch (error_) {
      const message = error_ instanceof Error ? error_.message : 'Unexpected error';
      error.value = message;
      return { ok: false, error: message };
    } finally {
      isPending.value = false;
    }
  }

  /**
   * Verify an email address with a 6-digit code sent during sign-up.
   * STUB — Better Auth's email-verification SDK path needs to be wired here.
   * Flag: requires authClient.emailVerification or equivalent Better Auth call.
   */
  // eslint-disable-next-line unicorn/consistent-function-scoping
  function verifyEmail(_code: string): Promise<{ ok: boolean; error?: string }> {
    console.warn('[auth] verifyEmail is a stub — wire Better Auth email verification');
    return Promise.resolve({ ok: true });
  }

  /**
   * Initiate a password-reset flow by sending a reset link to the given email.
   * STUB — requires Better Auth's `requestPasswordReset` or equivalent.
   */
  // eslint-disable-next-line unicorn/consistent-function-scoping
  function forgotPassword(_email: string): Promise<{ ok: boolean; error?: string }> {
    console.warn('[auth] forgotPassword is a stub — wire Better Auth password reset request');
    return Promise.resolve({ ok: true });
  }

  /**
   * Complete a password reset using a token (from the ?token= URL param) and the new password.
   * STUB — requires Better Auth's `resetPassword` or equivalent.
   */
  // eslint-disable-next-line unicorn/consistent-function-scoping
  function resetPassword(
    _newPassword: string,
    _token: string,
  ): Promise<{ ok: boolean; error?: string }> {
    console.warn('[auth] resetPassword is a stub — wire Better Auth password reset completion');
    return Promise.resolve({ ok: true });
  }

  /**
   * Change the current user's password via Better Auth's `changePassword` method.
   * Returns `{ ok: true }` on success or `{ ok: false, error }` on failure.
   */
  async function changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<{ ok: boolean; error?: string; code?: string }> {
    const auth = getAuthClient();
    try {
      const result = await (
        auth as unknown as {
          changePassword: (opts: {
            currentPassword: string;
            newPassword: string;
            revokeOtherSessions: boolean;
          }) => Promise<{ error?: { message?: string; code?: string } | null }>;
        }
      ).changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });

      if (result.error) {
        const message = result.error.message ?? 'Password change failed';
        return { ok: false, error: message, code: result.error.code };
      }
      return { ok: true };
    } catch (error_) {
      const message = error_ instanceof Error ? error_.message : 'Unexpected error';
      return { ok: false, error: message };
    }
  }

  return {
    user,
    token,
    isPending,
    error,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    refresh,
    clear,
    verifyEmail,
    forgotPassword,
    resetPassword,
    changePassword,
  };
});
