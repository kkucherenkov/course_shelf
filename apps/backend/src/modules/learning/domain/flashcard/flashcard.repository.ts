/**
 * WHY this file exists:
 * Port (interface + injection token) for the Flashcard persistence adapter.
 * The application layer depends only on this contract; the Prisma adapter in
 * infra/ implements it. Swapping storage never touches domain or application
 * code.
 */
import type { Flashcard } from './flashcard';

export interface FlashcardRepository {
  save(flashcard: Flashcard): Promise<void>;
  findById(id: string): Promise<Flashcard | null>;
  /** Ordered by createdAt ASC — stable listing order for a lesson's deck. */
  findManyByUserAndLesson(userId: string, lessonId: string): Promise<Flashcard[]>;
  /**
   * Due-card selection — a query, not a background job. Returns up to
   * `limit` cards with `dueAt <= now` for the user, across all lessons,
   * ordered by `dueAt` ascending (most overdue first).
   */
  findDueByUser(userId: string, now: Date, limit: number): Promise<Flashcard[]>;
  delete(id: string): Promise<void>;
}

/** Nest DI injection token — Symbol prevents collisions with class-name strings. */
export const FLASHCARD_REPOSITORY = Symbol('FLASHCARD_REPOSITORY');
