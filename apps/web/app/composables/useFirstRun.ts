/**
 * Fetches `GET /api/v1/admin/has-users` once per browser session.
 * Result is cached in Nuxt's `useState` so all component instances share it.
 *
 * `hasUsers === null`  — probe not yet run
 * `hasUsers === false` — no users in the DB; the current sign-up flow is the first-run wizard
 * `hasUsers === true`  — at least one user exists; normal flow
 */

import { getAdminHasUsers, client } from '@app/api-client-ts';

export interface UseFirstRunReturn {
  hasUsers: ReturnType<typeof useState<boolean | null>>;
  refresh: () => Promise<void>;
}

export function useFirstRun(): UseFirstRunReturn {
  const hasUsers = useState<boolean | null>('cs.firstRun', () => null);

  async function refresh(): Promise<void> {
    try {
      const res = await getAdminHasUsers({ client, throwOnError: false });
      if (res.error || !res.data) {
        // Defensive: assume users exist on probe failure.
        hasUsers.value = true;
        return;
      }
      hasUsers.value = res.data.hasUsers;
    } catch {
      hasUsers.value = true;
    }
  }

  // Fetch on first access if not yet resolved.
  if (hasUsers.value === null) {
    void refresh();
  }

  return { hasUsers, refresh };
}
