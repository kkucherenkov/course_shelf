/**
 * Unit tests for useEntitySearch.
 *
 * Covers the one non-obvious behaviour: an option seen once (from the
 * initial seed or an earlier search page) stays resolvable after a
 * different search term replaces the visible page — otherwise a picked
 * entity's label would go blank the moment the admin typed something else.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.useFakeTimers();

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('useEntitySearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('seeds items from the initial list before any fetch resolves', async () => {
    const { useEntitySearch } = await import('../useEntitySearch');
    const fetchPage = vi.fn().mockResolvedValue([]);

    const { items } = useEntitySearch(fetchPage, [{ id: 'a', displayName: 'Ada' }]);

    expect(items.value).toEqual([{ id: 'a', displayName: 'Ada' }]);
  });

  it('fetches an unfiltered page immediately on creation', async () => {
    const { useEntitySearch } = await import('../useEntitySearch');
    const fetchPage = vi.fn().mockResolvedValue([]);

    useEntitySearch(fetchPage);
    await flushMicrotasks();

    expect(fetchPage).toHaveBeenCalledWith('');
  });

  it('keeps a previously-seen option after the search term changes and drops it from the page', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce([]) // initial unfiltered fetch
      .mockResolvedValueOnce([{ id: 'a', displayName: 'Ada' }])
      .mockResolvedValueOnce([{ id: 'b', displayName: 'Bob' }]);

    const { useEntitySearch } = await import('../useEntitySearch');
    const { searchTerm, items } = useEntitySearch(fetchPage);
    await flushMicrotasks();

    searchTerm.value = 'ada';
    await vi.advanceTimersByTimeAsync(250);

    searchTerm.value = 'bob';
    await vi.advanceTimersByTimeAsync(250);

    const ids = items.value.map((o) => o.id);
    expect(ids).toContain('a');
    expect(ids).toContain('b');
  });

  it('debounces rapid search-term changes into a single fetch', async () => {
    const fetchPage = vi.fn().mockResolvedValue([]);
    const { useEntitySearch } = await import('../useEntitySearch');
    const { searchTerm } = useEntitySearch(fetchPage);
    await flushMicrotasks();
    fetchPage.mockClear();

    searchTerm.value = 'a';
    await vi.advanceTimersByTimeAsync(50);
    searchTerm.value = 'ad';
    await vi.advanceTimersByTimeAsync(50);
    searchTerm.value = 'ada';
    await vi.advanceTimersByTimeAsync(250);

    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(fetchPage).toHaveBeenCalledWith('ada');
  });
});
