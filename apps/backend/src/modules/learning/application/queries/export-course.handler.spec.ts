/**
 * Unit tests for ExportCourseHandler.
 * All ports mocked — no real DB or network.
 */
import { describe, expect, it, vi } from 'vitest';

import { CourseNotFoundError } from '../../../../common/catalog-tokens';
import { PermissionDenied } from '../../../../shared/domain-error';
import { Bookmark } from '../../domain/bookmark/bookmark';
import { Note } from '../../domain/note/note';

import { ExportCourseQuery } from './export-course.query';
import { ExportCourseHandler } from './export-course.handler';

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

const COURSE = {
  id: 'course-1',
  libraryId: 'lib-1',
  title: 'Signals and Systems',
  sections: [
    { id: 'sec-1', position: 1, title: 'Foundations' },
    { id: 'sec-2', position: 2, title: 'Advanced' },
  ],
} as never;

const LESSONS = [
  { id: 'lesson-1', courseId: 'course-1', sectionId: 'sec-1', position: 1, title: 'Intro' },
  { id: 'lesson-2', courseId: 'course-1', sectionId: 'sec-1', position: 2, title: 'Sampling' },
  { id: 'lesson-3', courseId: 'course-1', sectionId: 'sec-2', position: 1, title: 'Z-Transform' },
] as never as {
  id: string;
  courseId: string;
  sectionId: string;
  position: number;
  title: string;
}[];

function makeCourseRepo(course: unknown = COURSE): CourseRepository {
  return { findById: vi.fn().mockResolvedValue(course) } as unknown as CourseRepository;
}

function makeLessonRepo(lessons = LESSONS): LessonRepository {
  return { findByCourse: vi.fn().mockResolvedValue(lessons) } as unknown as LessonRepository;
}

function makeAuthz(allowed = true): AuthorizationService {
  return {
    canSee: vi.fn().mockResolvedValue(allowed),
    invalidate: vi.fn(),
    listAccessibleLibraryIds: vi.fn().mockResolvedValue(null),
  };
}

function makeNoteRepo(notes: Map<string, Note> = new Map<string, Note>()): NoteRepository {
  return {
    upsert: vi.fn(),
    findByUserAndLesson: vi.fn(),
    deleteByUserAndLesson: vi.fn(),
    findManyByUserAndLessons: vi.fn().mockResolvedValue(notes),
  };
}

function makeBookmarkRepo(
  bookmarks: Map<string, Bookmark[]> = new Map<string, Bookmark[]>(),
): BookmarkRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findByIdempotencyKey: vi.fn(),
    findManyByUserAndLesson: vi.fn(),
    findManyByUserAndLessons: vi.fn().mockResolvedValue(bookmarks),
    delete: vi.fn(),
  };
}

interface FakeLessonCues {
  language: string;
  cues: { startMs: number; endMs: number; text: string }[];
}
type CuesByLessonMap = Map<string, FakeLessonCues>;

function makeTranscriptRepo(
  cuesByLesson: CuesByLessonMap = new Map<string, FakeLessonCues>(),
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
    findCuesForLesson: vi.fn(),
    findCuesForLessons: vi.fn().mockResolvedValue(cuesByLesson),
    cueBelongsToLesson: vi.fn(),
  } as unknown as TranscriptRepository;
}

function makeConfig(corsOrigins: string[] = ['http://localhost:8080']): AppConfig {
  return { runtime: { corsOrigins } } as unknown as AppConfig;
}

function makeHandler(
  opts: {
    course?: unknown;
    lessons?: typeof LESSONS;
    allowed?: boolean;
    notes?: Map<string, Note>;
    bookmarks?: Map<string, Bookmark[]>;
    cues?: CuesByLessonMap;
  } = {},
) {
  const courseRepo = makeCourseRepo('course' in opts ? opts.course : COURSE);
  const lessonRepo = makeLessonRepo(opts.lessons ?? LESSONS);
  const authz = makeAuthz(opts.allowed ?? true);
  const noteRepo = makeNoteRepo(opts.notes);
  const bookmarkRepo = makeBookmarkRepo(opts.bookmarks);
  const transcripts = makeTranscriptRepo(opts.cues);
  const config = makeConfig();

  const handler = new ExportCourseHandler(
    courseRepo,
    lessonRepo,
    authz,
    noteRepo,
    bookmarkRepo,
    transcripts,
    config,
  );
  return { handler, courseRepo, lessonRepo, authz, noteRepo, bookmarkRepo, transcripts };
}

