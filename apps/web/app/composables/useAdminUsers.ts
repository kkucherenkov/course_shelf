/**
 * Wraps `listAdminUsers` (`GET /api/v1/admin/users`) for the admin Users page.
 *
 * Accepts a reactive search ref so changing it triggers a fresh fetch via a
 * unique `useAsyncData` key. Returns the canonical
 * `{ data, status, error, errorStatus, refetch }` shape.
 * Uses `lazy: true` so the page skeleton renders while data loads.
 */

import { computed } from 'vue';
import type { Ref } from 'vue';
import { listAdminUsers, client } from '@app/api-client-ts';
import type { AdminUserListDto } from '@app/api-client-ts';

export type AdminUsersStatus = 'idle' | 'pending' | 'success' | 'error';

class HttpStatusError extends Error {
  constructor(
    public readonly httpStatus: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpStatusError';
  }
}

export interface UseAdminUsersReturn {
  data: Ref<AdminUserListDto | undefined>;
  status: Ref<AdminUsersStatus>;
  error: Ref<Error | null>;
  errorStatus: Ref<number | null>;
  refetch: () => Promise<void>;
}

export function useAdminUsers(search: Ref<string>): UseAdminUsersReturn {
  const { data, status, error, refresh } = useAsyncData<AdminUserListDto>(
    // Key includes search so Nuxt refetches when it changes.
    () => `admin-users-${search.value}`,
    async () => {
      const res = await listAdminUsers({
        client,
        throwOnError: false,
        query: {
          search: search.value || undefined,
          limit: 100,
        },
      });
      if (res.error) {
        throw new HttpStatusError(res.response.status, 'Failed to load admin users');
      }
      return res.data as AdminUserListDto;
    },
    { lazy: true, watch: [search] },
  );

  const errorStatus = computed<number | null>(() => {
    const e = error.value;
    if (e instanceof HttpStatusError) return e.httpStatus;
    return null;
  });

  return {
    data,
    status: status as Ref<AdminUsersStatus>,
    error: error as Ref<Error | null>,
    errorStatus,
    refetch: async () => {
      await refresh();
    },
  };
}
