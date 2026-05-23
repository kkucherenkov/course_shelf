/**
 * WHY this file exists:
 * Centralises the Instructor, Studio, and Tag aggregate → wire DTO mappings so
 * query/command handlers and the controller share single conversion functions
 * without duplicating field access. Output types are sourced from the generated
 * @app/api-client-ts package so they stay in sync with the OpenAPI spec
 * automatically.
 *
 * toCourseDto lives in courses.dto.ts — do not duplicate it here.
 */
import { toCourseDto } from './courses.dto';

import type { Instructor } from './domain/instructor/instructor';
import type { Studio } from './domain/studio/studio';
import type { Tag } from './domain/tag/tag';
import type { Course } from './domain/course/course';
import type {
  InstructorDto,
  InstructorListDto,
  InstructorDetailDto,
  InstructorRef,
  StudioDto,
  StudioListDto,
  StudioDetailDto,
  StudioRef,
  TagDto,
  TagListDto,
  TagDetailDto,
  TagRef,
  ExternalIdRef,
} from '@app/api-client-ts';

// ---------------------------------------------------------------------------
// Ref helpers — one-liner projections from domain aggregate to DTO ref shape
// ---------------------------------------------------------------------------

/** Project an Instructor aggregate to an InstructorRef. */
export function toInstructorRef(instructor: Instructor): InstructorRef {
  return { id: instructor.id, slug: instructor.slug, displayName: instructor.displayName };
}

/** Project a Studio aggregate to a StudioRef. */
export function toStudioRef(studio: Studio): StudioRef {
  return { id: studio.id, slug: studio.slug, displayName: studio.displayName };
}

/** Project a Tag aggregate to a TagRef. */
export function toTagRef(tag: Tag): TagRef {
  return {
    id: tag.id,
    slug: tag.slug,
    displayName: tag.displayName,
    category: tag.category ?? null,
  };
}

// ---------------------------------------------------------------------------
// Instructor mappers
// ---------------------------------------------------------------------------

/** Map an Instructor aggregate + coursesTotal count to a flat InstructorDto. */
export function toInstructorDto(instructor: Instructor, coursesTotal: number): InstructorDto {
  return {
    id: instructor.id,
    slug: instructor.slug,
    displayName: instructor.displayName,
    externalIds: instructor.externalIds as ExternalIdRef[],
    coursesTotal,
    createdAt: instructor.createdAt.toISOString(),
    updatedAt: instructor.updatedAt.toISOString(),
  };
}

/**
 * Map a page of Instructor aggregates to InstructorListDto.
 * totals: Map<instructorId, coursesTotal> — populated by the handler.
 *
 * TODO: batch count — the handler currently makes N+1 findCoursesForInstructor
 * calls; replace with a single batched query when volume justifies it.
 */
export function toInstructorListDto(
  items: Instructor[],
  totals: Map<string, number>,
  total: number,
  offset: number,
  limit: number,
): InstructorListDto {
  return {
    items: items.map((i) => toInstructorDto(i, totals.get(i.id) ?? 0)),
    total,
    offset,
    limit,
  };
}

/** Map an Instructor aggregate + paginated courses to InstructorDetailDto. */
export function toInstructorDetailDto(
  instructor: Instructor,
  coursesTotal: number,
  courses: Course[],
): InstructorDetailDto {
  return {
    instructor: toInstructorDto(instructor, coursesTotal),
    courses: courses.map((c) => toCourseDto(c)),
    coursesTotal,
  };
}

// ---------------------------------------------------------------------------
// Studio mappers
// ---------------------------------------------------------------------------

/** Map a Studio aggregate + coursesTotal count to a flat StudioDto. */
export function toStudioDto(studio: Studio, coursesTotal: number): StudioDto {
  return {
    id: studio.id,
    slug: studio.slug,
    displayName: studio.displayName,
    externalIds: studio.externalIds as ExternalIdRef[],
    coursesTotal,
    createdAt: studio.createdAt.toISOString(),
    updatedAt: studio.updatedAt.toISOString(),
  };
}

/**
 * Map a page of Studio aggregates to StudioListDto.
 * totals: Map<studioId, coursesTotal> — populated by the handler.
 *
 * TODO: batch count — the handler currently makes N+1 findCoursesForStudio
 * calls; replace with a single batched query when volume justifies it.
 */
export function toStudioListDto(
  items: Studio[],
  totals: Map<string, number>,
  total: number,
  offset: number,
  limit: number,
): StudioListDto {
  return {
    items: items.map((s) => toStudioDto(s, totals.get(s.id) ?? 0)),
    total,
    offset,
    limit,
  };
}

/** Map a Studio aggregate + paginated courses to StudioDetailDto. */
export function toStudioDetailDto(
  studio: Studio,
  coursesTotal: number,
  courses: Course[],
): StudioDetailDto {
  return {
    studio: toStudioDto(studio, coursesTotal),
    courses: courses.map((c) => toCourseDto(c)),
    coursesTotal,
  };
}

// ---------------------------------------------------------------------------
// Tag mappers
// ---------------------------------------------------------------------------

/** Map a Tag aggregate + coursesTotal count to a flat TagDto. */
export function toTagDto(tag: Tag, coursesTotal: number): TagDto {
  return {
    id: tag.id,
    slug: tag.slug,
    displayName: tag.displayName,
    category: tag.category ?? null,
    externalIds: tag.externalIds as ExternalIdRef[],
    coursesTotal,
    createdAt: tag.createdAt.toISOString(),
    updatedAt: tag.updatedAt.toISOString(),
  };
}

/**
 * Map a page of Tag aggregates to TagListDto.
 * totals: Map<tagId, coursesTotal> — populated by the handler.
 *
 * TODO: batch count — the handler currently makes N+1 findCoursesForTag
 * calls; replace with a single batched query when volume justifies it.
 */
export function toTagListDto(
  items: Tag[],
  totals: Map<string, number>,
  total: number,
  offset: number,
  limit: number,
): TagListDto {
  return {
    items: items.map((t) => toTagDto(t, totals.get(t.id) ?? 0)),
    total,
    offset,
    limit,
  };
}

/** Map a Tag aggregate + paginated courses to TagDetailDto. */
export function toTagDetailDto(tag: Tag, coursesTotal: number, courses: Course[]): TagDetailDto {
  return {
    tag: toTagDto(tag, coursesTotal),
    courses: courses.map((c) => toCourseDto(c)),
    coursesTotal,
  };
}
