/**
 * Wraps `getAdminUser` (`GET /api/v1/admin/users/{id}`) for the admin
 * Permissions page.
 *
 * Accepts a reactive userId ref. Uses `useAsyncData` with a stable per-id
 * handler (module-level Map memo — same pattern as `useCourseOutline`) so
 * multiple call sites (if any) share the same handler reference and Nuxt
 * does not warn about incompatible options.
 *
 * Returns the canonical `{ data, status, error, errorStatus, refetch }` shape.
 * Uses `lazy: true` so the page skeleton renders while data loads.
 */

import { computed, type Ref } from 'vue';
import { getAdminUser, client } from '@app/api-client-ts';
import type { AdminUserListItem } from '@app/api-client-ts';

export type AdminUserStatus = 'idle' | 'pending' | 'success' | 'error';

class HttpStatusError extends Error {
  constructor(
    public readonly httpStatus: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpStatusError';
  }
}

const handlerCache = new Map<string, () => Promise<AdminUserListItem>>();

function getAdminUserHandler(userId: string): () => Promise<AdminUserListItem> {
  let cached = handlerCache.get(userId);
  if (!cached) {
    cached = async () => {
      const res = await getAdminUser({ client, throwOnError: false, path: { id: userId } });
      if (res.error) {
        throw new HttpStatusError(res.response.status, 'Failed to load user');
      }
      return res.data as AdminUserListItem;
    };
    handlerCache.set(userId, cached);
  }
  return cached;
}

export interface UseAdminUserReturn {
  data: Ref<AdminUserListItem | undefined>;
  status: Ref<AdminUserStatus>;
  error: Ref<Error | null>;
  errorStatus: Ref<number | null>;
  refetch: () => Promise<void>;
}

export function useAdminUser(userIdRef: Ref<string>): UseAdminUserReturn {
  const { data, status, error, refresh } = useAsyncData<AdminUserListItem>(
    () => `admin-user:${userIdRef.value}`,
    () => getAdminUserHandler(userIdRef.value)(),
    { lazy: true, watch: [userIdRef] },
  );

  const errorStatus = computed<number | null>(() => {
    const e = error.value;
    if (e instanceof HttpStatusError) return e.httpStatus;
    return null;
  });

  return {
    data,
    status: status as Ref<AdminUserStatus>,
    error: error as Ref<Error | null>,
    errorStatus,
    refetch: async () => {
      await refresh();
    },
  };
}
