/**
 * WHY this file exists:
 * Centralises the Course aggregate → wire DTO mapping so query handlers and the
 * controller share a single conversion function without duplicating field access.
 *
 * Output types are sourced from the generated @app/api-client-ts package so they
 * stay in sync with the OpenAPI spec automatically.
 *
 * Progress: as of E10-F01-S01, callers may supply a CourseProgressReadModel row
 * (looked up from the projection). When absent, the zero placeholder is used
 * so the DTO contract remains stable for callers that have no session context.
 */
import type { Course } from './domain/course/course';
import type { CourseProgressReadModel } from './domain/progress/course-progress-read-model';
import type { CourseDto, CourseProgress, SectionDto } from '@app/api-client-ts';

/** Fallback — used when no projection row exists yet for this (user, course). */
const PROGRESS_PLACEHOLDER: CourseProgress = {
  percent: 0,
  lessonsCompleted: 0,
  lessonsTotal: 0,
} as const;

export function toCourseDto(
  course: Course,
  progressRow?: CourseProgressReadModel | null,
): CourseDto {
  const sections: SectionDto[] = course.sections.map((s) => ({
    id: s.id,
    position: s.position,
    title: s.title,
  }));

  const progress: CourseProgress = progressRow
    ? {
        percent: progressRow.percent,
        lessonsCompleted: progressRow.lessonsCompleted,
        lessonsTotal: progressRow.lessonsTotal,
      }
    : PROGRESS_PLACEHOLDER;

  const base = {
    id: course.id,
    libraryId: course.libraryId,
    slug: course.slug,
    title: course.title,
    sections,
    progress,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
  };

  if (course.description === undefined) {
    return base;
  }

  return { ...base, description: course.description };
}
