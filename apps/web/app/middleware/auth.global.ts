/**
 * Global route middleware — gates navigation based on auth state and the
 * first-run `hasUsers` probe.
 *
 * Decision matrix:
 *  1. `hasUsers === false` → force /setup (the DB has no users yet).
 *     - /setup itself is allowed to render.
 *  2. `hasUsers === true` + target is /setup → redirect /sign-in (locked).
 *  3. Public routes (/sign-in, /signup, /__tokens) → pass through.
 *  4. Not authenticated → redirect /sign-in.
 *  5. Authenticated → pass through.
 *
 * The `hasUsers` result is cached for the browser session in
 * `~/composables/useHasUsersCache.ts`; tests can reset it via
 * `resetHasUsersCache()` without breaking Nuxt's route-middleware contract
 * (this file exports only `default`).
 */

import { getAdminHasUsers, client } from '@app/api-client-ts';

import { useAuthStore } from '~/stores/auth';
import { hasUsersCache } from '~/composables/useHasUsersCache';

const PUBLIC_ROUTES = new Set(['/sign-in', '/signup', '/setup', '/__tokens']);

async function fetchHasUsers(): Promise<boolean> {
  if (hasUsersCache.value !== null) return hasUsersCache.value;
  try {
    const res = await getAdminHasUsers({ client, throwOnError: false });
    if (res.error || !res.data) {
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

  const hasUsers = await fetchHasUsers();

  // First-run: no users in the DB — force the setup wizard.
  if (!hasUsers) {
    if (to.path === '/setup') return;
    return navigateTo('/setup');
  }

  // Setup is locked once an admin exists.
  if (to.path === '/setup') return navigateTo('/sign-in');

  // Public routes skip the auth check entirely.
  if (PUBLIC_ROUTES.has(to.path)) return;

  const auth = useAuthStore();

  // If a bearer token is present but the in-memory user is not yet hydrated
  // (e.g. after a hard reload), attempt one silent session refresh.  This is
  // the happy-path for page reloads: the token survives in localStorage but
  // Pinia state is reset.
  if (!auth.isAuthenticated && auth.token) {
    await auth.refresh();
  }

  if (!auth.isAuthenticated) {
    return navigateTo('/sign-in');
  }
});
