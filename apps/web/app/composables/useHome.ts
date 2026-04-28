/**
 * Composables for the Home page rows.
 *
 * Each composable wraps a single SDK call via `useAsyncData` and returns a
 * unified shape: `{ data, status, error, refetch }`.
 *
 * `status` mirrors Nuxt's AsyncData status: 'idle' | 'pending' | 'success' | 'error'.
 * `data` is `T | null | undefined` — undefined before first fetch, null on error.
 */

import {
  getContinueWatching,
  getRecentlyAdded,
  getRecentlyCompleted,
  getYourWeek,
} from '@app/api-client-ts';
import type {
  ContinueWatchingDto,
  RecentlyAddedDto,
  RecentlyCompletedDto,
  YourWeekDto,
  Problem,
} from '@app/api-client-ts';

// ── Shared row status type ───────────────────────────────────────────────────

export type RowStatus = 'idle' | 'pending' | 'success' | 'error';

// ── Helper: convert a Problem (or unknown) to an Error ──────────────────────

function toError(raw: unknown): Error {
  if (raw instanceof Error) return raw;
  const p = raw as Problem;
  // Problem.detail and Problem.title are typed string | null — fall back to a
  // static message when both are null/undefined.
  const msg = p.detail ?? p.title ?? 'Request failed';
  return new Error(msg);
}

// ── Continue watching ────────────────────────────────────────────────────────

export function useContinueWatching(): {
  data: Ref<ContinueWatchingDto | undefined>;
  status: Ref<RowStatus>;
  error: Ref<Error | null>;
  refetch: () => Promise<void>;
} {
  const { data, status, error, refresh } = useAsyncData<ContinueWatchingDto>(
    'home:continue-watching',
    async () => {
      const res = await getContinueWatching({ query: { limit: 10 } });
      if (res.error) throw toError(res.error);
      return res.data as ContinueWatchingDto;
    },
    { lazy: true },
  );

  return {
    data,
    status: status as Ref<RowStatus>,
    error: error as Ref<Error | null>,
    refetch: refresh,
  };
}

// ── Recently added ───────────────────────────────────────────────────────────

export function useRecentlyAdded(): {
  data: Ref<RecentlyAddedDto | undefined>;
  status: Ref<RowStatus>;
  error: Ref<Error | null>;
  refetch: () => Promise<void>;
} {
  const { data, status, error, refresh } = useAsyncData<RecentlyAddedDto>(
    'home:recently-added',
    async () => {
      const res = await getRecentlyAdded({ query: { limit: 10 } });
      if (res.error) throw toError(res.error);
      return res.data as RecentlyAddedDto;
    },
    { lazy: true },
  );

  return {
    data,
    status: status as Ref<RowStatus>,
    error: error as Ref<Error | null>,
    refetch: refresh,
  };
}

// ── Recently completed ───────────────────────────────────────────────────────

export function useRecentlyCompleted(): {
  data: Ref<RecentlyCompletedDto | undefined>;
  status: Ref<RowStatus>;
  error: Ref<Error | null>;
  refetch: () => Promise<void>;
} {
  const { data, status, error, refresh } = useAsyncData<RecentlyCompletedDto>(
    'home:recently-completed',
    async () => {
      const res = await getRecentlyCompleted({ query: { limit: 20 } });
      if (res.error) throw toError(res.error);
      return res.data as RecentlyCompletedDto;
    },
    { lazy: true },
  );

  return {
    data,
    status: status as Ref<RowStatus>,
    error: error as Ref<Error | null>,
    refetch: refresh,
  };
}

// ── Your week ────────────────────────────────────────────────────────────────

export function useYourWeek(): {
  data: Ref<YourWeekDto | undefined>;
  status: Ref<RowStatus>;
  error: Ref<Error | null>;
  refetch: () => Promise<void>;
} {
  const { data, status, error, refresh } = useAsyncData<YourWeekDto>(
    'home:your-week',
    async () => {
      const res = await getYourWeek();
      if (res.error) throw toError(res.error);
      return res.data as YourWeekDto;
    },
    { lazy: true },
  );

  return {
    data,
    status: status as Ref<RowStatus>,
    error: error as Ref<Error | null>,
    refetch: refresh,
  };
}
