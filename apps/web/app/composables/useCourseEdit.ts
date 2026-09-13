/**
 * Course metadata editor composable (E30-F03-S01).
 *
 * Wraps `getCourse` (fetch) and `updateCourse` (`PATCH /api/v1/courses/{id}`)
 * for the admin-only edit page at `pages/courses/[id]/edit.vue`.
 *
 * `UpdateCourseRequest` is a genuine partial update: a field absent from the
 * payload is left untouched server-side. `buildUpdatePayload` is the one
 * place that turns "which fields did the admin actually edit" into that
 * payload — an untouched field never makes it into the request, so a stale
 * render can never clobber a value a scraper (or another admin) set after
 * the form loaded. `null` is reserved for an explicit clear the admin asked
 * for (see the field-by-field mapping below); omission is the default.
 *
 * The handler passed to `useAsyncData` is memoised at module scope per
 * `courseId`, matching `useCourseOutline` / `useAdminUser` — Nuxt warns on a
 * changing handler identity otherwise.
 */

import { computed, reactive, ref, type Ref } from 'vue';
import { getCourse, updateCourse, client } from '@app/api-client-ts';
import type {
  CourseDto,
  CourseLevel,
  ExternalIdRef,
  Problem,
  UpdateCourseRequest,
} from '@app/api-client-ts';

export type CourseEditStatus = 'idle' | 'pending' | 'success' | 'error';

/** Form-editable mirror of `UpdateCourseRequest` — all primitives, no `undefined`. */
export interface CourseFormState {
  title: string;
  description: string;
  slug: string;
  level: CourseLevel | null;
  language: string;
  /** `YYYY-MM-DD`, or `''` for unset. */
  releaseDate: string;
  posterUrl: string;
  ratingAverage: number | null;
  ratingCount: number | null;
  instructorIds: string[];
  studioIds: string[];
  tagIds: string[];
  externalIds: ExternalIdRef[];
  /** `YYYY-MM-DDTHH:mm` (datetime-local), or `''` for unset. */
  sourceUpdatedAt: string;
}

export type CourseFormField = keyof CourseFormState;

class HttpStatusError extends Error {
  constructor(
    public readonly httpStatus: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpStatusError';
  }
}

function toError(raw: unknown, statusCode: number): Error {
  if (raw instanceof Error) return raw;
  const p = raw as Problem;
  return new HttpStatusError(statusCode, p.detail ?? p.title ?? 'Request failed');
}

/** Builds the initial form state from the fetched course. */
export function courseToFormState(course: CourseDto): CourseFormState {
  return {
    title: course.title,
    description: course.description ?? '',
    slug: course.slug,
    level: course.level ?? null,
    language: course.language ?? '',
    releaseDate: course.releaseDate ?? '',
    posterUrl: course.posterUrl ?? '',
    ratingAverage: course.ratingAverage ?? null,
    ratingCount: course.ratingCount ?? null,
    instructorIds: (course.instructors ?? []).map((i) => i.id),
    studioIds: (course.studios ?? []).map((s) => s.id),
    tagIds: (course.tags ?? []).map((t) => t.id),
    externalIds: course.externalIds ?? [],
    // ponytail: sliced as UTC wall-clock, no local-tz conversion — sourceUpdatedAt
    // is an upstream bookkeeping timestamp, not a value anyone reads at a glance.
    sourceUpdatedAt: course.sourceUpdatedAt ? course.sourceUpdatedAt.slice(0, 16) : '',
  };
}

/**
 * Turns the touched subset of `form` into an `UpdateCourseRequest`. A field
 * missing from `touched` is omitted entirely — never sent, never nulled.
 *
 * `ratingAverage`/`ratingCount` travel together: the API rejects one without
 * the other, so touching either includes both current form values.
 */
