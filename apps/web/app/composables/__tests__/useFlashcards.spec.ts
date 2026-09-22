/**
 * Unit tests for useFlashcards.
 *
 * The point of interest for the review queue: a graded card is dropped
 * locally rather than re-fetched, because the API's own SM-2 doc guarantees
 * a grade always pushes `dueAt` into the future (minimum interval 1 day) —
 * so the card that was just graded can never still belong in the queue.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import type { FlashcardDto } from '@app/api-client-ts';

const mockListDueFlashcards = vi.fn();
const mockGradeFlashcard = vi.fn();
const mockCreateFlashcard = vi.fn();

vi.mock('@app/api-client-ts', () => ({
  listDueFlashcards: (...args: unknown[]) => mockListDueFlashcards(...args),
  gradeFlashcard: (...args: unknown[]) => mockGradeFlashcard(...args),
  createFlashcard: (...args: unknown[]) => mockCreateFlashcard(...args),
}));

function card(id: string): FlashcardDto {
  return {
    id,
    lessonId: 'lesson-1',
    front: `front-${id}`,
    back: `back-${id}`,
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
    dueAt: '2026-04-25T14:00:00Z',
    createdAt: '2026-04-25T14:00:00Z',
    updatedAt: '2026-04-25T14:00:00Z',
  };
}

/** Wires the Nuxt `useAsyncData` auto-import useFlashcardReviewQueue relies
 * on, seeded with an already-resolved queue — same approach as
 * useLibraries.spec.ts. */
function loadQueue(initial: FlashcardDto[]) {
  const data = ref<FlashcardDto[]>(initial);
  vi.stubGlobal('useAsyncData', () => ({
    data,
    error: ref<Error | null>(null),
    status: ref('success'),
    refresh: vi.fn().mockResolvedValue(undefined),
  }));
  return data;
}

describe('useFlashcardReviewQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('exposes the first item as current', async () => {
    loadQueue([card('a'), card('b')]);
    const { useFlashcardReviewQueue } = await import('../useFlashcards');
    const { current } = useFlashcardReviewQueue();
    expect(current.value?.id).toBe('a');
  });

  it('current is null on an empty queue', async () => {
    loadQueue([]);
    const { useFlashcardReviewQueue } = await import('../useFlashcards');
    const { current } = useFlashcardReviewQueue();
    expect(current.value).toBeNull();
  });

  it('grade() posts the SM-2 value for the current card and drops it from the queue', async () => {
    loadQueue([card('a'), card('b')]);
    mockGradeFlashcard.mockResolvedValueOnce({
      data: { ...card('a'), dueAt: '2026-05-01T00:00:00Z' },
      error: null,
      response: { status: 200 },
    });

    const { useFlashcardReviewQueue } = await import('../useFlashcards');
    const { current, queue, grade, grading } = useFlashcardReviewQueue();

    const promise = grade(4);
    expect(grading.value).toBe(true);
    await promise;

    expect(mockGradeFlashcard).toHaveBeenCalledWith({ path: { id: 'a' }, body: { grade: 4 } });
    expect(grading.value).toBe(false);
    expect(queue.value.map((c) => c.id)).toEqual(['b']);
    expect(current.value?.id).toBe('b');
  });

  it('grade() is a no-op with an empty queue', async () => {
    loadQueue([]);
    const { useFlashcardReviewQueue } = await import('../useFlashcards');
    const { grade } = useFlashcardReviewQueue();
    await grade(5);
    expect(mockGradeFlashcard).not.toHaveBeenCalled();
  });

  it('grade() records gradeError and keeps the card in the queue on failure', async () => {
    loadQueue([card('a')]);
    mockGradeFlashcard.mockResolvedValueOnce({
      data: undefined,
      error: { title: 'Not Found', status: 404, detail: 'No such flashcard.' },
      response: { status: 404 },
    });

    const { useFlashcardReviewQueue } = await import('../useFlashcards');
    const { queue, grade, gradeError } = useFlashcardReviewQueue();

    await grade(4);

    expect(gradeError.value?.message).toBe('No such flashcard.');
    expect(queue.value.map((c) => c.id)).toEqual(['a']);
  });
});

describe('useCreateFlashcard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns the created card on success', async () => {
    mockCreateFlashcard.mockResolvedValueOnce({
      data: card('new'),
      error: null,
      response: { status: 201 },
    });

    const { useCreateFlashcard } = await import('../useFlashcards');
    const { create, error } = useCreateFlashcard();

    const result = await create('lesson-1', { front: 'Q', back: 'A' });

    expect(mockCreateFlashcard).toHaveBeenCalledWith({
      path: { lessonId: 'lesson-1' },
      body: { front: 'Q', back: 'A' },
    });
    expect(result?.id).toBe('new');
    expect(error.value).toBeNull();
  });

  it('returns null and records the error on failure', async () => {
    mockCreateFlashcard.mockResolvedValueOnce({
      data: undefined,
      error: { title: 'Bad Request', status: 400, detail: 'front must not be empty.' },
      response: { status: 400 },
    });

    const { useCreateFlashcard } = await import('../useFlashcards');
    const { create, error } = useCreateFlashcard();

    const result = await create('lesson-1', { front: '', back: 'A' });

    expect(result).toBeNull();
    expect(error.value?.message).toBe('front must not be empty.');
  });

  it('toggles submitting for the duration of the request', async () => {
    let resolve!: (v: unknown) => void;
    mockCreateFlashcard.mockReturnValueOnce(
      new Promise((r) => {
        resolve = r;
      }),
    );

    const { useCreateFlashcard } = await import('../useFlashcards');
    const { create, submitting } = useCreateFlashcard();

    const promise = create('lesson-1', { front: 'Q', back: 'A' });
    expect(submitting.value).toBe(true);
    resolve({ data: card('new'), error: null, response: { status: 201 } });
    await promise;
    expect(submitting.value).toBe(false);
  });
});
