/**
 * WHY this file exists:
 * Orchestrates the "update bookmark" use case.
 *
 * Steps:
 *   1. Load bookmark via BOOKMARK_REPOSITORY.findById. Missing → BookmarkNotFoundError.
 *   2. Ownership check: bookmark.userId !== actor.id AND actor.role !== 'admin'
 *      → BookmarkOwnershipMismatchError (403). Admins bypass for moderation.
 *   3. Apply patch via bookmark.update(). Aggregate throws BookmarkUpdateEmptyError
 *      when both fields are undefined, or BookmarkInvalidError on invariant failure.
 *   4. Persist. Return BookmarkDto.
 *
 * No NestJS HTTP exceptions. HttpExceptionFilter translates DomainError subclasses.
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  BookmarkNotFoundError,
  BookmarkOwnershipMismatchError,
} from '../../domain/bookmark/bookmark.errors';
import { BOOKMARK_REPOSITORY } from '../../domain/bookmark/bookmark.repository';

import { UpdateBookmarkCommand } from './update-bookmark.command';

import type { BookmarkRepository } from '../../domain/bookmark/bookmark.repository';
import type { Bookmark } from '../../domain/bookmark/bookmark';
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

@CommandHandler(UpdateBookmarkCommand)
export class UpdateBookmarkHandler implements ICommandHandler<UpdateBookmarkCommand, BookmarkDto> {
  constructor(@Inject(BOOKMARK_REPOSITORY) private readonly bookmarkRepo: BookmarkRepository) {}

  async execute(command: UpdateBookmarkCommand): Promise<BookmarkDto> {
    const { id, positionSeconds, label, actor } = command;

    const bookmark = await this.bookmarkRepo.findById(id);
    if (!bookmark) {
      throw new BookmarkNotFoundError(id);
    }

    if (bookmark.userId !== actor.id && actor.role !== 'admin') {
      throw new BookmarkOwnershipMismatchError();
    }

    // Aggregate throws BookmarkUpdateEmptyError or BookmarkInvalidError on violations.
    // Build patch without undefined-valued optional keys to satisfy exactOptionalPropertyTypes.
    const patch: { positionSeconds?: number; label?: string | null } = {};
    if (positionSeconds !== undefined) patch.positionSeconds = positionSeconds;
    if (label !== undefined) patch.label = label;
    bookmark.update(patch);

    await this.bookmarkRepo.save(bookmark);
    return toDto(bookmark);
  }
}
