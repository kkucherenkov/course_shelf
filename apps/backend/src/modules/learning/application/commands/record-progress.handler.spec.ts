/**
 * Unit tests for RecordProgressHandler.
 * PrismaService and external ports are all mocked — no real DB or network.
 */
import { describe, expect, it, vi } from 'vitest';

import { PermissionDenied } from '../../../../shared/domain-error';
import { LessonCompleted } from '../../domain/progress/lesson-completed.event';
import { LessonProgress } from '../../domain/progress/lesson-progress';

import { RecordProgressCommand } from './record-progress.command';
import { RecordProgressHandler } from './record-progress.handler';

import type { AuthorizationService } from '../../../../common/access/authorization.service';
import type { CourseRepository, LessonRepository } from '../../../../common/catalog-tokens';
import type { LessonProgressRepository } from '../../domain/progress/lesson-progress.repository';
import { LessonNotFoundError } from '../../../../common/catalog-tokens';

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

const ADMIN = { id: 'user-admin', role: 'admin' };
const USER = { id: 'user-1', role: 'user' };

const LESSON = { id: 'lesson-1', courseId: 'course-1', title: 'L1', videoPath: '/v' } as never;
const COURSE = { id: 'course-1', libraryId: 'lib-1', slug: 'c1' } as never;

const T0 = new Date('2026-01-01T00:00:00.000Z');

function makeLessonRepo(lesson: unknown = LESSON): LessonRepository {
  return { findById: vi.fn().mockResolvedValue(lesson) } as unknown as LessonRepository;
}

function makeCourseRepo(course: unknown = COURSE): CourseRepository {
  return { findById: vi.fn().mockResolvedValue(course) } as unknown as CourseRepository;
}

function makeAuthz(allowed = true): AuthorizationService {
  return { canSee: vi.fn().mockResolvedValue(allowed), invalidate: vi.fn() };
}

function makeProgressRepo(existing: LessonProgress | null = null): LessonProgressRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findByUserAndLesson: vi.fn().mockResolvedValue(existing),
  };
}

function makeEventBus() {
  return { publish: vi.fn() };
}

function makeHandler(
  opts: {
    lesson?: unknown;
    course?: unknown;
    allowed?: boolean;
    existing?: LessonProgress | null;
  } = {},
) {
  const lessonRepo = makeLessonRepo('lesson' in opts ? opts.lesson : LESSON);
  const courseRepo = makeCourseRepo('course' in opts ? opts.course : COURSE);
  const authz = makeAuthz(opts.allowed ?? true);
  const progressRepo = makeProgressRepo(opts.existing ?? null);
  const eventBus = makeEventBus();

  const handler = new RecordProgressHandler(
    lessonRepo,
    courseRepo,
    authz,
    progressRepo,
    eventBus as never,
  );

  return { handler, lessonRepo, courseRepo, authz, progressRepo, eventBus };
}

function makeCommand(
  actor = ADMIN,
  positionSeconds = 50,
  durationSeconds = 100,
): RecordProgressCommand {
  return new RecordProgressCommand('lesson-1', positionSeconds, durationSeconds, T0, actor);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RecordProgressHandler', () => {
  describe('happy path — admin, below threshold', () => {
    it('saves progress and returns DTO', async () => {
      const { handler, progressRepo, eventBus } = makeHandler();
      const dto = await handler.execute(makeCommand());

      expect(progressRepo.save).toHaveBeenCalledOnce();
      expect(dto.lessonId).toBe('lesson-1');
      expect(dto.positionSeconds).toBe(50);
      expect(dto.completed).toBe(false);
      expect(eventBus.publish).not.toHaveBeenCalled();
    });
  });

  describe('threshold crossing', () => {
    it('publishes LessonCompleted exactly once when crossing 90 %', async () => {
      const { handler, eventBus } = makeHandler();
      await handler.execute(makeCommand(ADMIN, 95, 100));

      expect(eventBus.publish).toHaveBeenCalledOnce();
      const event = vi.mocked(eventBus.publish).mock.calls[0]?.[0];
      expect(event).toBeInstanceOf(LessonCompleted);
      expect((event as LessonCompleted).userId).toBe(ADMIN.id);
      expect((event as LessonCompleted).lessonId).toBe('lesson-1');
      expect((event as LessonCompleted).courseId).toBe('course-1');
    });

    it('does NOT publish LessonCompleted when below threshold', async () => {
      const { handler, eventBus } = makeHandler();
      await handler.execute(makeCommand(ADMIN, 50, 100));

      expect(eventBus.publish).not.toHaveBeenCalled();
    });
  });

  describe('upsert — existing aggregate', () => {
    it('calls record() on existing aggregate instead of start()', async () => {
      // Pre-existing at 50 % with an earlier timestamp.
      const T_earlier = new Date('2025-12-31T23:00:00.000Z');
      const { aggregate: existing } = LessonProgress.start({
        id: 'lp-existing',
        userId: USER.id,
        lessonId: 'lesson-1',
        durationSeconds: 100,
        positionSeconds: 50,
        clientUpdatedAt: T_earlier,
      });

      const { handler, progressRepo, eventBus } = makeHandler({ existing });
      const dto = await handler.execute(makeCommand(ADMIN, 60, 100));

      // repo.save was called with the mutated aggregate (60 s)
      expect(progressRepo.save).toHaveBeenCalledOnce();
      expect(dto.positionSeconds).toBe(60);
      expect(eventBus.publish).not.toHaveBeenCalled();
    });
  });

  describe('authorization', () => {
    it('non-admin with grant succeeds', async () => {
      const { handler } = makeHandler({ allowed: true });
      await expect(handler.execute(makeCommand(USER))).resolves.toBeDefined();
    });

    it('non-admin without grant throws PermissionDenied', async () => {
      const { handler } = makeHandler({ allowed: false });
      await expect(handler.execute(makeCommand(USER))).rejects.toBeInstanceOf(PermissionDenied);
    });
  });

  describe('error cases', () => {
    it('throws LessonNotFoundError when lesson is missing', async () => {
      const { handler } = makeHandler({ lesson: null });
      await expect(handler.execute(makeCommand())).rejects.toBeInstanceOf(LessonNotFoundError);
    });
  });
});
