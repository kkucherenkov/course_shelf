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
  async function signIn(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
    error.value = null;
    isPending.value = true;

    let capturedToken: string | null = null;

    try {
      const auth = getAuthClient();

      const result = await auth.signIn.email(
        { email, password },
        {
          // @better-fetch/fetch onSuccess hook — the Response object carries
          // the `set-auth-token` header set by the server's `bearer` plugin.
          onSuccess(ctx) {
            const raw = ctx.response.headers.get('set-auth-token');
            if (raw) capturedToken = raw;
          },
        },
      );

      if (result.error) {
        const message = result.error.message ?? 'Sign-in failed';
        error.value = message;
        return { ok: false, error: message };
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

  return { user, token, isPending, error, isAuthenticated, signIn, signOut, refresh, clear };
});
