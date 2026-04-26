/**
 * WHY this file exists:
 * Centralises the Course aggregate → wire DTO mapping so query handlers and the
 * controller share a single conversion function without duplicating field access.
 *
 * Output types are sourced from the generated @app/api-client-ts package so they
 * stay in sync with the OpenAPI spec automatically.
 *
 * Progress is a v1 placeholder (zeros). The LessonProgress projector in
 * E10-F01-S01 will replace this with real computed values.
 */
import type { Course } from './domain/course/course';
import type { CourseDto, SectionDto } from '@app/api-client-ts';

/** v1 progress placeholder — always zeros until E10-F01-S01 lands. */
const PROGRESS_PLACEHOLDER = {
  percent: 0,
  lessonsCompleted: 0,
  lessonsTotal: 0,
} as const;

export function toCourseDto(course: Course): CourseDto {
  const sections: SectionDto[] = course.sections.map((s) => ({
    id: s.id,
    position: s.position,
    title: s.title,
  }));

  const base = {
    id: course.id,
    libraryId: course.libraryId,
    slug: course.slug,
    title: course.title,
    sections,
    progress: PROGRESS_PLACEHOLDER,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
  };

  if (course.description === undefined) {
    return base;
  }

  return { ...base, description: course.description };
}
