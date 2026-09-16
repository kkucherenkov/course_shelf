/**
 * Unit tests for ListDueFlashcardsHandler.
 * All ports mocked — no real DB or network.
 */
import { describe, expect, it, vi } from 'vitest';

import { Flashcard } from '../../domain/flashcard/flashcard';

import { ListDueFlashcardsHandler } from './list-due-flashcards.handler';
import { ListDueFlashcardsQuery } from './list-due-flashcards.query';

import type { FlashcardRepository } from '../../domain/flashcard/flashcard.repository';

const USER = { id: 'user-1', role: 'user' };
const OTHER = { id: 'user-2', role: 'user' };

function makeFlashcard(id: string, userId = USER.id): Flashcard {
  return Flashcard.create({ id, userId, lessonId: 'lesson-1', front: 'Q?', back: 'A.' });
}

function makeFlashcardRepo(due: Flashcard[] = []): FlashcardRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findManyByUserAndLesson: vi.fn().mockResolvedValue([]),
    findDueByUser: vi.fn().mockResolvedValue(due),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

describe('ListDueFlashcardsHandler', () => {
  it('returns an empty list when nothing is due', async () => {
    const repo = makeFlashcardRepo([]);
    const handler = new ListDueFlashcardsHandler(repo);

    const dto = await handler.execute(new ListDueFlashcardsQuery(USER, 20));
    expect(dto.items).toEqual([]);
  });

  it("maps due cards to DTOs, preserving the repository's dueAt-ascending order", async () => {
    const overdue = makeFlashcard('fc-overdue');
    const dueSoon = makeFlashcard('fc-due-soon');
    const repo = makeFlashcardRepo([overdue, dueSoon]);
    const handler = new ListDueFlashcardsHandler(repo);

    const dto = await handler.execute(new ListDueFlashcardsQuery(USER, 20));

    expect(dto.items.map((i) => i.id)).toEqual(['fc-overdue', 'fc-due-soon']);
  });

  it("scopes the query to the calling actor — never crosses into another user's queue", async () => {
    const repo = makeFlashcardRepo();
    const handler = new ListDueFlashcardsHandler(repo);

    await handler.execute(new ListDueFlashcardsQuery(USER, 20));

    const [userId] = vi.mocked(repo.findDueByUser).mock.calls[0] ?? [];
    expect(userId).toBe(USER.id);
    expect(userId).not.toBe(OTHER.id);
  });

  it('forwards the limit to the repository', async () => {
    const repo = makeFlashcardRepo();
    const handler = new ListDueFlashcardsHandler(repo);

    await handler.execute(new ListDueFlashcardsQuery(USER, 5));

    const call = vi.mocked(repo.findDueByUser).mock.calls[0];
    expect(call?.[2]).toBe(5);
  });
});
