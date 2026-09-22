/**
 * Wraps `listScrapers` (`GET /api/v1/admin/scrapers`) for the admin Scrapers
 * inventory page (E30-F01-S02).
 *
 * Returns the canonical `{ data, status, error, errorStatus, refetch }` shape.
 * Uses `lazy: true` so the page skeleton shows while data loads.
 */

import { computed } from 'vue';
import { listScrapers, client } from '@app/api-client-ts';
import type { ScraperListDto } from '@app/api-client-ts';

export type AdminScrapersStatus = 'idle' | 'pending' | 'success' | 'error';

class HttpStatusError extends Error {
  constructor(
    public readonly httpStatus: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpStatusError';
  }
}

export interface UseAdminScrapersReturn {
  data: Ref<ScraperListDto | undefined>;
  status: Ref<AdminScrapersStatus>;
  error: Ref<Error | null>;
  errorStatus: Ref<number | null>;
  refetch: () => Promise<void>;
}

export function useAdminScrapers(): UseAdminScrapersReturn {
  const { data, status, error, refresh } = useAsyncData<ScraperListDto>(
    'admin-scrapers',
    async () => {
      const res = await listScrapers({ client, throwOnError: false });
      if (res.error) {
        throw new HttpStatusError(res.response.status, 'Failed to load scrapers');
      }
      return res.data as ScraperListDto;
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
    status: status as Ref<AdminScrapersStatus>,
    error: error as Ref<Error | null>,
    errorStatus,
    refetch: async () => {
      await refresh();
    },
  };
}
