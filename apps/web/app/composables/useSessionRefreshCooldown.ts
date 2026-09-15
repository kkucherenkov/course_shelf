/**
 * Tiny module-level cooldown for retrying `useAuthStore.refresh()` after a
 * transient failure (network error, 5xx, or the shared API rate limiter —
 * see #572/#581).
 *
 * `refresh()` only clears the bearer token on a confirmed "no session"
 * answer (`stores/auth.ts`); a transient failure leaves the token in place,
 * which is what `auth.global.ts` uses to tell the two apart. Retrying on
 * every single navigation during an outage would just re-hit the same rate
 * limit and stretch it out, so the middleware backs off for a few seconds
 * instead of calling `refresh()` again immediately.
 *
 * Extracted from `auth.global.ts` for the same reason as
 * `useHasUsersCache.ts`: the middleware's `default` export must stay its
 * only export (Nuxt's route-middleware contract), and tests need a way to
 * reset module state between runs.
 */

import { ref } from 'vue';

// ponytail: fixed cooldown window, not exponential backoff — revisit if a
// sustained outage still floods the limiter.
const COOLDOWN_MS = 5000;

export const lastTransientRefreshFailureAt = ref(0);

/** True while a transient refresh() failure is still within its backoff window. */
export function isRefreshCoolingDown(now: number = Date.now()): boolean {
  return now - lastTransientRefreshFailureAt.value < COOLDOWN_MS;
}

/** Reset — intended for use in tests only. */
export function resetRefreshCooldown(): void {
  lastTransientRefreshFailureAt.value = 0;
}
