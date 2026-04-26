/**
 * WHY this file exists:
 * Query handler for GET /lessons/{id}. Enforces the same existence-before-
 * permission ordering as GetCourseHandler to prevent oracle attacks:
 *   1. Load lesson → 404 if missing.
 *   2. Load parent course (for libraryId) → defensive fallthrough to 404.
 *   3. Evaluate grant → 403 if non-admin without access.
 *   4. Map to LessonDto — raw path fields are NEVER included (NFR-S-01).
 *
 * The returned LessonDto carries:
 *   - materials: { id, kind, label, sizeBytes } — no path field.
 *   - subtitles: { id, language, label } — no path field.
 *   - progress: zero placeholder (v1); E10-F01-S01 populates real values.
 *
 * No NestJS HTTP exceptions — HttpExceptionFilter translates DomainError subclasses.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AUTHORIZATION_SERVICE } from '../../../../common/access/authorization.service';
import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { LESSON_REPOSITORY } from '../../domain/lesson/lesson.repository';
import { LessonNotFoundError } from '../../domain/lesson/lesson.errors';
import { PermissionDenied } from '../../../../shared/domain-error';

import { GetLessonQuery } from './get-lesson.query';

import type { AuthorizationService } from '../../../../common/access/authorization.service';
import type { CourseRepository } from '../../domain/course/course.repository';
import type { LessonRepository } from '../../domain/lesson/lesson.repository';
import type { LessonDto } from '@app/api-client-ts';
import type { CourseId, LibraryId } from '../../../../common/access/authorization.service';

/** v1 progress placeholder — always zeros until E10-F01-S01 lands. */
const LESSON_PROGRESS_PLACEHOLDER = {
  percent: 0,
  completed: false,
  lastSeenAtSeconds: 0,
} as const;

@QueryHandler(GetLessonQuery)
export class GetLessonHandler implements IQueryHandler<GetLessonQuery, LessonDto> {
  constructor(
    @Inject(LESSON_REPOSITORY) private readonly lessonRepo: LessonRepository,
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
  ) {}

  async execute(query: GetLessonQuery): Promise<LessonDto> {
    const lesson = await this.lessonRepo.findById(query.id);
    if (!lesson) {
      throw new LessonNotFoundError(query.id);
    }

    // Load parent course to obtain the libraryId required for grant evaluation.
    // If the course is somehow missing (should not happen with FK constraints but
    // is defensive for data inconsistency scenarios), treat it as lesson not found.
    const course = await this.courseRepo.findById(lesson.courseId);
    if (!course) {
      throw new LessonNotFoundError(query.id);
    }

    const allowed = await this.authz.canSee(query.actor, {
      kind: 'lesson',
      id: lesson.id,
      courseId: lesson.courseId as CourseId,
      libraryId: course.libraryId as LibraryId,
    });

    if (!allowed) {
      throw new PermissionDenied('You do not have access to this lesson.');
    }

    // Map to DTO — raw filesystem paths are deliberately omitted (NFR-S-01).
    return {
      id: lesson.id,
      courseId: lesson.courseId,
      sectionId: lesson.sectionId,
      position: lesson.position,
      title: lesson.title,
      ...(lesson.duration === undefined ? {} : { durationSeconds: lesson.duration }),
      materials: lesson.materials.map((m) => ({
        id: m.id,
        kind: m.kind,
        label: m.label,
        sizeBytes: m.sizeBytes,
      })),
      subtitles: lesson.subtitles.map((s) => ({
        id: s.id,
        language: s.language,
        label: s.label,
      })),
      progress: LESSON_PROGRESS_PLACEHOLDER,
    };
  }
}
