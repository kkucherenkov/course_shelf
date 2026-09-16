/**
 * WHY this file exists:
 * SM-2 (SuperMemo-2) scheduling as a pure function: current schedule + grade
 * + "now" in, next schedule out. No clock reads, no Prisma, no NestJS — the
 * only caller is Flashcard.grade(), kept separate so the algorithm can be
 * table-tested without constructing an aggregate.
 *
 * Grade is the classic SM-2 0..5 "quality of response" scale:
 *   0 - complete blackout    3 - correct, serious difficulty
 *   1 - incorrect, familiar  4 - correct, some hesitation
 *   2 - incorrect, easy      5 - perfect recall
 *
 * grade < 3 is a lapse: repetitions resets to 0 and the interval resets to
 * 1 day, regardless of the current ease factor. grade >= 3 advances the
 * repetition count and walks the two fixed intervals (1 day, then 6 days)
 * before the interval starts scaling by easeFactor on the third+ review.
 * The ease factor itself updates on every grade, lapse or not — this is the
 * original SuperMemo-2 algorithm, not a house variant.
 */

export const MIN_EASE_FACTOR = 1.3;
export const INITIAL_EASE_FACTOR = 2.5;

export type ReviewGrade = 0 | 1 | 2 | 3 | 4 | 5;

export interface ReviewScheduleState {
  readonly easeFactor: number;
  readonly intervalDays: number;
  readonly repetitions: number;
  readonly dueAt: Date;
}

/** Fresh card: never reviewed, due immediately. */
export function initialReviewSchedule(now: Date): ReviewScheduleState {
  return { easeFactor: INITIAL_EASE_FACTOR, intervalDays: 0, repetitions: 0, dueAt: now };
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function nextEaseFactor(current: number, grade: ReviewGrade): number {
  const raw = current + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  return Math.max(MIN_EASE_FACTOR, raw);
}

/**
 * SM-2 transition. Grade in, next schedule state out — a pure function, not
 * a method that reaches for a clock; the caller always supplies `now`.
 */
export function scheduleNextReview(
  current: ReviewScheduleState,
  grade: ReviewGrade,
  now: Date,
): ReviewScheduleState {
  const easeFactor = nextEaseFactor(current.easeFactor, grade);

  if (grade < 3) {
    return { easeFactor, intervalDays: 1, repetitions: 0, dueAt: addDays(now, 1) };
  }

  const repetitions = current.repetitions + 1;
  const intervalDays =
    repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.round(current.intervalDays * easeFactor);

  return { easeFactor, intervalDays, repetitions, dueAt: addDays(now, intervalDays) };
}
