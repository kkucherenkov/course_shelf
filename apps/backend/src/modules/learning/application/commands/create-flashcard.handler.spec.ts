/**
 * Unit tests for CreateFlashcardHandler.
 * All ports mocked — no real DB or network.
 */
import { describe, expect, it, vi } from 'vitest';

import { PermissionDenied } from '../../../../shared/domain-error';
import { LessonNotFoundError } from '../../../../common/catalog-tokens';
import { FlashcardSourceCueInvalidError } from '../../domain/flashcard/flashcard.errors';

import { CreateFlashcardCommand } from './create-flashcard.command';
import { CreateFlashcardHandler } from './create-flashcard.handler';

import type { AuthorizationService } from '../../../../common/access/authorization.service';
import type {
  CourseRepository,
  LessonRepository,
  TranscriptRepository,
} from '../../../../common/catalog-tokens';
import type { FlashcardRepository } from '../../domain/flashcard/flashcard.repository';

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

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

function makeFlashcardRepo(): FlashcardRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findManyByUserAndLesson: vi.fn().mockResolvedValue([]),
    findDueByUser: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

function makeTranscriptRepo(cueBelongs = true): TranscriptRepository {
  return {
    findGeneratedForLessons: vi.fn(),
    findAnyGeneratedForLessons: vi.fn(),
    replaceGenerated: vi.fn(),
    findExisting: vi.fn(),
    replaceSidecar: vi.fn(),
    deleteForLesson: vi.fn(),
    findGeneratedByLanguage: vi.fn(),
    reclassifyGenerated: vi.fn(),
    findCuesForLesson: vi.fn(),
    cueBelongsToLesson: vi.fn().mockResolvedValue(cueBelongs),
  } as unknown as TranscriptRepository;
}

function makeHandler(
  opts: {
    lesson?: unknown;
    course?: unknown;
    allowed?: boolean;
    flashcardRepo?: FlashcardRepository;
    transcripts?: TranscriptRepository;
  } = {},
) {
  const lessonRepo = makeLessonRepo('lesson' in opts ? opts.lesson : LESSON);
  const courseRepo = makeCourseRepo('course' in opts ? opts.course : COURSE);
  const authz = makeAuthz(opts.allowed ?? true);
  const flashcardRepo = opts.flashcardRepo ?? makeFlashcardRepo();
  const transcripts = opts.transcripts ?? makeTranscriptRepo();

  const handler = new CreateFlashcardHandler(
    lessonRepo,
    courseRepo,
    authz,
    flashcardRepo,
    transcripts,
  );
  return { handler, lessonRepo, courseRepo, authz, flashcardRepo, transcripts };
}

function makeCommand(actor = ADMIN, sourceCueId?: string): CreateFlashcardCommand {
  return new CreateFlashcardCommand('lesson-1', 'Front?', 'Back.', sourceCueId, actor);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CreateFlashcardHandler', () => {
  describe('happy path', () => {
    it('creates a flashcard and returns its DTO', async () => {
      const { handler, flashcardRepo } = makeHandler();
      const dto = await handler.execute(makeCommand());

      expect(flashcardRepo.save).toHaveBeenCalledOnce();
      expect(dto.lessonId).toBe('lesson-1');
      expect(dto.front).toBe('Front?');
      expect(dto.back).toBe('Back.');
    });

    it('stamps actor.id as userId', async () => {
      const { handler, flashcardRepo } = makeHandler();
      await handler.execute(makeCommand(USER));

      const saved = vi.mocked(flashcardRepo.save).mock.calls[0]?.[0];
      expect(saved?.userId).toBe(USER.id);
    });

    it('is due immediately, with the initial SM-2 schedule', async () => {
      const { handler } = makeHandler();
      const dto = await handler.execute(makeCommand());

      expect(dto.repetitions).toBe(0);
      expect(dto.intervalDays).toBe(0);
      expect(dto.easeFactor).toBe(2.5);
    });

    it('persists sourceCueId when it belongs to this lesson', async () => {
      const { handler, flashcardRepo, transcripts } = makeHandler();
      await handler.execute(makeCommand(ADMIN, 'cue-1'));

      expect(transcripts.cueBelongsToLesson).toHaveBeenCalledWith('cue-1', 'lesson-1');
      const saved = vi.mocked(flashcardRepo.save).mock.calls[0]?.[0];
      expect(saved?.sourceCueId).toBe('cue-1');
    });

    it('does not check cue ownership when sourceCueId is omitted', async () => {
      const { handler, transcripts } = makeHandler();
      await handler.execute(makeCommand());

      expect(transcripts.cueBelongsToLesson).not.toHaveBeenCalled();
    });

    it('omits sourceCueId from the DTO when not provided (manual creation)', async () => {
      const { handler } = makeHandler();
      const dto = await handler.execute(makeCommand());

      expect(dto.sourceCueId).toBeUndefined();
    });
  });

  describe('authorization', () => {
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

    it('throws LessonNotFoundError when parent course is missing (orphan lesson)', async () => {
      const { handler } = makeHandler({ course: null });
      await expect(handler.execute(makeCommand())).rejects.toBeInstanceOf(LessonNotFoundError);
    });

    it('throws FlashcardSourceCueInvalidError when sourceCueId belongs to another lesson', async () => {
      const { handler, flashcardRepo } = makeHandler({ transcripts: makeTranscriptRepo(false) });
      await expect(handler.execute(makeCommand(ADMIN, 'cue-other'))).rejects.toBeInstanceOf(
        FlashcardSourceCueInvalidError,
      );
      expect(flashcardRepo.save).not.toHaveBeenCalled();
    });

    it('throws FlashcardSourceCueInvalidError when sourceCueId does not exist', async () => {
      const { handler } = makeHandler({ transcripts: makeTranscriptRepo(false) });
      await expect(handler.execute(makeCommand(ADMIN, 'cue-missing'))).rejects.toBeInstanceOf(
        FlashcardSourceCueInvalidError,
      );
    });
  });
});
