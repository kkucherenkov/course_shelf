/**
 * Round-trip tests for useQueryStringState — the mechanism that makes the
 * Browse filters survive a reload (E31-F01-S01).
 *
 * A fake route/router pair stands in for vue-router: `router.replace` writes
 * straight back into the reactive `route.query`, which is what the real router
 * does a tick later. That is enough to prove the round trip without booting
 * Nuxt.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reactive } from 'vue';

import type { LocationQuery } from 'vue-router';

const route = reactive<{ query: LocationQuery }>({ query: {} });
const replace = vi.fn((to: { query: LocationQuery }) => {
  route.query = to.query;
});

// `useRoute` / `useRouter` reach the composable through Nuxt's auto-import
// transform, so in unit tests they have to be globals — same trick the other
// composable specs use for `useAsyncData`.
vi.stubGlobal('useRoute', () => route);
vi.stubGlobal('useRouter', () => ({ replace }));

const { useQueryStringState } = await import('../useQueryStringState');

type Sort = 'recently-watched' | 'newest' | 'duration';
const SORTS = ['recently-watched', 'newest', 'duration'] as const;

describe('useQueryStringState', () => {
  beforeEach(() => {
    route.query = {};
    replace.mockClear();
  });

  it('reads the fallback when the param is absent', () => {
    const sort = useQueryStringState<Sort>('sort', 'recently-watched', SORTS);
    expect(sort.value).toBe('recently-watched');
  });

  it('reads a value already present in the URL — the reload case', () => {
    route.query = { sort: 'duration' };
    const sort = useQueryStringState<Sort>('sort', 'recently-watched', SORTS);
    expect(sort.value).toBe('duration');
  });

  it('round-trips: what is written is what a fresh read returns', () => {
    const sort = useQueryStringState<Sort>('sort', 'recently-watched', SORTS);
    sort.value = 'newest';

    expect(route.query['sort']).toBe('newest');
    // A second instance is what a page reload constructs.
    expect(useQueryStringState<Sort>('sort', 'recently-watched', SORTS).value).toBe('newest');
  });

  it('keeps the default out of the URL', () => {
    route.query = { sort: 'duration' };
    const sort = useQueryStringState<Sort>('sort', 'recently-watched', SORTS);

    sort.value = 'recently-watched';

    expect(route.query['sort']).toBeUndefined();
    expect(sort.value).toBe('recently-watched');
  });

  it('leaves other params untouched when one changes', () => {
    route.query = { status: 'completed', q: 'ddd' };
    const sort = useQueryStringState<Sort>('sort', 'recently-watched', SORTS);

    sort.value = 'newest';

    expect(route.query).toEqual({ status: 'completed', q: 'ddd', sort: 'newest' });
  });

  it('falls back when the URL carries a value outside the allow-list', () => {
    route.query = { sort: 'by-vibes' };
    const sort = useQueryStringState<Sort>('sort', 'recently-watched', SORTS);
    expect(sort.value).toBe('recently-watched');
  });

  it('accepts any non-empty string when no allow-list is given', () => {
    route.query = { library: 'clxvp1234567890abcdefghij' };
    const libraryId = useQueryStringState('library', '');
    expect(libraryId.value).toBe('clxvp1234567890abcdefghij');
  });

  it('treats an empty param as absent', () => {
    route.query = { library: '' };
    expect(useQueryStringState('library', '').value).toBe('');
  });

  it('takes the last value of a repeated param', () => {
    route.query = { sort: ['newest', 'duration'] };
    const sort = useQueryStringState<Sort>('sort', 'recently-watched', SORTS);
    expect(sort.value).toBe('duration');
  });

  it('replaces rather than pushes, so back does not walk the filter history', () => {
    const sort = useQueryStringState<Sort>('sort', 'recently-watched', SORTS);
    sort.value = 'newest';
    expect(replace).toHaveBeenCalledOnce();
  });
});
