/**
 * Wraps `getAdminDashboard` (`GET /api/v1/admin/dashboard`) for the admin
 * Dashboard page.
 *
 * Returns the canonical `{ data, status, error, errorStatus, refetch }` shape.
 * Uses `lazy: true` so the page skeleton shows while data loads.
 */

import { computed } from 'vue';
import { getAdminDashboard, client } from '@app/api-client-ts';
import type { AdminDashboardDto } from '@app/api-client-ts';

export type AdminDashboardStatus = 'idle' | 'pending' | 'success' | 'error';

class HttpStatusError extends Error {
  constructor(
    public readonly httpStatus: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpStatusError';
  }
}

export interface UseAdminDashboardReturn {
  data: Ref<AdminDashboardDto | undefined>;
  status: Ref<AdminDashboardStatus>;
  error: Ref<Error | null>;
  errorStatus: Ref<number | null>;
  refetch: () => Promise<void>;
}

export function useAdminDashboard(): UseAdminDashboardReturn {
  const { data, status, error, refresh } = useAsyncData<AdminDashboardDto>(
    'admin-dashboard',
    async () => {
      const res = await getAdminDashboard({ client, throwOnError: false });
      if (res.error) {
        throw new HttpStatusError(res.response.status, 'Failed to load admin dashboard');
      }
      return res.data as AdminDashboardDto;
    },
    { lazy: true },
  );

  const errorStatus = computed<number | null>(() => {
    const e = error.value;
    if (e instanceof HttpStatusError) return e.httpStatus;
    return null;
  });

  return {
    data,
    status: status as Ref<AdminDashboardStatus>,
    error: error as Ref<Error | null>,
    errorStatus,
    refetch: async () => {
      await refresh();
    },
  };
}
