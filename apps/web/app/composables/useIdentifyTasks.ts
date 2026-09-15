/**
 * Identify task queue composables (E30-F03-S02).
 *
 * Wraps the five identify-pipeline operations that had no `apps/web`
 * consumer before this card: `listIdentifyTasks`, `getIdentifyTask`,
 * `applyIdentifyResult`, `discardIdentifyTask` (all admin-only), plus
 * `runIdentifyTask` under the name `queueIdentifyTask` — the "queue for
 * review" action `CourseScrapePreviewPanel` calls once a candidate is chosen.
 *
 * This is the only path that resolves a scraped fragment's raw
 * `instructorNames` / `studioName` / `tags` into real entities — the backend
 * handler (`apply-identify-result.handler.ts`) does that resolution when a
 * task is applied. The scrape-preview panel's own "Apply" only ever writes
 * fields that map directly onto `UpdateCourseRequest`, by design.
 */

import { computed, ref, type Ref } from 'vue';
import {
  client,
  getCourse,
  getIdentifyTask,
  listIdentifyTasks,
  applyIdentifyResult,
  discardIdentifyTask,
  runIdentifyTask,
} from '@app/api-client-ts';
import type {
  CourseDto,
  IdentifyTaskDto,
  IdentifyTaskListDto,
  IdentifyTaskStatus,
  MergeMode,
  MergePolicyDto,
  RunIdentifyRequest,
} from '@app/api-client-ts';

export type IdentifyTasksStatus = 'idle' | 'pending' | 'success' | 'error';

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
  const p = raw as { detail?: string; title?: string };
  return new HttpStatusError(statusCode, p.detail ?? p.title ?? 'Request failed');
}

// ── Merge policy ─────────────────────────────────────────────────────────────

/** Every `MergePolicyDto` field, in the order the review panel renders them. */
export const MERGE_POLICY_FIELDS = [
  'title',
  'description',
  'level',
  'language',
  'posterUrl',
  'releaseDate',
  'ratingAverage',
  'ratingCount',
  'instructors',
  'studios',
  'tags',
  'externalIds',
] as const satisfies readonly (keyof MergePolicyDto)[];

export type MergePolicyField = (typeof MERGE_POLICY_FIELDS)[number];

/**
 * Fills every `MergePolicyDto` field explicitly. The API defaults an omitted
 * field to `merge` — so a field the admin toggled to `ignore` must still be
 * sent as `ignore`, never left out, or the omission silently overrides what
 * was just chosen. `modes` is usually the panel's live per-field state,
 * seeded from the task's stored policy.
 */
export function buildMergePolicy(
  modes: Partial<Record<MergePolicyField, MergeMode>>,
): MergePolicyDto {
  const policy = {} as MergePolicyDto;
  for (const field of MERGE_POLICY_FIELDS) {
    policy[field] = modes[field] ?? 'merge';
  }
  return policy;
}

// ── Queue list ───────────────────────────────────────────────────────────────

export interface UseIdentifyTasksListReturn {
  data: Ref<IdentifyTaskListDto | undefined>;
  status: Ref<IdentifyTasksStatus>;
  error: Ref<Error | null>;
  refetch: () => Promise<void>;
}

/** Lists identify tasks, optionally filtered by status. */
export function useIdentifyTasksList(status?: IdentifyTaskStatus): UseIdentifyTasksListReturn {
  const {
    data,
    status: fetchStatus,
    error,
    refresh,
  } = useAsyncData<IdentifyTaskListDto>(
    `identify-tasks:${status ?? 'all'}`,
    async () => {
      const res = await listIdentifyTasks({
        client,
        throwOnError: false,
        query: status ? { status } : undefined,
      });
      if (res.error) throw toError(res.error, res.response.status);
      return res.data;
    },
    { lazy: true },
  );

  return {
    data,
    status: fetchStatus as Ref<IdentifyTasksStatus>,
    error: error as Ref<Error | null>,
    refetch: async () => {
      await refresh();
    },
  };
}

