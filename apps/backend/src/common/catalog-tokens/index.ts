/**
 * WHY this file exists:
 * The boundaries/element-types ESLint rule prevents sibling modules from
 * importing each other's source files directly. The `streaming` module needs
 * the LESSON_REPOSITORY and COURSE_REPOSITORY injection tokens + the
 * LessonNotFoundError from the `catalog` module.
 *
 * Re-exporting through `src/common/` is the canonical pattern for this repo:
 * `common` is explicitly in the `allow` zone for all module types (see
 * packages/eslint-config/nest.mjs). The Symbol identity of each token is
 * **preserved** — re-export does not create a new Symbol, so the injection
 * token that Nest resolves at runtime is identical to the one CatalogModule
 * registers. This is not a copy; it is an alias.
 *
 * Add only items that multiple bounded contexts genuinely need. If only one
 * sibling uses something, keep it inside that module's domain layer instead.
 */

export { LESSON_REPOSITORY } from '../../modules/catalog/domain/lesson/lesson.repository';
export type { LessonRepository } from '../../modules/catalog/domain/lesson/lesson.repository';
export { COURSE_REPOSITORY } from '../../modules/catalog/domain/course/course.repository';
export type { CourseRepository } from '../../modules/catalog/domain/course/course.repository';
export { LessonNotFoundError } from '../../modules/catalog/domain/lesson/lesson.errors';
// Added for E08-F02-S01: LessonFileLocator needs Library.rootPath to compute
// the video file's absolute path for range-based streaming.
export { LIBRARY_REPOSITORY } from '../../modules/catalog/domain/library/library.repository';
export type { LibraryRepository } from '../../modules/catalog/domain/library/library.repository';
// Added for material download: LessonFileLocator.locateMaterial returns kind so
// the controller can derive the Content-Type without importing catalog sources.
export type { MaterialKindValue } from '../../modules/catalog/domain/lesson/material';
