/**
 * Three-state read of "can this session see `/admin/*`" (#695, #776).
 *
 * `'unknown'` is a live token whose session hasn't been confirmed yet — a
 * transient `get-session` failure (network, 5xx, or the throttle split in
 * `common/auth/auth-throttle.ts`, see #777), not the same thing as "not an
 * admin". `middleware/admin.ts` used to conflate the two and let this state
 * through unchanged, which is what let the full admin dashboard mount (and
 * immediately 403) for a genuine non-admin caught mid-outage. The gate that
 * actually reads this now lives in `layouts/default.vue`
 * (`AdminAccessGate.vue`), which can render a loading state for 'unknown'
 * and an inline "no access" screen for 'denied' without ejecting a real
 * admin over a hiccup or leaving the URL for a confirmed non-admin.
 *
 * Plain function, not a Vue composable proper (no refs) — the two call
 * sites (`middleware/admin.ts`, `layouts/default.vue`) each already hold
 * live `useAuthStore()` state and just need this decision made from it.
 */

export type AdminAccessState = 'unknown' | 'granted' | 'denied';

export function resolveAdminAccess(
  hasToken: boolean,
  isAuthenticated: boolean,
  role: string | undefined,
): AdminAccessState {
  if (!isAuthenticated && hasToken) return 'unknown';
  return role?.toLowerCase() === 'admin' ? 'granted' : 'denied';
}

/**
 * Routes `AdminAccessGate` covers (#795). `/admin/*` is the bulk of them; the
 * course metadata editor (E30-F03-S01, `pages/courses/[id]/edit.vue`) is the
 * one admin-only page that lives outside that prefix — its own
 * `definePageMeta({ middleware: 'admin' })` is vestigial, same as every
 * `pages/admin/*.vue` page's (see `middleware/admin.ts`'s doc comment), so
 * without an entry here it had no gate at all and any authenticated user
 * could open it.
 *
 * A literal list, not a convention (e.g. "every page with `middleware:
 * 'admin'`") — that would require parsing route meta at a layer that
 * doesn't have it, and a second admin-only page outside `/admin/*` is rare
 * enough to add here explicitly when it happens.
 */
const ADMIN_GATED_ROUTES: RegExp[] = [/^\/admin(\/|$)/, /^\/courses\/[^/]+\/edit$/];

export function isAdminGatedRoute(path: string): boolean {
  return ADMIN_GATED_ROUTES.some((pattern) => pattern.test(path));
}
