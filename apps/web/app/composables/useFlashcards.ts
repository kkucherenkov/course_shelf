/**
 * Flashcard review queue + card creation (E29-F01-S03).
 *
 * `useFlashcardReviewQueue` drives `/flashcards/review`: fetches the due
 * queue once via `useAsyncData` (same shape as useHome.ts's rows), then
 * grades and advances locally. A grade always pushes `dueAt` into the
 * future — SM-2's minimum interval is 1 day — so a graded card can never
 * still be due; it is spliced out of the local queue instead of a
 * round-trip to re-learn that.
 *
 * `useCreateFlashcard` wraps the one write both creation entry points (a
 * lesson note, a transcript line) call.
 */

import { computed, ref, watch } from 'vue';
import type { ComputedRef, Ref } from 'vue';
import { createFlashcard, gradeFlashcard, listDueFlashcards } from '@app/api-client-ts';
import type {
  CreateFlashcardRequest,
  FlashcardDto,
  FlashcardListDto,
  Problem,
} from '@app/api-client-ts';

// Reused rather than redeclared — Nuxt auto-imports every named export under
// `composables/`, and a second `RowStatus` here shadowed useHome.ts's with a
// silent "duplicated import, ignored" warning instead of a type error.
import type { RowStatus } from './useHome';

// `statusCode` mirrors useHome.ts's HttpStatusError — same reason: h3 /
// Nuxt's `createError` (which useAsyncData wraps thrown errors in) reads
// and preserves this exact property name.
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
  const msg = p.detail ?? p.title ?? 'Request failed';
  return new HttpStatusError(statusCode, msg);
}

// Same duck-typed read as useHome.ts's `errorStatusOf` — `useAsyncData`
// re-wraps a thrown error with `createError`, which keeps `statusCode`/
// `status` but breaks `instanceof HttpStatusError`. Lets the review page
// tell a 429 ("wait a moment") apart from a genuine connection failure (#799).
function errorStatusOf(error: Ref<Error | null>): ComputedRef<number | null> {
  return computed(() => {
    const e = error.value as { statusCode?: number; status?: number } | null;
    if (typeof e?.statusCode === 'number') return e.statusCode;
    if (typeof e?.status === 'number') return e.status;
    return null;
  });
}

// ── Review queue ──────────────────────────────────────────────────────────

export interface UseFlashcardReviewQueueReturn {
  queue: ComputedRef<FlashcardDto[]>;
  status: Ref<RowStatus>;
  error: Ref<Error | null>;
  /** HTTP status of the last failed request — 429 needs different advice (#799). */
  errorStatus: ComputedRef<number | null>;
  /** The card to show — `queue[0]`, most overdue first. */
  current: ComputedRef<FlashcardDto | null>;
  /** Size of the queue as first fetched — the review screen's "N left" denominator. */
  total: Ref<number>;
  /** True while a grade request is in flight — disables the review card's actions. */
  grading: Ref<boolean>;
  gradeError: Ref<Error | null>;
  /** Grades the current card (SM-2 0..5) and drops it from the local queue on success. */
  grade: (value: number) => Promise<void>;
  refetch: () => Promise<void>;
}

const DEFAULT_QUEUE_LIMIT = 20;

export function useFlashcardReviewQueue(
  limit = DEFAULT_QUEUE_LIMIT,
  // `immediate: false` lets a caller that isn't sure a session exists yet
  // (`layouts/default.vue`'s due-count badge, mounted on every page
  // including public/anonymous ones) skip the auto-fetch entirely rather
  // than firing an authenticated call that can only 401. Defaults to `true`
  // so `pages/flashcards/review.vue` — always behind auth — is unaffected.
  options: { immediate?: boolean } = {},
): UseFlashcardReviewQueueReturn {
  const grading = ref(false);
  const gradeError = ref<Error | null>(null);

  const { data, status, error, refresh } = useAsyncData<FlashcardDto[]>(
    'flashcards:due',
    async () => {
      const res = await listDueFlashcards({ query: { limit } });
      if (res.error) throw toError(res.error, res.response.status);
      return (res.data as FlashcardListDto).items;
    },
    { lazy: true, immediate: options.immediate ?? true },
  );

  // `useAsyncData` dedupes by key — only the first caller registered under
  // 'flashcards:due' this session (typically `layouts/default.vue`'s nav
  // badge, which mounts before any page) actually runs the fetcher above;
  // every later `useFlashcardReviewQueue()` call gets the same shared `data`
  // back without its own fetcher ever firing. A value set *inside* that
  // closure — the old `total.value = items.length` here — was local to
  // whichever call owned the fetcher, so every other caller's copy stayed
  // at its initial 0 forever (#796). Watching the shared `data` instead runs
  // for every caller, and capturing only the first non-pending value (never
  // overwriting on a later grade shrinking the queue to 0) keeps it what the
  // field is documented as: the queue size as first fetched.
  const total = ref(0);
  let capturedInitialTotal = false;
  watch(
    data,
    (items) => {
      if (capturedInitialTotal || !items) return;
      capturedInitialTotal = true;
      total.value = items.length;
    },
    { immediate: true },
  );

  const queue = computed(() => data.value ?? []);
  const current = computed(() => queue.value[0] ?? null);

  async function grade(value: number): Promise<void> {
    const card = current.value;
    if (!card || grading.value) return;
    grading.value = true;
    gradeError.value = null;
    try {
      const res = await gradeFlashcard({ path: { id: card.id }, body: { grade: value } });
      if (res.error) {
        gradeError.value = toError(res.error, res.response.status);
        return;
      }
      data.value = (data.value ?? []).slice(1);
    } finally {
      grading.value = false;
    }
  }

  return {
    queue,
    status: status as Ref<RowStatus>,
    error: error as Ref<Error | null>,
    errorStatus: errorStatusOf(error as Ref<Error | null>),
    current,
    total,
    grading,
    gradeError,
    grade,
    refetch: refresh,
  };
}

// ── Card creation ────────────────────────────────────────────────────────

export interface UseCreateFlashcardReturn {
  submitting: Ref<boolean>;
  error: Ref<Error | null>;
  create: (lessonId: string, payload: CreateFlashcardRequest) => Promise<FlashcardDto | null>;
}

export function useCreateFlashcard(): UseCreateFlashcardReturn {
  const submitting = ref(false);
  const error = ref<Error | null>(null);

  async function create(
    lessonId: string,
    payload: CreateFlashcardRequest,
  ): Promise<FlashcardDto | null> {
    submitting.value = true;
    error.value = null;
    try {
      const res = await createFlashcard({ path: { lessonId }, body: payload });
      if (res.error) {
        error.value = toError(res.error, res.response.status);
        return null;
      }
      return res.data as FlashcardDto;
    } finally {
      submitting.value = false;
    }
  }

  return { submitting, error, create };
}
