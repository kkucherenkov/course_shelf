/**
 * Unit tests for GetLessonProgressHandler.
 */
import { describe, expect, it, vi } from 'vitest';

import { PermissionDenied } from '../../../../shared/domain-error';
import { LessonProgressNotFoundError } from '../../domain/progress/lesson-progress.errors';
import { LessonProgress } from '../../domain/progress/lesson-progress';

import { GetLessonProgressQuery } from './get-lesson-progress.query';
import { GetLessonProgressHandler } from './get-lesson-progress.handler';

import type { AuthorizationService } from '../../../../common/access/authorization.service';
import type { CourseRepository, LessonRepository } from '../../../../common/catalog-tokens';
import type { LessonProgressRepository } from '../../domain/progress/lesson-progress.repository';

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

const USER = { id: 'user-1', role: 'user' };

const LESSON = { id: 'lesson-1', courseId: 'course-1' } as never;
const COURSE = { id: 'course-1', libraryId: 'lib-1' } as never;

const T0 = new Date('2026-01-01T00:00:00.000Z');

function makeProgress(): LessonProgress {
  return LessonProgress.start({
    id: 'lp-1',
    userId: USER.id,
    lessonId: 'lesson-1',
    durationSeconds: 100,
    positionSeconds: 50,
    clientUpdatedAt: T0,
  }).aggregate;
}

function makeHandler(opts: {
  lesson?: unknown;
  course?: unknown;
  allowed?: boolean;
  progress?: LessonProgress | null;
}) {
  const lessonRepo = {
    findById: vi.fn().mockResolvedValue('lesson' in opts ? opts.lesson : LESSON),
  } as unknown as LessonRepository;

  const courseRepo = {
    findById: vi.fn().mockResolvedValue('course' in opts ? opts.course : COURSE),
  } as unknown as CourseRepository;

  const authz: AuthorizationService = {
    canSee: vi.fn().mockResolvedValue(opts.allowed ?? true),
    invalidate: vi.fn(),
  };

  const progressRepo: LessonProgressRepository = {
    save: vi.fn(),
    findByUserAndLesson: vi.fn().mockResolvedValue(opts.progress ?? null),
  };

  const handler = new GetLessonProgressHandler(lessonRepo, courseRepo, authz, progressRepo);
  return { handler, lessonRepo, courseRepo, authz, progressRepo };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GetLessonProgressHandler', () => {
  describe('happy path', () => {
    it('returns LessonProgressDto when progress exists and actor has grant', async () => {
      const progress = makeProgress();
      const { handler } = makeHandler({ progress, allowed: true });
      const dto = await handler.execute(new GetLessonProgressQuery('lesson-1', USER));

      expect(dto.lessonId).toBe('lesson-1');
      expect(dto.positionSeconds).toBe(50);
      expect(dto.completed).toBe(false);
    });
  });

  describe('absent progress', () => {
    it('throws LessonProgressNotFoundError when progress absent but actor has grant', async () => {
      const { handler } = makeHandler({ progress: null, allowed: true });
      await expect(
        handler.execute(new GetLessonProgressQuery('lesson-1', USER)),
      ).rejects.toBeInstanceOf(LessonProgressNotFoundError);
    });
  });

  describe('no oracle rule', () => {
    it('throws PermissionDenied when lesson is missing (not 404)', async () => {
      const { handler } = makeHandler({ lesson: null });
      await expect(
        handler.execute(new GetLessonProgressQuery('lesson-1', USER)),
      ).rejects.toBeInstanceOf(PermissionDenied);
    });

    it('throws PermissionDenied when progress absent and actor has no grant', async () => {
      const { handler } = makeHandler({ progress: null, allowed: false });
      await expect(
        handler.execute(new GetLessonProgressQuery('lesson-1', USER)),
      ).rejects.toBeInstanceOf(PermissionDenied);
    });
  });
});
