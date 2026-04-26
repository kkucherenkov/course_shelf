/**
 * WHY this file exists:
 * Orchestrates the "delete bookmark" use case.
 *
 * Steps:
 *   1. Load bookmark. Missing → BookmarkNotFoundError.
 *   2. Ownership check: bookmark.userId !== actor.id AND actor.role !== 'admin'
 *      → BookmarkOwnershipMismatchError (403). Admins bypass for moderation.
 *   3. repo.delete(id). Returns void.
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

import { DeleteBookmarkCommand } from './delete-bookmark.command';

import type { BookmarkRepository } from '../../domain/bookmark/bookmark.repository';

@CommandHandler(DeleteBookmarkCommand)
export class DeleteBookmarkHandler implements ICommandHandler<DeleteBookmarkCommand, void> {
  constructor(@Inject(BOOKMARK_REPOSITORY) private readonly bookmarkRepo: BookmarkRepository) {}

  async execute(command: DeleteBookmarkCommand): Promise<void> {
    const { id, actor } = command;

    const bookmark = await this.bookmarkRepo.findById(id);
    if (!bookmark) {
      throw new BookmarkNotFoundError(id);
    }

    if (bookmark.userId !== actor.id && actor.role !== 'admin') {
      throw new BookmarkOwnershipMismatchError();
    }

    await this.bookmarkRepo.delete(id);
  }
}
