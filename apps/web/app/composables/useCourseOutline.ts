/**
 * Composable for the Course detail page.
 *
 * Wraps `getCourseOutline` and exposes the outline data plus mutation helpers
 * for `markCourseComplete` and `resetCourseProgress`.
 *
 * Mutations do NOT use `useAsyncData` — they are imperative calls that update
 * the outline ref directly from the response.
 */

import { getCourseOutline, markCourseComplete, resetCourseProgress } from '@app/api-client-ts';
import type { CourseOutlineDto, Problem } from '@app/api-client-ts';

export type OutlineStatus = 'idle' | 'pending' | 'success' | 'error';

function toError(raw: unknown): Error {
  if (raw instanceof Error) return raw;
  const p = raw as Problem;
  const msg = p.detail ?? p.title ?? 'Request failed';
  return new Error(msg);
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
  const errorStatus = ref<number | null>(null);
  const mutating = ref(false);

  const { data, status, error, refresh } = useAsyncData<CourseOutlineDto>(
    `course-outline:${courseId}`,
    async () => {
      const res = await getCourseOutline({ path: { id: courseId } });
      if (res.error) {
        errorStatus.value = res.response.status;
        throw toError(res.error);
      }
      errorStatus.value = null;
      return res.data as CourseOutlineDto;
    },
    { lazy: true },
  );

  async function markComplete(): Promise<Error | null> {
    mutating.value = true;
    try {
      const res = await markCourseComplete({ path: { id: courseId } });
      if (res.error) return toError(res.error);
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
      if (res.error) return toError(res.error);
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
