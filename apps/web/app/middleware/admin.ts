/**
 * Route middleware for admin-only pages.
 *
 * Apply via `definePageMeta({ middleware: 'admin' })` on every page under
 * `pages/admin/*`. Not global — opt-in only.
 *
 * Accepts both `'ADMIN'` (historical backend stamp) and `'admin'` (lowercase)
 * so the guard stays correct while the SPA cache might still hold a stale
 * uppercase value from an older session.
 */

import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return;

  const auth = useAuthStore();
  const role = auth.user?.role?.toLowerCase();

  if (role !== 'admin') {
    return navigateTo('/');
  }
});