function makeQuery(actor = ADMIN): ExportCourseQuery {
  return new ExportCourseQuery('course-1', actor);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExportCourseHandler', () => {
  describe('happy path', () => {
    it('returns course.md plus one lessons/NN-slug.md per lesson, in outline order', async () => {
      const { handler } = makeHandler();
      const bundle = await handler.execute(makeQuery());

      expect(bundle.directories).toEqual(['images/']);
      const paths = bundle.files.map((f) => f.path);
      expect(paths).toEqual([
        'course.md',
        'lessons/01-intro.md',
        'lessons/02-sampling.md',
        'lessons/03-z-transform.md',
      ]);
    });

    it('course.md groups lessons under their section, in section position order', async () => {
      const { handler } = makeHandler();
      const bundle = await handler.execute(makeQuery());
      const courseMd = bundle.files[0]?.content ?? '';

      expect(courseMd).toContain('## Foundations');
      expect(courseMd).toContain('- [Intro](lessons/01-intro.md)');
      expect(courseMd).toContain('- [Sampling](lessons/02-sampling.md)');
      expect(courseMd).toContain('## Advanced');
      expect(courseMd).toContain('- [Z-Transform](lessons/03-z-transform.md)');
    });

    it('attaches each lesson its own note, bookmarks, and transcript context from the batched maps', async () => {
      const note = Note.create({
        id: 'n1',
        userId: ADMIN.id,
        lessonId: 'lesson-2',
        body: 'sampling note',
      });
      const bookmark = Bookmark.create({
        id: 'bm-1',
        userId: ADMIN.id,
        lessonId: 'lesson-2',
        positionSeconds: 10,
        label: 'Nyquist',
      });

      const { handler } = makeHandler({
        notes: new Map([['lesson-2', note]]),
        bookmarks: new Map([['lesson-2', [bookmark]]]),
        cues: new Map([
          [
            'lesson-2',
            { language: 'en', cues: [{ startMs: 9000, endMs: 11_000, text: 'nyquist rate' }] },
          ],
        ]),
      });
      const bundle = await handler.execute(makeQuery());

      const introMd = bundle.files.find((f) => f.path === 'lessons/01-intro.md')?.content ?? '';
      const samplingMd =
        bundle.files.find((f) => f.path === 'lessons/02-sampling.md')?.content ?? '';

      expect(introMd).not.toContain('sampling note');
      expect(introMd).not.toContain('## Bookmarks');
      expect(samplingMd).toContain('sampling note');
      expect(samplingMd).toContain('Nyquist');
      expect(samplingMd).toContain('nyquist rate');
    });

    it('appends lessons whose section is unknown under a trailing "Other" section instead of dropping them', async () => {
      const orphan = {
        id: 'lesson-4',
        courseId: 'course-1',
        sectionId: 'sec-missing',
        position: 1,
        title: 'Orphan Lesson',
      };
      const { handler } = makeHandler({ lessons: [...LESSONS, orphan] as never });
      const bundle = await handler.execute(makeQuery());

      expect(bundle.files.some((f) => f.path === 'lessons/04-orphan-lesson.md')).toBe(true);
      expect(bundle.files[0]?.content).toContain('## Other');
      expect(bundle.files[0]?.content).toContain('- [Orphan Lesson](lessons/04-orphan-lesson.md)');
    });
  });

  describe('access control', () => {
    it('throws CourseNotFoundError (404) when the course is missing', async () => {
      const { handler } = makeHandler({ course: null });
      await expect(handler.execute(makeQuery())).rejects.toBeInstanceOf(CourseNotFoundError);
    });

    it('throws PermissionDenied (403) when the actor has no grant', async () => {
      const { handler } = makeHandler({ allowed: false });
      await expect(handler.execute(makeQuery(USER))).rejects.toBeInstanceOf(PermissionDenied);
    });
  });
});
