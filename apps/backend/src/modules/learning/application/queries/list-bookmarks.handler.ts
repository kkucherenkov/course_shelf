/**
 * WHY this file exists:
 * Orchestrates the "list bookmarks for a lesson" use case.
 *
 * Steps:
 *   1. Load lesson via LESSON_REPOSITORY. Missing → LessonNotFoundError.
 *   2. Load parent course to obtain libraryId.
 *   3. AuthorizationService.canSee → PermissionDenied if non-admin without grant.
 *   4. Return BookmarkRepository.findManyByUserAndLesson(actor.id, lessonId)
 *      mapped to BookmarkDto[]. Repo guarantees positionSeconds ASC ordering.
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
import { BOOKMARK_REPOSITORY } from '../../domain/bookmark/bookmark.repository';

import { ListBookmarksQuery } from './list-bookmarks.query';

import type {
  AuthorizationService,
  CourseId,
  LibraryId,
} from '../../../../common/access/authorization.service';
import type { CourseRepository, LessonRepository } from '../../../../common/catalog-tokens';
import type { BookmarkRepository } from '../../domain/bookmark/bookmark.repository';
import type { Bookmark } from '../../domain/bookmark/bookmark';
import type { BookmarkDto, BookmarkListDto } from '@app/api-client-ts';

function toDto(bm: Bookmark): BookmarkDto {
  return {
    id: bm.id,
    lessonId: bm.lessonId,
    positionSeconds: bm.positionSeconds,
    createdAt: bm.createdAt.toISOString(),
    updatedAt: bm.updatedAt.toISOString(),
    // exactOptionalPropertyTypes: omit the key entirely when undefined.
    ...(bm.label === undefined ? {} : { label: bm.label }),
  };
}

@QueryHandler(ListBookmarksQuery)
export class ListBookmarksHandler implements IQueryHandler<ListBookmarksQuery, BookmarkListDto> {
  constructor(
    @Inject(LESSON_REPOSITORY) private readonly lessonRepo: LessonRepository,
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
    @Inject(BOOKMARK_REPOSITORY) private readonly bookmarkRepo: BookmarkRepository,
  ) {}

  async execute(query: ListBookmarksQuery): Promise<BookmarkListDto> {
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

    const bookmarks = await this.bookmarkRepo.findManyByUserAndLesson(actor.id, lessonId);
    return { items: bookmarks.map((bm) => toDto(bm)) };
  }
}
