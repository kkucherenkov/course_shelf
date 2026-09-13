/**
 * Unit tests for SearchCatalogueHandler.
 *
 * Covers:
 *   - empty q → immediate empty result, no DB call
 *   - q.trim().length < 2 → immediate empty result, no DB call
 *   - happy path: course-only matches
 *   - happy path: lesson-only matches
 *   - happy path: both course + lesson matches
 *   - happy path: transcript matches
 *   - admin sees all (listAccessibleLibraryIds returns null)
 *   - non-admin with grants sees only their libraries
 *   - non-admin with no grants → empty result, no DB call
 *   - limit clamp (handler receives pre-clamped limit from the controller),
 *     including transcript hits
 *   - ranking order: prefix > word-start > substring, on titles and on
 *     transcript cue text alike
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SearchCatalogueHandler } from './search-catalogue.handler';
import { SearchCatalogueQuery } from './search-catalogue.query';

import type {
  SearchPort,
  SearchCourseHitRow,
  SearchLessonHitRow,
  SearchTranscriptHitRow,
} from '../../domain/search.port';
import type { AuthorizationService } from '../../../../common/access/authorization.service';

// ── helpers ─────────────────────────────────────────────────────────────────

function makeSearchPort(
  courses: SearchCourseHitRow[] = [],
  lessons: SearchLessonHitRow[] = [],
  transcripts: SearchTranscriptHitRow[] = [],
): SearchPort {
  return {
    findCourseHits: vi.fn().mockResolvedValue(courses),
    findLessonHits: vi.fn().mockResolvedValue(lessons),
    findTranscriptHits: vi.fn().mockResolvedValue(transcripts),
  };
}

function makeAuthz(libraryIds: string[] | null): AuthorizationService {
  return {
    canSee: vi.fn(),
    invalidate: vi.fn(),
    listAccessibleLibraryIds: vi.fn().mockResolvedValue(libraryIds),
  };
}

function makeCourseRow(overrides: Partial<SearchCourseHitRow> = {}): SearchCourseHitRow {
  return {
    id: 'course-1',
    libraryId: 'lib-1',
    title: 'Architecture Fundamentals',
    slug: 'architecture-fundamentals',
    lessonsTotal: 10,
    ...overrides,
  };
}

function makeLessonRow(overrides: Partial<SearchLessonHitRow> = {}): SearchLessonHitRow {
  return {
    id: 'lesson-1',
    courseId: 'course-1',
    courseTitle: 'Architecture Fundamentals',
    sectionTitle: 'Domain Layer',
    title: 'Architectural drivers',
    position: 1,
    ...overrides,
  };
}

function makeTranscriptRow(
  overrides: Partial<SearchTranscriptHitRow> = {},
): SearchTranscriptHitRow {
  return {
    lessonId: 'lesson-1',
    lessonTitle: 'Architectural drivers',
    courseId: 'course-1',
    courseTitle: 'Architecture Fundamentals',
    sectionTitle: 'Domain Layer',
    language: 'en',
    startMs: 42_000,
    text: "and that's where the architecture decision matters most",
    ...overrides,
  };
}

const adminActor = { id: 'admin-1', role: 'admin' };
const userActor = { id: 'user-1', role: 'user' };

// ── tests ────────────────────────────────────────────────────────────────────

describe('SearchCatalogueHandler', () => {
  let port: SearchPort;
  let authz: AuthorizationService;
  let handler: SearchCatalogueHandler;

  describe('short-circuit for empty/short queries', () => {
    beforeEach(() => {
      port = makeSearchPort();
      authz = makeAuthz(null);
      handler = new SearchCatalogueHandler(port, authz);
    });

    it('returns empty lists for empty q without hitting the DB', async () => {
      const result = await handler.execute(new SearchCatalogueQuery('', 20, adminActor));

      expect(result).toEqual({ query: '', courses: [], lessons: [], transcripts: [] });
      expect(port.findCourseHits).not.toHaveBeenCalled();
      expect(port.findLessonHits).not.toHaveBeenCalled();
      expect(port.findTranscriptHits).not.toHaveBeenCalled();
      expect(authz.listAccessibleLibraryIds).not.toHaveBeenCalled();
    });

    it('returns empty lists for single-character q without hitting the DB', async () => {
      const result = await handler.execute(new SearchCatalogueQuery('a', 20, adminActor));

      expect(result).toEqual({ query: 'a', courses: [], lessons: [], transcripts: [] });
      expect(port.findCourseHits).not.toHaveBeenCalled();
    });

    it('trims whitespace before length check', async () => {
      const result = await handler.execute(new SearchCatalogueQuery('  a  ', 20, adminActor));

      expect(result).toEqual({ query: 'a', courses: [], lessons: [], transcripts: [] });
      expect(port.findCourseHits).not.toHaveBeenCalled();
    });

    it('passes through for q.trim().length === 2', async () => {
      await handler.execute(new SearchCatalogueQuery('ar', 20, adminActor));

      expect(port.findCourseHits).toHaveBeenCalled();
    });
  });

  describe('happy path — course-only matches', () => {
    it('returns matched courses with correct shape', async () => {
      const course = makeCourseRow();
      port = makeSearchPort([course], []);
      authz = makeAuthz(null);
      handler = new SearchCatalogueHandler(port, authz);

      const result = await handler.execute(
        new SearchCatalogueQuery('architecture', 20, adminActor),
      );

      expect(result.courses).toHaveLength(1);
      expect(result.courses[0]).toEqual({
        id: 'course-1',
        libraryId: 'lib-1',
        title: 'Architecture Fundamentals',
        slug: 'architecture-fundamentals',
        lessonsTotal: 10,
      });
      expect(result.lessons).toHaveLength(0);
    });
  });

  describe('happy path — lesson-only matches', () => {
    it('returns matched lessons with correct shape', async () => {
      const lesson = makeLessonRow();
      port = makeSearchPort([], [lesson]);
      authz = makeAuthz(null);
      handler = new SearchCatalogueHandler(port, authz);

      const result = await handler.execute(
        new SearchCatalogueQuery('architectural', 20, adminActor),
      );

      expect(result.courses).toHaveLength(0);
      expect(result.lessons).toHaveLength(1);
      expect(result.lessons[0]).toEqual({
        id: 'lesson-1',
        courseId: 'course-1',
        courseTitle: 'Architecture Fundamentals',
        sectionTitle: 'Domain Layer',
        title: 'Architectural drivers',
        position: 1,
      });
    });
  });

  describe('happy path — both courses and lessons', () => {
    it('returns both lists populated', async () => {
      port = makeSearchPort([makeCourseRow()], [makeLessonRow()]);
      authz = makeAuthz(null);
      handler = new SearchCatalogueHandler(port, authz);

      const result = await handler.execute(new SearchCatalogueQuery('arch', 20, adminActor));

      expect(result.courses).toHaveLength(1);
      expect(result.lessons).toHaveLength(1);
      expect(result.query).toBe('arch');
    });
  });

  describe('happy path — transcript matches', () => {
    it('returns matched transcript hits with correct shape', async () => {
      const transcript = makeTranscriptRow();
      port = makeSearchPort([], [], [transcript]);
      authz = makeAuthz(null);
      handler = new SearchCatalogueHandler(port, authz);

      const result = await handler.execute(
        new SearchCatalogueQuery('architecture', 20, adminActor),
      );

      expect(result.transcripts).toHaveLength(1);
      expect(result.transcripts[0]).toEqual({
        lessonId: 'lesson-1',
        lessonTitle: 'Architectural drivers',
        courseId: 'course-1',
        courseTitle: 'Architecture Fundamentals',
        sectionTitle: 'Domain Layer',
        language: 'en',
        startMs: 42_000,
        text: "and that's where the architecture decision matters most",
      });
    });
  });

  describe('authorization — admin sees all', () => {
    it('passes null libraryIds to port (no filter)', async () => {
      port = makeSearchPort([makeCourseRow()], []);
      authz = makeAuthz(null); // null = admin
      handler = new SearchCatalogueHandler(port, authz);

      await handler.execute(new SearchCatalogueQuery('arch', 20, adminActor));

      expect(port.findCourseHits).toHaveBeenCalledWith('arch', 20, null);
      expect(port.findLessonHits).toHaveBeenCalledWith('arch', 20, null);
      expect(port.findTranscriptHits).toHaveBeenCalledWith('arch', 20, null);
    });
  });

  describe('authorization — non-admin with grants', () => {
    it('passes library ids to port for filtering', async () => {
      port = makeSearchPort([makeCourseRow()], []);
      authz = makeAuthz(['lib-1', 'lib-2']);
      handler = new SearchCatalogueHandler(port, authz);

      await handler.execute(new SearchCatalogueQuery('arch', 20, userActor));

      expect(authz.listAccessibleLibraryIds).toHaveBeenCalledWith(userActor);
      expect(port.findCourseHits).toHaveBeenCalledWith('arch', 20, ['lib-1', 'lib-2']);
      expect(port.findLessonHits).toHaveBeenCalledWith('arch', 20, ['lib-1', 'lib-2']);
      expect(port.findTranscriptHits).toHaveBeenCalledWith('arch', 20, ['lib-1', 'lib-2']);
    });
  });

  describe('authorization — non-admin with no grants', () => {
    it('returns empty lists without hitting the DB', async () => {
      port = makeSearchPort();
      authz = makeAuthz([]); // empty array = no grants
      handler = new SearchCatalogueHandler(port, authz);

      const result = await handler.execute(new SearchCatalogueQuery('arch', 20, userActor));

      expect(result).toEqual({ query: 'arch', courses: [], lessons: [], transcripts: [] });
      expect(port.findCourseHits).not.toHaveBeenCalled();
      expect(port.findLessonHits).not.toHaveBeenCalled();
      expect(port.findTranscriptHits).not.toHaveBeenCalled();
    });
  });

  describe('limit is passed through to port', () => {
    it('passes the handler limit to all three port methods', async () => {
      port = makeSearchPort([], []);
      authz = makeAuthz(null);
      handler = new SearchCatalogueHandler(port, authz);

      await handler.execute(new SearchCatalogueQuery('arch', 5, adminActor));

      expect(port.findCourseHits).toHaveBeenCalledWith('arch', 5, null);
      expect(port.findLessonHits).toHaveBeenCalledWith('arch', 5, null);
      expect(port.findTranscriptHits).toHaveBeenCalledWith('arch', 5, null);
    });

    it('slices results to the limit after ranking', async () => {
      const courses = [
        makeCourseRow({ id: 'c1', title: 'Architecture A' }),
        makeCourseRow({ id: 'c2', title: 'Architecture B' }),
        makeCourseRow({ id: 'c3', title: 'Architecture C' }),
      ];
      port = makeSearchPort(courses, []);
      authz = makeAuthz(null);
      handler = new SearchCatalogueHandler(port, authz);

      const result = await handler.execute(new SearchCatalogueQuery('arch', 2, adminActor));

      expect(result.courses).toHaveLength(2);
    });

    it('slices transcript hits to the limit after ranking', async () => {
      const transcripts = [
        makeTranscriptRow({ lessonId: 't1', text: 'talking about arch patterns here' }),
        makeTranscriptRow({ lessonId: 't2', text: 'arch is the starting word' }),
        makeTranscriptRow({ lessonId: 't3', text: 'the arch decision record' }),
      ];
      port = makeSearchPort([], [], transcripts);
      authz = makeAuthz(null);
      handler = new SearchCatalogueHandler(port, authz);

      const result = await handler.execute(new SearchCatalogueQuery('arch', 2, adminActor));

      expect(result.transcripts).toHaveLength(2);
    });
  });

  describe('ranking order', () => {
    it('places prefix matches before word-start matches before other substrings', async () => {
      const courses: SearchCourseHitRow[] = [
        makeCourseRow({ id: 'c1', title: 'Domain Driven arch' }), // tier 2: substring only
        makeCourseRow({ id: 'c2', title: 'arch patterns' }), // tier 0: starts with arch
        makeCourseRow({ id: 'c3', title: 'Clean arch patterns' }), // tier 1: word starts with arch
      ];
      port = makeSearchPort(courses, []);
      authz = makeAuthz(null);
      handler = new SearchCatalogueHandler(port, authz);

      const result = await handler.execute(new SearchCatalogueQuery('arch', 20, adminActor));

      expect(result.courses[0]?.id).toBe('c2'); // prefix
      expect(result.courses[1]?.id).toBe('c3'); // word-start
      expect(result.courses[2]?.id).toBe('c1'); // substring
    });

    it('sorts alphabetically within the same tier', async () => {
      const courses: SearchCourseHitRow[] = [
        makeCourseRow({ id: 'c1', title: 'architect Z' }),
        makeCourseRow({ id: 'c2', title: 'architect A' }),
      ];
      port = makeSearchPort(courses, []);
      authz = makeAuthz(null);
      handler = new SearchCatalogueHandler(port, authz);

      const result = await handler.execute(new SearchCatalogueQuery('arch', 20, adminActor));

      expect(result.courses[0]?.id).toBe('c2'); // 'architect A' < 'architect Z'
      expect(result.courses[1]?.id).toBe('c1');
    });

    it('ranks transcript hits by tier on cue text, same as courses/lessons', async () => {
      const transcripts: SearchTranscriptHitRow[] = [
        makeTranscriptRow({ lessonId: 't1', text: 'we discuss the arch decision later' }), // tier 2
        makeTranscriptRow({ lessonId: 't2', text: 'arch is the word we start with' }), // tier 0
        makeTranscriptRow({ lessonId: 't3', text: 'clean arch matters here' }), // tier 1
      ];
      port = makeSearchPort([], [], transcripts);
      authz = makeAuthz(null);
      handler = new SearchCatalogueHandler(port, authz);

      const result = await handler.execute(new SearchCatalogueQuery('arch', 20, adminActor));

      expect(result.transcripts[0]?.lessonId).toBe('t2'); // prefix
      expect(result.transcripts[1]?.lessonId).toBe('t3'); // word-start
      expect(result.transcripts[2]?.lessonId).toBe('t1'); // substring
    });
  });
});
