/**
 * WHY this file exists:
 * Orchestrates the "create bookmark" use case.
 *
 * Steps:
 *   1. Load lesson. Missing → LessonNotFoundError.
 *   2. Load parent course for libraryId.
 *   3. AuthorizationService.canSee → PermissionDenied if non-admin without grant.
 *   4. Create Bookmark aggregate via nanoid id stamped with actor.id.
 *   5. Persist. Return BookmarkDto.
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
import { Bookmark } from '../../domain/bookmark/bookmark';
import { BOOKMARK_REPOSITORY } from '../../domain/bookmark/bookmark.repository';

import { CreateBookmarkCommand } from './create-bookmark.command';

import type {
  AuthorizationService,
  CourseId,
  LibraryId,
} from '../../../../common/access/authorization.service';
import type { CourseRepository, LessonRepository } from '../../../../common/catalog-tokens';
import type { BookmarkRepository } from '../../domain/bookmark/bookmark.repository';
import type { BookmarkDto } from '@app/api-client-ts';

function toDto(bm: Bookmark): BookmarkDto {
  return {
    id: bm.id,
    lessonId: bm.lessonId,
    positionSeconds: bm.positionSeconds,
    createdAt: bm.createdAt.toISOString(),
    updatedAt: bm.updatedAt.toISOString(),
    ...(bm.label === undefined ? {} : { label: bm.label }),
  };
}

@CommandHandler(CreateBookmarkCommand)
export class CreateBookmarkHandler implements ICommandHandler<CreateBookmarkCommand, BookmarkDto> {
  constructor(
    @Inject(LESSON_REPOSITORY) private readonly lessonRepo: LessonRepository,
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
    @Inject(BOOKMARK_REPOSITORY) private readonly bookmarkRepo: BookmarkRepository,
  ) {}

  async execute(command: CreateBookmarkCommand): Promise<BookmarkDto> {
    const { lessonId, positionSeconds, label, actor } = command;

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

    const bookmark = Bookmark.create({
      id: nanoid(),
      userId: actor.id,
      lessonId,
      positionSeconds,
      ...(label === undefined ? {} : { label }),
    });

    await this.bookmarkRepo.save(bookmark);
    return toDto(bookmark);
  }
}
