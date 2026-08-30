/**
 * Unit tests for useCoursesList — one per Browse filter (E31-F01-S01).
 *
 * The point of each case is the same: the filter must reach the server as a
 * query param, because every one of them is server-applied. A filter that
 * silently stayed client-side would still look right on a small shelf and be
 * wrong on a large one, which is exactly the bug this card exists to close.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, computed } from 'vue';
import type { CourseListDto } from '@app/api-client-ts';

const mockListCourses = vi.fn();

vi.mock('@app/api-client-ts', () => ({
  listCourses: (...args: unknown[]) => mockListCourses(...args),
  client: {},
}));

// `computed` and `useAsyncData` reach the composable through Nuxt's
// auto-import transform, so in unit tests they have to be globals.
vi.stubGlobal('computed', computed);

const EMPTY: CourseListDto = { items: [] };

/**
 * Run the composable with the given refs and return the query object that
 * reached `listCourses` (undefined when the call was made without one).
 */
async function queryFor(
  options: Record<string, { value: string }>,
): Promise<Record<string, string> | undefined> {
  mockListCourses.mockResolvedValueOnce({ data: EMPTY, error: null, response: { status: 200 } });

  vi.stubGlobal('useAsyncData', async (_key: unknown, handler: () => Promise<CourseListDto>) => {
    await handler();
    return { data: ref(EMPTY), error: ref(null), status: ref('success'), refresh: vi.fn() };
  });

  const { useCoursesList } = await import('../useCoursesList');
  useCoursesList(options as never);
  await new Promise((r) => {
    setTimeout(r, 0);
  });

  const call = mockListCourses.mock.calls[0]?.[0] as { query?: Record<string, string> };
  return call.query;
}

describe('useCoursesList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends no query at all when every filter is at its default', async () => {
    const query = await queryFor({
      status: ref('all'),
      sort: ref('recently-watched'),
      durationBucket: ref('all'),
      libraryId: ref(''),
      instructorId: ref(''),
    });
    expect(query).toBeUndefined();
  });

  it('sends status', async () => {
    expect(await queryFor({ status: ref('in-progress') })).toEqual({ status: 'in-progress' });
  });

  it('sends durationBucket', async () => {
    expect(await queryFor({ durationBucket: ref('10to20') })).toEqual({
      durationBucket: '10to20',
    });
  });

  it('sends libraryId', async () => {
    expect(await queryFor({ libraryId: ref('lib-1') })).toEqual({ libraryId: 'lib-1' });
  });

  it('sends instructorId', async () => {
    expect(await queryFor({ instructorId: ref('i-1') })).toEqual({ instructorId: 'i-1' });
  });

  it('sends the duration sort', async () => {
    expect(await queryFor({ sort: ref('duration') })).toEqual({ sort: 'duration' });
  });

  it('combines every active filter into one request', async () => {
    const query = await queryFor({
      status: ref('completed'),
      sort: ref('duration'),
      durationBucket: ref('gt20'),
      libraryId: ref('lib-1'),
      instructorId: ref('i-1'),
    });
    expect(query).toEqual({
      status: 'completed',
      sort: 'duration',
      durationBucket: 'gt20',
      libraryId: 'lib-1',
      instructorId: 'i-1',
    });
  });

  it('gives each filter combination its own cache key', async () => {
    const keys: unknown[] = [];
    mockListCourses.mockResolvedValue({ data: EMPTY, error: null, response: { status: 200 } });
    vi.stubGlobal('useAsyncData', (key: { value: string }) => {
      keys.push(key.value);
      return { data: ref(EMPTY), error: ref(null), status: ref('success'), refresh: vi.fn() };
    });

    const { useCoursesList } = await import('../useCoursesList');
    useCoursesList({ durationBucket: ref('lt5') } as never);
    useCoursesList({ durationBucket: ref('gt20') } as never);

    expect(keys[0]).not.toBe(keys[1]);
  });
});