// ── Single task + its course, apply/discard ────────────────────────────────

export interface IdentifyTaskBundle {
  task: IdentifyTaskDto;
  /** `null` only when the course fetch itself failed — the review panel
   * falls back to a blank "current value" column rather than failing the
   * whole page, since the task itself is still perfectly reviewable. */
  course: CourseDto | null;
}

const bundleHandlerCache = new Map<string, () => Promise<IdentifyTaskBundle>>();

function getBundleHandler(id: string): () => Promise<IdentifyTaskBundle> {
  let cached = bundleHandlerCache.get(id);
  if (!cached) {
    cached = async () => {
      const taskRes = await getIdentifyTask({ client, throwOnError: false, path: { id } });
      if (taskRes.error) throw toError(taskRes.error, taskRes.response.status);
      const task = taskRes.data;
      const courseRes = await getCourse({
        client,
        throwOnError: false,
        path: { id: task.courseId },
      });
      return { task, course: courseRes.error ? null : courseRes.data };
    };
    bundleHandlerCache.set(id, cached);
  }
  return cached;
}

export interface UseIdentifyTaskReturn {
  data: Ref<IdentifyTaskBundle | undefined>;
  status: Ref<IdentifyTasksStatus>;
  error: Ref<Error | null>;
  errorStatus: Ref<number | null>;
  refetch: () => Promise<void>;
  applying: Ref<boolean>;
  /** Sends `mergePolicy` as-is; the caller builds it with `buildMergePolicy`. */
  apply: (mergePolicy: MergePolicyDto) => Promise<Error | null>;
  discarding: Ref<boolean>;
  discard: () => Promise<Error | null>;
}

export function useIdentifyTask(id: string): UseIdentifyTaskReturn {
  const { data, status, error, refresh } = useAsyncData<IdentifyTaskBundle>(
    `identify-task:${id}`,
    getBundleHandler(id),
    { lazy: true },
  );

  const errorStatus = computed<number | null>(() => {
    const e = error.value as { statusCode?: number; status?: number } | null | undefined;
    if (typeof e?.statusCode === 'number') return e.statusCode;
    if (typeof e?.status === 'number') return e.status;
    return null;
  });

  const applying = ref(false);
  const discarding = ref(false);

  async function apply(mergePolicy: MergePolicyDto): Promise<Error | null> {
    applying.value = true;
    try {
      const res = await applyIdentifyResult({
        client,
        throwOnError: false,
        path: { id },
        body: { mergePolicy },
      });
      if (res.error) return toError(res.error, res.response.status);
      // Refetches both the (now `applied`) task and the course — the course's
      // instructors/studios/tags only reflect the resolved entities after
      // this round-trip.
      await refresh();
      return null;
    } finally {
      applying.value = false;
    }
  }

  async function discard(): Promise<Error | null> {
    discarding.value = true;
    try {
      const res = await discardIdentifyTask({ client, throwOnError: false, path: { id } });
      if (res.error) return toError(res.error, res.response.status);
      await refresh();
      return null;
    } finally {
      discarding.value = false;
    }
  }

  return {
    data,
    status: status as Ref<IdentifyTasksStatus>,
    error: error as Ref<Error | null>,
    errorStatus,
    refetch: async () => {
      await refresh();
    },
    applying,
    apply,
    discarding,
    discard,
  };
}

// ── Queue for review ─────────────────────────────────────────────────────────

/**
 * Creates an identify task from a chosen scrape candidate. Plain mutation,
 * not `useAsyncData`-backed — a one-shot POST fired from a button click in
 * `CourseScrapePreviewPanel`, mirroring `run` in `useCourseScrapePreview`.
 */
export async function queueIdentifyTask(
  courseId: string,
  body: RunIdentifyRequest,
): Promise<IdentifyTaskDto> {
  const res = await runIdentifyTask({ client, throwOnError: false, path: { id: courseId }, body });
  if (res.error) throw toError(res.error, res.response.status);
  return res.data;
}
