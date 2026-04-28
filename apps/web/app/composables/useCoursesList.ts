/**
 * Wraps `listCourses` (`GET /api/v1/courses`) for the Browse page.
 *
 * Returns the same `{ data, status, error, refetch }` shape used by every
 * other page-level composable in apps/web (mirrors useHome.* and
 * useCourseOutline). `useAsyncData` keeps the SPA semantics consistent
 * with the rest of the app (`server: false`).
 */

import { client, listCourses } from '@app/api-client-ts';
import type { CourseListDto } from '@app/api-client-ts';

// Reuse the canonical row-status alias from useHome so every page-level
// composable shares one type — Nuxt warns on duplicate auto-imports.
import type { RowStatus } from './useHome';

export function useCoursesList(): {
  data: Ref<CourseListDto | undefined>;
  status: Ref<RowStatus>;
  error: Ref<Error | null>;
  refetch: () => Promise<void>;
} {
  const { data, status, error, refresh } = useAsyncData<CourseListDto>(
    'courses:list',
    async () => {
      const res = await listCourses({ client, throwOnError: false });
      if (res.error) {
        throw new Error('Failed to load courses');
      }
      return res.data;
    },
    { server: false, default: () => ({ items: [] }) },
  );

  return {
    data,
    status: status as Ref<RowStatus>,
    error: error as Ref<Error | null>,
    refetch: async () => {
      await refresh();
    },
  };
}
