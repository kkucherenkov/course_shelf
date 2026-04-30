/**
 * Unit tests for useSearch composable.
 *
 * Mocks @app/api-client-ts so no real HTTP occurs.
 * Vue reactivity is used directly (no Nuxt globals needed — useSearch
 * uses watch internally rather than useAsyncData).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, nextTick } from 'vue';
import type { SearchResultDto } from '@app/api-client-ts';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockSearchCatalogue = vi.fn();

vi.mock('@app/api-client-ts', () => ({
  searchCatalogue: (...args: unknown[]) => mockSearchCatalogue(...args),
  client: {},
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const emptyResult: SearchResultDto = {
  query: 'js',
  courses: [],
  lessons: [],
};

const filledResult: SearchResultDto = {
  query: 'postgres',
  courses: [
    {
      id: 'c1',
      libraryId: 'lib1',
      title: 'PostgreSQL Deep Dive',
      slug: 'postgresql-deep-dive',
      lessonsTotal: 12,
    },
  ],
  lessons: [
    {
      id: 'l1',
      courseId: 'c1',
      courseTitle: 'PostgreSQL Deep Dive',
      sectionTitle: 'Section 1 · Basics',
      title: 'Introduction to Postgres',
      position: 1,
    },
  ],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stays idle when q is shorter than 2 characters', async () => {
    const { useSearch } = await import('../useSearch');
    const q = ref('a');
    const { status, data, error } = useSearch(q);

    await nextTick();

    expect(status.value).toBe('idle');
    expect(data.value).toBeNull();
    expect(error.value).toBeNull();
    expect(mockSearchCatalogue).not.toHaveBeenCalled();
  });

  it('stays idle when q is empty string', async () => {
    const { useSearch } = await import('../useSearch');
    const q = ref('');
    const { status } = useSearch(q);

    await nextTick();

    expect(status.value).toBe('idle');
    expect(mockSearchCatalogue).not.toHaveBeenCalled();
  });

  it('fetches and returns data when q has 2+ characters', async () => {
    mockSearchCatalogue.mockResolvedValueOnce({
      data: filledResult,
      error: null,
      response: { status: 200 },
    });

    const { useSearch } = await import('../useSearch');
    const q = ref('postgres');
    const { status, data, error } = useSearch(q);

    // Wait for the watch + async fetch to complete.
    await nextTick();
    await new Promise((r) => setTimeout(r, 0));

    expect(mockSearchCatalogue).toHaveBeenCalledOnce();
    expect(mockSearchCatalogue).toHaveBeenCalledWith({
      query: { q: 'postgres', limit: 20 },
    });
    expect(status.value).toBe('success');
    expect(data.value).toEqual(filledResult);
    expect(error.value).toBeNull();
  });

  it('trims whitespace before fetching', async () => {
    mockSearchCatalogue.mockResolvedValueOnce({
      data: emptyResult,
      error: null,
      response: { status: 200 },
    });

    const { useSearch } = await import('../useSearch');
    const q = ref('  js  ');
    useSearch(q);

    await nextTick();
    await new Promise((r) => setTimeout(r, 0));

    expect(mockSearchCatalogue).toHaveBeenCalledWith({
      query: { q: 'js', limit: 20 },
    });
  });

  it('sets status=error and captures httpStatus on 401', async () => {
    mockSearchCatalogue.mockResolvedValueOnce({
      data: null,
      error: { detail: 'Unauthorized' },
      response: { status: 401 },
    });

    const { useSearch } = await import('../useSearch');
    const q = ref('postgres');
    const { status, error, errorStatus } = useSearch(q);

    await nextTick();
    await new Promise((r) => setTimeout(r, 0));

    expect(status.value).toBe('error');
    expect(error.value).not.toBeNull();
    expect(errorStatus.value).toBe(401);
  });

  it('resets to idle when q drops below 2 characters', async () => {
    mockSearchCatalogue.mockResolvedValueOnce({
      data: filledResult,
      error: null,
      response: { status: 200 },
    });

    const { useSearch } = await import('../useSearch');
    const q = ref('postgres');
    const { status, data } = useSearch(q);

    await nextTick();
    await new Promise((r) => setTimeout(r, 0));

    expect(status.value).toBe('success');

    // Now clear the query
    q.value = 'p';
    await nextTick();

    expect(status.value).toBe('idle');
    expect(data.value).toBeNull();
  });

  it('re-fetches when q changes to a new valid value', async () => {
    mockSearchCatalogue
      .mockResolvedValueOnce({ data: emptyResult, error: null, response: { status: 200 } })
      .mockResolvedValueOnce({ data: filledResult, error: null, response: { status: 200 } });

    const { useSearch } = await import('../useSearch');
    const q = ref('js');
    useSearch(q);

    await nextTick();
    await new Promise((r) => setTimeout(r, 0));

    expect(mockSearchCatalogue).toHaveBeenCalledTimes(1);

    q.value = 'postgres';
    await nextTick();
    await new Promise((r) => setTimeout(r, 0));

    expect(mockSearchCatalogue).toHaveBeenCalledTimes(2);
  });
});
