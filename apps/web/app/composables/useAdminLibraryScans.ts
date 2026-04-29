/**
 * Wraps `listAdminScans` (`GET /api/v1/admin/scans?libraryId=…&limit=10`) for
 * the admin Library detail page's scan-history table.
 *
 * Keyed `admin-scans:libraryId-{id}` so each library gets its own cache slot.
 * Uses `lazy: true` so the page skeleton shows while data loads.
 */

import { computed } from 'vue';
import { listAdminScans, client } from '@app/api-client-ts';
import type { AdminScanListDto } from '@app/api-client-ts';

export type AdminLibraryScansStatus = 'idle' | 'pending' | 'success' | 'error';

class HttpStatusError extends Error {
  constructor(
    public readonly httpStatus: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpStatusError';
  }
}

export interface UseAdminLibraryScansReturn {
  data: Ref<AdminScanListDto | undefined>;
  status: Ref<AdminLibraryScansStatus>;
  error: Ref<Error | null>;
  errorStatus: Ref<number | null>;
  refetch: () => Promise<void>;
}

export function useAdminLibraryScans(libraryId: Ref<string>): UseAdminLibraryScansReturn {
  const { data, status, error, refresh } = useAsyncData<AdminScanListDto>(
    computed(() => `admin-scans:libraryId-${libraryId.value}`),
    async () => {
      const res = await listAdminScans({
        client,
        query: { libraryId: libraryId.value, limit: 10 },
        throwOnError: false,
      });
      if (res.error) {
        throw new HttpStatusError(res.response.status, 'Failed to load library scans');
      }
      return res.data as AdminScanListDto;
    },
    { lazy: true, watch: [libraryId] },
  );

  const errorStatus = computed<number | null>(() => {
    const e = error.value;
    if (e instanceof HttpStatusError) return e.httpStatus;
    return null;
  });

  return {
    data,
    status: status as Ref<AdminLibraryScansStatus>,
    error: error as Ref<Error | null>,
    errorStatus,
    refetch: async () => {
      await refresh();
    },
  };
}
