/**
 * WHY this file exists:
 * Orchestrates the "review queue" use case — due-card selection as a plain
 * read, not a background job. No lesson/course lookup, no canSee check:
 * the repository call is already scoped to the actor's own cards, and a
 * card is only ever created after its lesson access was checked once, at
 * creation time (see CreateFlashcardHandler).
 *
 * Returns FlashcardRepository.findDueByUser(actor.id, now, limit) mapped to
 * FlashcardDto[]. Repo guarantees dueAt ASC ordering (most overdue first).
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { FLASHCARD_REPOSITORY } from '../../domain/flashcard/flashcard.repository';

import { ListDueFlashcardsQuery } from './list-due-flashcards.query';

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

@QueryHandler(ListDueFlashcardsQuery)
export class ListDueFlashcardsHandler implements IQueryHandler<
  ListDueFlashcardsQuery,
  FlashcardListDto
> {
  constructor(@Inject(FLASHCARD_REPOSITORY) private readonly flashcardRepo: FlashcardRepository) {}

  async execute(query: ListDueFlashcardsQuery): Promise<FlashcardListDto> {
    const { actor, limit } = query;

    const due = await this.flashcardRepo.findDueByUser(actor.id, new Date(), limit);
    return { items: due.map((fc) => toDto(fc)) };
  }
}
