/**
 * Global route middleware — gates navigation based on auth state and the
 * first-run `hasUsers` probe.
 *
 * Decision matrix:
 *  1. `hasUsers === false` → first-run, the 3-step sign-up wizard IS the
 *     bootstrap experience (per E14-F02-S01). All auth entry points
 *     funnel into /sign-up; /sign-up itself passes through. Step 1 of
 *     the wizard promotes the new account to ADMIN. There is no separate
 *     /setup route (#665).
 *  2. Public routes (/sign-in, /sign-up, /forgot, /reset, /signup, /__tokens) → pass through.
 *  3. Not authenticated, refresh() confirmed the session is gone → redirect
 *     /sign-in.
 *  4. Not authenticated, refresh() failed transiently (network/5xx/429) or
 *     is still cooling down from a previous transient failure → pass
 *     through. The token survives (only a confirmed "no session" answer
 *     clears it — see `stores/auth.ts`'s `refresh()`), so redirecting here
 *     would silently sign a live session out over a hiccup (#581). The
 *     destination page's own API calls are the authoritative check from
 *     here — they retry once through `refresh()` on a 401 (`api.client.ts`).
 *  5. Authenticated → pass through.
 *
 * The `hasUsers` result is cached for the browser session in
 * `~/composables/useHasUsersCache.ts`; tests can reset it via
 * `resetHasUsersCache()` without breaking Nuxt's route-middleware contract
 * (this file exports only `default`). The transient-refresh-failure cooldown
 * lives in `~/composables/useSessionRefreshCooldown.ts` for the same reason.
 */

import { getAdminHasUsers, client } from '@app/api-client-ts';

import { useAuthStore } from '~/stores/auth';
import { hasUsersCache } from '~/composables/useHasUsersCache';
import {
  lastTransientRefreshFailureAt,
  isRefreshCoolingDown,
} from '~/composables/useSessionRefreshCooldown';

const PUBLIC_ROUTES = new Set([
  '/sign-in',
  '/sign-up',
  '/forgot',
  '/reset',
  '/signup',
  '/__tokens',
  '/dev/foundations',
]);

async function fetchHasUsers(): Promise<boolean> {
  if (hasUsersCache.value !== null) return hasUsersCache.value;
  try {
    const res = await getAdminHasUsers({ client, throwOnError: false });
    // See useFirstRun: `!res.data` is unreachable now that the operation
    // declares its error responses and the generated union discriminates.
    if (res.error) {
      // Defensive: assume users exist on probe failure to avoid trapping a
      // real user in the setup wizard if the backend is mis-responding.
      hasUsersCache.value = true;
      return true;
    }
    hasUsersCache.value = res.data.hasUsers;
    return res.data.hasUsers;
  } catch {
    hasUsersCache.value = true;
    return true;
  }
}

export default defineNuxtRouteMiddleware(async (to) => {
  // Defensive server-side guard; this code never runs because ssr: false.
  if (import.meta.server) return;

  // The production nginx serves the statically generated site with directory
  // redirects: GET /sign-up → 301 /sign-up/ (each page is a directory with an
  // index.html). The SPA then hydrates with a trailing-slash `to.path`, which
  // an exact-string comparison misclassifies as a protected route and bounces
  // to /sign-in — breaking every deep link to a public page. Normalize before
  // comparing.
  const path = to.path.length > 1 ? to.path.replace(/\/+$/, '') : to.path;

  const hasUsers = await fetchHasUsers();

  // First-run: no users in the DB — funnel every auth entry point into the
  // 3-step sign-up wizard. The wizard's step 1 promotes the first user to
  // ADMIN; there is no separate /setup screen.
  if (!hasUsers) {
    if (path === '/sign-up') return;
    return navigateTo('/sign-up');
  }

  // Public routes skip the auth check entirely.
  if (PUBLIC_ROUTES.has(path)) return;

  const auth = useAuthStore();

  // If a bearer token is present but the in-memory user is not yet hydrated
  // (e.g. after a hard reload), attempt one silent session refresh. This is
  // the happy-path for page reloads: the token survives in localStorage but
  // Pinia state is reset. `refresh()` authenticates with that same token
  // (see `stores/auth.ts`'s `createClient`) — it does not depend on the
  // session cookie, so this works even with cookies cleared.
  //
  // Skip the retry while a previous attempt is still cooling down (#581):
  // get-session shares a rate limiter with the rest of the API, and
  // retrying on every navigation during an outage just re-hits it and
  // stretches the outage out.
  if (!auth.isAuthenticated && auth.token && !isRefreshCoolingDown()) {
    const ok = await auth.refresh();
    if (!ok && auth.token) {
      // Token survived the attempt — refresh() only clears it on a
      // confirmed "no session" answer, so this was a transient failure.
      lastTransientRefreshFailureAt.value = Date.now();
    }
  }

  if (!auth.isAuthenticated) {
    if (auth.token) {
      // A live token with no confirmed session: either the refresh above
      // just failed transiently, or an earlier one is still cooling down.
      // See the decision matrix above — pass through rather than signing a
      // possibly-valid session out.
      return;
    }
    return navigateTo('/sign-in');
  }
});
