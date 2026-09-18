/**
 * Wraps `listCourses` (`GET /api/v1/courses`) for the Browse page.
 *
 * Returns the same `{ data, status, error, refetch }` shape used by every
 * other page-level composable in apps/web (mirrors useHome.* and
 * useCourseOutline). `useAsyncData` keeps the SPA semantics consistent
 * with the rest of the app (`server: false`).
 *
 * Browse filters/sort (E14-F01-S02, completed in E31-F01-S01): pass refs for
 * any of status / sort / library / duration bucket / instructor and the
 * composable refetches whenever one changes. Every one of them is applied by
 * the server, so the response is the answer — there is no client-side
 * post-filtering to keep in sync. The cache key embeds the whole active
 * combination, so returning to a previous one hits cache instantly.
 *
 * `useCourseCatalogAccess` (below) is the unfiltered case of the same call —
 * see its own doc comment for why Browse and Home each need it alongside
 * `useLibraries`.
 */

import { computed } from 'vue';
import { client, listCourses } from '@app/api-client-ts';
import type { CourseListDto, Problem } from '@app/api-client-ts';
import type { ComputedRef } from 'vue';

// Reuse the canonical row-status alias from useHome so every page-level
// composable shares one type — Nuxt warns on duplicate auto-imports.
import type { RowStatus } from './useHome';

// `statusCode` mirrors useCourseOutline.ts's HttpStatusError — same reason:
// h3 / Nuxt's `createError` (which useAsyncData wraps thrown errors in)
// reads and preserves this exact property name.
class HttpStatusError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'HttpStatusError';
    this.statusCode = statusCode;
  }
}

function toError(raw: unknown, statusCode: number): Error {
  if (raw instanceof Error) return raw;
  const p = raw as Problem;
  const msg = p.detail ?? p.title ?? 'Failed to load courses';
  return new HttpStatusError(statusCode, msg);
}

// `error.value` is a plain `Error` at the type level, but useAsyncData wraps
// whatever the handler throws with `createError`, which preserves
// `statusCode`/`status` while breaking `instanceof HttpStatusError` — duck
// type it instead (same approach as useCourseOutline.ts's `errorStatus`).
// Lets Browse tell a 429 (wrong advice: "check your connection") apart from
// a genuine network/5xx failure (#212).
function errorStatusOf(error: Ref<Error | null>): ComputedRef<number | null> {
  return computed(() => {
    const e = error.value as { statusCode?: number; status?: number } | null;
    if (typeof e?.statusCode === 'number') return e.statusCode;
    if (typeof e?.status === 'number') return e.status;
    return null;
  });
}

export type CourseListStatusFilter = 'all' | 'not-started' | 'in-progress' | 'completed';
export type CourseListSort = 'recently-watched' | 'newest' | 'alphabetical' | 'duration';
export type CourseListDurationBucket = 'all' | 'lt5' | '5to10' | '10to20' | 'gt20';

/** The value each filter takes when it is not narrowing anything. */
export const COURSE_LIST_DEFAULTS = {
  status: 'all',
  sort: 'recently-watched',
  durationBucket: 'all',
  libraryId: '',
  instructorId: '',
} as const;

export interface UseCoursesListOptions {
  status?: Ref<CourseListStatusFilter>;
  sort?: Ref<CourseListSort>;
  durationBucket?: Ref<CourseListDurationBucket>;
  libraryId?: Ref<string>;
  instructorId?: Ref<string>;
}

