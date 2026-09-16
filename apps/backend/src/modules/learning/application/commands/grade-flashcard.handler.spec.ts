/**
 * Unit tests for GradeFlashcardHandler.
 * All ports mocked — no real DB or network.
 */
import { describe, expect, it, vi } from 'vitest';

import { Flashcard } from '../../domain/flashcard/flashcard';
import {
  FlashcardInvalidError,
  FlashcardNotFoundError,
  FlashcardOwnershipMismatchError,
} from '../../domain/flashcard/flashcard.errors';

import { GradeFlashcardCommand } from './grade-flashcard.command';
import { GradeFlashcardHandler } from './grade-flashcard.handler';

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

describe('GradeFlashcardHandler', () => {
  describe('happy path', () => {
    it('advances the schedule for a passing grade and persists it', async () => {
      const repo = makeRepo();
      const handler = new GradeFlashcardHandler(repo);

      const dto = await handler.execute(new GradeFlashcardCommand('fc-1', 5, OWNER));

      expect(repo.save).toHaveBeenCalledOnce();
      expect(dto.repetitions).toBe(1);
      expect(dto.intervalDays).toBe(1);
      expect(dto.easeFactor).toBeCloseTo(2.6, 10);
    });

    it('resets the streak on a lapse grade', async () => {
      const flashcard = makeFlashcard();
      flashcard.grade(5, new Date('2026-01-01T00:00:00Z'));
      const repo = makeRepo(flashcard);
      const handler = new GradeFlashcardHandler(repo);

      const dto = await handler.execute(new GradeFlashcardCommand('fc-1', 1, OWNER));

      expect(dto.repetitions).toBe(0);
      expect(dto.intervalDays).toBe(1);
    });

    it('admin can grade another user flashcard', async () => {
      const repo = makeRepo(makeFlashcard(OWNER.id));
      const handler = new GradeFlashcardHandler(repo);

      const dto = await handler.execute(new GradeFlashcardCommand('fc-1', 4, ADMIN));
      expect(dto.repetitions).toBe(1);
    });
  });

  describe('ownership', () => {
    it('non-owner non-admin throws FlashcardOwnershipMismatchError', async () => {
      const repo = makeRepo();
      const handler = new GradeFlashcardHandler(repo);
      await expect(
        handler.execute(new GradeFlashcardCommand('fc-1', 5, OTHER)),
      ).rejects.toBeInstanceOf(FlashcardOwnershipMismatchError);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('error cases', () => {
    it('throws FlashcardNotFoundError when flashcard is missing', async () => {
      const repo = makeRepo(null);
      const handler = new GradeFlashcardHandler(repo);
      await expect(
        handler.execute(new GradeFlashcardCommand('fc-missing', 5, OWNER)),
      ).rejects.toBeInstanceOf(FlashcardNotFoundError);
    });

    it('throws FlashcardInvalidError for a grade outside 0..5', async () => {
      const repo = makeRepo();
      const handler = new GradeFlashcardHandler(repo);
      await expect(
        handler.execute(new GradeFlashcardCommand('fc-1', 9, OWNER)),
      ).rejects.toBeInstanceOf(FlashcardInvalidError);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });
});
