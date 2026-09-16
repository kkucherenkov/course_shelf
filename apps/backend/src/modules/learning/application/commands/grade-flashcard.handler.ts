/**
 * WHY this file exists:
 * Orchestrates the "grade flashcard" use case — the SM-2 review transition.
 *
 * Steps:
 *   1. Load flashcard. Missing → FlashcardNotFoundError.
 *   2. Ownership check: flashcard.userId !== actor.id AND actor.role !== 'admin'
 *      → FlashcardOwnershipMismatchError (403).
 *   3. flashcard.grade(grade, now) validates the grade and delegates to the
 *      pure scheduleNextReview() function. `now` is read here, at the I/O
 *      boundary — the aggregate and the scheduler never read the clock
 *      themselves, which is what keeps them table-testable.
 *   4. Persist. Return FlashcardDto with the updated schedule.
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

import { GradeFlashcardCommand } from './grade-flashcard.command';

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

@CommandHandler(GradeFlashcardCommand)
export class GradeFlashcardHandler implements ICommandHandler<GradeFlashcardCommand, FlashcardDto> {
  constructor(@Inject(FLASHCARD_REPOSITORY) private readonly flashcardRepo: FlashcardRepository) {}

  async execute(command: GradeFlashcardCommand): Promise<FlashcardDto> {
    const { id, grade, actor } = command;

    const flashcard = await this.flashcardRepo.findById(id);
    if (!flashcard) {
      throw new FlashcardNotFoundError(id);
    }

    if (flashcard.userId !== actor.id && actor.role !== 'admin') {
      throw new FlashcardOwnershipMismatchError();
    }

    flashcard.grade(grade, new Date());

    await this.flashcardRepo.save(flashcard);
    return toDto(flashcard);
  }
}
