/**
 * Route middleware for admin-only pages.
 *
 * Apply via `definePageMeta({ middleware: 'admin' })` on every page under
 * `pages/admin/*`. Not global — opt-in only.
 *
 * Accepts both `'ADMIN'` (historical backend stamp) and `'admin'` (lowercase)
 * so the guard stays correct while the SPA cache might still hold a stale
 * uppercase value from an older session.
 *
 * Three states, not two (#695). `auth.global.ts` already lets navigation
 * through when a live token has no confirmed session yet — a transient
 * `get-session` failure (network, 5xx, 429; see #581/#693), not a "no
 * session" answer. Treating that as "not an admin" one middleware later
 * ejects the owner from `/admin` and tells them they lack access, on exactly
 * the page where that message is worst. Role-unknown must resolve the same
 * way here as it does there: pass through, don't redirect.
 */

import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return;

  const auth = useAuthStore();

  // Live token, session not (yet) confirmed — role unknown, not "not admin".
  if (!auth.isAuthenticated && auth.token) return;

  const role = auth.user?.role?.toLowerCase();

  if (role !== 'admin') {
    return navigateTo('/');
  }
});
