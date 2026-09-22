/**
 * Route middleware for admin-only pages.
 *
 * Apply via `definePageMeta({ middleware: 'admin' })` on every page under
 * `pages/admin/*`. Not global — opt-in only.
 *
 * A no-op now (#776) — kept only because every `admin/*.vue` page still
 * opts in via `definePageMeta({ middleware: 'admin' })` and Nuxt requires
 * the named middleware to exist. It used to redirect a confirmed non-admin
 * to `/`, which meant the full admin dashboard still mounted (and 403'd)
 * during the "role not yet known" window (#695) — `auth.global.ts`
 * deliberately lets navigation through on a live token with no confirmed
 * session, so this redirect never actually saw that state to catch it, and
 * a redirect can't show the "no access" screen the audit asked for anyway
 * (the URL changes before the message would render).
 *
 * The real three-state gate (unknown / denied / granted) now lives in
 * `useAdminAccess.ts` + `AdminAccessGate.vue`, wired from
 * `layouts/default.vue`: it replaces the page's own `<slot/>` outright, so
 * an admin page never mounts (and never fires its own data fetch) while
 * role is unresolved or confirmed absent — strictly stronger than this
 * redirect ever was, and it renders `AppNoPermission` inline on the actual
 * `/admin` URL instead of bouncing home.
 */

// Genuinely a no-op by design — see the doc comment above for why.
// eslint-disable-next-line @typescript-eslint/no-empty-function
export default defineNuxtRouteMiddleware(() => {});
