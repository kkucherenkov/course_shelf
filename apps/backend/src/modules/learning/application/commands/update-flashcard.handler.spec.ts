/**
 * Unit tests for UpdateFlashcardHandler.
 * All ports mocked — no real DB or network.
 */
import { describe, expect, it, vi } from 'vitest';

import { Flashcard } from '../../domain/flashcard/flashcard';
import {
  FlashcardNotFoundError,
  FlashcardOwnershipMismatchError,
  FlashcardUpdateEmptyError,
} from '../../domain/flashcard/flashcard.errors';

import { UpdateFlashcardCommand } from './update-flashcard.command';
import { UpdateFlashcardHandler } from './update-flashcard.handler';

import type { FlashcardRepository } from '../../domain/flashcard/flashcard.repository';

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

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

function makeHandler(repo?: FlashcardRepository) {
  const flashcardRepo = repo ?? makeRepo();
  return { handler: new UpdateFlashcardHandler(flashcardRepo), flashcardRepo };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UpdateFlashcardHandler', () => {
  describe('happy path', () => {
    it('owner updates front', async () => {
      const { handler, flashcardRepo } = makeHandler();
      const dto = await handler.execute(
        new UpdateFlashcardCommand('fc-1', 'New front?', undefined, OWNER),
      );
      expect(flashcardRepo.save).toHaveBeenCalledOnce();
      expect(dto.front).toBe('New front?');
    });

    it('owner updates back', async () => {
      const { handler } = makeHandler();
      const dto = await handler.execute(
        new UpdateFlashcardCommand('fc-1', undefined, 'New back.', OWNER),
      );
      expect(dto.back).toBe('New back.');
    });

    it('admin can update another user flashcard', async () => {
      const repo = makeRepo(makeFlashcard(OWNER.id));
      const { handler, flashcardRepo } = makeHandler(repo);
      const dto = await handler.execute(
        new UpdateFlashcardCommand('fc-1', 'Admin edit?', undefined, ADMIN),
      );
      expect(flashcardRepo.save).toHaveBeenCalledOnce();
      expect(dto.front).toBe('Admin edit?');
    });

    it('does not touch the review schedule', async () => {
      const { handler } = makeHandler();
      const dto = await handler.execute(
        new UpdateFlashcardCommand('fc-1', 'New front?', undefined, OWNER),
      );
      expect(dto.repetitions).toBe(0);
      expect(dto.intervalDays).toBe(0);
    });
  });

  describe('ownership', () => {
    it('non-owner non-admin throws FlashcardOwnershipMismatchError', async () => {
      const { handler } = makeHandler();
      await expect(
        handler.execute(new UpdateFlashcardCommand('fc-1', 'X?', undefined, OTHER)),
      ).rejects.toBeInstanceOf(FlashcardOwnershipMismatchError);
    });
  });

  describe('error cases', () => {
    it('throws FlashcardNotFoundError when flashcard is missing', async () => {
      const { handler } = makeHandler(makeRepo(null));
      await expect(
        handler.execute(new UpdateFlashcardCommand('fc-missing', 'X?', undefined, OWNER)),
      ).rejects.toBeInstanceOf(FlashcardNotFoundError);
    });

    it('throws FlashcardUpdateEmptyError when no fields provided', async () => {
      const { handler } = makeHandler();
      await expect(
        handler.execute(new UpdateFlashcardCommand('fc-1', undefined, undefined, OWNER)),
      ).rejects.toBeInstanceOf(FlashcardUpdateEmptyError);
    });
  });
});
