/**
 * WHY this file exists:
 * Orchestrates the "get note" use case.
 *
 * Steps:
 *   1. Load lesson. If missing → PermissionDenied, NOT LessonNotFoundError.
 *      WHY: "no-oracle" rule — a 404 on a missing lesson would let an
 *      unauthenticated / unauthorised caller enumerate lesson ids. We return 403
 *      so the lesson's existence is not disclosed to actors without access.
 *      Mirror of GetLessonProgressHandler pattern.
 *   2. Load parent course. If missing → PermissionDenied (same reason).
 *   3. AuthorizationService.canSee → PermissionDenied if non-admin without grant.
 *   4. Load note via findByUserAndLesson(actor.id, lessonId).
 *      Missing → NoteNotFoundError (404).
 *   5. Return NoteDto.
 *
 * No NestJS HTTP exceptions. HttpExceptionFilter translates DomainError subclasses.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AUTHORIZATION_SERVICE } from '../../../../common/access/authorization.service';
import { COURSE_REPOSITORY, LESSON_REPOSITORY } from '../../../../common/catalog-tokens';
import { PermissionDenied } from '../../../../shared/domain-error';
import { NoteNotFoundError } from '../../domain/note/note.errors';
import { NOTE_REPOSITORY } from '../../domain/note/note.repository';

import { GetNoteQuery } from './get-note.query';

import type {
  AuthorizationService,
  CourseId,
  LibraryId,
} from '../../../../common/access/authorization.service';
import type { CourseRepository, LessonRepository } from '../../../../common/catalog-tokens';
import type { NoteRepository } from '../../domain/note/note.repository';
import type { Note } from '../../domain/note/note';
import type { NoteDto } from '@app/api-client-ts';

function toDto(note: Note): NoteDto {
  return {
    id: note.id,
    lessonId: note.lessonId,
    body: note.body,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

@QueryHandler(GetNoteQuery)
export class GetNoteHandler implements IQueryHandler<GetNoteQuery, NoteDto> {
  constructor(
    @Inject(LESSON_REPOSITORY) private readonly lessonRepo: LessonRepository,
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
    @Inject(NOTE_REPOSITORY) private readonly noteRepo: NoteRepository,
  ) {}

  async execute(query: GetNoteQuery): Promise<NoteDto> {
    const { lessonId, actor } = query;

    // No-oracle rule: missing lesson is presented as 403, not 404, so callers
    // cannot enumerate lesson ids by observing the error status code.
    const lesson = await this.lessonRepo.findById(lessonId);
    if (!lesson) {
      throw new PermissionDenied('You do not have access to this lesson.');
    }

    const course = await this.courseRepo.findById(lesson.courseId);
    if (!course) {
      throw new PermissionDenied('You do not have access to this lesson.');
    }

    const allowed = await this.authz.canSee(actor, {
      kind: 'lesson',
      id: lessonId as never,
      courseId: lesson.courseId as CourseId,
      libraryId: course.libraryId as LibraryId,
    });
    if (!allowed) {
      throw new PermissionDenied('You do not have access to this lesson.');
    }

    const note = await this.noteRepo.findByUserAndLesson(actor.id, lessonId);
    if (!note) {
      throw new NoteNotFoundError(lessonId);
    }

    return toDto(note);
  }
}