export function buildUpdatePayload(
  form: CourseFormState,
  touched: ReadonlySet<CourseFormField>,
): UpdateCourseRequest {
  const payload: UpdateCourseRequest = {};

  if (touched.has('title')) payload.title = form.title.trim();
  if (touched.has('description')) payload.description = form.description.trim();
  if (touched.has('slug')) payload.slug = form.slug.trim();
  if (touched.has('level')) payload.level = form.level;
  if (touched.has('language')) payload.language = form.language.trim() || null;
  if (touched.has('releaseDate')) payload.releaseDate = form.releaseDate || null;
  if (touched.has('posterUrl')) payload.posterUrl = form.posterUrl.trim() || null;
  if (touched.has('ratingAverage') || touched.has('ratingCount')) {
    payload.ratingAverage = form.ratingAverage;
    payload.ratingCount = form.ratingCount;
  }
  if (touched.has('instructorIds')) payload.instructorIds = form.instructorIds;
  if (touched.has('studioIds')) payload.studioIds = form.studioIds;
  if (touched.has('tagIds')) payload.tagIds = form.tagIds;
  if (touched.has('externalIds')) payload.externalIds = form.externalIds;
  if (touched.has('sourceUpdatedAt')) {
    payload.sourceUpdatedAt = form.sourceUpdatedAt
      ? new Date(form.sourceUpdatedAt).toISOString()
      : null;
  }

  return payload;
}

export interface UseCourseFormStateReturn {
  /** Reactive — bind directly in templates, e.g. `v-model="form.title"` is NOT
   * used on purpose; every write must go through `setField` so it gets marked
   * touched. */
  form: CourseFormState;
  touched: ReadonlySet<CourseFormField>;
  /** Writes one field and marks it touched. */
  setField: <K extends CourseFormField>(key: K, value: CourseFormState[K]) => void;
  /** Writes both rating fields at once — see `buildUpdatePayload`'s pairing rule. */
  setRating: (average: number | null, count: number | null) => void;
}

/**
 * Shared editable state for the metadata form and the scrape-preview panel —
 * both write into the same `form`/`touched` pair so an "apply" click in the
 * panel behaves exactly like the admin editing the field by hand.
 */
export function useCourseFormState(initial: CourseFormState): UseCourseFormStateReturn {
  const form = reactive({ ...initial }) as CourseFormState;
  const touchedSet = reactive(new Set<CourseFormField>());

  function setField<K extends CourseFormField>(key: K, value: CourseFormState[K]): void {
    form[key] = value;
    touchedSet.add(key);
  }

  function setRating(average: number | null, count: number | null): void {
    form.ratingAverage = average;
    form.ratingCount = count;
    touchedSet.add('ratingAverage');
    touchedSet.add('ratingCount');
  }

  return { form, touched: touchedSet, setField, setRating };
}

const handlerCache = new Map<string, () => Promise<CourseDto>>();

function getCourseHandler(courseId: string): () => Promise<CourseDto> {
  let cached = handlerCache.get(courseId);
  if (!cached) {
    cached = async () => {
      const res = await getCourse({ client, throwOnError: false, path: { id: courseId } });
      if (res.error) throw toError(res.error, res.response.status);
      return res.data as CourseDto;
    };
    handlerCache.set(courseId, cached);
  }
  return cached;
}

export interface UseCourseEditReturn {
  data: Ref<CourseDto | undefined>;
  status: Ref<CourseEditStatus>;
  error: Ref<Error | null>;
  errorStatus: Ref<number | null>;
  refetch: () => Promise<void>;
  saving: Ref<boolean>;
  /** Sends `payload` as-is via `updateCourse`; the caller builds it with `buildUpdatePayload`. */
  save: (payload: UpdateCourseRequest) => Promise<Error | null>;
}

export function useCourseEdit(courseId: string): UseCourseEditReturn {
  const saving = ref(false);

  const { data, status, error, refresh } = useAsyncData<CourseDto>(
    `course-edit:${courseId}`,
    getCourseHandler(courseId),
    { lazy: true },
  );

  const errorStatus = computed<number | null>(() => {
    const e = error.value as { statusCode?: number; status?: number } | null | undefined;
    if (typeof e?.statusCode === 'number') return e.statusCode;
    if (typeof e?.status === 'number') return e.status;
    return null;
  });

  async function save(payload: UpdateCourseRequest): Promise<Error | null> {
    saving.value = true;
    try {
      const res = await updateCourse({
        client,
        throwOnError: false,
        path: { id: courseId },
        body: payload,
      });
      if (res.error) return toError(res.error, res.response.status);
      data.value = res.data as CourseDto;
      return null;
    } finally {
      saving.value = false;
    }
  }

  return {
    data,
    status: status as Ref<CourseEditStatus>,
    error: error as Ref<Error | null>,
    errorStatus,
    refetch: async () => {
      await refresh();
    },
    saving,
    save,
  };
}
