/**
 * Table-driven unit tests for the SM-2 pure scheduler.
 * Every row is derived by hand from the canonical SuperMemo-2 formulas:
 *   EF' = EF + (0.1 - (5-q)*(0.08 + (5-q)*0.02)), clamped to >= 1.3
 *   interval: 1 (n=1), 6 (n=2), round(previousInterval * EF') (n>=3)
 *   grade < 3 (lapse): repetitions -> 0, interval -> 1, EF' still applied.
 */
import { describe, expect, it } from 'vitest';

import { INITIAL_EASE_FACTOR, MIN_EASE_FACTOR, scheduleNextReview } from './review-schedule';

import type { ReviewGrade, ReviewScheduleState } from './review-schedule';

const T0 = new Date('2026-01-01T00:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

function state(easeFactor: number, intervalDays: number, repetitions: number): ReviewScheduleState {
  return { easeFactor, intervalDays, repetitions, dueAt: T0 };
}

interface Row {
  readonly name: string;
  readonly current: ReviewScheduleState;
  readonly grade: ReviewGrade;
  readonly expectedEase: number;
  readonly expectedInterval: number;
  readonly expectedRepetitions: number;
}

const FRESH = state(INITIAL_EASE_FACTOR, 0, 0);

const rows: Row[] = [
  // -- perfect recall (grade 5) three times running: EF+0.1 each time,
  //    walking the two fixed intervals before scaling by EF.
  {
    name: 'grade 5, first review: fixed interval 1',
    current: FRESH,
    grade: 5,
    expectedEase: 2.6,
    expectedInterval: 1,
    expectedRepetitions: 1,
  },
  {
    name: 'grade 5, second review: fixed interval 6',
    current: state(2.6, 1, 1),
    grade: 5,
    expectedEase: 2.7,
    expectedInterval: 6,
    expectedRepetitions: 2,
  },
  {
    name: 'grade 5, third review: interval scales by EF (round(6*2.8)=17)',
    current: state(2.7, 6, 2),
    grade: 5,
    expectedEase: 2.8,
    expectedInterval: 17,
    expectedRepetitions: 3,
  },
  // -- grade 3 ("correct, serious difficulty"): EF-0.14 each time.
  {
    name: 'grade 3, first review: fixed interval 1',
    current: FRESH,
    grade: 3,
    expectedEase: 2.36,
    expectedInterval: 1,
    expectedRepetitions: 1,
  },
  {
    name: 'grade 3, second review: fixed interval 6',
    current: state(2.36, 1, 1),
    grade: 3,
    expectedEase: 2.22,
    expectedInterval: 6,
    expectedRepetitions: 2,
  },
  {
    name: 'grade 3, third review: interval scales by EF (round(6*2.08)=12)',
    current: state(2.22, 6, 2),
    grade: 3,
    expectedEase: 2.08,
    expectedInterval: 12,
    expectedRepetitions: 3,
  },
  // -- grade 4: EF unchanged (0.1 - 1*(0.08+1*0.02) == 0).
  {
    name: 'grade 4, first review: ease factor unchanged, fixed interval 1',
    current: FRESH,
    grade: 4,
    expectedEase: 2.5,
    expectedInterval: 1,
    expectedRepetitions: 1,
  },
  // -- lapse path (grade < 3): repetitions resets to 0, interval resets to 1,
  //    EF still updates using the same formula.
  {
    name: 'grade 2 (lapse) after two successful reviews resets repetitions and interval',
    current: state(2.7, 6, 2),
    grade: 2,
    expectedEase: 2.38,
    expectedInterval: 1,
    expectedRepetitions: 0,
  },
  {
    name: 'grade 1 (lapse) on a fresh card',
    current: FRESH,
    grade: 1,
    expectedEase: 1.96,
    expectedInterval: 1,
    expectedRepetitions: 0,
  },
  {
    name: 'grade 0 (lapse) clamps ease factor at the MIN_EASE_FACTOR floor',
    current: state(MIN_EASE_FACTOR, 1, 0),
    grade: 0,
    expectedEase: MIN_EASE_FACTOR,
    expectedInterval: 1,
    expectedRepetitions: 0,
  },
];

describe('scheduleNextReview', () => {
  it.each(rows)(
    '$name',
    ({ current, grade, expectedEase, expectedInterval, expectedRepetitions }) => {
      const next = scheduleNextReview(current, grade, T0);
      expect(next.easeFactor).toBeCloseTo(expectedEase, 10);
      expect(next.intervalDays).toBe(expectedInterval);
      expect(next.repetitions).toBe(expectedRepetitions);
    },
  );

  it('sets dueAt to now + intervalDays days', () => {
    const next = scheduleNextReview(FRESH, 5, T0);
    expect(next.dueAt.getTime()).toBe(T0.getTime() + 1 * DAY_MS);
  });

  it('lapse dueAt is now + 1 day regardless of the prior interval', () => {
    const next = scheduleNextReview(state(2.7, 30, 5), 1, T0);
    expect(next.dueAt.getTime()).toBe(T0.getTime() + 1 * DAY_MS);
  });

  it('is pure: does not mutate the input state', () => {
    const current = state(2.5, 6, 2);
    const snapshot = { ...current };
    scheduleNextReview(current, 5, T0);
    expect(current).toEqual(snapshot);
  });

  it('never reads the clock itself — same "now" in, same dueAt out', () => {
    const a = scheduleNextReview(FRESH, 4, T0);
    const b = scheduleNextReview(FRESH, 4, T0);
    expect(a.dueAt.getTime()).toBe(b.dueAt.getTime());
  });
});
