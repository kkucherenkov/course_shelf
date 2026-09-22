/**
 * Unit tests for ExportLessonHandler.
 * All ports mocked — no real DB or network.
 */
import { describe, expect, it, vi } from 'vitest';

import { LessonNotFoundError } from '../../../../common/catalog-tokens';
import { PermissionDenied } from '../../../../shared/domain-error';
import { Bookmark } from '../../domain/bookmark/bookmark';
import { Note } from '../../domain/note/note';

import { ExportLessonQuery } from './export-lesson.query';
import { ExportLessonHandler } from './export-lesson.handler';

import type { AuthorizationService } from '../../../../common/access/authorization.service';
import type {
  CourseRepository,
  LessonRepository,
  TranscriptRepository,
} from '../../../../common/catalog-tokens';
import type { BookmarkRepository } from '../../domain/bookmark/bookmark.repository';
import type { NoteRepository } from '../../domain/note/note.repository';
import type { AppConfig } from '../../../../common/config/app-config';

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

const ADMIN = { id: 'user-admin', role: 'admin' };
const USER = { id: 'user-1', role: 'user' };

const LESSON = { id: 'lesson-1', courseId: 'course-1', title: 'Intro' } as never;
const COURSE = { id: 'course-1', libraryId: 'lib-1' } as never;

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

function makeNoteRepo(note: Note | null = null): NoteRepository {
  return {
    upsert: vi.fn(),
    findByUserAndLesson: vi.fn().mockResolvedValue(note),
    deleteByUserAndLesson: vi.fn(),
    findManyByUserAndLessons: vi.fn().mockResolvedValue(new Map()),
  };
}

function makeBookmarkRepo(bookmarks: Bookmark[] = []): BookmarkRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findByIdempotencyKey: vi.fn(),
    findManyByUserAndLesson: vi.fn().mockResolvedValue(bookmarks),
    findManyByUserAndLessons: vi.fn().mockResolvedValue(new Map()),
    delete: vi.fn(),
  };
}

function makeTranscriptRepo(
  lessonCues: {
    language: string;
    cues: { startMs: number; endMs: number; text: string }[];
  } | null = null,
): TranscriptRepository {
  return {
    findGeneratedForLessons: vi.fn(),
    findAnyGeneratedForLessons: vi.fn(),
    replaceGenerated: vi.fn(),
    findExisting: vi.fn(),
    replaceSidecar: vi.fn(),
    deleteForLesson: vi.fn(),
    findGeneratedByLanguage: vi.fn(),
    reclassifyGenerated: vi.fn(),
    findCuesForLesson: vi.fn().mockResolvedValue(lessonCues),
    findCuesForLessons: vi.fn().mockResolvedValue(new Map()),
    cueBelongsToLesson: vi.fn(),
  } as unknown as TranscriptRepository;
}

function makeConfig(corsOrigins: string[] = ['http://localhost:8080']): AppConfig {
  return { runtime: { corsOrigins } } as unknown as AppConfig;
}

function makeHandler(
  opts: {
    lesson?: unknown;
    course?: unknown;
    allowed?: boolean;
    note?: Note | null;
    bookmarks?: Bookmark[];
    lessonCues?: {
      language: string;
      cues: { startMs: number; endMs: number; text: string }[];
    } | null;
  } = {},
) {
  const lessonRepo = makeLessonRepo('lesson' in opts ? opts.lesson : LESSON);
  const courseRepo = makeCourseRepo('course' in opts ? opts.course : COURSE);
  const authz = makeAuthz(opts.allowed ?? true);
  const noteRepo = makeNoteRepo(opts.note ?? null);
  const bookmarkRepo = makeBookmarkRepo(opts.bookmarks ?? []);
  const transcripts = makeTranscriptRepo(opts.lessonCues ?? null);
  const config = makeConfig();

  const handler = new ExportLessonHandler(
    lessonRepo,
    courseRepo,
    authz,
    noteRepo,
    bookmarkRepo,
    transcripts,
    config,
  );
  return { handler, lessonRepo, courseRepo, authz, noteRepo, bookmarkRepo, transcripts };
}

function makeQuery(actor = ADMIN): ExportLessonQuery {
  return new ExportLessonQuery('lesson-1', actor);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExportLessonHandler', () => {
  describe('happy path', () => {
    it('returns a bundle with lesson.md and an empty images/ directory', async () => {
      const { handler } = makeHandler();
      const bundle = await handler.execute(makeQuery());

      expect(bundle.directories).toEqual(['images/']);
      expect(bundle.files).toHaveLength(1);
      expect(bundle.files[0]?.path).toBe('lesson.md');
      expect(bundle.files[0]?.content).toContain('# Intro');
    });

    it('renders the note when the actor has one', async () => {
      const note = Note.create({
        id: 'n1',
        userId: ADMIN.id,
        lessonId: 'lesson-1',
        body: 'my note',
      });
      const { handler } = makeHandler({ note });
      const bundle = await handler.execute(makeQuery());
      expect(bundle.files[0]?.content).toContain('my note');
    });

    it('renders bookmarks with transcript context near their timestamp', async () => {
      const bookmark = Bookmark.create({
        id: 'bm-1',
        userId: ADMIN.id,
        lessonId: 'lesson-1',
        positionSeconds: 10,
        label: 'Key point',
      });
      const { handler } = makeHandler({
        bookmarks: [bookmark],
        lessonCues: {
          language: 'en',
          cues: [
            { startMs: 9000, endMs: 11_000, text: 'the key point is this' },
            { startMs: 60_000, endMs: 62_000, text: 'unrelated later line' },
          ],
        },
      });
      const bundle = await handler.execute(makeQuery());
      const content = bundle.files[0]?.content ?? '';
      expect(content).toContain('Key point');
      expect(content).toContain('?t=10');
      expect(content).toContain('the key point is this');
      expect(content).not.toContain('unrelated later line');
    });

    it('non-admin with grant succeeds', async () => {
      const { handler } = makeHandler({ allowed: true });
      const bundle = await handler.execute(makeQuery(USER));
      expect(bundle.files[0]?.content).toContain('# Intro');
    });
  });

  describe('access control', () => {
    it('throws LessonNotFoundError (404) when the lesson is missing', async () => {
      const { handler } = makeHandler({ lesson: null });
      await expect(handler.execute(makeQuery())).rejects.toBeInstanceOf(LessonNotFoundError);
    });

    it('throws LessonNotFoundError (404) when the parent course is missing', async () => {
      const { handler } = makeHandler({ course: null });
      await expect(handler.execute(makeQuery())).rejects.toBeInstanceOf(LessonNotFoundError);
    });

    it('throws PermissionDenied (403) when the actor has no grant', async () => {
      const { handler } = makeHandler({ allowed: false });
      await expect(handler.execute(makeQuery(USER))).rejects.toBeInstanceOf(PermissionDenied);
    });
  });
});
