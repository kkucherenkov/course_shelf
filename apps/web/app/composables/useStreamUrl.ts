/**
 * useStreamUrl
 *
 * Fetches a signed stream URL for a lesson via `issueStreamUrl`.
 * On HTTP 401, calls `auth.refresh()` and retries once.
 * On retry failure or 403, surfaces `errorStatus` for the page.
 */

import { ref } from 'vue';
import type { Ref } from 'vue';
import { issueStreamUrl } from '@app/api-client-ts';
import { useAuthStore } from '~/stores/auth';

export interface UseStreamUrlReturn {
  url: Ref<string | null>;
  status: Ref<'idle' | 'pending' | 'success' | 'error'>;
  errorStatus: Ref<number | null>;
  fetch: (lessonId: string) => Promise<void>;
}

export function useStreamUrl(): UseStreamUrlReturn {
  const url = ref<string | null>(null);
  const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle');
  const errorStatus = ref<number | null>(null);

  const auth = useAuthStore();

  async function fetch(lessonId: string): Promise<void> {
    status.value = 'pending';
    errorStatus.value = null;

    const attempt = async (): Promise<{ data: { url: string } | null; httpStatus: number }> => {
      const res = await issueStreamUrl({ path: { id: lessonId } });
      if (res.error) {
        return { data: null, httpStatus: res.response.status };
      }
      return { data: res.data as { url: string }, httpStatus: 200 };
    };

    let result = await attempt();

    if (result.httpStatus === 401) {
      // Retry once after token refresh
      const refreshed = await auth.refresh();
      if (refreshed) {
        result = await attempt();
      }
    }

    if (result.data) {
      url.value = result.data.url;
      status.value = 'success';
    } else {
      errorStatus.value = result.httpStatus;
      status.value = 'error';
    }
  }

  return { url, status, errorStatus, fetch };
}
