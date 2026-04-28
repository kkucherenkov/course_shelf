/**
 * Unit tests for IssueStreamTokenHandler.
 *
 * Scenarios:
 *   1. Admin actor → happy path → returns StreamUrlDto with URL + token + expiresAt.
 *   2. Non-admin actor with grant → happy path.
 *   3. Non-admin actor without grant → PermissionDenied.
 *   4. Missing lesson → LessonNotFoundError.
 *   5. Missing parent course (defensive) → LessonNotFoundError.
 *   6. Returned URL contains the lesson id and the encoded token.
 *   7. expiresAt > now.
 *   8. Signer is called with actor.id, lesson.id, and configured ttlSeconds.
 *
 * Domain entities (Lesson, Course) are represented as plain objects in this
 * test. The handler only reads `lesson.id`, `lesson.courseId`, and
 * `course.libraryId`, so we do not need the real aggregate classes — avoiding
 * cross-module source-file imports (boundaries rule).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppConfig } from '../../../../common/config/app-config';
import { LessonNotFoundError } from '../../../../common/catalog-tokens';
import { PermissionDenied } from '../../../../shared/domain-error';
import { StreamTokenSigner } from '../../domain/stream-token/stream-token-signer';
import { IssueStreamTokenQuery } from './issue-stream-token.query';
import { IssueStreamTokenHandler } from './issue-stream-token.handler';

import type { AuthorizationService } from '../../../../common/access/authorization.service';
import type { CourseRepository, LessonRepository } from '../../../../common/catalog-tokens';

type FakeLesson = Awaited<ReturnType<LessonRepository['findById']>>;
type FakeCourse = Awaited<ReturnType<CourseRepository['findById']>>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeLessonRepo(): LessonRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findByCourse: vi.fn(),
    findBySection: vi.fn(),
    getLessonStatsByCourseIds: vi.fn(),
  };
}

function makeCourseRepo(): CourseRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findManyByLibrary: vi.fn(),
    findAll: vi.fn(),
    findByIds: vi.fn(),
    findRecentlyAdded: vi.fn(),
  };
}

function makeAuthz(allow: boolean): AuthorizationService {
  return {
    canSee: vi.fn().mockResolvedValue(allow),
    invalidate: vi.fn(),
  };
}

/** Minimal plain object that satisfies the fields the handler reads. */
function makeFakeLesson(id = 'lesson-1', courseId = 'course-1'): FakeLesson {
  return { id, courseId } as unknown as FakeLesson;
}

/** Minimal plain object that satisfies the fields the handler reads. */
function makeFakeCourse(id = 'course-1', libraryId = 'lib-1'): FakeCourse {
  return { id, libraryId } as unknown as FakeCourse;
}

function makeSigner(): StreamTokenSigner {
  const config = {
    streaming: {
      secret: 'test-secret',
      hkdfInfo: 'courseshelf:stream-token:v1',
      ttlSeconds: 900,
    },
  } as unknown as AppConfig;
  return new StreamTokenSigner(config);
}

function makeAppConfig(ttlSeconds = 900): AppConfig {
  return {
    streaming: { ttlSeconds },
  } as unknown as AppConfig;
}

function makeHandler(
  lessonRepo: LessonRepository,
  courseRepo: CourseRepository,
  authz: AuthorizationService,
  signer?: StreamTokenSigner,
  appConfig?: AppConfig,
): IssueStreamTokenHandler {
  return new IssueStreamTokenHandler(
    lessonRepo,
    courseRepo,
    authz,
    signer ?? makeSigner(),
    appConfig ?? makeAppConfig(),
  );
}

