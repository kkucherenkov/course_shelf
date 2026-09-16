/**
 * WHY this file exists:
 * Orchestrates the "delete flashcard" use case.
 *
 * Steps:
 *   1. Load flashcard. Missing → FlashcardNotFoundError.
 *   2. Ownership check: flashcard.userId !== actor.id AND actor.role !== 'admin'
 *      → FlashcardOwnershipMismatchError (403). Admins bypass for moderation.
 *   3. repo.delete(id). Returns void.
 *
 * No NestJS HTTP exceptions. HttpExceptionFilter translates DomainError subclasses.
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  FlashcardNotFoundError,
  FlashcardOwnershipMismatchError,
} from '../../domain/flashcard/flashcard.errors';
import { FLASHCARD_REPOSITORY } from '../../domain/flashcard/flashcard.repository';

import { DeleteFlashcardCommand } from './delete-flashcard.command';

import type { FlashcardRepository } from '../../domain/flashcard/flashcard.repository';

@CommandHandler(DeleteFlashcardCommand)
export class DeleteFlashcardHandler implements ICommandHandler<DeleteFlashcardCommand, void> {
  constructor(@Inject(FLASHCARD_REPOSITORY) private readonly flashcardRepo: FlashcardRepository) {}

  async execute(command: DeleteFlashcardCommand): Promise<void> {
    const { id, actor } = command;

    const flashcard = await this.flashcardRepo.findById(id);
    if (!flashcard) {
      throw new FlashcardNotFoundError(id);
    }

    if (flashcard.userId !== actor.id && actor.role !== 'admin') {
      throw new FlashcardOwnershipMismatchError();
    }

    await this.flashcardRepo.delete(id);
  }
}
