/**
 * WHY this file exists:
 * Orchestrates the "delete note" use case.
 *
 * Authorization strategy — no-oracle rule (mirrors GetNoteHandler):
 *   1. Load lesson. Missing → PermissionDenied (not LessonNotFoundError).
 *      Rationale: DELETE is still a resource-scoped operation. Returning 403 on
 *      a missing lesson prevents callers from enumerating lesson ids by probing
 *      with DELETE and observing 404 vs 403. This is consistent with the GET
 *      handler. LessonNotFoundError would be appropriate only for commands where
 *      the lesson must exist as a prerequisite (e.g. UpsertNote, RecordProgress)
 *      and the actor is already confirmed to have access before the lesson check
 *      matters. For operations that gate everything on access first, 403 is the
 *      correct sentinel for "no access AND possibly not found."
 *   2. Load parent course. Missing → PermissionDenied (same reason).
 *   3. canSee check. False → PermissionDenied.
 *   4. repo.deleteByUserAndLesson(actor.id, lessonId) — idempotent; ignore the
 *      boolean. Returns void (204 to the caller regardless of prior existence).
 *
 * No NestJS HTTP exceptions. HttpExceptionFilter translates DomainError subclasses.
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AUTHORIZATION_SERVICE } from '../../../../common/access/authorization.service';
import { COURSE_REPOSITORY, LESSON_REPOSITORY } from '../../../../common/catalog-tokens';
import { PermissionDenied } from '../../../../shared/domain-error';
import { NOTE_REPOSITORY } from '../../domain/note/note.repository';

import { DeleteNoteCommand } from './delete-note.command';

import type {
  AuthorizationService,
  CourseId,
  LibraryId,
} from '../../../../common/access/authorization.service';
import type { CourseRepository, LessonRepository } from '../../../../common/catalog-tokens';
import type { NoteRepository } from '../../domain/note/note.repository';

@CommandHandler(DeleteNoteCommand)
export class DeleteNoteHandler implements ICommandHandler<DeleteNoteCommand, void> {
  constructor(
    @Inject(LESSON_REPOSITORY) private readonly lessonRepo: LessonRepository,
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
    @Inject(NOTE_REPOSITORY) private readonly noteRepo: NoteRepository,
  ) {}

  async execute(command: DeleteNoteCommand): Promise<void> {
    const { lessonId, actor } = command;

    // No-oracle rule: missing lesson → 403, not 404. See module comment.
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

    // Idempotent: boolean return is intentionally ignored.
    await this.noteRepo.deleteByUserAndLesson(actor.id, lessonId);
  }
}