const adminActor = { id: 'admin-1', role: 'admin' };
const userActor = { id: 'user-1', role: 'user' };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('IssueStreamTokenHandler', () => {
  let lessonRepo: LessonRepository;
  let courseRepo: CourseRepository;

  // -------------------------------------------------------------------------
  // Admin happy path
  // -------------------------------------------------------------------------
  describe('admin actor', () => {
    beforeEach(() => {
      lessonRepo = makeLessonRepo();
      courseRepo = makeCourseRepo();
      vi.mocked(lessonRepo.findById).mockResolvedValue(makeFakeLesson());
      vi.mocked(courseRepo.findById).mockResolvedValue(makeFakeCourse());
    });

    it('returns StreamUrlDto with url, token, and expiresAt', async () => {
      const handler = makeHandler(lessonRepo, courseRepo, makeAuthz(true));

      const result = await handler.execute(new IssueStreamTokenQuery('lesson-1', adminActor));

      expect(typeof result.url).toBe('string');
      expect(typeof result.token).toBe('string');
      expect(typeof result.expiresAt).toBe('string');
    });

    it('returned URL contains the lesson id', async () => {
      const handler = makeHandler(lessonRepo, courseRepo, makeAuthz(true));

      const result = await handler.execute(new IssueStreamTokenQuery('lesson-1', adminActor));

      expect(result.url).toContain('lesson-1');
    });

    it('returned URL contains the encoded token', async () => {
      const handler = makeHandler(lessonRepo, courseRepo, makeAuthz(true));

      const result = await handler.execute(new IssueStreamTokenQuery('lesson-1', adminActor));

      expect(result.url).toContain(encodeURIComponent(result.token));
    });

    it('expiresAt is in the future', async () => {
      const handler = makeHandler(lessonRepo, courseRepo, makeAuthz(true));

      const result = await handler.execute(new IssueStreamTokenQuery('lesson-1', adminActor));

      expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });
  });

  // -------------------------------------------------------------------------
  // Non-admin with grant
  // -------------------------------------------------------------------------
  describe('non-admin actor with grant', () => {
    it('returns StreamUrlDto', async () => {
      lessonRepo = makeLessonRepo();
      courseRepo = makeCourseRepo();
      vi.mocked(lessonRepo.findById).mockResolvedValue(makeFakeLesson());
      vi.mocked(courseRepo.findById).mockResolvedValue(makeFakeCourse());
      const handler = makeHandler(lessonRepo, courseRepo, makeAuthz(true));

      const result = await handler.execute(new IssueStreamTokenQuery('lesson-1', userActor));

      expect(result.url).toContain('lesson-1');
    });
  });

  // -------------------------------------------------------------------------
  // Non-admin without grant
  // -------------------------------------------------------------------------
  describe('non-admin actor without grant', () => {
    it('throws PermissionDenied', async () => {
      lessonRepo = makeLessonRepo();
      courseRepo = makeCourseRepo();
      vi.mocked(lessonRepo.findById).mockResolvedValue(makeFakeLesson());
      vi.mocked(courseRepo.findById).mockResolvedValue(makeFakeCourse());
      const handler = makeHandler(lessonRepo, courseRepo, makeAuthz(false));

      await expect(
        handler.execute(new IssueStreamTokenQuery('lesson-1', userActor)),
      ).rejects.toBeInstanceOf(PermissionDenied);
    });
  });

  // -------------------------------------------------------------------------
  // Missing lesson
  // -------------------------------------------------------------------------
  describe('missing lesson', () => {
    it('throws LessonNotFoundError', async () => {
      lessonRepo = makeLessonRepo();
      courseRepo = makeCourseRepo();
      vi.mocked(lessonRepo.findById).mockResolvedValue(null);
      const handler = makeHandler(lessonRepo, courseRepo, makeAuthz(true));

      await expect(
        handler.execute(new IssueStreamTokenQuery('missing-lesson', adminActor)),
      ).rejects.toBeInstanceOf(LessonNotFoundError);
    });
  });

  // -------------------------------------------------------------------------
  // Missing parent course (defensive)
  // -------------------------------------------------------------------------
  describe('missing parent course', () => {
    it('throws LessonNotFoundError when parent course is absent', async () => {
      lessonRepo = makeLessonRepo();
      courseRepo = makeCourseRepo();
      vi.mocked(lessonRepo.findById).mockResolvedValue(makeFakeLesson());
      vi.mocked(courseRepo.findById).mockResolvedValue(null);
      const handler = makeHandler(lessonRepo, courseRepo, makeAuthz(true));

      await expect(
        handler.execute(new IssueStreamTokenQuery('lesson-1', adminActor)),
      ).rejects.toBeInstanceOf(LessonNotFoundError);
    });
  });

  // -------------------------------------------------------------------------
  // Signer is called with the expected args
  // -------------------------------------------------------------------------
  describe('signer call assertions', () => {
    it('calls signer.sign with actor.id, lesson.id, and configured ttlSeconds', async () => {
      lessonRepo = makeLessonRepo();
      courseRepo = makeCourseRepo();
      vi.mocked(lessonRepo.findById).mockResolvedValue(makeFakeLesson());
      vi.mocked(courseRepo.findById).mockResolvedValue(makeFakeCourse());

      const signer = makeSigner();
      const signSpy = vi.spyOn(signer, 'sign');
      const handler = makeHandler(
        lessonRepo,
        courseRepo,
        makeAuthz(true),
        signer,
        makeAppConfig(600),
      );

      await handler.execute(new IssueStreamTokenQuery('lesson-1', adminActor));

      expect(signSpy).toHaveBeenCalledOnce();
      expect(signSpy).toHaveBeenCalledWith({
        userId: adminActor.id,
        lessonId: 'lesson-1',
        ttlSeconds: 600,
      });
    });
  });
});
