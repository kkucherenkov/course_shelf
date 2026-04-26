/**
 * WHY this file exists:
 * Port (interface + injection token) for the LessonProgress persistence adapter.
 * The application layer depends only on this contract; the Prisma adapter in
 * infra/ implements it. Swapping storage never touches domain or application code.
 */
import type { LessonProgress } from './lesson-progress';

export interface LessonProgressRepository {
  save(progress: LessonProgress): Promise<void>;
  findByUserAndLesson(userId: string, lessonId: string): Promise<LessonProgress | null>;
}

/** Nest DI injection token — Symbol prevents collisions with class-name strings. */
export const LESSON_PROGRESS_REPOSITORY = Symbol('LESSON_PROGRESS_REPOSITORY');
