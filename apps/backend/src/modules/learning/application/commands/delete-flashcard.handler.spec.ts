/**
 * Unit tests for DeleteFlashcardHandler.
 * All ports mocked — no real DB or network.
 */
import { describe, expect, it, vi } from 'vitest';

import { Flashcard } from '../../domain/flashcard/flashcard';
import {
  FlashcardNotFoundError,
  FlashcardOwnershipMismatchError,
} from '../../domain/flashcard/flashcard.errors';

import { DeleteFlashcardCommand } from './delete-flashcard.command';
import { DeleteFlashcardHandler } from './delete-flashcard.handler';

import type { FlashcardRepository } from '../../domain/flashcard/flashcard.repository';

const OWNER = { id: 'user-owner', role: 'user' };
const OTHER = { id: 'user-other', role: 'user' };
const ADMIN = { id: 'user-admin', role: 'admin' };

function makeFlashcard(userId = OWNER.id): Flashcard {
  return Flashcard.create({
    id: 'fc-1',
    userId,
    lessonId: 'lesson-1',
    front: 'Front?',
    back: 'Back.',
  });
}

function makeRepo(flashcard: Flashcard | null = makeFlashcard()): FlashcardRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(flashcard),
    findManyByUserAndLesson: vi.fn().mockResolvedValue([]),
    findDueByUser: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

describe('DeleteFlashcardHandler', () => {
  it('owner deletes their own flashcard', async () => {
    const repo = makeRepo();
    const handler = new DeleteFlashcardHandler(repo);
    await handler.execute(new DeleteFlashcardCommand('fc-1', OWNER));
    expect(repo.delete).toHaveBeenCalledWith('fc-1');
  });

  it('admin can delete another user flashcard', async () => {
    const repo = makeRepo(makeFlashcard(OWNER.id));
    const handler = new DeleteFlashcardHandler(repo);
    await handler.execute(new DeleteFlashcardCommand('fc-1', ADMIN));
    expect(repo.delete).toHaveBeenCalledWith('fc-1');
  });

  it('non-owner non-admin throws FlashcardOwnershipMismatchError, does not delete', async () => {
    const repo = makeRepo();
    const handler = new DeleteFlashcardHandler(repo);
    await expect(handler.execute(new DeleteFlashcardCommand('fc-1', OTHER))).rejects.toBeInstanceOf(
      FlashcardOwnershipMismatchError,
    );
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('throws FlashcardNotFoundError when flashcard is missing', async () => {
    const repo = makeRepo(null);
    const handler = new DeleteFlashcardHandler(repo);
    await expect(
      handler.execute(new DeleteFlashcardCommand('fc-missing', OWNER)),
    ).rejects.toBeInstanceOf(FlashcardNotFoundError);
  });
});
