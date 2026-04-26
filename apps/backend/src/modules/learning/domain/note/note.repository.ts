/**
 * WHY this file exists:
 * Port (interface + injection token) for the Note persistence adapter.
 * The application layer depends only on this contract; the Prisma adapter in
 * infra/ implements it. Swapping storage never touches domain or application code.
 *
 * The repository has no findById — Note is addressed exclusively by the
 * composite (userId, lessonId) key, which is its natural identity in the
 * per-user, per-lesson uniqueness model.
 */
import type { Note } from './note';

export interface NoteRepository {
  upsert(note: Note): Promise<void>;
  findByUserAndLesson(userId: string, lessonId: string): Promise<Note | null>;
  /**
   * Deletes the note for the given (userId, lessonId) pair.
   * Returns true if a row was deleted, false if no row existed (idempotent).
   */
  deleteByUserAndLesson(userId: string, lessonId: string): Promise<boolean>;
}

/** Nest DI injection token — Symbol prevents collisions with class-name strings. */
export const NOTE_REPOSITORY = Symbol('NOTE_REPOSITORY');
