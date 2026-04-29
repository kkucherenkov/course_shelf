/**
 * Wraps `listAdminLibraries` (`GET /api/v1/admin/libraries`) for the admin
 * Libraries list page.
 *
 * Returns the canonical `{ data, status, error, errorStatus, refetch }` shape.
 * Uses `lazy: true` so the page skeleton shows while data loads.
 */

import { computed } from 'vue';
import { listAdminLibraries, client } from '@app/api-client-ts';
import type { AdminLibraryListDto } from '@app/api-client-ts';

export type AdminLibrariesStatus = 'idle' | 'pending' | 'success' | 'error';

class HttpStatusError extends Error {
  constructor(
    public readonly httpStatus: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpStatusError';
  }
}

export interface UseAdminLibrariesReturn {
  data: Ref<AdminLibraryListDto | undefined>;
  status: Ref<AdminLibrariesStatus>;
  error: Ref<Error | null>;
  errorStatus: Ref<number | null>;
  refetch: () => Promise<void>;
}

export function useAdminLibraries(): UseAdminLibrariesReturn {
  const { data, status, error, refresh } = useAsyncData<AdminLibraryListDto>(
    'admin-libraries',
    async () => {
      const res = await listAdminLibraries({ client, throwOnError: false });
      if (res.error) {
        throw new HttpStatusError(res.response.status, 'Failed to load admin libraries');
      }
      return res.data as AdminLibraryListDto;
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
    status: status as Ref<AdminLibrariesStatus>,
    error: error as Ref<Error | null>,
    errorStatus,
    refetch: async () => {
      await refresh();
    },
  };
}
