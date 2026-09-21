/**
 * WHY this file exists:
 * Orchestrates the "create flashcard" use case — the one command all three
 * creation entry points (manual, from a note, from a transcript line) call.
 * Which UI flow triggered it is a web concern; the only trace left server-side
 * is the optional sourceCueId.
 *
 * Steps:
 *   1. Load lesson. Missing → LessonNotFoundError.
 *   2. Load parent course for libraryId.
 *   3. AuthorizationService.canSee → PermissionDenied if non-admin without grant.
 *   4. When sourceCueId is given, verify it names a TranscriptCue on this
 *      lesson's own transcript (tuxedo 208) — a foreign or nonexistent id is
 *      FlashcardSourceCueInvalidError, not a silently saved reference.
 *   5. Create a Flashcard aggregate via nanoid id stamped with actor.id,
 *      due immediately, and persist.
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
  TRANSCRIPT_REPOSITORY,
} from '../../../../common/catalog-tokens';
import { PermissionDenied } from '../../../../shared/domain-error';
import { Flashcard } from '../../domain/flashcard/flashcard';
import { FlashcardSourceCueInvalidError } from '../../domain/flashcard/flashcard.errors';
import { FLASHCARD_REPOSITORY } from '../../domain/flashcard/flashcard.repository';

import { CreateFlashcardCommand } from './create-flashcard.command';

import type {
  AuthorizationService,
  CourseId,
  LibraryId,
} from '../../../../common/access/authorization.service';
import type {
  CourseRepository,
  LessonRepository,
  TranscriptRepository,
} from '../../../../common/catalog-tokens';
import type { FlashcardRepository } from '../../domain/flashcard/flashcard.repository';
import type { FlashcardDto } from '@app/api-client-ts';

function toDto(fc: Flashcard): FlashcardDto {
  return {
    id: fc.id,
    lessonId: fc.lessonId,
    front: fc.front,
    back: fc.back,
    // exactOptionalPropertyTypes: omit the key entirely when undefined.
    ...(fc.sourceCueId === undefined ? {} : { sourceCueId: fc.sourceCueId }),
    easeFactor: fc.schedule.easeFactor,
    intervalDays: fc.schedule.intervalDays,
    repetitions: fc.schedule.repetitions,
    dueAt: fc.schedule.dueAt.toISOString(),
    createdAt: fc.createdAt.toISOString(),
    updatedAt: fc.updatedAt.toISOString(),
  };
}

@CommandHandler(CreateFlashcardCommand)
export class CreateFlashcardHandler implements ICommandHandler<
  CreateFlashcardCommand,
  FlashcardDto
> {
  constructor(
    @Inject(LESSON_REPOSITORY) private readonly lessonRepo: LessonRepository,
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
    @Inject(FLASHCARD_REPOSITORY) private readonly flashcardRepo: FlashcardRepository,
    @Inject(TRANSCRIPT_REPOSITORY) private readonly transcripts: TranscriptRepository,
  ) {}

  async execute(command: CreateFlashcardCommand): Promise<FlashcardDto> {
    const { lessonId, front, back, sourceCueId, actor } = command;

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

    if (sourceCueId !== undefined) {
      const belongs = await this.transcripts.cueBelongsToLesson(sourceCueId, lessonId);
      if (!belongs) {
        throw new FlashcardSourceCueInvalidError(sourceCueId);
      }
    }

    const flashcard = Flashcard.create({
      id: nanoid(),
      userId: actor.id,
      lessonId,
      front,
      back,
      ...(sourceCueId === undefined ? {} : { sourceCueId }),
    });

    await this.flashcardRepo.save(flashcard);
    return toDto(flashcard);
  }
}
