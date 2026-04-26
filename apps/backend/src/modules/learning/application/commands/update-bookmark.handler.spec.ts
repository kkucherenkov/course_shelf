/**
 * Unit tests for UpdateBookmarkHandler.
 * All ports mocked — no real DB or network.
 */
import { describe, expect, it, vi } from 'vitest';

import { Bookmark } from '../../domain/bookmark/bookmark';
import {
  BookmarkNotFoundError,
  BookmarkOwnershipMismatchError,
  BookmarkUpdateEmptyError,
} from '../../domain/bookmark/bookmark.errors';

import { UpdateBookmarkCommand } from './update-bookmark.command';
import { UpdateBookmarkHandler } from './update-bookmark.handler';

import type { BookmarkRepository } from '../../domain/bookmark/bookmark.repository';

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

const OWNER = { id: 'user-owner', role: 'user' };
const OTHER = { id: 'user-other', role: 'user' };
const ADMIN = { id: 'user-admin', role: 'admin' };

function makeBookmark(
  overrides: Partial<{
    userId: string;
    positionSeconds: number;
    label: string;
  }> = {},
): Bookmark {
  return Bookmark.create({
    id: 'bm-1',
    userId: overrides.userId ?? OWNER.id,
    lessonId: 'lesson-1',
    positionSeconds: overrides.positionSeconds ?? 30,
    ...(overrides.label === undefined ? {} : { label: overrides.label }),
  });
}

function makeRepo(bookmark: Bookmark | null = makeBookmark()): BookmarkRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(bookmark),
    findManyByUserAndLesson: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

function makeHandler(repo?: BookmarkRepository) {
  const bookmarkRepo = repo ?? makeRepo();
  return { handler: new UpdateBookmarkHandler(bookmarkRepo), bookmarkRepo };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UpdateBookmarkHandler', () => {
  describe('happy path', () => {
    it('owner bumps positionSeconds', async () => {
      const { handler, bookmarkRepo } = makeHandler();
      const dto = await handler.execute(new UpdateBookmarkCommand('bm-1', 60, undefined, OWNER));
      expect(bookmarkRepo.save).toHaveBeenCalledOnce();
      expect(dto.positionSeconds).toBe(60);
    });

    it('owner clears label via null', async () => {
      const repo = makeRepo(makeBookmark({ label: 'existing' }));
      const { handler } = makeHandler(repo);
      const dto = await handler.execute(new UpdateBookmarkCommand('bm-1', undefined, null, OWNER));
      expect(dto.label).toBeUndefined();
    });

    it('admin can update another user bookmark', async () => {
      const repo = makeRepo(makeBookmark({ userId: OWNER.id }));
      const { handler, bookmarkRepo } = makeHandler(repo);
      const dto = await handler.execute(new UpdateBookmarkCommand('bm-1', 99, undefined, ADMIN));
      expect(bookmarkRepo.save).toHaveBeenCalledOnce();
      expect(dto.positionSeconds).toBe(99);
    });

    it('returned DTO contains updatedAt ISO string', async () => {
      const { handler } = makeHandler();
      const dto = await handler.execute(new UpdateBookmarkCommand('bm-1', 50, undefined, OWNER));
      expect(dto.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('ownership', () => {
    it('non-owner non-admin throws BookmarkOwnershipMismatchError', async () => {
      const { handler } = makeHandler();
      await expect(
        handler.execute(new UpdateBookmarkCommand('bm-1', 50, undefined, OTHER)),
      ).rejects.toBeInstanceOf(BookmarkOwnershipMismatchError);
    });
  });

  describe('error cases', () => {
    it('throws BookmarkNotFoundError when bookmark is missing', async () => {
      const { handler } = makeHandler(makeRepo(null));
      await expect(
        handler.execute(new UpdateBookmarkCommand('bm-missing', 50, undefined, OWNER)),
      ).rejects.toBeInstanceOf(BookmarkNotFoundError);
    });

    it('throws BookmarkUpdateEmptyError when no fields provided', async () => {
      const { handler } = makeHandler();
      await expect(
        // Both positionSeconds and label are undefined → empty patch
        handler.execute(new UpdateBookmarkCommand('bm-1', undefined, undefined, OWNER)),
      ).rejects.toBeInstanceOf(BookmarkUpdateEmptyError);
    });
  });
});
