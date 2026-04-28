/**
 * Unit tests for GetYourWeekHandler.
 *
 * Scenarios:
 *   - New user: zero progress → { minutesWatched: 0, lessonsCompleted: 0 }.
 *   - Happy path: repo returns counts → DTO reflects them.
 *   - Range is exactly 7 days wide (to - from ≈ 7 * 24 * 60 * 60 * 1000 ms).
 *   - Out-of-range rows are the adapter's responsibility (tested at adapter layer);
 *     the handler trusts the repo return value.
 */
import { describe, expect, it, vi } from 'vitest';

import { GetYourWeekQuery } from './get-your-week.query';
import { GetYourWeekHandler } from './get-your-week.handler';

import type { LessonProgressRepository } from '../../../../common/learning-progress';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const USER = { id: 'user-1', role: 'user' };

function makeProgressRepo(opts: {
  minutesWatched?: number;
  lessonsCompleted?: number;
}): LessonProgressRepository {
  return {
    save: vi.fn(),
    findByUserAndLesson: vi.fn(),
    countCompletedByUserAndCourse: vi.fn(),
    findAllUserCoursePairs: vi.fn(),
    findLatestByUserAndCourse: vi.fn(),
    aggregateForUserRange: vi.fn().mockResolvedValue({
      minutesWatched: opts.minutesWatched ?? 0,
      lessonsCompleted: opts.lessonsCompleted ?? 0,
    }),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GetYourWeekHandler', () => {
  describe('new user / empty week', () => {
    it('returns zeros for a user with no progress rows', async () => {
      const repo = makeProgressRepo({ minutesWatched: 0, lessonsCompleted: 0 });
      const handler = new GetYourWeekHandler(repo);
      const result = await handler.execute(new GetYourWeekQuery(USER));

      expect(result.minutesWatched).toBe(0);
      expect(result.lessonsCompleted).toBe(0);
    });
  });

  describe('happy path', () => {
    it('returns minutesWatched and lessonsCompleted from the repo', async () => {
      const repo = makeProgressRepo({ minutesWatched: 45, lessonsCompleted: 3 });
      const handler = new GetYourWeekHandler(repo);
      const result = await handler.execute(new GetYourWeekQuery(USER));

      expect(result.minutesWatched).toBe(45);
      expect(result.lessonsCompleted).toBe(3);
    });

    it('range.from is approximately 7 days before range.to', async () => {
      const repo = makeProgressRepo({});
      const handler = new GetYourWeekHandler(repo);
      const result = await handler.execute(new GetYourWeekQuery(USER));

      const from = new Date(result.range.from);
      const to = new Date(result.range.to);
      const diffMs = to.getTime() - from.getTime();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

      // Allow ±1 second tolerance for test execution time.
      expect(diffMs).toBeGreaterThanOrEqual(sevenDaysMs - 1000);
      expect(diffMs).toBeLessThanOrEqual(sevenDaysMs + 1000);
    });

    it('passes correct userId, from, and to to the repo', async () => {
      const repo = makeProgressRepo({});
      const handler = new GetYourWeekHandler(repo);
      await handler.execute(new GetYourWeekQuery(USER));

      const call = vi.mocked(repo.aggregateForUserRange).mock.calls[0];
      expect(call?.[0]).toBe('user-1');
      // from < to
      const from = call?.[1] as Date;
      const to = call?.[2] as Date;
      expect(from.getTime()).toBeLessThan(to.getTime());
    });
  });

  describe('in-range vs out-of-range rows', () => {
    it('excludes out-of-range rows — verified via adapter call args', async () => {
      // The handler trusts the repo to filter by window. We verify that the
      // repo is called with from < to and the window is ≤ 7 days.
      const repo = makeProgressRepo({ minutesWatched: 10, lessonsCompleted: 1 });
      const handler = new GetYourWeekHandler(repo);
      await handler.execute(new GetYourWeekQuery(USER));

      expect(repo.aggregateForUserRange).toHaveBeenCalledOnce();
      const [, from, to] = vi.mocked(repo.aggregateForUserRange).mock.calls[0]!;
      const windowMs = (to as Date).getTime() - (from as Date).getTime();
      expect(windowMs).toBeLessThanOrEqual(7 * 24 * 60 * 60 * 1000 + 1000);
    });
  });
});