export function useCoursesList(options: UseCoursesListOptions = {}): {
  data: Ref<CourseListDto | undefined>;
  status: Ref<RowStatus>;
  error: Ref<Error | null>;
  /** HTTP status of the last failed request — lets a caller tell a 429 apart
   * from a genuine connection/server failure (#212). */
  errorStatus: ComputedRef<number | null>;
  refetch: () => Promise<void>;
} {
  const {
    status: statusRef,
    sort: sortRef,
    durationBucket: durationRef,
    libraryId: libraryRef,
    instructorId: instructorRef,
  } = options;

  const cacheKey = computed(() =>
    [
      'courses:list',
      statusRef?.value ?? COURSE_LIST_DEFAULTS.status,
      sortRef?.value ?? COURSE_LIST_DEFAULTS.sort,
      durationRef?.value ?? COURSE_LIST_DEFAULTS.durationBucket,
      libraryRef?.value ?? COURSE_LIST_DEFAULTS.libraryId,
      instructorRef?.value ?? COURSE_LIST_DEFAULTS.instructorId,
    ].join(':'),
  );

  // `useAsyncData`'s `watch` option is `MultiWatchSources` — Refs of any
  // value type qualify. Build the list with explicit `Ref<unknown>` so the
  // string-literal-union types of each individual ref don't pollute the
  // array element type and break the overload match.
  const watchSources: Ref<unknown>[] = [];
  for (const source of [statusRef, sortRef, durationRef, libraryRef, instructorRef]) {
    if (source !== undefined) watchSources.push(source as Ref<unknown>);
  }

  const { data, status, error, refresh } = useAsyncData<CourseListDto>(
    cacheKey,
    async () => {
      // Defaults are omitted rather than sent — the server applies the same
      // fallbacks, and a bare `GET /courses` is the cacheable common case.
      const query: {
        status?: CourseListStatusFilter;
        sort?: CourseListSort;
        durationBucket?: CourseListDurationBucket;
        libraryId?: string;
        instructorId?: string;
      } = {};
      if (statusRef && statusRef.value !== COURSE_LIST_DEFAULTS.status)
        query.status = statusRef.value;
      if (sortRef && sortRef.value !== COURSE_LIST_DEFAULTS.sort) query.sort = sortRef.value;
      if (durationRef && durationRef.value !== COURSE_LIST_DEFAULTS.durationBucket)
        query.durationBucket = durationRef.value;
      if (libraryRef && libraryRef.value !== COURSE_LIST_DEFAULTS.libraryId)
        query.libraryId = libraryRef.value;
      if (instructorRef && instructorRef.value !== COURSE_LIST_DEFAULTS.instructorId)
        query.instructorId = instructorRef.value;

      const res = await listCourses({
        client,
        throwOnError: false,
        ...(Object.keys(query).length > 0 ? { query } : {}),
      });
      if (res.error) {
        throw toError(res.error, res.response.status);
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
    errorStatus: errorStatusOf(error as Ref<Error | null>),
    refetch: async () => {
      await refresh();
    },
  };
}

/**
 * Whether the account can see ANY course in the catalogue at all — an
 * unfiltered `GET /courses` probe, i.e. `useCoursesList()` with no filters.
 *
 * Browse and Home both need this to tell "nothing was ever granted to this
 * account" apart from every other empty state, and both used to answer it
 * from `useLibraries` alone. That signal only covers grants that target a
 * library directly: `AuthorizationService.canSee`'s "library grant implies
 * access to its courses" rule is one-directional, so a COURSE-level grant —
 * the admin UI offers those — puts a course in this response without ever
 * putting a row in `GET /libraries`. Read `useLibraries` alone, that account
 * looks exactly like one with zero grants: the catalogue gets hidden,
 * including the one course the grant was actually for (tuxedo 249).
 *
 * Neither probe alone is enough, which is why callers OR this with
 * `useLibraries`'s own item count rather than replacing it: a library-level
 * grant to a library that is genuinely empty leaves THIS probe at zero
 * without the account being denied (that's the "granted, nothing to see"
 * empty state, not "no access").
 */
export function useCourseCatalogAccess(): {
  hasAnyCourse: ComputedRef<boolean>;
  status: Ref<RowStatus>;
} {
  const { data, status } = useCoursesList();
  return {
    hasAnyCourse: computed(() => (data.value?.items.length ?? 0) > 0),
    status,
  };
}
