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
 *
 * Enrichment: as of Slice 5, the mapper also projects the new optional fields
 * (instructors, studios, tags, level, language, releaseDate, posterUrl,
 * ratingAverage, ratingCount, externalIds, sourceUpdatedAt). All are present
 * with null placeholders on every response so the DTO shape is stable for callers
 * that do not yet consume them.
 */
import type { Course } from './domain/course/course';
import type { CourseProgressReadModel } from './domain/progress/course-progress-read-model';
import type { CourseDto, CourseProgress, ExternalIdRef, SectionDto } from '@app/api-client-ts';
import type { InstructorRef, StudioRef, TagRef } from './domain/shared-vo/refs';

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
    instructors: course.instructors.map((r: InstructorRef) => ({
      id: r.id,
      slug: r.slug,
      displayName: r.displayName,
    })),
    studios: course.studios.map((r: StudioRef) => ({
      id: r.id,
      slug: r.slug,
      displayName: r.displayName,
    })),
    tags: course.tags.map((r: TagRef) => ({
      id: r.id,
      slug: r.slug,
      displayName: r.displayName,
      category: r.category ?? null,
    })),
    level: course.level ?? null,
    language: course.language ?? null,
    releaseDate: course.releaseDate
      ? (course.releaseDate.toISOString().split('T')[0] ?? null)
      : null,
    posterUrl: course.posterUrl ?? null,
    ratingAverage: course.ratingAverage ?? null,
    ratingCount: course.ratingCount ?? null,
    externalIds: [...course.externalIds] as ExternalIdRef[],
    sourceUpdatedAt: course.sourceUpdatedAt?.toISOString() ?? null,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
  };

  if (course.description === undefined) {
    return base;
  }

  return { ...base, description: course.description };
}
