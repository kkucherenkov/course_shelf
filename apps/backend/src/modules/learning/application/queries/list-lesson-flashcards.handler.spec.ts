/**
 * Unit tests for ListLessonFlashcardsHandler.
 * All ports mocked — no real DB or network.
 */
import { describe, expect, it, vi } from 'vitest';

import { PermissionDenied } from '../../../../shared/domain-error';
import { LessonNotFoundError } from '../../../../common/catalog-tokens';
import { Flashcard } from '../../domain/flashcard/flashcard';

import { ListLessonFlashcardsHandler } from './list-lesson-flashcards.handler';
import { ListLessonFlashcardsQuery } from './list-lesson-flashcards.query';

import type { AuthorizationService } from '../../../../common/access/authorization.service';
import type { CourseRepository, LessonRepository } from '../../../../common/catalog-tokens';
import type { FlashcardRepository } from '../../domain/flashcard/flashcard.repository';

const ADMIN = { id: 'user-admin', role: 'admin' };
const USER = { id: 'user-1', role: 'user' };

const LESSON = { id: 'lesson-1', courseId: 'course-1', title: 'L1', videoPath: '/v' } as never;
const COURSE = { id: 'course-1', libraryId: 'lib-1', slug: 'c1' } as never;

function makeLessonRepo(lesson: unknown = LESSON): LessonRepository {
  return { findById: vi.fn().mockResolvedValue(lesson) } as unknown as LessonRepository;
}

function makeCourseRepo(course: unknown = COURSE): CourseRepository {
  return { findById: vi.fn().mockResolvedValue(course) } as unknown as CourseRepository;
}

function makeAuthz(allowed = true): AuthorizationService {
  return {
    canSee: vi.fn().mockResolvedValue(allowed),
    invalidate: vi.fn(),
    listAccessibleLibraryIds: vi.fn().mockResolvedValue(null),
  };
}

function makeFlashcardRepo(flashcards: Flashcard[] = []): FlashcardRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findManyByUserAndLesson: vi.fn().mockResolvedValue(flashcards),
    findDueByUser: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

function makeHandler(
  opts: {
    lesson?: unknown;
    course?: unknown;
    allowed?: boolean;
    flashcardRepo?: FlashcardRepository;
  } = {},
) {
  const lessonRepo = makeLessonRepo('lesson' in opts ? opts.lesson : LESSON);
  const courseRepo = makeCourseRepo('course' in opts ? opts.course : COURSE);
  const authz = makeAuthz(opts.allowed ?? true);
  const flashcardRepo = opts.flashcardRepo ?? makeFlashcardRepo();
  return {
    handler: new ListLessonFlashcardsHandler(lessonRepo, courseRepo, authz, flashcardRepo),
    flashcardRepo,
  };
}

describe('ListLessonFlashcardsHandler', () => {
  it('returns an empty list when the user has no cards for the lesson', async () => {
    const { handler } = makeHandler();
    const dto = await handler.execute(new ListLessonFlashcardsQuery('lesson-1', ADMIN));
    expect(dto.items).toEqual([]);
  });

  it('maps repository results to DTOs, preserving repository order', async () => {
    const a = Flashcard.create({
      id: 'fc-a',
      userId: 'u',
      lessonId: 'lesson-1',
      front: 'A?',
      back: 'a',
    });
    const b = Flashcard.create({
      id: 'fc-b',
      userId: 'u',
      lessonId: 'lesson-1',
      front: 'B?',
      back: 'b',
    });
    const { handler } = makeHandler({ flashcardRepo: makeFlashcardRepo([a, b]) });

    const dto = await handler.execute(new ListLessonFlashcardsQuery('lesson-1', ADMIN));

    expect(dto.items.map((i) => i.id)).toEqual(['fc-a', 'fc-b']);
  });

  it('scopes the repository call to (actor.id, lessonId)', async () => {
    const { handler, flashcardRepo } = makeHandler();
    await handler.execute(new ListLessonFlashcardsQuery('lesson-1', USER));
    expect(flashcardRepo.findManyByUserAndLesson).toHaveBeenCalledWith(USER.id, 'lesson-1');
  });

  describe('authorization', () => {
    it('non-admin without grant throws PermissionDenied', async () => {
      const { handler } = makeHandler({ allowed: false });
      await expect(
        handler.execute(new ListLessonFlashcardsQuery('lesson-1', USER)),
      ).rejects.toBeInstanceOf(PermissionDenied);
    });
  });

  describe('error cases', () => {
    it('throws LessonNotFoundError when lesson is missing', async () => {
      const { handler } = makeHandler({ lesson: null });
      await expect(
        handler.execute(new ListLessonFlashcardsQuery('lesson-1', ADMIN)),
      ).rejects.toBeInstanceOf(LessonNotFoundError);
    });

    it('throws LessonNotFoundError when parent course is missing (orphan lesson)', async () => {
      const { handler } = makeHandler({ course: null });
      await expect(
        handler.execute(new ListLessonFlashcardsQuery('lesson-1', ADMIN)),
      ).rejects.toBeInstanceOf(LessonNotFoundError);
    });
  });
});
