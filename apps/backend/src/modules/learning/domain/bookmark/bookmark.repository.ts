/**
 * WHY this file exists:
 * Port (interface + injection token) for the Bookmark persistence adapter.
 * The application layer depends only on this contract; the Prisma adapter in
 * infra/ implements it. Swapping storage never touches domain or application code.
 *
 * findManyByUserAndLesson returns aggregates sorted by positionSeconds ASC —
 * callers rely on this ordering guarantee without a secondary sort step.
 */
import type { Bookmark } from './bookmark';

export interface BookmarkRepository {
  /**
   * Throws `BookmarkIdempotencyConflictError` (#285) when a concurrent create
   * won the race on (userId, lessonId, idempotencyKey) — callers should
   * re-fetch via `findByIdempotencyKey` rather than treat this as a failure.
   */
  save(bookmark: Bookmark): Promise<void>;
  findById(id: string): Promise<Bookmark | null>;
  /** Lookup used to make POST create retry-safe (#285). */
  findByIdempotencyKey(
    userId: string,
    lessonId: string,
    idempotencyKey: string,
  ): Promise<Bookmark | null>;
  findManyByUserAndLesson(userId: string, lessonId: string): Promise<Bookmark[]>;
  delete(id: string): Promise<void>;
}

/** Nest DI injection token — Symbol prevents collisions with class-name strings. */
export const BOOKMARK_REPOSITORY = Symbol('BOOKMARK_REPOSITORY');
