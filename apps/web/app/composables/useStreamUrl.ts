/**
 * useStreamUrl
 *
 * Fetches a signed stream URL for a lesson via `issueStreamUrl`.
 * On HTTP 401, calls `auth.refresh()` and retries once.
 * On retry failure or 403, surfaces `errorStatus` for the page.
 *
 * The backend returns a same-origin relative path so it doesn't need to
 * know its own public hostname. In dev the SPA (3001) and API (3000) live
 * on different origins, and in prod they may sit behind the same domain —
 * so we resolve any relative URL against `runtimeConfig.public.apiBaseUrl`
 * before handing it to the `<video>` element.
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

function resolveStreamUrl(raw: string, apiBaseUrl: string): string {
  // Already absolute — nothing to do.
  if (/^https?:\/\//i.test(raw)) return raw;
  // Strip the `/api/v1` suffix from runtime config to get the bare API origin,
  // since the backend already includes the full `/api/v1/...` path.
  const apiOrigin = apiBaseUrl.replace(/\/api\/v1\/?$/, '');
  return new URL(raw, apiOrigin).toString();
}

export function useStreamUrl(): UseStreamUrlReturn {
  const url = ref<string | null>(null);
  const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle');
  const errorStatus = ref<number | null>(null);

  const auth = useAuthStore();
  const config = useRuntimeConfig();
  const apiBaseUrl = config.public.apiBaseUrl as string;

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
      url.value = resolveStreamUrl(result.data.url, apiBaseUrl);
      status.value = 'success';
    } else {
      errorStatus.value = result.httpStatus;
      status.value = 'error';
    }
  }

  return { url, status, errorStatus, fetch };
}
