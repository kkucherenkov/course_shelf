/**
 * Composable for the Course detail page (and the lesson player, which needs
 * the same outline to render its sidebar).
 *
 * Wraps `getCourseOutline` and exposes the outline data plus mutation helpers
 * for `markCourseComplete` and `resetCourseProgress`.
 *
 * Mutations do NOT use `useAsyncData` — they are imperative calls that update
 * the outline ref directly from the response.
 *
 * The handler passed to `useAsyncData` is memoised at module scope per
 * `courseId` so multiple call sites (course detail page + lesson player)
 * share the SAME function reference. Without this, Nuxt warns:
 *
 *   [useAsyncData] Incompatible options detected for "course-outline:<id>":
 *     - different handler
 *
 * `errorStatus` is exposed as a computed derived from the thrown error rather
 * than a ref the handler closes over — so the handler closure stays free of
 * per-instance state and remains identity-stable.
 */

import { computed } from 'vue';
import { getCourseOutline, markCourseComplete, resetCourseProgress } from '@app/api-client-ts';
import type { CourseOutlineDto, Problem } from '@app/api-client-ts';

export type OutlineStatus = 'idle' | 'pending' | 'success' | 'error';

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

const handlerCache = new Map<string, () => Promise<CourseOutlineDto>>();

function getOutlineHandler(courseId: string): () => Promise<CourseOutlineDto> {
  let cached = handlerCache.get(courseId);
  if (!cached) {
    cached = async () => {
      const res = await getCourseOutline({ path: { id: courseId } });
      if (res.error) {
        throw toError(res.error, res.response.status);
      }
      return res.data as CourseOutlineDto;
    };
    handlerCache.set(courseId, cached);
  }
  return cached;
}

export interface UseCourseOutlineReturn {
  data: Ref<CourseOutlineDto | undefined>;
  status: Ref<OutlineStatus>;
  error: Ref<Error | null>;
  /** HTTP status of the last failed request — used to detect 403. */
  errorStatus: Ref<number | null>;
  refetch: () => Promise<void>;
  /** Calls markCourseComplete; updates `data` from response. Returns error or null. */
  markComplete: () => Promise<Error | null>;
  /** Calls resetCourseProgress; updates `data` from response. Returns error or null. */
  resetProgress: () => Promise<Error | null>;
  /** True while markComplete or resetProgress is in flight. */
  mutating: Ref<boolean>;
}

export function useCourseOutline(courseId: string): UseCourseOutlineReturn {
  const mutating = ref(false);

  const { data, status, error, refresh } = useAsyncData<CourseOutlineDto>(
    `course-outline:${courseId}`,
    getOutlineHandler(courseId),
    { lazy: true },
  );

  const errorStatus = computed<number | null>(() => {
    const e = error.value;
    if (e instanceof HttpStatusError) return e.httpStatus;
    return null;
  });

  async function markComplete(): Promise<Error | null> {
    mutating.value = true;
    try {
      const res = await markCourseComplete({ path: { id: courseId } });
      if (res.error) return toError(res.error, res.response.status);
      data.value = res.data as CourseOutlineDto;
      return null;
    } finally {
      mutating.value = false;
    }
  }

  async function resetProgress(): Promise<Error | null> {
    mutating.value = true;
    try {
      const res = await resetCourseProgress({ path: { id: courseId } });
      if (res.error) return toError(res.error, res.response.status);
      data.value = res.data as CourseOutlineDto;
      return null;
    } finally {
      mutating.value = false;
    }
  }

  return {
    data,
    status: status as Ref<OutlineStatus>,
    error: error as Ref<Error | null>,
    errorStatus,
    refetch: refresh,
    markComplete,
    resetProgress,
    mutating,
  };
}
