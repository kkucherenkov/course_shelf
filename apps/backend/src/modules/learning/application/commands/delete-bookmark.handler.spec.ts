/**
 * Unit tests for DeleteBookmarkHandler.
 * All ports mocked — no real DB or network.
 */
import { describe, expect, it, vi } from 'vitest';

import { Bookmark } from '../../domain/bookmark/bookmark';
import {
  BookmarkNotFoundError,
  BookmarkOwnershipMismatchError,
} from '../../domain/bookmark/bookmark.errors';

import { DeleteBookmarkCommand } from './delete-bookmark.command';
import { DeleteBookmarkHandler } from './delete-bookmark.handler';

import type { BookmarkRepository } from '../../domain/bookmark/bookmark.repository';

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

const OWNER = { id: 'user-owner', role: 'user' };
const OTHER = { id: 'user-other', role: 'user' };
const ADMIN = { id: 'user-admin', role: 'admin' };

function makeBookmark(userId = OWNER.id): Bookmark {
  return Bookmark.create({
    id: 'bm-1',
    userId,
    lessonId: 'lesson-1',
    positionSeconds: 30,
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
  return { handler: new DeleteBookmarkHandler(bookmarkRepo), bookmarkRepo };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DeleteBookmarkHandler', () => {
  describe('happy path', () => {
    it('owner deletes their bookmark', async () => {
      const { handler, bookmarkRepo } = makeHandler();
      await handler.execute(new DeleteBookmarkCommand('bm-1', OWNER));
      expect(bookmarkRepo.delete).toHaveBeenCalledWith('bm-1');
    });

    it('admin deletes another user bookmark', async () => {
      const repo = makeRepo(makeBookmark(OWNER.id));
      const { handler, bookmarkRepo } = makeHandler(repo);
      await handler.execute(new DeleteBookmarkCommand('bm-1', ADMIN));
      expect(bookmarkRepo.delete).toHaveBeenCalledWith('bm-1');
    });
  });

  describe('ownership', () => {
    it('non-owner non-admin throws BookmarkOwnershipMismatchError', async () => {
      const { handler } = makeHandler();
      await expect(
        handler.execute(new DeleteBookmarkCommand('bm-1', OTHER)),
      ).rejects.toBeInstanceOf(BookmarkOwnershipMismatchError);
    });
  });

  describe('error cases', () => {
    it('throws BookmarkNotFoundError when bookmark is missing', async () => {
      const { handler } = makeHandler(makeRepo(null));
      await expect(
        handler.execute(new DeleteBookmarkCommand('bm-missing', OWNER)),
      ).rejects.toBeInstanceOf(BookmarkNotFoundError);
    });
  });
});
