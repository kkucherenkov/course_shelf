/**
 * WHY this file exists:
 * Orchestrates the "upsert note" use case.
 *
 * Steps:
 *   1. Load lesson. Missing → LessonNotFoundError.
 *   2. Load parent course for libraryId.
 *   3. AuthorizationService.canSee → PermissionDenied if non-admin without grant.
 *   4. Load existing note via findByUserAndLesson(actor.id, lessonId).
 *      If absent → Note.create({ id: nanoid(), userId: actor.id, lessonId, body }).
 *      If present → existing.setBody(body).
 *   5. repo.upsert(note). Returns NoteDto.
 *
 * No NestJS HTTP exceptions. HttpExceptionFilter translates DomainError subclasses.
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { nanoid } from 'nanoid';

import { AUTHORIZATION_SERVICE } from '../../../../common/access/authorization.service';
import {
  COURSE_REPOSITORY,
  LESSON_REPOSITORY,
  LessonNotFoundError,
} from '../../../../common/catalog-tokens';
import { PermissionDenied } from '../../../../shared/domain-error';
import { Note } from '../../domain/note/note';
import { NOTE_REPOSITORY } from '../../domain/note/note.repository';

import { UpsertNoteCommand } from './upsert-note.command';

import type {
  AuthorizationService,
  CourseId,
  LibraryId,
} from '../../../../common/access/authorization.service';
import type { CourseRepository, LessonRepository } from '../../../../common/catalog-tokens';
import type { NoteRepository } from '../../domain/note/note.repository';
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

@CommandHandler(UpsertNoteCommand)
export class UpsertNoteHandler implements ICommandHandler<UpsertNoteCommand, NoteDto> {
  constructor(
    @Inject(LESSON_REPOSITORY) private readonly lessonRepo: LessonRepository,
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
    @Inject(NOTE_REPOSITORY) private readonly noteRepo: NoteRepository,
  ) {}

  async execute(command: UpsertNoteCommand): Promise<NoteDto> {
    const { lessonId, body, actor } = command;

    const lesson = await this.lessonRepo.findById(lessonId);
    if (!lesson) {
      throw new LessonNotFoundError(lessonId);
    }

    const course = await this.courseRepo.findById(lesson.courseId);
    if (!course) {
      throw new LessonNotFoundError(lessonId);
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

    const existing = await this.noteRepo.findByUserAndLesson(actor.id, lessonId);

    let note: Note;
    if (existing) {
      existing.setBody(body);
      note = existing;
    } else {
      note = Note.create({ id: nanoid(), userId: actor.id, lessonId, body });
    }

    await this.noteRepo.upsert(note);
    return toDto(note);
  }
}
