/**
 * WHY this file exists:
 * Orchestrates the "list flashcards for a lesson" use case.
 *
 * Steps:
 *   1. Load lesson via LESSON_REPOSITORY. Missing → LessonNotFoundError.
 *   2. Load parent course to obtain libraryId.
 *   3. AuthorizationService.canSee → PermissionDenied if non-admin without grant.
 *   4. Return FlashcardRepository.findManyByUserAndLesson(actor.id, lessonId)
 *      mapped to FlashcardDto[]. Repo guarantees createdAt ASC ordering.
 *
 * No NestJS HTTP exceptions. HttpExceptionFilter translates DomainError subclasses.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AUTHORIZATION_SERVICE } from '../../../../common/access/authorization.service';
import {
  COURSE_REPOSITORY,
  LESSON_REPOSITORY,
  LessonNotFoundError,
} from '../../../../common/catalog-tokens';
import { PermissionDenied } from '../../../../shared/domain-error';
import { FLASHCARD_REPOSITORY } from '../../domain/flashcard/flashcard.repository';

import { ListLessonFlashcardsQuery } from './list-lesson-flashcards.query';

import type {
  AuthorizationService,
  CourseId,
  LibraryId,
} from '../../../../common/access/authorization.service';
import type { CourseRepository, LessonRepository } from '../../../../common/catalog-tokens';
import type { FlashcardRepository } from '../../domain/flashcard/flashcard.repository';
import type { Flashcard } from '../../domain/flashcard/flashcard';
import type { FlashcardDto, FlashcardListDto } from '@app/api-client-ts';

function toDto(fc: Flashcard): FlashcardDto {
  return {
    id: fc.id,
    lessonId: fc.lessonId,
    front: fc.front,
    back: fc.back,
    ...(fc.sourceCueId === undefined ? {} : { sourceCueId: fc.sourceCueId }),
    easeFactor: fc.schedule.easeFactor,
    intervalDays: fc.schedule.intervalDays,
    repetitions: fc.schedule.repetitions,
    dueAt: fc.schedule.dueAt.toISOString(),
    createdAt: fc.createdAt.toISOString(),
    updatedAt: fc.updatedAt.toISOString(),
  };
}

@QueryHandler(ListLessonFlashcardsQuery)
export class ListLessonFlashcardsHandler implements IQueryHandler<
  ListLessonFlashcardsQuery,
  FlashcardListDto
> {
  constructor(
    @Inject(LESSON_REPOSITORY) private readonly lessonRepo: LessonRepository,
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
    @Inject(FLASHCARD_REPOSITORY) private readonly flashcardRepo: FlashcardRepository,
  ) {}

  async execute(query: ListLessonFlashcardsQuery): Promise<FlashcardListDto> {
    const { lessonId, actor } = query;

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

    const flashcards = await this.flashcardRepo.findManyByUserAndLesson(actor.id, lessonId);
    return { items: flashcards.map((fc) => toDto(fc)) };
  }
}
