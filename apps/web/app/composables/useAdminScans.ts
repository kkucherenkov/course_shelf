/**
 * Wraps `listAdminScans` (`GET /api/v1/admin/scans?limit=10`) for the admin
 * Dashboard page's "Recent scans" table.
 *
 * Returns the canonical `{ data, status, error, errorStatus, refetch }` shape.
 * Uses `lazy: true` so the page skeleton shows while data loads.
 */

import { computed } from 'vue';
import { listAdminScans, client } from '@app/api-client-ts';
import type { AdminScanListDto } from '@app/api-client-ts';

export type AdminScansStatus = 'idle' | 'pending' | 'success' | 'error';

class HttpStatusError extends Error {
  constructor(
    public readonly httpStatus: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpStatusError';
  }
}

export interface UseAdminScansReturn {
  data: Ref<AdminScanListDto | undefined>;
  status: Ref<AdminScansStatus>;
  error: Ref<Error | null>;
  errorStatus: Ref<number | null>;
  refetch: () => Promise<void>;
}

export function useAdminScans(): UseAdminScansReturn {
  const { data, status, error, refresh } = useAsyncData<AdminScanListDto>(
    'admin-scans:limit-10',
    async () => {
      const res = await listAdminScans({ client, query: { limit: 10 }, throwOnError: false });
      if (res.error) {
        throw new HttpStatusError(res.response.status, 'Failed to load admin scans');
      }
      return res.data as AdminScanListDto;
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
    status: status as Ref<AdminScansStatus>,
    error: error as Ref<Error | null>,
    errorStatus,
    refetch: async () => {
      await refresh();
    },
  };
}
