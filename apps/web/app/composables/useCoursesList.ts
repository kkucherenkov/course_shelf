/**
 * Wraps `listCourses` (`GET /api/v1/courses`) for the Browse page.
 *
 * Returns the same `{ data, status, error, refetch }` shape used by every
 * other page-level composable in apps/web (mirrors useHome.* and
 * useCourseOutline). `useAsyncData` keeps the SPA semantics consistent
 * with the rest of the app (`server: false`).
 *
 * Browse filters/sort (E14-F01-S02): pass refs for `status` and `sort` and
 * the composable refetches whenever either changes. The cache key embeds
 * the active filter+sort so each combination has its own entry — switching
 * back to a previous filter hits cache instantly.
 */

import { client, listCourses } from '@app/api-client-ts';
import type { CourseListDto } from '@app/api-client-ts';

// Reuse the canonical row-status alias from useHome so every page-level
// composable shares one type — Nuxt warns on duplicate auto-imports.
import type { RowStatus } from './useHome';

export type CourseListStatusFilter = 'all' | 'not-started' | 'in-progress' | 'completed';
export type CourseListSort = 'recently-watched' | 'newest' | 'alphabetical';

export interface UseCoursesListOptions {
  status?: Ref<CourseListStatusFilter>;
  sort?: Ref<CourseListSort>;
}

export function useCoursesList(options: UseCoursesListOptions = {}): {
  data: Ref<CourseListDto | undefined>;
  status: Ref<RowStatus>;
  error: Ref<Error | null>;
  refetch: () => Promise<void>;
} {
  const statusRef = options.status;
  const sortRef = options.sort;

  const cacheKey = computed(
    () => `courses:list:${statusRef?.value ?? 'all'}:${sortRef?.value ?? 'recently-watched'}`,
  );

  // `useAsyncData`'s `watch` option is `MultiWatchSources` — Refs of any
  // value type qualify. Build the list with explicit `Ref<unknown>` so the
  // string-literal-union types of each individual ref don't pollute the
  // array element type and break the overload match.
  const watchSources: Ref<unknown>[] = [];
  if (statusRef !== undefined) watchSources.push(statusRef);
  if (sortRef !== undefined) watchSources.push(sortRef);

  const { data, status, error, refresh } = useAsyncData<CourseListDto>(
    cacheKey,
    async () => {
      const query: { status?: CourseListStatusFilter; sort?: CourseListSort } = {};
      if (statusRef && statusRef.value !== 'all') query.status = statusRef.value;
      if (sortRef && sortRef.value !== 'recently-watched') query.sort = sortRef.value;

      const res = await listCourses({
        client,
        throwOnError: false,
        ...(Object.keys(query).length > 0 ? { query } : {}),
      });
      if (res.error) {
        throw new Error('Failed to load courses');
      }
      return res.data;
    },
    {
      server: false,
      default: (): CourseListDto => ({ items: [] }),
      watch: watchSources,
    },
  );

  return {
    // useAsyncData's data ref is `Ref<PickFrom<ResT, KeysOf<DataT>> | undefined>`
    // — a Nuxt typing artefact that doesn't preserve the explicit `<CourseListDto>`
    // generic for callers. Cast back so consumers get the DTO they asked for.
    data: data as unknown as Ref<CourseListDto | undefined>,
    status: status as Ref<RowStatus>,
    error: error as Ref<Error | null>,
    refetch: async () => {
      await refresh();
    },
  };
}
