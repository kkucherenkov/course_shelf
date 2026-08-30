/**
 * Round-trip tests for useQueryStringState — the mechanism that makes the
 * Browse filters survive a reload (E31-F01-S01).
 *
 * A fake route/router pair stands in for vue-router: `router.replace` writes
 * straight back into the reactive `route.query`. The composable itself defers
 * the actual `replace` to a microtask (see useQueryStringState.ts) so every
 * test awaits one `flush()` after writing before asserting on `route.query`.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reactive } from 'vue';

import type { LocationQuery } from 'vue-router';

const route = reactive<{ query: LocationQuery }>({ query: {} });
const replace = vi.fn((to: { query: LocationQuery }) => {
  route.query = to.query;
  return Promise.resolve();
});

// `useRoute` / `useRouter` reach the composable through Nuxt's auto-import
// transform, so in unit tests they have to be globals — same trick the other
// composable specs use for `useAsyncData`.
// The real `useRouter()` always returns the same singleton — the mock must
// too, since the composable keys its same-tick batching off router identity.
const router = { replace };
vi.stubGlobal('useRoute', () => route);
vi.stubGlobal('useRouter', () => router);

const { useQueryStringState } = await import('../useQueryStringState');

/** The composable schedules its replace on the next microtask. */
async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

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

  it('round-trips: what is written is what a fresh read returns', async () => {
    const sort = useQueryStringState<Sort>('sort', 'recently-watched', SORTS);
    sort.value = 'newest';
    await flush();

    expect(route.query['sort']).toBe('newest');
    // A second instance is what a page reload constructs.
    expect(useQueryStringState<Sort>('sort', 'recently-watched', SORTS).value).toBe('newest');
  });

  it('keeps the default out of the URL', async () => {
    route.query = { sort: 'duration' };
    const sort = useQueryStringState<Sort>('sort', 'recently-watched', SORTS);

    sort.value = 'recently-watched';
    await flush();

    expect(route.query['sort']).toBeUndefined();
    expect(sort.value).toBe('recently-watched');
  });

  it('leaves other params untouched when one changes', async () => {
    route.query = { status: 'completed', q: 'ddd' };
    const sort = useQueryStringState<Sort>('sort', 'recently-watched', SORTS);

    sort.value = 'newest';
    await flush();

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

  it('replaces rather than pushes, so back does not walk the filter history', async () => {
    const sort = useQueryStringState<Sort>('sort', 'recently-watched', SORTS);
    sort.value = 'newest';
    await flush();
    expect(replace).toHaveBeenCalledOnce();
  });

  it('drops every key when several refs are cleared in the same tick (browse.vue Clear filters)', async () => {
    // Regression: four independent setters used to each issue their own
    // `replace`, computed from `route.query` at call time. Since the real
    // router resolves those asynchronously and not necessarily in dispatch
    // order, an earlier (already-stale) replace could win and re-add a key a
    // later call had just dropped. The fix batches same-tick writes into one
    // replace — this only proves anything because it's exactly one call.
    route.query = { status: 'completed', library: 'lib-1', duration: 'lt5', q: 'kept' };
    const status = useQueryStringState('status', 'all');
    const library = useQueryStringState('library', '');
    const duration = useQueryStringState('duration', 'all');

    status.value = 'all';
    library.value = '';
    duration.value = 'all';
    await flush();

    expect(route.query).toEqual({ q: 'kept' });
    expect(replace).toHaveBeenCalledOnce();
  });
});
