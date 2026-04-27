/**
 * Tiny module-level cache for the `GET /api/v1/admin/has-users` probe result.
 *
 * Extracted from `auth.global.ts` middleware so that:
 *  1. Tests can reset the cache between runs without depending on Nuxt's
 *     middleware module boundary.
 *  2. The middleware `default` export stays the only export from that file,
 *     satisfying Nuxt's route-middleware contract cleanly.
 *
 * `hasUsersCache` is `null` until the first probe resolves, then `true` or
 * `false` for the lifetime of the browser session.
 */

import { ref } from 'vue';

export const hasUsersCache = ref<boolean | null>(null);

/** Reset the cache — intended for use in tests only. */
export function resetHasUsersCache(): void {
  hasUsersCache.value = null;
}
