/**
 * WHY this file exists:
 * Orchestrates the "create bookmark" use case.
 *
 * Steps:
 *   1. Load lesson. Missing → LessonNotFoundError.
 *   2. Load parent course for libraryId.
 *   3. AuthorizationService.canSee → PermissionDenied if non-admin without grant.
 *   4. When idempotencyKey is given, look up an existing bookmark for
 *      (actor, lessonId, idempotencyKey) first — a retry of an already-applied
 *      create returns that bookmark (`created: false`) instead of making a
 *      second one (#285).
 *   5. Otherwise create a Bookmark aggregate via nanoid id stamped with
 *      actor.id and persist. A concurrent create that wins the race on the
 *      same key surfaces as BookmarkIdempotencyConflictError from the repo —
 *      re-fetch and answer with the winner rather than propagate a 409 for
 *      what is, from the retrying client's point of view, a success.
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
import { BookmarkIdempotencyConflictError } from '../../domain/bookmark/bookmark.errors';
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

/** created: false means this was an idempotent replay — controller answers 200, not 201. */
export interface CreateBookmarkResult {
  readonly bookmark: BookmarkDto;
  readonly created: boolean;
}

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
export class CreateBookmarkHandler implements ICommandHandler<
  CreateBookmarkCommand,
  CreateBookmarkResult
> {
  constructor(
    @Inject(LESSON_REPOSITORY) private readonly lessonRepo: LessonRepository,
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
    @Inject(BOOKMARK_REPOSITORY) private readonly bookmarkRepo: BookmarkRepository,
  ) {}

  async execute(command: CreateBookmarkCommand): Promise<CreateBookmarkResult> {
    const { lessonId, positionSeconds, label, idempotencyKey, actor } = command;

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

    if (idempotencyKey !== undefined) {
      const existing = await this.bookmarkRepo.findByIdempotencyKey(
        actor.id,
        lessonId,
        idempotencyKey,
      );
      if (existing) {
        return { bookmark: toDto(existing), created: false };
      }
    }

    const bookmark = Bookmark.create({
      id: nanoid(),
      userId: actor.id,
      lessonId,
      positionSeconds,
      ...(label === undefined ? {} : { label }),
      ...(idempotencyKey === undefined ? {} : { idempotencyKey }),
    });

    try {
      await this.bookmarkRepo.save(bookmark);
    } catch (error) {
      if (idempotencyKey !== undefined && error instanceof BookmarkIdempotencyConflictError) {
        const winner = await this.bookmarkRepo.findByIdempotencyKey(
          actor.id,
          lessonId,
          idempotencyKey,
        );
        if (winner) {
          return { bookmark: toDto(winner), created: false };
        }
      }
      throw error;
    }

    return { bookmark: toDto(bookmark), created: true };
  }
}
