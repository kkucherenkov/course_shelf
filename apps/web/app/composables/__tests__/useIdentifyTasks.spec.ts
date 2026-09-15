/**
 * Unit tests for useIdentifyTasks (E30-F03-S02).
 *
 * `buildMergePolicy` is the card's explicit landmine: `MergePolicyDto` omits
 * a field ⇒ the API defaults it to `merge`, so the payload must always carry
 * all 12 keys, never rely on the default. `apply`/`discard` prove the review
 * panel's chosen policy reaches `applyIdentifyResult` untouched, and that
 * discard never calls apply.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import type { IdentifyTaskDto, MergePolicyDto } from '@app/api-client-ts';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGetIdentifyTask = vi.fn();
const mockGetCourse = vi.fn();
const mockListIdentifyTasks = vi.fn();
const mockApplyIdentifyResult = vi.fn();
const mockDiscardIdentifyTask = vi.fn();
const mockRunIdentifyTask = vi.fn();

vi.mock('@app/api-client-ts', () => ({
  getIdentifyTask: (...args: unknown[]) => mockGetIdentifyTask(...args),
  getCourse: (...args: unknown[]) => mockGetCourse(...args),
  listIdentifyTasks: (...args: unknown[]) => mockListIdentifyTasks(...args),
  applyIdentifyResult: (...args: unknown[]) => mockApplyIdentifyResult(...args),
  discardIdentifyTask: (...args: unknown[]) => mockDiscardIdentifyTask(...args),
  runIdentifyTask: (...args: unknown[]) => mockRunIdentifyTask(...args),
  client: {},
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeTask(overrides: Partial<IdentifyTaskDto> = {}): IdentifyTaskDto {
  return {
    id: 'task-1',
    courseId: 'course-1',
    status: 'proposed',
    source: 'coursera',
    scrapedFragment: { title: 'Scraped Title' },
    mergePolicy: {},
    createdAt: '2026-09-15T00:00:00.000Z',
    ...overrides,
  } as IdentifyTaskDto;
}

// ── buildMergePolicy ─────────────────────────────────────────────────────────

describe('buildMergePolicy', () => {
  it('fills every field to merge when no overrides are given', async () => {
    const { buildMergePolicy, MERGE_POLICY_FIELDS } = await import('../useIdentifyTasks');

    const policy = buildMergePolicy({});

    expect(Object.keys(policy).toSorted()).toEqual([...MERGE_POLICY_FIELDS].toSorted());
    for (const field of MERGE_POLICY_FIELDS) {
      expect(policy[field]).toBe('merge');
    }
  });

  it('carries an explicit ignore through rather than omitting the field', async () => {
    const { buildMergePolicy } = await import('../useIdentifyTasks');

    const policy = buildMergePolicy({ title: 'ignore', instructors: 'overwrite' });

    expect(policy.title).toBe('ignore');
    expect(policy.instructors).toBe('overwrite');
    // Every other field is still present, not omitted.
    expect(policy.description).toBe('merge');
    expect(policy.externalIds).toBe('merge');
  });
});

// ── useIdentifyTask ──────────────────────────────────────────────────────────

describe('useIdentifyTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('apply sends exactly the given policy and refetches the bundle', async () => {
    mockGetIdentifyTask.mockResolvedValueOnce({
      data: makeTask(),
      error: null,
      response: { status: 200 },
    });
    mockGetCourse.mockResolvedValueOnce({
      data: { id: 'course-1', title: 'Course' },
      error: null,
      response: { status: 200 },
    });
    mockApplyIdentifyResult.mockResolvedValueOnce({
      data: makeTask({ status: 'applied' }),
      error: null,
      response: { status: 200 },
    });
    const refresh = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('useAsyncData', () => ({
      data: ref(undefined),
      status: ref('idle'),
      error: ref(null),
      refresh,
    }));

    const { useIdentifyTask, buildMergePolicy } = await import('../useIdentifyTasks');
    const { apply } = useIdentifyTask('task-1');

    const policy: MergePolicyDto = buildMergePolicy({ title: 'ignore' });
    const err = await apply(policy);

    expect(err).toBeNull();
    expect(mockApplyIdentifyResult).toHaveBeenCalledWith(
      expect.objectContaining({ path: { id: 'task-1' }, body: { mergePolicy: policy } }),
    );
    expect(mockDiscardIdentifyTask).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
  });

  it('discard calls discardIdentifyTask and never apply', async () => {
    mockDiscardIdentifyTask.mockResolvedValueOnce({
      data: makeTask({ status: 'discarded' }),
      error: null,
      response: { status: 200 },
    });
    const refresh = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('useAsyncData', () => ({
      data: ref(undefined),
      status: ref('idle'),
      error: ref(null),
      refresh,
    }));

    const { useIdentifyTask } = await import('../useIdentifyTasks');
    const { discard } = useIdentifyTask('task-1');

    const err = await discard();

    expect(err).toBeNull();
    expect(mockDiscardIdentifyTask).toHaveBeenCalledWith(
      expect.objectContaining({ path: { id: 'task-1' } }),
    );
    expect(mockApplyIdentifyResult).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
  });

  it('apply returns an error and does not refetch on failure', async () => {
    mockApplyIdentifyResult.mockResolvedValueOnce({
      data: null,
      error: { detail: 'Course was removed' },
      response: { status: 404 },
    });
    const refresh = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('useAsyncData', () => ({
      data: ref(undefined),
      status: ref('idle'),
      error: ref(null),
      refresh,
    }));

    const { useIdentifyTask, buildMergePolicy } = await import('../useIdentifyTasks');
    const { apply } = useIdentifyTask('task-1');

    const err = await apply(buildMergePolicy({}));

    expect(err).toBeInstanceOf(Error);
    expect(err?.message).toBe('Course was removed');
    expect(refresh).not.toHaveBeenCalled();
  });
});

// ── queueIdentifyTask ────────────────────────────────────────────────────────

describe('queueIdentifyTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('posts the fragment to runIdentifyTask and returns the created task', async () => {
    const created = makeTask();
    mockRunIdentifyTask.mockResolvedValueOnce({
      data: created,
      error: null,
      response: { status: 201 },
    });

    const { queueIdentifyTask } = await import('../useIdentifyTasks');
    const result = await queueIdentifyTask('course-1', {
      fragment: { title: 'Scraped Title' },
      source: 'coursera',
    });

    expect(result).toEqual(created);
    expect(mockRunIdentifyTask).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { id: 'course-1' },
        body: { fragment: { title: 'Scraped Title' }, source: 'coursera' },
      }),
    );
  });

  it('throws with the server detail on failure', async () => {
    mockRunIdentifyTask.mockResolvedValueOnce({
      data: null,
      error: { detail: 'Course not found' },
      response: { status: 404 },
    });

    const { queueIdentifyTask } = await import('../useIdentifyTasks');

    await expect(
      queueIdentifyTask('course-1', { fragment: {}, source: 'coursera' }),
    ).rejects.toThrow('Course not found');
  });
});
