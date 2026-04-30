/**
 * Composable that wraps `searchCatalogue` with reactive query watching.
 *
 * When `qRef` trimmed length is < 2 the fetch is skipped entirely and the
 * composable returns `status = 'idle'` without hitting the network.
 * Reactive to `qRef` changes — changing the ref causes a re-fetch automatically.
 *
 * Follows the same `HttpStatusError` pattern as `useCourseOutline`.
 */

import { ref, computed, watch, type Ref } from 'vue';
import { searchCatalogue } from '@app/api-client-ts';
import type { SearchResultDto, Problem } from '@app/api-client-ts';

export type SearchStatus = 'idle' | 'pending' | 'success' | 'error';

class HttpStatusError extends Error {
  constructor(
    public readonly httpStatus: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpStatusError';
  }
}

function toError(raw: unknown, httpStatus: number): Error {
  if (raw instanceof Error) return raw;
  const p = raw as Problem;
  const msg = p.detail ?? p.title ?? 'Request failed';
  return new HttpStatusError(httpStatus, msg);
}

export interface UseSearchReturn {
  data: Ref<SearchResultDto | null>;
  status: Ref<SearchStatus>;
  error: Ref<Error | null>;
  errorStatus: Ref<number | null>;
}

export function useSearch(qRef: Ref<string>): UseSearchReturn {
  const trimmedQ = computed(() => qRef.value.trim());
  const isActive = computed(() => trimmedQ.value.length >= 2);

  const data = ref<SearchResultDto | null>(null);
  const status = ref<SearchStatus>('idle');
  const error = ref<Error | null>(null);

  const errorStatus = computed<number | null>(() => {
    const e = error.value;
    if (e instanceof HttpStatusError) return e.httpStatus;
    return null;
  });

  async function doSearch(q: string): Promise<void> {
    status.value = 'pending';
    error.value = null;
    try {
      const res = await searchCatalogue({ query: { q, limit: 20 } });
      if (res.error) {
        throw toError(res.error, res.response.status);
      }
      data.value = res.data as SearchResultDto;
      status.value = 'success';
    } catch (error_) {
      error.value = error_ instanceof Error ? error_ : new Error(String(error_));
      status.value = 'error';
    }
  }

  watch(
    trimmedQ,
    (q) => {
      if (!isActive.value) {
        data.value = null;
        status.value = 'idle';
        error.value = null;
        return;
      }
      void doSearch(q);
    },
    { immediate: true },
  );

  return {
    data: data as Ref<SearchResultDto | null>,
    status: status as Ref<SearchStatus>,
    error: error as Ref<Error | null>,
    errorStatus,
  };
}
