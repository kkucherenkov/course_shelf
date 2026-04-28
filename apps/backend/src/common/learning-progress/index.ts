/**
 * WHY this file exists:
 * Re-exports the LESSON_PROGRESS_REPOSITORY token and LessonProgressRepository
 * interface so that the Catalog bounded context can depend on the Learning
 * progress port without importing from src/modules/learning/** directly
 * (which would violate the boundaries/element-types ESLint rule).
 *
 * Symbol identity is preserved — re-export does not create a new Symbol.
 */

export { LESSON_PROGRESS_REPOSITORY } from '../../modules/learning/domain/progress/lesson-progress.repository';
export type { LessonProgressRepository } from '../../modules/learning/domain/progress/lesson-progress.repository';
// Re-export LessonProgress class (not just the type) so the Catalog context can use it
// in specs without a direct cross-context import from modules/learning/**.
export { LessonProgress } from '../../modules/learning/domain/progress/lesson-progress';
