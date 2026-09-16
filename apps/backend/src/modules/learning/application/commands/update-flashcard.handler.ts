/**
 * WHY this file exists:
 * Orchestrates the "update flashcard" use case.
 *
 * Steps:
 *   1. Load flashcard via FLASHCARD_REPOSITORY.findById. Missing → FlashcardNotFoundError.
 *   2. Ownership check: flashcard.userId !== actor.id AND actor.role !== 'admin'
 *      → FlashcardOwnershipMismatchError (403). Admins bypass for moderation.
 *   3. Apply patch via flashcard.update(). Aggregate throws FlashcardUpdateEmptyError
 *      when both fields are undefined, or FlashcardInvalidError on invariant failure.
 *      Does not touch the review schedule.
 *   4. Persist. Return FlashcardDto.
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

import { UpdateFlashcardCommand } from './update-flashcard.command';

import type { FlashcardRepository } from '../../domain/flashcard/flashcard.repository';
import type { Flashcard } from '../../domain/flashcard/flashcard';
import type { FlashcardDto } from '@app/api-client-ts';

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

@CommandHandler(UpdateFlashcardCommand)
export class UpdateFlashcardHandler implements ICommandHandler<
  UpdateFlashcardCommand,
  FlashcardDto
> {
  constructor(@Inject(FLASHCARD_REPOSITORY) private readonly flashcardRepo: FlashcardRepository) {}

  async execute(command: UpdateFlashcardCommand): Promise<FlashcardDto> {
    const { id, front, back, actor } = command;

    const flashcard = await this.flashcardRepo.findById(id);
    if (!flashcard) {
      throw new FlashcardNotFoundError(id);
    }

    if (flashcard.userId !== actor.id && actor.role !== 'admin') {
      throw new FlashcardOwnershipMismatchError();
    }

    // Build patch without undefined-valued optional keys to satisfy exactOptionalPropertyTypes.
    const patch: { front?: string; back?: string } = {};
    if (front !== undefined) patch.front = front;
    if (back !== undefined) patch.back = back;
    flashcard.update(patch);

    await this.flashcardRepo.save(flashcard);
    return toDto(flashcard);
  }
}
