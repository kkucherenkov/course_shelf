/**
 * WHY this file exists:
 * Flashcard is the aggregate root for the per-user, per-lesson flashcard
 * slice. It owns:
 *   - front/back are trimmed on entry; after trimming each must be 1..2000
 *     characters (FlashcardInvalidError otherwise).
 *   - update() requires at least one of front/back (FlashcardUpdateEmptyError
 *     on an empty patch), same shape as Bookmark.update().
 *   - the embedded ReviewSchedule value object (ease, interval, repetitions,
 *     due date) — carried on the same row as the card because it is always
 *     read/written together with it (see schema.prisma comment).
 *   - grade() validates the raw grade and delegates the actual transition to
 *     the pure scheduleNextReview() function; this method holds no scheduling
 *     logic of its own, only the clock argument the pure function needs.
 *
 * No Prisma types. No NestJS decorators. Infrastructure stays in infra/.
 */
import { FlashcardInvalidError, FlashcardUpdateEmptyError } from './flashcard.errors';
import { initialReviewSchedule, scheduleNextReview } from './review-schedule';

import type { ReviewGrade, ReviewScheduleState } from './review-schedule';

const TEXT_MAX = 2000;

function validateText(value: string, field: 'front' | 'back'): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new FlashcardInvalidError(`Flashcard ${field} must not be empty after trimming.`);
  }
  if (trimmed.length > TEXT_MAX) {
    throw new FlashcardInvalidError(
      `Flashcard ${field} must be at most ${String(TEXT_MAX)} characters (got ${String(trimmed.length)}).`,
    );
  }
  return trimmed;
}

function validateGrade(grade: number): ReviewGrade {
  if (!Number.isInteger(grade) || grade < 0 || grade > 5) {
    throw new FlashcardInvalidError(`grade must be an integer 0..5, got ${String(grade)}.`);
  }
  return grade as ReviewGrade;
}

export interface FlashcardProps {
  readonly id: string;
  readonly userId: string;
  readonly lessonId: string;
  front: string;
  back: string;
  readonly sourceCueId: string | undefined;
  schedule: ReviewScheduleState;
  readonly createdAt: Date;
  updatedAt: Date;
}

export class Flashcard {
  readonly id: string;
  readonly userId: string;
  readonly lessonId: string;
  front: string;
  back: string;
  readonly sourceCueId: string | undefined;
  schedule: ReviewScheduleState;
  readonly createdAt: Date;
  updatedAt: Date;

  private constructor(props: FlashcardProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.lessonId = props.lessonId;
    this.front = props.front;
    this.back = props.back;
    this.sourceCueId = props.sourceCueId;
    this.schedule = props.schedule;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Creates a new Flashcard aggregate, due immediately (fresh cards start in
   * the queue). Throws FlashcardInvalidError when front or back is empty
   * after trimming, or exceeds 2000 characters.
   */
  static create(params: {
    id: string;
    userId: string;
    lessonId: string;
    front: string;
    back: string;
    sourceCueId?: string;
  }): Flashcard {
    const front = validateText(params.front, 'front');
    const back = validateText(params.back, 'back');
    const now = new Date();
    return new Flashcard({
      id: params.id,
      userId: params.userId,
      lessonId: params.lessonId,
      front,
      back,
      sourceCueId: params.sourceCueId,
      schedule: initialReviewSchedule(now),
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitutes a Flashcard from a persisted row. Bypasses invariant checks
   * because the DB is the source of truth for already-valid rows.
   */
  static reconstitute(props: FlashcardProps): Flashcard {
    return new Flashcard(props);
  }

  /**
   * Applies a partial content update. At least one of front/back must be
   * provided — throws FlashcardUpdateEmptyError otherwise. Does not touch
   * the review schedule.
   */
  update(patch: { front?: string; back?: string }): this {
    if (patch.front === undefined && patch.back === undefined) {
      throw new FlashcardUpdateEmptyError();
    }
    if (patch.front !== undefined) {
      this.front = validateText(patch.front, 'front');
    }
    if (patch.back !== undefined) {
      this.back = validateText(patch.back, 'back');
    }
    this.updatedAt = new Date();
    return this;
  }

  /**
   * Applies an SM-2 grade transition. `now` is mandatory — the clock is an
   * argument, not something this method reaches for on its own, so the
   * transition stays reproducible in tests.
   * Throws FlashcardInvalidError when grade is not an integer in 0..5.
   */
  grade(rawGrade: number, now: Date): this {
    const grade = validateGrade(rawGrade);
    this.schedule = scheduleNextReview(this.schedule, grade, now);
    this.updatedAt = now;
    return this;
  }
}
